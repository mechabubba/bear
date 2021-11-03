const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");

// all keys other than names can be set to null or omitted for default value
// refer to CommandBlock.js for documentation

module.exports = [
    new CommandBlock({
        names: ["template_a"],
        summary: null,
        description: null,
        usage: null,
        channelTypes: ["dm", "text", "news"],
        nsfw: false,
        locked: false,
        clientPermissions: null,
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
        userPermissions: null,
        userChannelPermissions: null,
    }, function(client, message, content, args) {
        const text = `hello world, ${message.author.tag}!`;
        log.trace(text);
        message.channel.send(text);
    }),
    new CommandBlock({
        names: ["template_b"],
        summary: null,
        description: null,
        usage: null,
        channelTypes: ["dm", "text", "news"],
        nsfw: false,
        locked: false,
        clientPermissions: null,
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
        userPermissions: null,
        userChannelPermissions: null,
    }, async function(client, message, content, args) {
        const reply = await message.channel.send(`hello world, ${message.author.tag}!`);
        log.trace(reply.content);
    }),
];
