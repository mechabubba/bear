const CommandBlock = require("../../modules/CommandBlock");

module.exports = new CommandBlock({
    names: ["ping", "latency"],
    summary: "Simple connection test",
    description: "Two latency statistics, the rough time it took to respond and the bot's average heartbeat. Generally used to check if the bot is responsive.",
    clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, async function(client, message, content, args) {
    const reply = await message.channel.send("ping...");
    reply.edit(`pong!\nresponding took roughly \`${reply.createdTimestamp - message.createdTimestamp}ms\`\naverage heartbeat is around \`${Math.round(client.ws.ping)}ms\``);
});
