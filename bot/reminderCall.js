const ListenerBlock = require("../modules/ListenerBlock");
const log = require("../modules/log");

module.exports = new ListenerBlock({ event: "reminderCall" }, async ({ client }, reminder, cronremove) => {
    const stop = (uid, rid) => client.reminders.stop(uid, rid);
    
    let threw = false;
    try {
        if(reminder.isDM) {
            const user = await client.users.fetch(reminder.userID);
            if(!user) throw new Error("User not found.");

            user.send({
                content: `${reminderalert} <@${reminder.userID}>, you set a reminder on **<t:${reminder.startSecs}:f>**;\n${reminder.message}`,
                allowedMentions: { parse: ["users"] },
            });
        } else {
            const guild = await client.guilds.fetch(reminder.guildID);
            if(!guild) throw new Error("Guild not found.");

            const channel = await guild.channels.fetch(reminder.channelID);
            if(!channel) throw new Error("Channel not found.");

            const user = guild.members.fetch(reminder.userID);
            if(!user) throw new Error("User is no longer in this guild.");

            channel.send({
                content: `${client.reactions.reminderalert.emote} <@${reminder.userID}>, you set a reminder on **<t:${reminder.startSecs}:f>**;\n${reminder.message}`,
                allowedMentions: { parse: ["users"] },
            });
        }
    } catch(e) {
        // A few possible things happened here;
        // - The bot could not fetch the guild.
        // - The bot could not fetch the guild member (or user, in the case of DM's).
        // - The bot could not fetch the channel.
        // - The bot could not DM the user.
        // Whatever the case, it wasn't supposed to happen. We kill the reminder here.
        log.error("Attempted to send reminder, but failed (for whatever reason!");
        log.error(e);
        threw = true;
    } finally {
        if(!reminder.isCron || (reminder.isCron && cronremove) || threw) {
            stop(reminder.userID, reminder.id);
        }
    }
});
