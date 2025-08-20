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
    description: "Creates a reminder that will ping you at a certain date, interval, or time. Able to use human-written date/time statements or cron statements.\n• Steps, ranges, and asterisks are supported as cron statement elements.\n• *Some* nonstandard entries, such as @yearly, @monthly, @weekly, etc, are also supported. These can be prefaced with a `-` instead of an `@` so to avoid pinging random people.\n• Triggering a reminder early will cancel it, regardless if it's a cron statement or not.\n\n**For server owners:** Kicking an offending user (or me!) using this command for evil will automatically stop the reminder when it ticks.",
    usage: "[\"[date / time / cron / human-readable string] | [message]\"], [list (\"*\" || channel_id)], [trigger [id]], [edit [id] [message]], [remove [id]]",
}, async function(client, message, content, args) {
    if(!args[0]) return message.reply(`${client.reactions.negative.emote} Missing an argument. Perform \`help ${this.firstName}\` for more information.`);

    const subcmd = args.shift();
    switch(subcmd) {
        case "list": {
            const chan = args.shift();
            const embed = new MessageEmbed();

            const results = await client.reminders.getReminders(message.author.id, (r) => {
                if(
                    (chan && (chan == "*" || chan == r.channelID))
                    || (!chan && (r.channelID == message.channel.id))
                    || (r.isDM && message.channel.type === "DM")
                ) {
                    return true;
                }
                return false;
            });
            const large = results.length > 25;

            if(results.length > 0) {
                const fields = [];
                for(let i = 0; i < (large ? 25 : results.length); i++) {
                    const reminder = results[i].reminder;

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
                        value: `(started <t:${reminder.startSecs}:R>, ${reminder.isCron ? `follows statement \`${reminder.end}\`, ticks <t:${results[i].job.nextDates().toSeconds()}:R>` : `ends <t:${reminder.endSecs}:R>`})\n${reminder.message}`,
                    });
                }
                embed.addFields(fields);
            } else {
                embed.setDescription(`No reminders${(chan && chan === "*") ? "" : " in this channel"}.`);
            }

            let title = `Reminders for ${message.author.username}`;
            if (chan) {
                // problem. we cannot rely solely on `client.channels` to get the right channel name.
                // we will also not always have a guild id; we could try to steal one from a reminder that has a matching guild id, but said reminder won't always be there.
                // revisit this...
                try {
                    const chan = await client.channels.fetch(chan);
                    title += ` in #${chan.name}`;
                } catch(e) {
                    title += ` in an unknown channel?`;
                }
            }

            embed.setColor("9B59B6")
                .setTitle(title)
                .setFooter({ text: `${results.length} active reminder(s)${(chan && chan === "*" || !chan) ? "" : " here"}. ${large ? "Only displaying the first 25! " : ""}• See \`help remindme\` for usage information.` });
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        }

        case "stop":
        case "delete":
        case "remove": {
            let ID = args.shift();
            if(!ID) {
                return message.reply(`${client.reactions.negative.emote} You must input a reminder ID!`);
            }
            ID = ID.toLowerCase();

            if(ID == "*") {
                client.reminders.stopAll(message.author.id);
                return message.reply({ content: `${client.reactions.positive.emote} All reminders removed!`, allowedMentions: { repliedUser: false } });
            }

            try {
                await client.reminders.stop(message.author.id, ID);
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\n\`\`\``); // The reminder was not found!
            }

            return message.reply({ content: `${client.reactions.positive.emote} The reminder was removed successfully!`, allowedMentions: { repliedUser: false } });
        }

        case "trigger": {
            let ID = args.shift();
            if(!ID) {
                return message.reply(`${client.reactions.negative.emote} You must input a reminder ID!`);
            }
            ID = ID.toLowerCase();

            try {
                const result = client.storage.get(["local", "reminders", message.author.id, ID]);
                if(!result) {
                    throw new Error(`This reminder does not exist.`);
                }

                // Construct the reminder and remove it if its invalid.
                const reminder = Reminder.fromObject(result);
                const valid = await reminder.isValid(client);
                if(!valid) {
                    client.reminders.stop(message.author.id, reminder.ID);
                    throw new Error("Attempted to trigger an invalid reminder!");
                }

                await client.reminders.trigger(message.author.id, ID, true);
                return message.reply({
                    content: `${client.reactions.positive.emote} Reminder triggered.`,
                    allowedMentions: { parse: [], repliedUser: false },
                });
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\n\`\`\``); // The reminder was not found!
            }
        }

        case "edit": {
            let ID = args.shift();
            if(!ID) {
                return message.reply(`${client.reactions.negative.emote} You must input a reminder ID!`);
            }
            ID = ID.toLowerCase();

            const text = content.substring(`edit ${ID}`.length, content.length);
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
                client.storage.set(["local", "reminders", message.author.id, ID], reminder);

                const diff = `\`\`\`diff\n- ${old.replace(/\n/g, "\n- ")}\n+${reminder.message.replace(/\n/g, "\n+ ")}\`\`\``;
                return message.reply({
                    content: `${client.reactions.positive.emote} Your reminders text has been updated.${diff}`,
                    allowedMentions: { parse: [], repliedUser: false },
                });
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\n\`\`\``);
            }
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
                if(message.channel.type === "DM") {
                    reminder = new Reminder(content, message.author.id, undefined, undefined, isHost);
                } else {
                    reminder = new Reminder(content, message.author.id, message.guild.id, message.channel.id, isHost);
                }
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
            }

            if(!reminder.isCron && reminder.end <= Date.now()) {
                return message.reply(`${client.reactions.negative.emote} The supplied date is before the current date!`);
            }
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
