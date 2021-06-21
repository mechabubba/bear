const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");

const commandPredicate = function(message, command) {
  if (!command.checkPermissions(message, message.member, command.userPermissions)) return false;
  if (!command.checkLocked(message)) return false;
  return true;
};

module.exports = new CommandBlock({
  identity: ["help", "commands", "command", "cmds", "cmd"],
  summary: "Lists commands & provides command info",
  description: "Provides a list of commands or info about individual commands when queried.",
  usage: "[command]",
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, function(client, message, content, args) {
  if (!content) {
    const commands = client.commands.cache.filter(command => commandPredicate(message, command));
    const names = commands.map(command => command.firstName);
    const text = `🔍 To query command info, use \`${this.firstName} ${this.usage}\`\n\`\`\`\n${names.join(", ")}\n\`\`\``;
    if (text.length > 1900) return log.warn("[help] The command list has exceeded 1990 characters in length and is no longer usable!");
    const embed = new MessageEmbed()
      .setTitle("Command List")
      .setDescription(text);
    const color = client.config.get("metadata.color").value();
    if (color) embed.setColor(color);
    return message.channel.send(embed);
  } else {
    const name = content.toLowerCase();
    if (!client.commands.index.has(name)) return message.channel.send(`Command \`${content}\` not found`);
    const id = client.commands.index.get(name);
    if (!client.commands.cache.has(id)) {
      log.warn(`Command name "${name}" was mapped in command index but corresponding id "${id}" isn't mapped in command cache`);
      return message.channel.send(`Command \`${content}\` not found`);
    }
    const command = client.commands.cache.get(id);
    if (!commandPredicate(message, command)) return message.channel.send(`Command \`${content}\` not found`);
    const embed = new MessageEmbed()
      .setTitle(command.firstName)
      .setDescription(command.description || command.summary || "No description provided")
      .addField("Usage", `\`${command.firstName}${command.usage ? " " + command.usage : ""}\``, true);
    const color = client.config.get("metadata.color").value();
    if (color) embed.setColor(color);
    if (command.nsfw) embed.addField("NSFW", "True", true);
    return message.channel.send(embed);
  }
});
