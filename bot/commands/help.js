const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");

const commandPredicate = function(message, command) {
    if (!command.checkPermissions(message, command.userPermissions, false, false)) return false;
    if (!command.checkLocked(message)) return false;
    return true;
};

module.exports = new CommandBlock({
    names: ["help", "commands", "command", "cmds", "cmd"],
    summary: "Lists commands & provides command info",
    description: "Provides a list of commands or info about individual commands when queried.",
    usage: "(command)",
    clientChannelPermissions: ["EMBED_LINKS"],
}, function(client, message, content, args) {
    if (!content) {
        /** @type {Collection<Snowflake, CommandBlock>} */
        const commands = client.commands.cache.filter(command => commandPredicate(message, command));
        /** @type {Array<String>} */
        const names = commands.map(command => command.names[0]);

        const text = `\`\`\`\n${names.join(", ")}\n\`\`\``;
        if (text.length > 1900) {
            return log.warn("[help] The command list has exceeded 1900 characters in length and is no longer usable!");
        }

        const embed = new MessageEmbed()
            .setTitle("Command List")
            .setDescription(text)
            .setFooter({ text: `\uD83D\uDD0D To query command info, perform "${this.firstName} ${this.usage}".` });

        const color = client.config.get("metadata.color");
        if (color) embed.setColor(color);
        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    } else {
        const name = content.toLowerCase();
        if (!client.commands.index.has(name)) {
            return message.reply(`${client.reactions.negative.emote} Command \`${content}\` not found.`);
        }

        const id = client.commands.index.get(name);
        if (!client.commands.cache.has(id)) {
            log.warn(`Command name "${name}" was mapped in command index but corresponding id "${id}" isn't mapped in command cache`);
            return message.reply(`${client.reactions.negative.emote} Command \`${content}\` not found.`);
        }

        /** @type {CommandBlock} */
        const command = client.commands.cache.get(id);
        if (!commandPredicate(message, command)) {
            return message.reply(`${client.reactions.negative.emote} Command \`${content}\` not found.`);
        }

        const embed = new MessageEmbed()
            .setTitle(command.names[0])
            .setDescription(command.description || command.summary || "No description provided");
        
        // Add specific fields to help text.
        const fields = [];
        fields.push({
            name: "Usage",
            value: `\`${command.names[0]}${command.usage ? " " + command.usage : ""}\``,
            inline: true
        });

        if(!command.channelTypes.includes("DM")) fields.push({
            name: "Direct Messages",
            value: "Disallowed",
            inline: true
        });
        if (!command.channelTypes.includes("GUILD_TEXT")) fields.push({
            name: "Guilds",
            value: "Disallowed",
            inline: true
        });
        if (command.nsfw) fields.push({
            name: "NSFW",
            value: "True",
            inline: true
        });
        embed.addFields(fields);

        const color = client.config.get("metadata.color");
        if (color) embed.setColor(color);
        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
});
