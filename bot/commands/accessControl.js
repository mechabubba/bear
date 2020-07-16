const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");

// WIP Command

module.exports = [
  new CommandBlock({
    identity: "access control temp", // Using spaces ensures the command can't be ran by commandParser.js
    summary: null,
    description: null,
    usage: "",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    const action = args[0].toLowerCase();
  }),
];
