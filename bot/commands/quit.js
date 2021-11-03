const CommandBlock = require("../../modules/CommandBlock");

module.exports = new CommandBlock({
    names: ["quit", "exit", "stop", "shutdown", "logout", "restart"],
    summary: "Log out & shut down",
    description: "Log out followed by process exit. Bot may be auto restarted externally.",
    usage: null,
    locked: "hosts",
    clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
}, async function(client, message, content, args) {
    await message.react(client.config.get("metadata.reactions.positive").value());
    client.destroy();
    process.exit(0);
});
