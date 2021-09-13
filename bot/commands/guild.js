const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { isNumeric } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");
const chalk = require("chalk");

module.exports = new CommandBlock({
    identity: ["guild", "guilds"],
    summary: "Lists guilds and provides guild info.",
    description: "Logs a list of guilds to the console or provides info about individual guilds when queried.",
    usage: "(guild ID)",
    scope: ["dm", "text", "news"],
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
}, async function(client, message, content, [id, ...args]) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();

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
        return message.channel.send(`<:_:${positive}> Logged ${client.guilds.cache.size} guilds to console.`);
    } else {
        if (!isNumeric(id)) return message.channel.send(`The id \`${id}\` was invalid`);
        if (!client.guilds.cache.has(id)) return message.channel.send(`The id \`${id}\` isn't mapped to a guild in the cache`);
        const guild = client.guilds.cache.get(id);
        if (!guild.available) return message.channel.send("The guild was unavailable and could not be interacted with. This is indicative of a server outage.");
        const embed = new MessageEmbed()
            .setTitle(guild.name)
            .setURL(`https://discordapp.com/channels/${guild.id}/`)
            .setThumbnail(guild.iconURL({ format: "png", dynamic: true }))
            .addFields(
                { name: "Owner", value: `${guild.owner.user}`, inline: true },
                { name: "Members", value: guild.memberCount, inline: true },
                { name: "Region", value: `\`${guild.region}\``, inline: true },
            )
            .setFooter(guild.id)
            .setTimestamp(guild.createdTimestamp)
            .setColor(client.config.get("metadata.color").value());
        return message.channel.send(embed);
    }
});
