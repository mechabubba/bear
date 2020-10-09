const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const sandplate = require("../../sandplate.json");
const package = require("../../package.json");
const Discord = require("discord.js");

module.exports = new CommandBlock({
  identity: ["version", "versions", "platform", "os"],
  summary: "Simple version information",
  description: "Provides the versions of the local project, [node.js](https://nodejs.org/), [discord.js](https://discord.js.org/), and [sandplate](https://github.com/06000208/sandplate), as well as the [platform](https://nodejs.org/api/process.html#process_process_platform) the bot is running on.",
  locked: ["trusted", "hosts"],
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, function(client, message, content, args) {
  const embed = new MessageEmbed()
    .setTitle("Version Info")
    .setDescription(`\`${client.user.tag}\` v${package.version}\n[\`node.js\`](https://nodejs.org/) ${process.version}\n[\`discord.js\`](https://discord.js.org/) v${Discord.version}\n[\`sandplate\`](https://github.com/06000208/sandplate) v${sandplate.version}`)
    .setFooter(`Running on ${process.platform}`);
  const color = client.config.get("metadata.color").value();
  if (color) embed.setColor(color);
  return message.channel.send(embed);
});
