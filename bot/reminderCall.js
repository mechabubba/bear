const ListenerBlock = require("../modules/ListenerBlock");
module.exports = new ListenerBlock({ event: "reminderCall" }, ({ client }, reminder, cronremove) => {
    const reminderalert = `<:_:${client.config.get("metadata.reactions.reminderalert").value()}>`;
    const alert = `${reminderalert} <@${reminder.userID}>, you set a reminder on **<t:${reminder.startSecs}:f>**;\n${reminder.message}`;

    const stop = (uid, rid) => client.reminders.stop(uid, rid);

    const user = client.users.resolve(reminder.userID);
    if(user === null) {
        stop(reminder.userID, reminder.id);
    }

    if(reminder.isDM) {
        user.send({
            content: alert,
            allowedMentions: {
                parse: ["users"],
            },
        });
    } else {
        const guild = client.guilds.resolve(reminder.guildID);
        if(guild !== null) {
            // We know the user exists, but we need to check if they're a member of the current server aswell.
            // If not, we have no need to send the message so we can dump it.
            const member = guild.members.resolve(reminder.userID);
            if(member !== null) {
                const channel = guild.channels.resolve(reminder.channelID);
                if(channel !== null) {
                    channel.send({
                        content: alert,
                        allowedMentions: {
                            parse: ["users"],
                        },
                    });
                }
            }
        }
    }

    if(!reminder.isCron || (reminder.isCron && cronremove)) {
        stop(reminder.userID, reminder.id);
    }
});
