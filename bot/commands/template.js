const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");

// all keys other than names can be set to null or omitted for default value
// refer to CommandBlock.js for documentation

module.exports = new CommandBlock({
    names: ["template"],
    summary: "An example command",
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
});
