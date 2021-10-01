const CommandBlock = require("../../modules/CommandBlock");
const { randomColor } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");
const djsver = require("discord.js").version
const moment = require("moment");

const desc = `I'm a bot made by <@183740622484668416>. You can see my abilities by performing the \`help\` command.
Invite the bot **[here;](https://discord.com/oauth2/authorize?client_id=435224030459723776&scope=bot&permissions=8)** this link will automatically give it the "administator" permission. rawr..... am polar bear x3
Powered by **[node.js](https://nodejs.org/en/) v${process.versions["node"]}**, **[discord.js](https://discord.js.org) v${djsver}**, and **[sandplate](https://github.com/06000208/sandplate)**.`;

module.exports = new CommandBlock({
    identity: "about",
    description: "Displays information about the bot.",
    scope: ["dm", "text", "news"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, function(client, message, content, args) {
    const col = randomColor();
    const embed = new MessageEmbed()
        .setTitle(`Hello, I am ${client.user.username}.`)
        .setColor(col)
        .setDescription(desc)
        .attachFiles(["assets/bear.gif"])
        .setThumbnail("attachment://bear.gif")
        .addField("Statistics", `• **Uptime:** ${moment.duration(client.uptime).humanize()}\n• **Guilds:** ${client.guilds.cache.size}\n• **Users:** ${client.users.cache.size}`)
        .setFooter(`Made with \uD83D\uDC96 by @stev#7503. • Last updated: 10/15/20 v3.1 α \uD83C\uDF89 • #${col.toUpperCase()}`);
    return message.channel.send(embed);
});
