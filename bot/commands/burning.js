const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");

// An (albeit arbitrary) character limit, so to respect the site and its administrators.
const charlimit = 64;

module.exports = new CommandBlock({
    identity: ["burning"],
    description: "Makes really awesome burning text. Generated from https://cooltext.com/.",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
}, async function(client, message, content, args) {
    if(content.length > charlimit) return message.channel.send(`${client.reactions.negative.emote} There is a character limit of ${charlimit} per image.`);

    message.channel.startTyping();

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

        message.channel.stopTyping(true);
        return message.channel.send({ files: [json.renderLocation.replace("https", "http")] }); // they dont encrypt things correctly on their end, requiring us to use http

    } catch(e) {
        message.channel.stopTyping(true);
        return message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);
    }
});
