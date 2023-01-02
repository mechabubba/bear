// @todo Handle reactions when the bot can't react to messages (throws).
const CommandBlock = require("../../modules/CommandBlock");
const Reminder = require("../../modules/Reminder");
const { MessageEmbed } = require("discord.js");
const affirmations = ["Okee doke!", "Will do!", "Gotcha!", "Affirmative.", "You got it!", "Alright!", "Can do!", "Roger that.", "Okay.", "Done.", "On it!"];

/**
 * "slg" stands for "Second Level Granularity."
 * This is a list of groups that can use second level granularity in cron statements.
 * If it equals "*", second level granularity will be available to all.
 * @type {(string|string[])}
 */
const slg = ["hosts"];

module.exports = new CommandBlock({
    names: ["remindme", "remind", "reminder", "setreminder"],
    description: "Creates a reminder that will ping you at a certain date, interval, or time. Able to use human-written date/time statements or cron statements.\n• Steps, ranges, and asterisks are supported as cron statement elements.\n• *Some* nonstandard entries, such as @yearly, @monthly, @weekly, etc, are also supported. These can be prefaced with a `-` instead of an `@` so to avoid pinging random people.\n• Triggering a reminder early will cancel it, regardless if it's a cron statement or not.\n\nFor server owners: kicking an offending user (or me!) using this command for evil will automatically stop the reminder from ticking.",
    usage: "[(date / time / cron / human-readable string) | (message)] [list] [trigger (id)] [remove (id)]",
}, async function(client, message, content, args) {
    if(!args[0]) return message.reply(`${client.reactions.negative.emote} Missing an argument. Perform \`help ${this.firstName}\` for more information.`);

    switch(args[0]) {
        case "list": {
            const chan = args[1];
            const embed = new MessageEmbed()
                .setColor("9B59B6")
                .setTitle(`Reminders for ${message.author.username}`);
            const reminders = client.reminders.getReminders(message.author.id, (r) => {
                if(r.isDM || (chan === "*" ? true : r.channelID === chan) || (!chan && r.channelID == message.channel.id)) {
                    return true;
                }
                return false;
            });

            if(reminders.length > 0) {
                const fields = [];
                const large = reminders.length > 25;
                for(let i = 0; i < (large ? 25 : reminders.length); i++) {
                    const reminder = reminders[i];
                    let location;
                    if(reminder.isDM) {
                        location = "the DMs";
                    } else {
                        const guild = await client.guilds.fetch(reminder.guildID);
                        const channel = await guild.channels.fetch(reminder.channelID);
                        location = `#${channel.name}`; 
                    }
                    
                    fields.push({
                        name: `\`${reminder.ID.toUpperCase()}\` in ${location}`,
                        value: `(started <t:${reminder.startSecs}:R>, ${reminder.isCron ? `follows statement \`${reminder.end}\`, ticks <t:${data.job.nextDates().toSeconds()}:R>`: `ends <t:${reminder.endSecs}:R>`})\n${reminder.message}`
                    })
                }
                embed.addFields(fields);
            } else {
                embed.setDescription(`No reminders${(chan && chan === "*") ? "" : " in this channel"}.`);
            }

            embed.setFooter({ text: `${reminders.length} active reminder(s)${(chan && chan === "*") ? "" : " here"}. ${large ? "Only displaying the first 25! " : ""}• See \`help remindme\` for usage information.` });
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
                    // Remove the reminder if its invalid.
                    if(!await reminder.isValid(client)) {
                        client.reminders.stop(message.author.id, reminder.ID);
                        throw new Error("Attempted to trigger an invalid reminder.");
                    }

                    await client.reminders.trigger(message.author.id, given.toLowerCase(), true);
                    return message.reply(`${client.reactions.positive.emote} Reaction triggered.`);
                } catch(e) {
                    return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\n\`\`\``); // The reminder was not found!
                }
            }
            break;
        }

        case "edit": {
            // Check if this references a real ID.
            const ID = args[1];
            if(!ID) {
                return message.reply(`${client.reactions.negative.emote} You must input a reminder ID!`);
            }

            args.shift();
            const text = args.join(" ");
            if(!text) {
                return message.reply(`${client.reactions.negative.emote} You must input a piece of text to change it to!\nIf you're looking to remove a reminder, use the \`${this.firstName} stop\` command.`);
            }

            try {
                const reminder = client.storage.get(["local", "reminders", message.author.id, ID]);
                if(!reminder) {
                    throw new Error(`This reminder does not exist.`);
                }

                const old = reminder.message;
                reminder.message = text;

                return message.reply(`${client.reactions.positive.emote} Your reminders text has been updated.\`\`\`diff\n- ${old}\n+ ${reminder.message}\`\`\``);
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\n\`\`\``);
            }

            break;
        }

        default: {
            if(!content.includes("|")) return message.reply(`${client.reactions.negative.emote} You must split your date and message with a \`|\`!`);

            let reminder;
            try {
                let isHost = false;
                if(slg !== "*") {
                    for(const group of slg) {
                        if(client.storage.get(["users", group]).includes(message.author.id)) {
                            isHost = true;
                            break;
                        }
                    }
                } else {
                    isHost = true;
                }
                if(message.channel.type == "dm") {
                    reminder = new Reminder(content, message.author.id, undefined, undefined, isHost);
                } else {
                    reminder = new Reminder(content, message.author.id, message.guild.id, message.channel.id, isHost);
                }
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured.\`\`\`\n${e.message}\`\`\``);
            }

            if(!reminder.isCron && reminder.end <= Date.now()) return message.reply(`${client.reactions.negative.emote} The supplied date is before the current date!`);
            const time = reminder.isCron ? `the cron expression \`${reminder.end}\`` : `**<t:${reminder.endSecs}:f>**`;

            let id;
            try {
                id = await client.reminders.start(reminder);
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured whilst starting the reminder;\`\`\`\n${e.message}\`\`\``); // this should never happen
            }

            return message.reply({
                content: `${client.reactions.positive.emote} ${affirmations[Math.floor(Math.random() * affirmations.length)]} I set a reminder for ${time}.\nYour ID is \`${id.toUpperCase()}\`.`,
                allowedMentions: { parse: [], repliedUser: false },
            });
        }
    }
});
