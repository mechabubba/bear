const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");
const { isArray } = require("lodash");

const commandPredicate = function(message, command) {
    if (!command.checkPermissions(message, command.userPermissions, false, false)) return false;
    if (!command.checkLocked(message)) return false;
    return true;
};

module.exports = new CommandBlock({
    names: ["help", "commands", "command", "cmds", "cmd"],
    summary: "Lists commands & provides command info",
    description: "Provides a list of commands or info about individual commands when queried.",
    usage: "[command]",
    clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
}, function(client, message, content, args) {
    if (!content) {
        /** @type {Collection<Snowflake, CommandBlock>} */
        const commands = client.commands.cache.filter(command => commandPredicate(message, command));
        /** @type {Array<String>} */
        const names = commands.map(command => command.names[0]);
        const text = `🔍 To query command info, use \`${this.names[0]} ${this.usage}\`\n\`\`\`\n${names.join(", ")}\n\`\`\``;
        if (text.length > 1900) return log.warn("[help] The command list has exceeded 1900 characters in length and is no longer usable!");
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
        /** @type {CommandBlock} */
        const command = client.commands.cache.get(id);
        if (!commandPredicate(message, command)) return message.channel.send(`Command \`${content}\` not found`);
        const embed = new MessageEmbed()
            .setTitle(command.names[0])
            .setDescription(command.description || command.summary || "No description provided")
            .addField("Usage", `\`${command.names[0]}${command.usage ? " " + command.usage : ""}\``, true);
        if (!command.channelTypes.includes("dm")) embed.addField("Direct Messages", "Disallowed", true);
        if (!command.channelTypes.includes("text")) embed.addField("Guilds", "Disallowed", true);
        if (command.nsfw) embed.addField("NSFW", "True", true);
        if (command.names.length > 1) embed.setFooter(command.names.slice(1).join(", "));
        const color = client.config.get("metadata.color").value();
        if (color) embed.setColor(color);
        return message.channel.send(embed);
    }
});
