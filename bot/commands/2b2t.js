const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");

module.exports = new CommandBlock({
    identity: "2b2t",
    summary: "Gets the current queue length of 2b2t.",
    description: "Gets the current queue length of 2b2t. Data fetched from [2b2t.io](https://2b2t.io/).",
}, async function(client, message, content, args) {
    try {
        const resp = await fetch("https://2b2t.io/api/queue?last=true");
        if(!resp.ok) {
            throw new Error(resp.statusText);
        }

        const json = await resp.json();
        if(!json || !json[0] || !json[0][1]) throw new Error("Recieved malformed json.");

        return message.reply({ content: `The 2b2t.org queue is **${json[0][1]}** users long.`, allowedMentions: { repliedUser: false } });
    } catch(e) {
        return message.reply({ content: `${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\`` });
    }
});
