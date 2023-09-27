// @todo Characters larger than 8 bits that are converted to hex work fine; the conversion back is not as easy.
const CommandBlock = require("../../modules/CommandBlock");
const nocontent = "You must input a piece of text to convert.";

module.exports = [
    new CommandBlock({
        names: ["hex"],
        description: "Converts text to hexadecimal.",
        usage: "[text]",
    }, async function(client, message, content, args) {
        if(!content) return message.reply(`${client.reactions.negative.emote} ${nocontent}`);
        let buf = "";
        for(let i = 0; i < content.length; i++) {
            buf += content.charCodeAt(i).toString(16);
        }
        return message.reply({ content: `\`\`\`\n${(buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf).toUpperCase()}\`\`\``, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["unhex"],
        description: "Converts hexadecimal to text.",
        usage: "[hex]",
    }, async function(client, message, content, args) {
        content = content.replace(/[^0-9A-Fa-f]/g, "");
        if(!content) return message.reply(`${client.reactions.negative.emote} ${nocontent}`);
        let buf = "";
        for(let i = 0; i < content.length; i += 2) {
            buf += String.fromCharCode(parseInt(content.substring(i, i + 2), 16));
        }
        return message.reply({ content: `\`\`\`\n${buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf}\`\`\``, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["base64"],
        description: "Converts text to base64.",
        usage: "[text]",
    }, async function(client, message, content, args) {
        if(!content) return message.reply(`${client.reactions.negative.emote} ${nocontent}`);
        const buf = Buffer.from(content).toString("base64");
        return message.reply({ content: `\`\`\`\n${buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf}\`\`\``, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["unbase64"],
        description: "Converts base64 to text.",
        usage: "[base64]",
    }, async function(client, message, content, args) {
        content = content.replace(/[^0-9A-Za-z./=]/g, "")
        if(!content) return message.reply(`${client.reactions.negative.emote} ${nocontent}`);
        const buf = Buffer.from(content, "base64").toString();
        return message.reply({ content: `\`\`\`\n${buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf}\`\`\``, allowedMentions: { repliedUser: false } });
    }),
];
