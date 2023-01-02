const CommandBlock = require("../../modules/CommandBlock");
const { randomColor, gitinfo, humanizeDuration } = require("../../modules/miscellaneous");
const package = require("../../package.json");
const { MessageEmbed, Permissions } = require("discord.js");
const djsver = require("discord.js").version;
const { DateTime } = require("luxon");

// The permissions to give to the invite.
const perms = new Permissions(["ADMINISTRATOR"]);

module.exports = [
    new CommandBlock({
        names: ["about"],
        description: "Displays information about the bot.",
        clientChannelPermissions: ["ATTACH_FILES"],
    }, function(client, message, content, args) {
        const col = randomColor();
        const embed = new MessageEmbed()
            .setTitle(`Hello, I am ${client.user.username}.`)
            .setColor(col)
            .setDescription([
                `<a:_:588518103814504490> I'm a bot made by <@183740622484668416>. You can see my abilities by performing the \`help\` command.\n`,
                `\u26A1 Powered by **[node.js](https://nodejs.org/en/) v${process.versions["node"]}**, **[discord.js](https://discord.js.org) v${djsver}**, and **${package.name} v${package.version}**.\n`,
                `**[Invite](https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=${perms.bitfield})** | **[Website](https://goon.haus/bear/)** | **[Source](https://github.com/mechabubba/bear/)** | **[Support Server](https://discord.gg/9gdMpBR6bK)**`,
            ].join("\n"))
            .setThumbnail("attachment://bear.gif")
            .addField("Statistics", [
                `• **Uptime:** ${humanizeDuration(client.uptime)}`,
                `• **Cached guilds:** ${client.guilds.cache.size}`,
                `• **Cached users:** ${client.users.cache.size}`,
            ].join("\n"))
            .setFooter({ text: `Made with \uD83D\uDC96 by mechabubba. • Commit ${gitinfo("%h")} @ ${DateTime.fromMillis(parseInt(gitinfo("%ct")) * 1000).toLocaleString(DateTime.DATETIME_SHORT)} \uD83C\uDF89 • #${col.toUpperCase()}` });
        return message.reply({ embeds: [embed], files: ["assets/bears/bear.gif"], allowedMentions: { repliedUser: false } });
    }),
];
