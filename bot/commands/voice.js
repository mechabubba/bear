// canoodlin'
const CommandBlock = require("../../modules/CommandBlock");
const { createAudioPlayer, entersState, joinVoiceChannel, createAudioResource, AudioPlayerStatus, StreamType, VoiceConnectionStatus } = require('@discordjs/voice');
const { spawnSync } = require("child_process");
const { Readable } = require("stream");
const log = require("../../modules/log");

const dectalk_pre_cmds = "[:phone on]";

module.exports = [
    new CommandBlock({
        names: ["dectalk", "say"],
        description: "The bear can speak. Speaks words in a voice channel via DECtalk.\n\nPhonemes enabled by default. aeiou",
        usage: "[text]",
        dependencies: ["/bin/dectalk/say"],
    }, async function(client, message, content, args) {
        // small lambda because theres a lot of these here
        const err = (x) => message.reply(`${client.reactions.negative.emote} ${x}`)

        if (!content) {
            return err(`You need to prompt the bot to say something.`);
        }
        if (message.channel.type === "DM") {
            return err(`This command is only available in guilds.`);
        }

        const chan = message.member.voice.channel;
        if (!chan) {
            return err(`You must be in a voice channel to use this command.`);
        }
        
        if(!chan.viewable)  return err(`I cannot view this channel!`);
        if(!chan.joinable)  return err(`I cannot join this channel!`);
        if(!chan.speakable) return err(`I cannot speak in this channel!`);

        // check if we're in another vc
        const vc = message.guild.me.voice.channel;
        if (vc && vc.id !== chan.id) {
            return err(`I'm already in another voice channel!`);
        }

        // get the audio
        let buf;
        try {
            let s = await spawnSync("./say", ["-p"], {
                cwd: "./bin/dectalk",
                input: dectalk_pre_cmds + content,
            });
            buf = s.stdout;
        } catch(e) {
            return err(`You must prompt the bot to say something.`);
        }

        const st = Readable.from(buf);
        const res = createAudioResource(st, {
            inputType: StreamType.Arbitrary
        });

        const connection = joinVoiceChannel({
            channelId: chan.id,
            guildId: chan.guild.id,
            adapterCreator: chan.guild.voiceAdapterCreator,
        });
        
        // play the audio
        const player = createAudioPlayer();
        connection.subscribe(player);
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            // incase it gets disconnected mid speech...
            try {
                // give it a chance to recover
                await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
            } catch {
                // failed, die in real life
                connection.destroy();
                player.stop();
                log.debug("disconnected...")
            }
        });

        // let it idle a bit...
        player.play(res);
        clearTimeout(client.cookies[`vc_idle_${chan.guildId}`]);

        player.on('error', (error) => {
            log.error('audio player encountered an error:', error.message)
            connection.destroy();
        });
        player.on(AudioPlayerStatus.Playing, () => {});
        player.on(AudioPlayerStatus.Idle, () => {
            clearTimeout(client.cookies[`vc_idle_${chan.guildId}`]);
            client.cookies[`vc_idle_${chan.guildId}`] = setTimeout(() => {
                if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                    // if we haven't already been disconnected in this timeframe, die
                    connection.destroy();
                }
            }, 30_000)
        });
    }),
];
