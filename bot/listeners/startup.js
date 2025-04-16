const fs = require('node:fs/promises');
const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const Reminder = require("../../modules/Reminder");
const { MessageEmbed } = require("discord.js");
const { has, isEmpty } = require("lodash");
const { DateTime } = require("luxon");

const snowflake = new RegExp("^(\\d{17,21})$");

module.exports = new ListenerBlock({
    event: "ready",
    once: true,
}, async function(client) {
    // This code runs after the bot is online and workable, as this is a listener for the ready event
    // But it will only run once, so it's safe to use for things such as scheduling tasks or other one time operations

    // Add bot owner to hosts usergroup.
    // If the hosts group is an empty array, this won't happen on the assumption its intentional.
    if (client.storage.get("users.hosts") === null) {
        const app = await client.application.fetch();
        // This supports teams, but only the team's owner.
        // If anyone wants to implement real support for team members, it would be appreciated.
        const owner = has(app, "owner.members") ? app.owner.ownerID : app.owner.id;
        client.storage.set("users.hosts", [owner]);
        log.info(`Added the bot's owner "${owner}" to the hosts user group.`);
    }

    // Remove all commands dependant on non-existing packages.
    client.commands.cache.forEach((cmd, id, map) => {
        const unmet = cmd.unmetDependencies();
        if (unmet.length > 0) {
            log.warn(`Unloading command "${cmd.firstName}" for having unmet dependencies; ${unmet.join(", ")}`);
            client.commands.unload(cmd);
        }
    });

    // Set up client.reactions object, so we dont have to get it from the config every time.
    // Each reaction has an `emote` (safe for chat usage) and `id` (safe for internal usage) key.
    client.reactions = {};
    const reactions = client.config.get("metadata.reactions");
    for(const [key, value] of Object.entries(reactions)) {
        client.reactions[key] = {};
        if(snowflake.test(value)) {
            client.reactions[key].emote = `<:_:${value}>`;
        } else {
            client.reactions[key].emote = value;
        }
        client.reactions[key].id = value;
    }

    // Load all stored reminders.
    const reminders = client.storage.get(["local", "reminders"]);
    for(const userID in reminders) {
        for(const ID in reminders[userID]) {
            const reminder = Reminder.fromObject(reminders[userID][ID]);
            const valid = await reminder.isValid(client);
            if(!valid) {
                client.storage.delete(["local", "reminders", userID, ID]);
                continue;
            }
            client.reminders.start(reminder);
        }
        if(isEmpty(client.storage.get(["local", "reminders", userID]))) {
            client.storage.delete(["local", "reminders", userID]);
        }
    }

    // other nonsense
    const spook = await fs.readFile("data/spook.lines", { encoding: "ascii" });
    client.cookies["spook"] = spook.split("\0").map(x => x.trim());

    // Notify the channel log of liveliness.
    const clogging = client.config.get("commands.channellogging");
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

    log.info("App is now fully functional!");
});
