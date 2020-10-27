/* todo: "remove all", handle reactions when the bot cannot react */

const CommandBlock = require("../../modules/CommandBlock");
const Reminder = require("../../modules/Reminder");
const moment = require("moment");
const _ = require("lodash");
const { MessageEmbed } = require("discord.js");
const affirmations = ["Okee doke!", "Will do!", "Gotcha!", "Affirmative.", "You got it!", "Alright!", "Can do!", "Roger that.", "Okay.", "Done.", "On it!"];

/**
 * A list of groups that can use second level granularity in cron statements.
 * If it equals "*", second level granularity will be available to all.
 * @readonly
 * @type {(string|Array)}
 */
const slg = ["hosts"];

module.exports = new CommandBlock({
    identity: ["remindme", "remind", "reminder"],
    summary: "Creates a reminder that will ping you at a certain date, interval, or time. Able to use human-date statements or cron statements.",
    description: "Creates a reminder that will ping you at a certain date, interval, or time. Able to use human-date statements or cron statements.\n• Steps, ranges, and asterisks are supported as cron statement elements.\n• Nonstandard entries, such as @yearly, @monthly, @weekly, etc, are also supported. These can be prefaced with a `-` instead of an `@`.",
    usage: "[(date / time / cron / human-readable string) | (message)] [list] [remove (id)]",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();

    if(!args[0]) return message.channel.send(`<:_:${negative}> Not enough parameters! Perform \`help ${this.firstName}\` for more information.`);
    switch(args[0]) {
      case "list":
        const embed = new MessageEmbed()
          .setColor("#9B59B6")
          .setTitle("Currently Active Reminders");

        let reminders = client.reminders.activeReminders(message.author.id);
        embed.setFooter(`${reminders.size} active reminder(s) • You can stop a reminder at any time by performing "remindme stop [id]".`);

        if(reminders.size > 0) {
          for(const value of reminders.values()) {
            let reminder = value.reminder;
            embed.addField(`"${reminder.message}"`, `• **Start:** ${moment(reminder.start).format("dddd, MMMM Do YYYY, h:mm a")}\n` + (reminder.iscron ? `• **Cron Statement:** ${reminder.end}\n` : `• **End:** ${moment(reminder.end).format("dddd, MMMM Do YYYY, h:mm a")}\n`) + `• **ID:** \`${reminder.id.toUpperCase()}\``);
          }
        }
        return message.channel.send(embed);

      case "stop":
      case "delete":
      case "remove":
        let givenID = args[1];
        if(!givenID) {
          return message.channel.send(`<:_:${negative}> You must input a reminder ID!`);
        } else {
          try {
            await client.reminders.stop(message.author.id, givenID.toLowerCase());
          } catch(e) {
            return message.channel.send(`<:_:${negative}> An error occured;\`\`\`\n${e.message}\n\`\`\``); // The reminder was not found!
          }
          return message.channel.send(`<:_:${positive}> The reminder was removed successfully!`);
        }

      default:
        if(!content.includes("|")) return message.channel.send(`<:_:${negative}> You must split your date and message with a \`|\`!`);
        
        let reminder;
        try {
          let ishost = false;
          if(slg !== "*") {
            for(group of slg) {
              if(client.storage.get(["users", group]).includes(message.author.id).value()) {
                ishost = true;
                break;
              }
            }
          } else {
            ishost = true;
          }
          if(message.channel.type == "dm") {
            reminder = new Reminder(content, message.author.id, null, null, ishost); // pain.
          } else {
            reminder = new Reminder(content, message.author.id, message.guild.id, message.channel.id, ishost); // pain.
          }
        } catch(e) {
          return message.channel.send(`<:_:${negative}> An error occured.\`\`\`\n${e.message}\`\`\``);
        }

        if(!reminder.iscron && (reminder.end.getTime() < new Date().getTime())) return message.channel.send(`<:_:${negative}> The supplied date is before the current date!`);
        let time = reminder.iscron ? `the cron expression **${reminder.end}**` : `**${moment(reminder.end).format("dddd, MMMM Do YYYY, h:mm a")}**`;

        let id;
        try {
          id = await client.reminders.start(reminder);
        } catch(e) {
          return message.channel.send(`<:_:${negative}> An error occured;\`\`\`\n${e.message}\`\`\``); // should never be seen
        }
        
        message.react(positive);
        return message.channel.send(`<:_:${positive}> ${affirmations[Math.floor(Math.random() * affirmations.length)]} I set a reminder for ${time} with the text "${reminder.message}"\nYour ID is \`${id.toUpperCase()}\`.`);
    }
  }
);
