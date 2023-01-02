const ListenerBlock = require("../modules/ListenerBlock");
const log = require("../modules/log");

module.exports = new ListenerBlock({ event: "reminderCall" }, async ({ client }, reminder, forceRemove) => {
    let threw = false;
    try {
        if(!reminder.isValid(client)) {
            threw = true;
            return; // Will jump to the finally block before exiting.
        }

        let channel;
        if(reminder.isDM) {
            const user = await client.users.fetch(reminder.userID);
            channel = user.dmChannel;
        } else {
            const guild = await client.guilds.fetch(reminder.guildID);
            channel = await guild.channels.fetch(reminder.channelID);
        }

        channel.send({
            content: `${client.reactions.reminderalert.emote} <@${reminder.userID}>, you set a reminder on **<t:${reminder.startSecs}:f>**;\n${reminder.message}`,
            allowedMentions: { parse: ["users"] },
        });
    } catch(e) {
        // Something happened that wasn't supposed to happen. Kill the reminder just to avoid it throwing again.
        log.error("Attempted to send reminder, but failed (for whatever reason!");
        log.error(e);
        threw = true;
    } finally {
        if(!reminder.isCron || forceRemove || threw) {
            client.reminders.stop(reminder.userID, reminder.ID);
        }
    }
});
