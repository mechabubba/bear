const ListenerBlock = require("../modules/ListenerBlock");
const { DateTime } = require("luxon");

// Default DateTime format. Used in the reminder announcement.
const dt_format = DateTime.DATETIME_FULL;

module.exports = new ListenerBlock({ event: "reminderCall" }, ({ client }, reminder) => {
    const reminderalert = `<:_:${client.config.get("metadata.reactions.reminderalert").value()}>`;

    const start = DateTime.fromJSDate(reminder.start).toLocaleString(dt_format);
    const alert = `${reminderalert} <@${reminder.userID}>, you set a reminder on **${start}**;\n"${reminder.message}"`;

    if(reminder.isDM) {
        if(!client.users.cache.has(reminder.userID)) return client.reminders.stop(reminder.id);

        const user = client.users.cache.get(reminder.userID);
        user.send(alert);
    } else {
        if(!client.guilds.cache.has(reminder.guildID)) return client.reminders.stop(reminder.id);

        const guild = client.guilds.cache.get(reminder.guildID);
        if(!guild.members.cache.has(reminder.userID)) return client.reminders.stop(reminder.id);
        if(!guild.channels.cache.has(reminder.channelID)) return client.reminders.stop(reminder.id);

        const channel = client.guilds.cache.get(reminder.guildID).channels.cache.get(reminder.channelID);

        console.log("sending reminder");
        channel.send(alert);
    }
});
