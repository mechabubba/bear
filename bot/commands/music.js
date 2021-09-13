const CommandBlock = require("../../modules/CommandBlock");

module.exports = [
    new CommandBlock({
        identity: ["play"],
        description: "Plays music in voice.",
        usage: "[youtube link]",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        // my
    }),
    new CommandBlock({
        identity: ["stop"],
        description: "Stops playing music in voice.",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, content, args) {
        // balls
    }),
    new CommandBlock({
        identity: ["pause"],
        description: "Pauses music in voice.",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, content, args) {
        // ache
    }),
];
