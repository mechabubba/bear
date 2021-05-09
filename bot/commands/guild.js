const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { numeric } = require("../../modules/regexes");
const { MessageEmbed } = require("discord.js");
const chalk = require("chalk");
const fetch = require("node-fetch");
const { has } = require("lodash");

module.exports = new CommandBlock({
  identity: ["guild", "guilds"],
  summary: "List guilds & provides guild info",
  description: "Logs a list of guilds to the console or provides info about individual guilds when queried.",
  usage: "[guild id]",
  scope: ["dm", "text", "news"],
  nsfw: false,
  locked: "hosts",
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
  userPermissions: null,
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
    const description = `list of ${client.user.tag}'s ${client.guilds.cache.size} ${client.guilds.cache.size === 1 ? "guild" : "guilds"}${unavailable ? ` (${unavailable} unavailable)` : ""}`;
    log.info(`A ${description}, requested by ${message.author.tag}${list}`);
    return message.channel.send(`Printed a ${description} to the console`);
  } else {
    if (!numeric.test(id)) return message.channel.send(`The id \`${id}\` was invalid`);
    if (!client.guilds.cache.has(id)) return message.channel.send(`The id \`${id}\` isn't mapped to a guild in the cache`);
    const guild = client.guilds.cache.get(id);
    // guild = await guild.fetch();
    if (!guild.available) return message.channel.send("The guild was unavailable. This is indicative of a server outage.");
    const embed = new MessageEmbed()
      .setTitle(guild.name)
      .addFields(
        { name: "Link", value: `[Jump](https://discordapp.com/channels/${guild.id}/)`, inline: true },
        { name: "Owner", value: `<@${guild.ownerID}>`, inline: true },
      )
      .setFooter(guild.id)
      .setTimestamp(guild.createdTimestamp);
    const color = client.config.get("metadata.color").value();
    if (color) embed.setColor(color);
    // Attempt to respect guild privacy when widget is disabled
    // Checked using node-fetch so the Manage Server permission isn't required
    const widget = `https://discordapp.com/api/guilds/${guild.id}/widget.json`;
    const response = await fetch(widget);
    const json = await response.json();
    if (!has(json, "code")) {
      log.debug(`Fetched "${widget}" for ${message.author.tag}`);
      embed.addFields(
        { name: "Members", value: guild.memberCount, inline: true },
        { name: "Region", value: `\`${guild.region}\``, inline: true },
        { name: "Widget", value: "Enabled", inline: true },
      ).setThumbnail(guild.iconURL({ format: "png" }));
    } else {
      log.warn(`${message.author.tag} requested widget.json for "${guild.id}"`, json);
      embed.addField("Widget", "Disabled", true);
    }
    return message.channel.send(embed);
  }
});
