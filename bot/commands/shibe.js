const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");

module.exports = [
    new CommandBlock({
        names: ["shibe"],
        description: "Gets a shibe. Images fetched from [shibe.online](https://shibe.online/).",
        clientChannelPermissions: ["ATTACH_FILES"]
    }, async function(client, message, content, args) {
        try {
            const resp = await fetch("http://shibe.online/api/shibes", { method: "get" });
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            if(!json) throw new Error("Recieved malformed json.");

            message.reply({ files: json, allowedMentions: { repliedUser: false } });
        } catch(e) {
            message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),
    new CommandBlock({
        names: ["httpcat", "cattp"],
        description: "Gets an HTTP cat code. Images fetched from [http.cat](https://http.cat).",
        usage: "(code)",
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async function(client, message, content, [code]) {
        try {
            await message.reply({ files: [`https://http.cat/${code}.jpg`], allowedMentions: { repliedUser: false } });
        } catch(e) { // just in case ;)
            message.reply({ files: [{ attachment: "../../assets/service_unavailable.jpg", name: "service_unavailable.jpg" }], allowedMentions: { repliedUser: false } })
        }
    }),
];
