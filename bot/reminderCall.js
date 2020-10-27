const ListenerBlock = require("../modules/ListenerBlock");
const moment = require("moment");

module.exports = new ListenerBlock({ event: "reminderCall" }, ({ client }, reminder) => {
  const reminderalert = `<:_:${client.config.get("metadata.reactions.reminderalert").value()}>`;

  const start = moment(reminder.start).format("dddd, MMMM Do YYYY, h:mm a");
  const alert = `${reminderalert} <@${reminder.userID}>, you set a reminder on **${start}**;\n"${reminder.message}"`;

  if(reminder.isDM) {
    if(!client.users.cache.has(reminder.userID)) return client.reminders.stop(reminder.id);
    
    let user = client.users.cache.get(reminder.userID);
    user.send(alert);
  } else {
    if(!client.guilds.cache.has(reminder.guildID)) return client.reminders.stop(reminder.id);
    
    let guild = client.guilds.cache.get(reminder.guildID);
    if(!guild.members.cache.has(reminder.userID)) return client.reminders.stop(reminder.id);
    if(!guild.channels.cache.has(reminder.channelID)) return client.reminders.stop(reminder.id);

    let channel = client.guilds.cache.get(reminder.guildID).channels.cache.get(reminder.channelID);
    channel.send(alert);
  }
});