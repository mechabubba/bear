const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");

module.exports = [
    new CommandBlock({
        identity: ["shibe"],
        summary: "Gets a shibe.",
        description: "Gets a shibe. Images fetched from [shibe.online](https://shibe.online/).",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"]
    }, async function(client, message, content, args) {
        message.channel.startTyping();

        try {
            const resp = await fetch("http://shibe.online/api/shibes", { method: "get" });
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            if(!json) throw new Error("Recieved malformed json.");

            message.channel.send({ files: json });
        } catch(e) {
            message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);
        }

        message.channel.stopTyping(true);
    }),
    new CommandBlock({
        identity: ["httpcat", "cattp"],
        summary: "Gets an HTTP cat code.",
        description: "Gets an HTTP cat code. Images fetched from [http.cat](https://http.cat).",
        usage: "(code)",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
    }, async function(client, message, content, [code]) {
        return message.channel.send({ files: [`https://http.cat/${code}.jpg`] });
    }),
];
