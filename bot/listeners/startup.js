const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const { has } = require("lodash");

const { MessageEmbed } = require("discord.js");
const { DateTime } = require("luxon");

const snowflake = new RegExp("^(\\d{17,21})$");

module.exports = new ListenerBlock({
    event: "ready",
    once: true,
}, async function(client) {
    // this code is after the bot is online and workable as this is a listener for the ready event,
    // but it'll only run once, so it's safe to use for things such as scheduling tasks, cron jobs, etc

    // Add bot owner to hosts user group
    if (client.storage.get("users.hosts").value() === null) {
        const application = await client.fetchApplication();
        const owner = has(application, "owner.members") ? application.owner.ownerID : application.owner.id;
        client.storage.set("users.hosts", [owner]).write();
    }

    // Notify channel log
    const clogging = client.config.get("commands.channellogging").value();
    if(clogging.enabled) {
        const guild = await client.guilds.fetch(clogging.guild);
        if(guild.available) {
            const embed = new MessageEmbed()
                .setTitle(`\uD83C\uDF89 Bot is now fully functional!`)
                .setColor("#43B581")
                .setFooter({ text: `${DateTime.now().toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}` });

            const channel = guild.channels.cache.get(clogging.channel);
            channel.send({ embeds: [embed] });
        }
    }

    // Set up reactions object so we dont have to get it from the config every time
    client.reactions = {};
    const reactions = client.config.get("metadata.reactions").value();
    for(const [key, value] of Object.entries(reactions)) {
        client.reactions[key] = {};
        if(snowflake.test(value)) {
            client.reactions[key].emote = `<:_:${value}>`; // safe for chat usage
        } else {
            client.reactions[key].emote = value;
        }
        client.reactions[key].id = value; // safe for reactions
    }

    log.info(`App is now fully functional!`);
});
