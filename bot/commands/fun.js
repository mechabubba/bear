const package = require("../../package.json");
const CommandBlock = require("../../modules/CommandBlock");
const { sleep } = require("../../modules/miscellaneous");
const { CircularBuffer } = require("../../modules/RandomStructs");
const { numeric_safeish_nonnull } = require("../../modules/regexes");
const fetch = require("node-fetch");
const OpenAI = require("openai");

const ball_responses = ["As I see it, yes.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don't count on it.", "It is certain.", "It is decidedly so.", "Most likely.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Outlook good.", "Reply hazy, try again.", "Signs point to yes.", "Very doubtful.", "Without a doubt.", "Yes.", "Yes - definitely.", "You may rely on it."];
const cooltext_font_endpoints = require("../../data/cooltext_font_endpoints.json"); /** A list of fonts and font endpoints from cooltext.com. */
const log = require("../../modules/log");
const cooltext_settings = {
    charlimit: 256, /** (Very arbitrary) character limit for each image. */
    cooldown: 500,  /** Cooldown in ms. */
};

const ai_system_prompt = {
    role: "system",
    content: `You are an AI feature for a chatbot named "${package.name}". Messages will come in as "<name> writes: <thought>", and you'll do your best to respond in an appropriate manner. You are also provided a small selection of previous messages for context; messages from you will be prefaced with a star \"*\" character. Respond without replicating any prefixes or other structural formatting, unless explicitly required.`
};
const ai_settings = {
    OpenAI: {
        __client: null,
        __model: "chatgpt-4o-latest",
    },
    DeepSeek: {
        __client: null,
        __model: "deepseek-chat",
        baseURL: "https://api.deepseek.com/v1",
    },
};

