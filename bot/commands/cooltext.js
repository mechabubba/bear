const cooltext_font_endpoints = require("../../data/cooltext_font_endpoints.json"); /** A list of fonts and font endpoints from cooltext.com. */
const { sleep } = require("../../modules/miscellaneous");
const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");

const settings = {
    charlimit: 256, /** (Very arbitrary) character limit for each image. */
    cooldown: 500,  /** Cooldown in ms. */
}

module.exports = [
    new CommandBlock({
        names: ["cooltext"],
        description: `Creates cool text. Images are generated from https://cooltext.com.\n\nSupported fonts;\`\`\`${Object.keys(cooltext_font_endpoints).join(", ")}\`\`\`\nNote there is a character limit of ${settings.charlimit} per image.`,
        usage: "[font] [...text]",
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async function(client, message, content, [font, ...args]) {
        if(!content) return message.reply(`${client.reactions.negative.emote} You must input a piece of text to render!`);
        
        const text = args.join(" ");
        if(text.length > settings.charlimit) return message.reply(`${client.reactions.negative.emote} There is a character limit of ${settings.charlimit} per image.`);

        const _now = Date.now();
        client.cookies["cooltext_cooldown"] = client.cookies["cooltext_cooldown"] ?? _now;
        if(client.cookies["cooltext_cooldown"] > _now) {
            await sleep(client.cookies["cooltext_cooldown"] - _now);
        }
        client.cookies["cooltext_cooldown"] = Date.now() + settings.cooldown;

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
        description: "Makes really awesome burning text, generated from https://cooltext.com. \n\nThis command is an alias of `cooltext burning`.",
        usage: "[text]",
        clientChannelPermissions: ["ATTACH_FILES"]
    }, async (client, message, content, args) => {
        args.shift();
        return client.commands.runByName("cooltext", message, "burning", ["burning", ...args]);
    })
]
