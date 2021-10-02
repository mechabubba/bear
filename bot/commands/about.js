const { execSync } = require("child_process");
const CommandBlock = require("../../modules/CommandBlock");
const { randomColor } = require("../../modules/miscellaneous");
const { MessageEmbed, Permissions } = require("discord.js");
const djsver = require("discord.js").version;
const { DateTime, Duration } = require("luxon");

// Helper function that gets information from the latest commit.
// https://git-scm.com/docs/git-show
const gi = (placeholder) => execSync(`git show -s --format=${placeholder} HEAD`).toString().trim();

// The permissions to give to the invite.
const perms = new Permissions([ Permissions.FLAGS.ADMINISTATOR ]);

const desc = [
    `<a:_:588518103814504490> I'm a bot made by <@183740622484668416>. You can see my abilities by performing the \`help\` command.\n`,
    `\u26A1 Powered by **[node.js](https://nodejs.org/en/) v${process.versions["node"]}**, **[discord.js](https://discord.js.org) v${djsver}**, and **[sandplate](https://github.com/06000208/sandplate)**.\n`,
    `**[Invite](https://discord.com/oauth2/authorize?client_id=435224030459723776&scope=bot&permissions=${perms.bitfield})** | **[Site](https://goon.haus/bear/)** | **[Support Server](https://discord.gg/9gdMpBR6bK)**`,
].join("\n");

module.exports = [
    new CommandBlock({
        identity: ["about"],
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
            .addField("Statistics", `• **Uptime:** ${Duration.fromMillis(client.uptime).toISOTime()}\n• **Guilds:** ${client.guilds.cache.size}\n• **Users:** ${client.users.cache.size}`)
            .setFooter(`Made with \uD83D\uDC96 by mechabubba. • Commit ${gi("%h")} @ ${DateTime.fromMillis(parseInt(gi("%ct")) * 1000).toLocaleString(DateTime.DATETIME_SHORT)} \uD83C\uDF89 • #${col.toUpperCase()}`);
        return message.channel.send(embed);
    }),
];
