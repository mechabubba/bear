const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { numeric } = require("../../modules/regexes");
const chalk = require("chalk");
const { MessageEmbed } = require("discord.js");

module.exports = new CommandBlock({
    names: ["guild", "guilds"],
    description: "Logs a list of guilds to the console or provides info about individual guilds when queried.",
    usage: "(guild ID)",
    locked: "hosts",
}, async function(client, message, content, [id, ...args]) {
    if (!content) {
        let list = "", unavailable = 0;
        client.guilds.cache.each(guild => {
            if (guild.available) {
                list += `\n${guild.name} ${chalk.gray(`(${guild.id})`)}`;
            } else {
                ++unavailable;
            }
        });
        log.info(`List of ${client.user.tag}'s ${client.guilds.cache.size} ${!unavailable.length ? "guilds" : `guilds (${unavailable} unavailable)`}, requested by ${message.author.tag}${list}`);
        return message.reply({ content: `${client.reactions.positive.emote} Logged ${client.guilds.cache.size} guilds to console.`, allowedMentions: { repliedUser: false } });
    } else {
        if (!numeric.test(id)) return message.reply(`${client.reactions.negative.emote} The id \`${id}\` was invalid!`);
        if (!client.guilds.cache.has(id)) return message.reply(`${client.reactions.negative.emote} The id \`${id}\` isn't mapped to a guild in the cache!`);
        const guild = client.guilds.cache.get(id);
        if (!guild.available) return message.reply(`${client.reactions.negative.emote} The guild was unavailable and could not be interacted with. This is indicative of a server outage.`);
        const embed = new MessageEmbed()
            .setTitle(guild.name)
            .setURL(`https://discordapp.com/channels/${guild.id}/`)
            .setThumbnail(guild.iconURL({ format: "png", dynamic: true }))
            .addFields([
                { name: "Owner",   value: `<@${guild.ownerId}>`,  inline: true },
                { name: "Members", value: `${guild.memberCount}`, inline: true }
            ])
            .setFooter({ text: guild.id })
            .setTimestamp(guild.createdTimestamp)
            .setColor(client.config.get("metadata.color").value());
        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
});
