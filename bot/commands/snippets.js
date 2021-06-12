const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const chalk = require("chalk");
const { MessageEmbed } = require("discord.js");
const sandplate = require("../../sandplate.json");
const package = require("../../package.json");
const Discord = require("discord.js");
const { randomBytes } = require("crypto");
const moment = require("moment");

const snippets = {
  guilds: function(client, message, content, args) {
    let list = "", unavailable = 0;
    client.guilds.cache.each(guild => {
      if (guild.available) {
        list += `\n${guild.name} ${chalk.gray(`(${guild.id})`)}`;
      } else {
        ++unavailable;
      }
    });
    const description = `list of ${client.user.tag}'s ${client.guilds.cache.size} ${client.guilds.cache.size === 1 ? "guild" : "guilds"}${unavailable ? ` (${unavailable} unavailable)` : ""}`;
    log.info(`A ${description}, requested by ${message.author.tag}${list}`);
    return message.channel.send(`Printed a ${description} to the console`);
  },
  info: function(client, message, content, args) {
    const embed = new MessageEmbed()
      .setTitle("Developer Info")
      .setDescription(`${client.user} v${package.version}\n[node.js](https://nodejs.org/) ${process.version}\n[discord.js](https://discord.js.org/) v${Discord.version}\n[sandplate](https://github.com/06000208/sandplate) v${sandplate.version}\n[platform](https://nodejs.org/api/process.html#process_process_platform) ${process.platform}`);
    const color = client.config.get("metadata.color").value();
    if (color) embed.setColor(color);
    return message.channel.send(embed);
  },
  emoji: function(client, message, content, args) {
    if (message.channel.type === "dm") return message.channel.send("No custom emojis for direct messages");
    message.channel.send(message.guild.emojis.cache.map(emoji=>emoji.toString()).join(" "));
  },
  ascii: function(client, message, content, args) {
    let characters = "";
    for (let i = 32; i <= 127; i++) characters += String.fromCharCode(i);
    message.channel.send(characters);
  },
  coin: function(client, message, content, args) {
    message.channel.send((randomBytes(1)[0] & 1) == 1 ? "Heads" : "Tails");
  },
  time: function(client, message, content, args) {
    message.channel.send(`${moment().format("MMMM Do[,] dddd[,] h:mm a")}`);
  },
};

module.exports = new CommandBlock({
  identity: ["snippets", "snip"],
  summary: "Various code snippets for developers",
  description: null,
  usage: "<snippet name> [args]",
  scope: ["dm", "text", "news"],
  nsfw: false,
  locked: "hosts",
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
  userPermissions: null,
}, function(client, message, content, [choice, args]) {
  const keys = Object.keys(snippets);
  const list = "`" + keys.join("`, `") + "`";
  if (!content) return message.channel.send(`What snippet do you want to run?\n${list}`);
  if (!keys.includes(choice)) return message.channel.send(`Unrecognized snippet\n${list}`);
  snippets[choice](client, message, content, args);
});