module.exports = [
    new CommandBlock({
        names: ["2b2t"],
        summary: "Gets the current queue length of 2b2t.",
        description: "Gets the current queue length of 2b2t. Data fetched from [2b2t.io](https://2b2t.io/).",
    }, async function(client, message, content, args) {
        try {
            const resp = await fetch("https://2b2t.io/api/queue?last=true");
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            if(!json || !json[0] || !json[0][1]) throw new Error("Recieved malformed json.");

            return message.reply({ content: `The 2b2t.org queue is **${json[0][1]}** users long.`, allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply({ content: `${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\`` });
        }
    }),
    new CommandBlock({
        names: ["8ball", "8"],
        description: "Shakes a magic 8 ball.",
        usage: "[query]",
    }, async function(client, message, content, args) {
        if(!content) return message.reply(`${client.reactions.negative.emote} You need to ask it something!`);
        return message.reply({ content: `\uD83C\uDFB1 ${ball_responses[Math.floor(Math.random() * ball_responses.length)]}`, allowedMentions: { repliedUser: false } }); // if you're reading this, im sorry for ruining the magic
    }),
    new CommandBlock({
        names: ["2ball", "2"],
        description: "Shakes a magic 2 ball.",
        usage: "[query]",
    }, async function(client, message, content, args) {
        if(!content) return message.reply(`${client.reactions.negative.emote} You need to ask it something!`);
        return message.reply({ content: `\uD83C\uDFB1 ${Math.random() > 0.5 ? "True" : "False"}`, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["cooltext"],
        description: `Creates cool text. Images are generated from https://cooltext.com.\n\nSupported fonts;\`\`\`${Object.keys(cooltext_font_endpoints).join(", ")}\`\`\`\nNote there is a character limit of ${cooltext_settings.charlimit} per image.`,
        usage: "[font] [...text]",
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async function(client, message, content, [font, ...args]) {
        if(!content) return message.reply(`${client.reactions.negative.emote} You must input a piece of text to render!`);

        const text = args.join(" ");
        if(text.length > cooltext_settings.charlimit) return message.reply(`${client.reactions.negative.emote} There is a character limit of ${cooltext_settings.charlimit} per image.`);

        const _now = Date.now();
        client.cookies["cooltext_cooldown"] = client.cookies["cooltext_cooldown"] ?? _now;
        if(client.cookies["cooltext_cooldown"] > _now) {
            await sleep(client.cookies["cooltext_cooldown"] - _now);
        }
        client.cookies["cooltext_cooldown"] = Date.now() + cooltext_settings.cooldown;

        if(!(font in cooltext_font_endpoints)) return message.reply(`${client.reactions.negative.emote} The provided font does not exist.`);

        const serialized_text = encodeURIComponent(text).replace(/%20/g, "+");
        const data = cooltext_font_endpoints[font] + `&Text=${serialized_text}`;

        // This API isn't public, so this will probably break eventually.
        try {
            const resp = await fetch("https://cooltext.com/PostChange", {
                method: "post",
                body: data,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Content-Length": data.length,
                },
            });

            if(!resp.ok) {
                throw new Error(resp.statusText);
            }

            const json = await resp.json();
            if(!json || !json.renderLocation) throw new Error("Recieved malformed json.");

            return message.reply({ files: [json.renderLocation.replace("https", "http")], allowedMentions: { repliedUser: false } }); // They dont encrypt things correctly on their end, requiring us to use HTTP.
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),
    new CommandBlock({
        names: ["burning"],
        description: "Makes really awesome burning text, generated from https://cooltext.com.\n\nThis command is an alias of `cooltext burning`.",
        usage: "[text]",
        clientChannelPermissions: ["ATTACH_FILES"]
    }, async function(client, message, content, args) {
        return client.commands.runByName("cooltext", message, `burning ${content}`, ["burning", ...args]);
    }),
    new CommandBlock({
        names: ["chatgpt", "gpt", "ai"],
        description: "Ask something to ChatGPT.\n\nNote that the bot cannot parse attachments.",
        usage: "[query]",
        chainable: true,
    }, async (client, message, content, args) => {
        return ai_cmd(client, message, content, args, "OpenAI");
    }),
    new CommandBlock({
        names: ["deepseek", "ds"],
        description: "Ask something to DeepSeek.\n\nNote that the bot cannot parse attachments.",
        usage: "[query]",
        chainable: true,
    }, async (client, message, content, args) => {
        return ai_cmd(client, message, content, args, "DeepSeek");
    }),
    new CommandBlock({
        names: ["spook", "mxspook"],
        description: "Use this command to troll the NSA. Inspired by the [emacs command of the same name](<https://www.gnu.org/software/emacs/manual/html_node/emacs/Mail-Amusements.html>) as well as a [brilliant schizo](<http://www.cypherspace.org/adam/shirt/>).",
        usage: "(words)",
    }, async (client, message, content, [words = "16", ...args]) => {
        if (!words.match(numeric_safeish_nonnull)[1]) {
            return message.reply(`${client.reactions.negative.emote} Invalid input, must be a number.`);
        }
        words = parseInt(words);
        if (words > 512) {
            return message.reply(`${client.reactions.negative.emote} W-woah buddy, relax a bit.`);
        }

        let resp = []; 
        for (let i = 0; i < words; i++) {
            resp.push(client.cookies.spook[Math.floor(client.cookies.spook.length * Math.random())]);
        }
        resp = resp.join(" ");

        return message.reply({
            content: resp.length > 2000 ? resp.substring(0, 1997) + "..." : resp,
            allowedMentions: { parse: [], repliedUser: false },
        });
    }),
    new CommandBlock({
        names: ["listenbrainz", "lb"],
        description: "Pull the most recent listening history from someones ListenBrainz account.",
        usage: "[username]"
    }, async (client, message, content, [username, ...args]) => {
        if (!username) {
            //return message.reply(`${client.reactions.negative.emote} Provide a username to pull data from!`);
            username = message.author.username; // try regardless...
        }

        try {
            const resp = await fetch(`https://api.listenbrainz.org/1/user/${encodeURIComponent(username)}/listens?count=1`);
            const json = await resp.json();
            if (json.error) {
                throw new Error(json.error);
            }
            let lsn = json.payload.listens[0];
            let trk = lsn.track_metadata;

            /* the 30 second marker here is kinda bullshit. listenbrainz does not have a "currently listening" portion of their api. */
            const cont = `[${lsn.user_name}](<https://listenbrainz.org/user/${lsn.user_name}/>) ${
                (lsn.listened_at + 30) * 1000 > Date.now() ? "is listening" : "last listened"
            } to **${
                trk.mbid_mapping?.recording_mbid ? `[${trk.track_name}](<https://musicbrainz.org/recording/${trk.mbid_mapping.recording_mbid}>)` : trk.track_name
            }** by **${
                (trk.mbid_mapping && Array.isArray(trk.mbid_mapping.artists))
                ? ((as) => {
                    let c = "";
                    for (const a of as) {
                        c += `[${a.artist_credit_name}](<https://musicbrainz.org/artist/${a.artist_mbid}>)${a.join_phrase}`;
                    }
                    return c;
                })(trk.mbid_mapping.artists)
                : trk.artist_name
            }** on **${
                trk.release_name
            }**.`;
            return message.reply({
                content: resp.length > 2000 ? cont.substring(0, 1997) + "..." : cont,
                allowedMentions: { parse: [], repliedUser: false },
            });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }

    })
];

// turning a smaller mess into a bigger mess
const ai_cmd = async (client, message, content, args, source = "mysteryman") => {
    // getting everything in order
    const getClient = (source) => {
        const s = ai_settings[source];
        if (s?.__client) return s.__client;

        const key = client.config.get(["secrets", `ai_${source.toLowerCase()}_apikey`]);
        if (!key) return undefined;

        s.apiKey = key;
        s.__client = new OpenAI(ai_settings[source]);
        return s.__client;
    }
    const ai = getClient(source);
    if (!ai) {
        return message.reply(`${client.reactions.negative.emote} No ${source} API key provided! Please set one in \`data/config.json\`.`);
    }

    // turning a mess into a smaller mess
    const prev = { role: 'user' };
    let queries = client.cookies[`${source}_queries_${message.channel.type === "DM" ? message.author.id : message.guild.id}`] ??= new CircularBuffer(30, { override: true });
    if (queries.isEmpty()) {
        prev.content = "You have not interacted here previously.";
    } else {
        prev.content = `Here are your previous interactions;\n${queries.data_queue.map(x => "- " + x.identifier + " wrote: " + x.content).join("\n")}`;
    }

    let msg;
    try {
        const response = await ai.chat.completions.create({
            model: ai_settings[source].__model,
            messages: [
                ai_system_prompt,
                prev,
                { role: 'user', content: `${message.author.username} writes: ${content}` }
            ]
        });
        const resp = response.choices[0].message.content;
        queries.put({
            identifier: message.author.username,
            content,
        });
        queries.put({
            identifier: `*${source}`,
            content: resp,
        });
        msg = await message.reply({
            content: resp.length > 2000 ? resp.substring(0, 1997) + "..." : resp,
            allowedMentions: { parse: [], repliedUser: false },
        });
    } catch(e) {
        msg = await message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
    } finally {
        return msg;
    }
}
