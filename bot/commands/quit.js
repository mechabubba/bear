const CommandBlock = require("../../modules/CommandBlock");

module.exports = new CommandBlock({
    identity: ["quit", "exit", "shutdown", "logout", "restart", "die", "perish"],
    summary: "Log out and shut down.",
    description: "Log out, followed by process exit. Bot may be auto restarted externally.",
    scope: ["dm", "text", "news"],
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"]
}, async function(client, message, content, args) {
    await message.react(client.config.get("metadata.reactions.positive").value());
    client.destroy();
    process.exit(0);
});
