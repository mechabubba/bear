const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const moment = require("moment");

module.exports = new ListenerBlock({ event: "reminderCall" }, (client, reminder) => {
  log.debug("we have entered.... the listener:tm:");
  log.debug(JSON.stringify(client));

  const reminderalert = `<:_:${client.config.get("metadata.reactions.reminderalert").value()}>`;

  if(!client.guilds.cache.has(reminder.guildID)) return client.reminders.stop(reminder.id);
  if(!reminder.private && !client.guilds.cache.get(reminder.guildID).channels.cache.has(reminder.channelID)) return client.reminders.stop(reminder.id);
  if(!client.guilds.cache.get(reminder.guildID).members.cache.has(reminder.userID)) return client.reminders.stop(reminder.id);

  const start = moment(reminder.start).format("dddd, MMMM Do YYYY, h:mm:ss a");
  const alert = `${reminderalert} **<@${reminder.user}>,** you set a reminder on **${start}**;\n"${reminder.message}"`;
  
  if(reminder.private == true) {
      client.users.cache.get(reminder.userID).send(alert);
  } else {
      client.guilds.cache.get(reminder.guildID).channels.cache.get(reminder.channelID).send(alert);
  }
});