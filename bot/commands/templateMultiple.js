const CommandModule = require("../../modules/CommandModule");
const log = require("../../modules/log");

// all keys other than identity can be set to null or omitted for default value
// refer to CommandModule.js for documentation

module.exports = [
  new CommandModule({
    identity: "template_a",
    summary: null,
    description: null,
    usage: null,
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    const reply = await message.channel.send(`hello world, ${message.author.tag}!`);
    log.trace(reply.content);
  }),
  new CommandModule({
    identity: "template_b",
    summary: null,
    description: null,
    usage: null,
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    const reply = await message.channel.send(`hello world, ${message.author.tag}!`);
    log.trace(reply.content);
  }),
];
