// @todo Handle reactions when the bot can't react to messages (throws).
const CommandBlock = require("../../modules/CommandBlock");
const Reminder = require("../../modules/Reminder");
const { MessageEmbed } = require("discord.js");
const affirmations = ["Okee doke!", "Will do!", "Gotcha!", "Affirmative.", "You got it!", "Alright!", "Can do!", "Roger that.", "Okay.", "Done.", "On it!"];

/**
 * "slg" stands for "Second Level Granularity."
 * This is a list of groups that can use second level granularity in cron statements.
 * If it equals "*", second level granularity will be available to all.
 * @type {(string|Array)}
 */
const slg = ["hosts"];

module.exports = new CommandBlock({
    identity: ["remindme", "remind", "reminder", "setreminder"],
    description: "Creates a reminder that will ping you at a certain date, interval, or time. Able to use human-date statements or cron statements.\n• Steps, ranges, and asterisks are supported as cron statement elements.\n• Nonstandard entries, such as @yearly, @monthly, @weekly, etc, are also supported. These can be prefaced with a `-` instead of an `@`.\n• Triggering a reminder early will cancel it if it's not a cron statement.",
    usage: "[(date / time / cron / human-readable string) | (message)] [list] [trigger (id)] [remove (id)]",
}, async function(client, message, content, args) {
    if(!args[0]) return message.reply(`${client.reactions.negative.emote} Missing an argument. Perform \`help ${this.firstName}\` for more information.`);

    switch(args[0]) {
        case "list": {
            const embed = new MessageEmbed()
                .setColor("9B59B6")
                .setTitle(`Reminders for ${message.author.username}`);

            const reminders = client.reminders.activeReminders(message.author.id);
            embed.setFooter({ text: `${reminders.size} active reminder(s) • See \`help remindme\` for usage information.` });

            if(reminders.size > 0) {
                for(const data of reminders.values()) {
                    const reminder = data.reminder;

                    let location;
                    if(reminder.isDM) {
                        location = "the DMs";
                    } else {
                        const guild = client.guilds.resolve(reminder.guildID);
                        const channel = guild === null ? guild : guild.channels.resolve(reminder.channelID);
                        location = channel === null ? "an unknown channel?" : `#${channel.name}`; 
                    }

                    embed.addField(
                        `\`${reminder.id.toUpperCase()}\` in ${location}`,
                        `(started <t:${reminder.startSecs}:R>, ${reminder.iscron ? `follows statement \`${reminder.end}\`, ticks <t:${Math.round(data.job.nextDates().toDate().getTime() / 1000)}:R>`: `ends <t:${reminder.endSecs}:R>`})\n${reminder.message}`
                    );
                }
            } else {
                embed.setDescription("No reminders! :)");
            }
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        }

        case "stop":
        case "delete":
        case "remove": {
            const given = args[1];
            if(!given) {
                return message.reply(`${client.reactions.negative.emote} You must input a reminder ID!`);
            } else {
                if(given == "*") {
                    client.reminders.stopAll(message.author.id);
                    return message.reply({ content: `${client.reactions.positive.emote} All reminders removed successfully!`, allowedMentions: { repliedUser: false } });
                }
                try {
                    await client.reminders.stop(message.author.id, given.toLowerCase());
                } catch(e) {
                    return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\n\`\`\``); // The reminder was not found!
                }
                return message.reply({ content: `${client.reactions.positive.emote} The reminder was removed successfully!`, allowedMentions: { repliedUser: false } });
            }
        }

        case "trigger": {
            const given = args[1];
            if(!given) {
                return message.reply(`${client.reactions.negative.emote} You must input a reminder ID!`);
            } else {
                try {
                    await client.reminders.trigger(message.author.id, given.toLowerCase());
                } catch(e) {
                    return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\n\`\`\``); // The reminder was not found!
                }
            }
            break;
        }

        default: {
            if(!content.includes("|")) return message.reply(`${client.reactions.negative.emote} You must split your date and message with a \`|\`!`);

            let reminder;
            try {
                let ishost = false;
                if(slg !== "*") {
                    for(const group of slg) {
                        if(client.storage.get(["users", group]).includes(message.author.id).value()) {
                            ishost = true;
                            break;
                        }
                    }
                } else {
                    ishost = true;
                }
                if(message.channel.type == "dm") {
                    reminder = new Reminder(content, message.author.id, null, null, ishost);
                } else {
                    reminder = new Reminder(content, message.author.id, message.guild.id, message.channel.id, ishost);
                }
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured.\`\`\`\n${e.message}\`\`\``);
            }

            if(!reminder.iscron && (reminder.end < Date.now())) return message.reply(`${client.reactions.negative.emote} The supplied date is before the current date!`);
            const time = reminder.iscron ? `the cron expression \`${reminder.end}\`` : `**<t:${reminder.endSecs}:f>**`;

            let id;
            try {
                id = await client.reminders.start(reminder);
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``); // should never be seen
            }

            return message.reply({
                content: `${client.reactions.positive.emote} ${affirmations[Math.floor(Math.random() * affirmations.length)]} I set a reminder for ${time}.\nYour ID is \`${id.toUpperCase()}\`.`,
                allowedMentions: { parse: [], repliedUser: false },
            });
        }
    }
});
