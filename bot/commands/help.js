const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");
const _ = require("lodash");

const validator = function(client, command, message) {
  // permissions
  if (message.channel.type !== "dm") {
    if (command.userPermissions) {
      if (!message.member.hasPermission(command.userPermissions, false, true, true)) return false;
    }
  }
  // access control
  if (command.locked !== false) {
    if (command.locked === true) return;
    if (_.isString(command.locked)) {
      if (command.locked !== message.author.id) {
        if (!client.config.has(["users", command.locked]).value()) return false;
        if (client.config.isNil(["users", command.locked]).value()) return false;
        if (!client.config.get(["users", command.locked]).includes(message.author.id).value()) return false;
      }
    } else if (_.isArray(command.locked)) {
      if (!command.locked.includes(message.author.id)) {
        if (command.locked.some((group) => {
          if (!client.config.has(["users", group]).value()) return false;
          if (client.config.isNil(["users", group]).value()) return false;
          if (!client.config.get(["users", group]).includes(message.author.id).value()) return false;
          return true;
        }) === false) return false;
      }
    }
  }
  // passed above code without returning
  return true;
};

module.exports = new CommandBlock({
  identity: "help",
  summary: "Lists commands & provides command info",
  description: "Provides a list of commands or additional info about individual commands when queried.",
  usage: "[command]",
  scope: ["dm", "text", "news"],
  nsfw: false,
  locked: false,
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
  userPermissions: null,
}, async function(client, message, content, args) {
  if (!content) {
    // Honestly, command lists shouldn't be done within discord itself if you want to
    // include detail or summaries as shown below, because it doesn't scale well at all.
    // It's implemented here regardless to show some real interaction with the CommandConstruct and it's collections.
    // The preferred alternative would be to have a website, and the below data could be easily exported.
    const commands = client.commands.cache.filter(command => validator(client, command, message));
    let text = "📄 Command List\n";
    commands.forEach((command) => {
      text += `**-** \`${command.firstName}\` `;
      if (command.summary) text += command.summary;
      text += "\n";
    });
    text += `🔍 For per command info, use \`${this.firstName} ${this.usage}\``;
    if (text.length < 1990) {
      return message.channel.send(text);
    } else {
      return log.warn("[help] The command list has exceeded 1990 characters in length and is no longer usable!");
    }
  } else {
    const name = content.toLowerCase();
    if (!client.commands.index.has(name)) return message.channel.send(`Command \`${content}\` not found`);
    const id = client.commands.index.get(name);
    if (!client.commands.cache.has(id)) {
      log.warn(`Command name "${name}" was mapped in command index but corresponding id "${id}" isn't mapped in command cache`);
      return message.channel.send(`Command \`${content}\` not found`);
    }
    const command = client.commands.cache.get(id);
    if (!validator(client, command, message)) return message.channel.send(`Command \`${content}\` not found`);
    const embed = new MessageEmbed()
      .setTitle(command.firstName)
      .setColor(client.config.get("metadata.color").value())
      .setDescription(command.description || command.summary || "No description provided")
      .addField("Usage", `\`${command.firstName}${command.usage ? " " + command.usage : ""}\``, true);
    if (command.nsfw) embed.addField("NSFW", "True", true);
    return message.channel.send(embed);
  }
});
