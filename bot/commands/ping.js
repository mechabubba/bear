const CommandBlock = require("../../modules/CommandBlock");

module.exports = [
  new CommandBlock({
    identity: ["ping", "latency"],
    summary: "Simple connection test",
    description: "Two latency statistics, the rough time it took to respond and the bot's average heartbeat. Generally used to check if the bot is responsive.",
  }, async function(client, message, content, args) {
	  const msg = await message.channel.send("<a:_:597509670210633729>");
	  msg.edit(`🏓 Pong!\nResponse time is \`${msg.createdTimestamp - message.createdTimestamp}ms\`. Average heartbeat is ~\`${Math.round(client.ping)}ms\``);
  }),
  new CommandBlock({
    identity: ["echo", "e"],
    summary: "Echoes text.",
    usage: "[any text]"
  }, function(client, message, content, args) {
    message.delete().catch(O_o => {});
    content = content.replace(/@/gi, "@\u200B");
    return message.channel.send(content);
  })
]
