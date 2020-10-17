const CommandBlock = require("../../modules/CommandBlock");
const Reminder = require("../../modules/Reminder");
const moment = require("moment");
const _ = require("lodash");
const { MessageEmbed } = require("discord.js");
const affirmations = ["Okee doke!", "Will do!", "Gotcha!", "Affirmative.", "You got it!", "Alright!", "Can do!", "Roger that.", "Okay.", "Done did.", "On it!", "Done."];
//const log = require("../../modules/log");

module.exports = new CommandBlock({
    identity: ["remindme", "remind", "reminder"],
    summary: "Creates a reminder that will ping you at a certain date, interval, or time. Able to use human-date statements or cron statements.",
    description: "Creates a reminder that will ping you at a certain date, interval, or time. Able to use human-date statements or cron statements.\n • Steps, ranges, and asterisks are supported as cron statement elements.\n • You can add `-private` to your options to be reminded via DM.\n • Nonstandard entries, such as @yearly, @monthly, @weekly, etc, are also supported. These can be prefaced with a `-` instead of an `@`.",
    usage: "[(date / time / cron / human-readable string) <options> | (message)] [list] [remove (id)]",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    const positive = `<:_:${client.config.get("metadata.reactions.positive").value()}>`
    const negative = `<:_:${client.config.get("metadata.reactions.negative").value()}>`

    if(!args[0]) return message.channel.send(`${negative} Not enough parameters! Perform \`help remindme\` for more information.`);
    switch(args[0]) {
      case "list":
        const embed = new MessageEmbed()
          .setColor("#9B59B6")
          .setAuthor("Currently Active Reminders");

        let reminders = client.reminders.activeReminders(message.author.id);
        if(_.isEmpty(reminders)) {
          embed.setDescription(`You dont currently have any active reminders!`);
          return message.channel.send(embed);
        }
        embed.setFooter(`${Object.keys(reminders).length} Reminders • You can stop a reminder at any time by performing "remindme stop [id]".`);

        for(let key in reminders) {
          let reminder = reminders[key];
          embed.addField(`"${reminder.message}"`, `**Start:** ${moment(reminder.start).format("dddd, MMMM Do YYYY, h:mm:ss a")}\n` + (reminder.iscron ? `**Cron Statement:** ${reminder.end}\n` : `**End:** ${moment(reminder.end).format("dddd, MMMM Do YYYY, h:mm:ss a")}\n`) + `**ID:** \`${reminder.id.toUpperCase()}\``, false);
        }

        return message.channel.send(embed);

      case "stop":
      case "delete":
      case "remove":
        let givenID = args[1];
        if(!givenID) {
          return message.channel.send(`${negative} You must input a reminder ID!`);
        } else {
          try {
            await client.reminders.stop(message.author.id, givenID.toLowerCase());
          } catch(e) {
            return message.channel.send(`${negative} An error occured;\`\`\`\n${e.stack}\n\`\`\``); // The reminder was not found!
          }
          return message.channel.send(`${positive} The reminder was removed successfully!`);
        }

      default:
        if(!content.includes("|")) return message.channel.send(`${negative} You must split your date and message with a \`|\`!`);
        
        let reminder;
        try {
          reminder = new Reminder(content, message.guild.id, message.author.id, message.channel.id); // pain.
        } catch(e) {
          message.channel.send(`${negative} An error occured.\`\`\`\n${e.stack}\`\`\``);
        }

        if(reminder.end instanceof Date && reminder.end.getTime() < new Date().getTime()) return message.channel.send(`${negative} The supplied date is before the current date!`);

        let time = reminder.iscron ? `the cron expression **${reminder.end}**` : `**${moment(reminder.end).format("dddd, MMMM Do YYYY, h:mm:ss a")}**`;

        let id;
        try {
          id = await client.reminders.start(reminder);
        } catch(e) {
          return message.channel.send(`${negative} An error occured;\`\`\`\n${e.stack}\`\`\``); // should never be seen
        }
        return message.channel.send(`${positive} ${affirmations[Math.floor(Math.random() * affirmations.length)]} I set a reminder for ${time} with the text "${reminder.message}"\nYour ID is \`${id.toUpperCase()}\`.`);
    }
  }
);