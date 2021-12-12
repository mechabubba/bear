// @todo Characters larger than 8 bits that are converted to hex work fine; the conversion back is not as easy.
const CommandBlock = require("../../modules/CommandBlock");

module.exports = [
    new CommandBlock({
        identity: ["hex"],
        description: "Converts text to hexadecimal.",
        usage: "[text]",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, content = "", args) {
        let buf = "";
        for(let i = 0; i < content.length; i++) {
            buf += content.charCodeAt(i).toString(16);
        }
        return message.channel.send(`\`\`\`\n${(buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf).toUpperCase()}\`\`\``);
    }),
    new CommandBlock({
        identity: ["unhex"],
        description: "Converts hexadecimal to text.",
        usage: "[hex]",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, content = "", ...args) {
        let buf = "";
        for(let i = 0; i < content.length; i += 2) {
            buf += String.fromCharCode(parseInt(content.substring(i, i + 2), 16));
        }
        return message.channel.send(`\`\`\`\n${buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf}\`\`\``);
    }),
    new CommandBlock({
        identity: ["base64"],
        description: "Converts text to base64.",
        usage: "[text]",
        clientPermissions: ["VIEW_CHANNEL, SEND_MESSAGES"],
    }, async function(client, message, content = "", args) {
        let buf = Buffer.from(content).toString("base64");
        return message.channel.send(`\`\`\`\n${buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf}\`\`\``);
    }),
    new CommandBlock({
        identity: ["unbase64"],
        description: "Converts base64 to text.",
        usage: "[base64]",
        clientPermissions: ["VIEW_CHANNEL, SEND_MESSAGES"],
    }, async function(client, message, content = "", args) {
        let buf = Buffer.from(content, "base64").toString();
        return message.channel.send(`\`\`\`\n${buf.length > 1993 ? buf.substring(0, 1990) + "..." : buf}\`\`\``);
    }),
];