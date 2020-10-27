const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");
const ListenerBlock = require("../../modules/ListenerBlock");
const moment = require("moment");

module.exports = [
  new ListenerBlock({ event: "command" }, async (client, message) => {
    const clogging = client.config.get("commands.channellogging").value();
    if(clogging.enabled) {
      const embed = new MessageEmbed()
        .setTitle(`@${message.author.tag} (\`${message.author.id}\`)`)
        .setColor(clogging.color)
        .setDescription(`\`\`\`\n${message.content}\`\`\``)
        .setThumbnail(message.author.displayAvatarURL({ format: "png", dynamic: "true" }))
        .setFooter(`${moment(message.createdTimestamp).format("lll")} • ${message.channel.id}`);
      let guild = await client.guilds.fetch(clogging.guild);
      if(guild.available) {
        let channel = guild.channels.cache.get(clogging.channel);
        channel.send(embed);
      }
    }
  })
]