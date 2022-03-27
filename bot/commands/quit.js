const CommandBlock = require("../../modules/CommandBlock");

module.exports = new CommandBlock({
    identity: ["quit", "exit", "shutdown", "logout", "restart", "die", "perish"],
    summary: "Log out and shut down.",
    description: "Log out, followed by process exit. Bot may be auto restarted externally.",
    locked: "hosts",
    clientPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"]
}, async function(client, message, content, args) {
    await message.react(client.reactions.positive.id);
    client.destroy();
    process.exit(0);
});
