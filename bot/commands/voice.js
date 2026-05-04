// canoodlin'
const CommandBlock = require("../../modules/CommandBlock");
const { createAudioPlayer, entersState, joinVoiceChannel, createAudioResource, AudioPlayerStatus, StreamType, VoiceConnectionStatus } = require('@discordjs/voice');
const { spawnSync } = require("child_process");
const { Readable } = require("stream");
const log = require("../../modules/log");

const dectalk_pre_cmds = "[:phone on]";

module.exports = [
    new CommandBlock({
        names: ["dectalk", "talk", "say"],
        description: "The bear can speak.\n\n(phonemes enabled by default)",
        usage: "[text]",
        dependencies: ["/bin/dectalk/say"],
        clientChannelPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
    }, async function(client, message, content, args) {
        if (!content) {
            return await message.reply(`${client.reactions.negative.emote} You need to prompt the bot to say something.`);
        }
        if (message.channel.type === "DM") {
            return await message.reply(`${client.reactions.negative.emote} This command is only available in guilds.`);
        }

        const chan = message.member.voice.channel;
        if (!chan) {
          return await message.reply(`${client.reactions.negative.emote} You must be in a voice channel to use this command.`);
        }

        // get the audio
        let buf;
        try {
            let s = await spawnSync("./say", ["-p"], {
                cwd: "./bin/dectalk",
                input: content,
            });
            buf = s.stdout;
        } catch(e) {
            return await message.reply(`${client.reactions.negative.emote} You need to prompt the bot to say something.`);
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
            }
        });

        player.play(res);
        player.on('error', (error) => log.error('audio player encountered an error:', error.message));
        player.on(AudioPlayerStatus.Playing, () => {});
        player.on(AudioPlayerStatus.Idle, () => connection.destroy()); // get outta town
    }),
];
