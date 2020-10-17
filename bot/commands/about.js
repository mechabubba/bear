const CommandBlock = require("../../modules/CommandBlock");
const { randomColor } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");
const djsver = require("discord.js").version
const moment = require("moment");

module.exports = new CommandBlock({
    identity: "about",
    description: "Displays information about the bot.",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, function(client, message, content, args) {
    const col = randomColor()
    const embed = new MessageEmbed()
      .setTitle(`Hello, I am ${client.user.username}.`)
      .setColor(col)
      .setDescription(`I'm a bot, see what I can do by performing the \`help\` command. rawr..... am polar bear x3\nPowered by **[node.js](https://nodejs.org/en/) v${process.versions["node"]}**, **[discord.js](https://discord.js.org) v${djsver}**, and **[sandplate](https://github.com/06000208/sandplate)**.`)
      .attachFiles(["assets/bear.gif"])
      .setThumbnail("attachment://bear.gif")
      .addField("Statistics", `• **Uptime:** ${moment.duration(client.uptime).humanize()}
• **Guilds:** ${client.guilds.cache.size}
• **Users:** ${client.users.cache.size}`, false)
      .setFooter(`Made with \uD83D\uDC96 by @stev#7503. • Last updated: 10/15/20 v3.0 α 🎉 • #${col.toUpperCase()}`);
      
      return message.channel.send(embed);
  }
);