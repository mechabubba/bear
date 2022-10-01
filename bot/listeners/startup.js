const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const { MessageEmbed } = require("discord.js");
const { has } = require("lodash");
const { DateTime } = require("luxon");

const snowflake = new RegExp("^(\\d{17,21})$");

module.exports = new ListenerBlock({
    event: "ready",
    once: true,
}, async function(client) {
    // This code runs after the bot is online and workable, as this is a listener for the ready event
    // But it will only run once, so it's safe to use for things such as scheduling tasks or other one time operations

    // Add bot owner to hosts user group
    // If the users.hosts group is an empty array, this won't happen.
    if (client.storage.get("users.hosts").value() === null) {
        const app = await client.application.fetch();
        // This supports teams, but only the team's owner.
        // If anyone wants to implement real support for team members, it would be appreciated.
        const owner = has(app, "owner.members") ? app.owner.ownerID : app.owner.id;
        client.storage.set("users.hosts", [owner]).write();
        log.info(`Added the bot's owner "${owner}" to the hosts user group.`);
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

    log.info("App is now fully functional");
});
