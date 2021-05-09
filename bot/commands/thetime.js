const CommandBlock = require("../../modules/CommandBlock");
const moment = require("moment")

module.exports = new CommandBlock({
    identity: ["thetime", "time"],
    description: "Tells the time.",
    scope: ["dm", "text", "news"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"]
  }, function(client, message, content, args) {
    let time = moment(Date.now()).format("lll");
    return message.channel.send(`The local time is **${time}**.`);
  }
);
