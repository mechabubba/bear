const CommandBlock = require("../../modules/CommandBlock");

module.exports = new CommandBlock({
    names: ["quit", "exit", "shutdown", "logout", "restart", "die", "perish"],
    summary: "Log out & shut down",
    description: "Logs the bot out, followed by an exit of the process. The bot may be auto restarted externally.",
    locked: "hosts",
    clientChannelPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
}, async function(client, message, content, args) {
    await message.react(client.reactions.positive.id);
    client.destroy();
    process.exit(0);
});
