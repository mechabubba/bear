const CommandBlock = require("../../modules/CommandBlock");
const { numeric } = require("../../modules/regexes");
const { MessageEmbed } = require("discord.js");

module.exports = new CommandBlock({
    names: ["guild"],
    summary: "Provides guild info",
    description: "Logs a list of guilds to the console or provides info about individual guilds when queried.",
    usage: "[guild id]",
    locked: "hosts",
    clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
}, async function(client, message, content, [id, ...args]) {
    if (message.channel.type === "dm" && !content) return message.channel.send("An id is required as input in direct messages");
    let guild = null;
    if (!content) {
        guild = message.guild;
    } else {
        if (!numeric.test(id)) return message.channel.send(`The id \`${id}\` was invalid`);
        if (!client.guilds.cache.has(id)) return message.channel.send(`The id \`${id}\` isn't mapped to a guild in the cache`);
        guild = client.guilds.cache.get(id);
    }
    if (!guild.available) return message.channel.send("The guild was unavailable. This is indicative of a server outage.");
    const embed = new MessageEmbed()
        .setTitle(guild.name)
        .addFields(
            { name: "Link", value: `[Jump](https://discordapp.com/channels/${guild.id}/)`, inline: true },
            { name: "Owner", value: `<@${guild.ownerID}>`, inline: true },
        )
        .setFooter(guild.id)
        .setTimestamp(guild.createdTimestamp);
    // Only display server avatars if the message originates from the same server
    if (guild.id === message.guild.id) embed.setThumbnail(guild.iconURL({ format: "png" }));
    const color = client.config.get("metadata.color").value();
    if (color) embed.setColor(color);
    return message.channel.send(embed);
});
