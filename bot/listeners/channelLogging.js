const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");
const ListenerBlock = require("../../modules/ListenerBlock");
const { DateTime } = require("luxon");

module.exports = [
    new ListenerBlock({ event: "command" }, async (client, message) => {
        const clogging = client.config.get("commands.channellogging").value();
        if(clogging.enabled) {
            const embed = new MessageEmbed()
                .setTitle(`@${message.author.tag} (\`${message.author.id}\`)`)
                .setColor(clogging.color)
                .setDescription(`\`\`\`\n${message.content}\`\`\``)
                .setThumbnail(message.author.displayAvatarURL({ format: "png", dynamic: "true" }))
                .setFooter(`${DateTime.fromMillis(message.createdTimestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)} • ${message.channel.id}`);

            const guild = await client.guilds.fetch(clogging.guild);
            if(guild.available) {
                const channel = guild.channels.cache.get(clogging.channel);
                channel.send(embed);
            }
        }
    }),
];
