const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const log = require("../../modules/log");
const _ = require("lodash");

const validator = function(client, message, command) {
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
                if (!client.storage.has(["users", command.locked]).value()) return false;
                if (client.storage.isNil(["users", command.locked]).value()) return false;
                if (!client.storage.get(["users", command.locked]).includes(message.author.id).value()) return false;
            }
        } else if (_.isArray(command.locked)) {
            if (!command.locked.includes(message.author.id)) {
                if (command.locked.some((group) => {
                    if (!client.storage.has(["users", group]).value()) return false;
                    if (client.storage.isNil(["users", group]).value()) return false;
                    if (!client.storage.get(["users", group]).includes(message.author.id).value()) return false;
                    return true;
                }) === false) return false;
            }
        }
    }
    // passed above code without returning
    return true;
};

module.exports = new CommandBlock({
    identity: ["help", "commands", "command", "cmds", "cmd"],
    summary: "Lists commands & provides command info.",
    description: "Provides a list of commands or info about individual commands when queried.",
    usage: "[command name]",
}, async function(client, message, content, args) {
    if (!content) {
        const commands = client.commands.cache.filter(command => validator(client, message, command));
        const names = commands.map(command => command.firstName);
        
        const text = `\`\`\`\n${names.join(", ")}\n\`\`\``;
        if (text.length > 1900) {
            return log.warn("[help] The command list has exceeded 1990 characters in length and is no longer usable!");
        }

        const embed = new MessageEmbed()
            .setTitle("Command List")
            .setColor(client.config.get("metadata.color").value())
            .setDescription(text)
            .setFooter({ text: `\uD83D\uDD0D To query command info, perform "${this.firstName} ${this.usage}".` });
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

        const command = client.commands.cache.get(id);
        if (!validator(client, message, command)) {
            return message.reply(`${client.reactions.negative.emote} Command \`${content}\` not found.`);
        }
        
        const embed = new MessageEmbed()
            .setTitle(command.firstName)
            .setColor(client.config.get("metadata.color").value())
            .setDescription(command.description || command.summary || "No description provided")
            .addField("Usage", `\`${command.firstName}${command.usage ? " " + command.usage : ""}\``, true);
        if (command.nsfw) embed.addField("NSFW", "True", true);
        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
});
