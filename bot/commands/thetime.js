const CommandBlock = require("../../modules/CommandBlock");
const moment = require("moment")

module.exports = new CommandBlock({
    identity: ["thetime", "time"],
    summary: "Tells the time.",
    description: "Tells the local time of the bot.",
  }, function(client, message, content, args) {
    let time = moment(Date.now()).format("lll");
	return message.channel.send(`The local time is **${time}**.`);
  }
);
