const CommandBlock = require("../../modules/CommandBlock");
const { randomColor, gitinfo } = require("../../modules/miscellaneous");
const { MessageEmbed, Permissions } = require("discord.js");
const djsver = require("discord.js").version;
const { DateTime, Duration } = require("luxon");

// The permissions to give to the invite.
const perms = new Permissions(["ADMINISTRATOR"]);

module.exports = [
    new CommandBlock({
        identity: ["about"],
        description: "Displays information about the bot.",
        clientPermissions: ["ATTACH_FILES"],
    }, function(client, message, content, args) {
        const col = randomColor();
        const embed = new MessageEmbed()
            .setTitle(`Hello, I am ${client.user.username}.`)
            .setColor(col)
            .setDescription([
                `<a:_:588518103814504490> I'm a bot made by <@183740622484668416>. You can see my abilities by performing the \`help\` command.\n`,
                `\u26A1 Powered by **[node.js](https://nodejs.org/en/) v${process.versions["node"]}**, **[discord.js](https://discord.js.org) v${djsver}**, and **[sandplate](https://github.com/06000208/sandplate)**.\n`,
                `**[Invite](https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=${perms.bitfield})** | **[Website](https://goon.haus/bear/)** | **[Source](https://github.com/mechabubba/bear/)** | **[Support Server](https://discord.gg/9gdMpBR6bK)**`,
            ].join("\n"))
            .setThumbnail("attachment://bear.gif")
            .addField("Statistics", [
                `• **Uptime:** ${getUptime(client.uptime)}`,
                `• **Guilds:** ${client.guilds.cache.size}`,
                `• **Users:** ${client.users.cache.size}`,
            ].join("\n"))
            .setFooter({ text: `Made with \uD83D\uDC96 by mechabubba. • Commit ${gitinfo("%h")} @ ${DateTime.fromMillis(parseInt(gitinfo("%ct")) * 1000).toLocaleString(DateTime.DATETIME_SHORT)} \uD83C\uDF89 • #${col.toUpperCase()}` });
        return message.reply({ embeds: [embed], files: ["assets/bears/bear.gif"], allowedMentions: { repliedUser: false } });
    }),
];

/**
 * Luxons Duration class doesn't format uptimes very well (or at all?) above 24 hours, so this function does that.
 * @param {number} millis - Taken from client.uptime.
 */
const getUptime = (millis) => {
    const periods = [
        ["year",   60 * 60 * 24 * 365 * 1000],
        ["month",  60 * 60 * 24 * 30 * 1000],
        ["day",    60 * 60 * 24 * 1000],
        ["hour",   60 * 60 * 1000],
        ["minute", 60 * 1000],
        ["second", 1000]
    ];
    const strings = []
    for(const period of periods) {
        if(millis > period[1]) {
            let value = Math.floor(millis / period[1])
            strings.push(`${value} ${period[0]}${value >= 1 ? "s" : ""}`);
            millis = millis - (value * period[1])
        }
    }
    return strings.join(", ");
};