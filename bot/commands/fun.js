const CommandBlock = require("../../modules/CommandBlock");
const { sleep } = require("../../modules/miscellaneous");
const { CircularBuffer } = require("../../modules/RandomStructs");
const fetch = require("node-fetch");
const OpenAI = require("openai");

const ball_responses = ["As I see it, yes.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don't count on it.", "It is certain.", "It is decidedly so.", "Most likely.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Outlook good.", "Reply hazy, try again.", "Signs point to yes.", "Very doubtful.", "Without a doubt.", "Yes.", "Yes - definitely.", "You may rely on it."];
const cooltext_font_endpoints = require("../../data/cooltext_font_endpoints.json"); /** A list of fonts and font endpoints from cooltext.com. */
const cooltext_settings = {
    charlimit: 256, /** (Very arbitrary) character limit for each image. */
    cooldown: 500,  /** Cooldown in ms. */
};

const openai_queries = new CircularBuffer(20);
const openai_system = {
    role: "developer",
    content: "You are a helpful assistant for a bot. Messages will come in as \"<name>/<chan_id> says: <thought>\", and you'll do your best to give an appropriate answer."
};
let openai = null;

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
        return client.commands.runByName("cooltext", message, null, ["burning", ...args]);
    }),
    new CommandBlock({
        names: ["chatgpt", "gpt"],
        description: "Ask something to ChatGPT.\n\nNote that the bot cannot parse attachments.",
        usage: "[query]",
    }, async (client, message, content, args) => {
        let key = client.config.get(["secrets", "openai_apikey"]);
        if (!key) return message.reply(`${client.reactions.negative.emote} No API key provided! Please set one in \`data/config.json\`.`);

        if (!openai) openai = new OpenAI({ apiKey: key });
        try {
            /*
            note: very naive implementation of this. trying to be token-efficient, but things could be efficient on the servers end.
            one would want to have multiple queues of messages per user, per channel. for now, i'm feeding it the last 25 messages it got in total.
            for what its worth, this bot doesn't get a lot of action. however this might change going forward. so future me, enjoy the work :)
            */
            const response = await openai.chat.completions.create({
                model: "chatgpt-4o-latest",
                messages: [
                    openai_system,
                    { role: 'user', content: `Previous interactions were;${openai_queries.data.map(x => "\n- " + x.identifier + " said: " + x)}`},
                    { role: 'user', content: `${message.author.id}/${message.guild.id} says: ${content}` }
                ]
            });
            const r = response.choices[0].message.content;
            openai_queries.put({
                identifier: `${message.author.username}/${message.guild.id}`,
                content,
            });
            openai_queries.put({
                identifier: `ChatGPT`,
                content: r,
            })
            openai_queries.put(r)
            return message.reply({ content: r, allowedMentions: { repliedUser: false } })
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    })
];
