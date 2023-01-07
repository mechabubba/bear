const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");
const { sleep } = require("../../modules/miscellaneous");

// Some (albeit arbitrary) limits, so to respect the site and its administrators.
const charlimit = 64;
const cooldown = 500; // two requests per second

module.exports = new CommandBlock({
    names: ["burning"],
    description: "Makes really awesome burning text. Generated from https://cooltext.com/.",
    usage: "[text]",
    clientChannelPermissions: ["ATTACH_FILES"],
}, async function(client, message, content, args) {
    if(!content) return message.reply(`${client.reactions.negative.emote} You must input a piece of text to render.`);
    if(content.length > charlimit) return message.reply(`${client.reactions.negative.emote} There is a character limit of ${charlimit} per image.`);

    const _now = Date.now();
    client.cookies["burning_cd"] = client.cookies["burning_cd"] ?? _now;
    if(client.cookies["burning_cd"] > _now) {
        await sleep(client.cookies["burning_cd"] - _now);
    }
    client.cookies["chan_cd"] = Date.now() + cooldown;

    const serialized = encodeURIComponent(content.trim()).replace(/%20/g, "+");
    const data = `LogoID=4&Text=${serialized}&FontSize=70&Color1_color=%23FF0000&Integer1=15&Boolean1=on&Integer9=0&Integer13=on&Integer12=on&BackgroundColor_color=%23FFFFFF`;

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

        return message.reply({ files: [json.renderLocation.replace("https", "http")], allowedMentions: { repliedUser: false } }); // they dont encrypt things correctly on their end, requiring us to use http
    } catch(e) {
        return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
    }
});
