const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");
const ListenerBlock = require("../../modules/ListenerBlock");
const { DateTime } = require("luxon");

module.exports = [
    new ListenerBlock({ event: "command" }, async (client, message, name, content) => {
        const clogging = client.config.get("commands.channellogging");
        if(clogging.enabled) {
            const embed = new MessageEmbed()
                .setTitle(`\`${message.author.id}\``)
                .setColor(clogging.color)
                .setDescription(`\`\`\`\n${name} ${content || ""}\`\`\``)
                .setFooter({ text: `${DateTime.fromMillis(message.createdTimestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}` });

            const guild = await client.guilds.fetch(clogging.guild);
            if(guild.available) {
                const channel = guild.channels.cache.get(clogging.channel);
                channel.send({ embeds: [embed] });
            }
        }
    }),
];
