// This file to eventually hold a bunch of other system stuff.
// Debug commands, system status, etc.
const CommandBlock = require("../../modules/CommandBlock");
const { humanizeDuration } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");
const { DateTime } = require("luxon");

module.exports = [
    new CommandBlock({
        names: ["cmdlog"],
        description: "Gets data from the command log.",
        usage: "[id]",
        locked: ["hosts"],
    }, function(client, message, content, [id, ...args]) {
        const clogging = client.config.get("commands.channellogging");
        if(!clogging.enabled) {
            return message.reply(`${client.reactions.alert.emote} Command logging is not enabled.`);
        }
        if(!id) {
            return message.reply(`${client.reactions.negative.emote} You must provide a command ID to look up!`);
        }

        id = id.toLowerCase();
        if (!client.cmdlog.has(id)) {
            return message.reply(`${client.reactions.negative.emote} The command was not found.`);
        } else {
		    const data = client.cmdlog.get(id);
            const tout = client.cmdlog.getTimeout(id);

            const tdate = DateTime.fromMillis(tout);
            const embed = new MessageEmbed()
                .setColor(clogging.color)
                .setTitle(`Command \`${id.toUpperCase()}\``)
                .setFooter({ text: `Expires ${tdate.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)} (in ${humanizeDuration(tout - Date.now())})` });

            embed.addFields([
                { name: "User", value: `\`${data.message.author.id}\``, inline: true },
                { name: "Message", value: `\`${data.message.id}\``, inline: true },
                { name: "Channel", value: `\`${data.message.channel.id}\``, inline: true },
                { name: "Guild", value: `\`${data.message.guild.id}\``, inline: true },
                { name: "Command", value: `**Executed at:** ${DateTime.fromMillis(data.message.createdTimestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}\`\`\`\n${data.parsedContent}\`\`\`` }
            ])
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        }
    }),
];
