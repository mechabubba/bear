const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { numeric } = require("../../modules/regexes");
const chalk = require("chalk");
const { MessageEmbed } = require("discord.js");

module.exports = [
        new CommandBlock({
        names: ["guild", "guilds"],
        description: "Logs a list of guilds to the console or provides info about individual guilds when queried.",
        usage: "(guild ID)",
        locked: "hosts",
    }, async function(client, message, content, [id, ...args]) {
        if (!content) {
            let list = "", unavailable = 0;
            client.guilds.cache.each(guild => {
                if (guild.available) {
                    list += `\n${guild.name} ${chalk.gray(`(${guild.id})`)}`;
                } else {
                    ++unavailable;
                }
            });
            log.info(`List of ${client.user.tag}'s ${client.guilds.cache.size} ${!unavailable.length ? "guilds" : `guilds (${unavailable} unavailable)`}, requested by ${message.author.tag}${list}`);
            return message.reply({ content: `${client.reactions.positive.emote} Logged ${client.guilds.cache.size} guilds to console.`, allowedMentions: { repliedUser: false } });
        } else {
            if (!numeric.test(id)) return message.reply(`${client.reactions.negative.emote} The id \`${id}\` was invalid!`);
            if (!client.guilds.cache.has(id)) return message.reply(`${client.reactions.negative.emote} The id \`${id}\` isn't mapped to a guild in the cache!`);
            const guild = client.guilds.cache.get(id);
            if (!guild.available) return message.reply(`${client.reactions.negative.emote} The guild was unavailable and could not be interacted with. This is indicative of a server outage.`);
            const embed = new MessageEmbed()
                .setTitle(guild.name)
                .setURL(`https://discordapp.com/channels/${guild.id}/`)
                .setThumbnail(guild.iconURL({ format: "png", dynamic: true }))
                .addFields([
                    { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
                    { name: "Members", value: `${guild.memberCount}`, inline: true },
                ])
                .setFooter({ text: guild.id })
                .setTimestamp(guild.createdTimestamp)
                .setColor(client.config.get("metadata.color"));
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        }
    }),
    new CommandBlock({
        names: ["leave"],
        description: "Instructs the bot to leave a specific guild.",
        usage: "[guild ID]",
        locked: "hosts",
    }, async function(client, message, content, args) {
        if (!content) return message.reply(`${client.reactions.negative.emote} Missing an argument. Preform \`help ${this.firstName}\` for more information.`);
        if (!numeric.test(content)) return message.reply(`${client.reactions.negative.emote} The ID \`${content}\` was invalid.`);
        if (!client.guilds.cache.has(content)) return message.reply(`${client.reactions.negative.emote} ${client.user.tag} did not have \`${content}\` mapped to a guild in the guilds cache.`);
    
        const guild = client.guilds.cache.get(content);
        if (!guild.available) return message.reply(`${client.reactions.negative.emote} The guild was unavailable and could not be interacted with. This is indicative of a server outage.`);
        if (guild.deleted) return message.reply(`${client.reactions.negative.emote} I have already left or been kicked from "${guild.name}" (${guild.id})!`);
        if (client.user.id === guild.ownerID) return message.reply(`${client.reactions.negative.emote} I own the specified guild and cannot leave without transferring ownership.`);
    
        try {
            await guild.leave();
        } catch (error) {
            message.react(client.reactions.negative.id);
            log.error(`Failed to leave guild "${guild.name}" (${guild.id}) as instructed by ${message.author.tag} due to an error:`, error);
            return message.reply(`${client.reactions.negative.emote} Failed to leave guild "${guild.name}" (\`${guild.id}\`) due to an error:\`\`\`\n${error.message}\`\`\``);
        }
    
        log.info(`${client.user.tag} left guild "${guild.name}" (${guild.id}) as instructed by ${message.author.tag}`);
        if (message.channel.guild.id !== guild.id) {
            message.react(client.reactions.negative.id);
            message.reply({ content: `${client.reactions.positive.emote} Left guild "${guild.name}" (\`${guild.id}\`).`, allowedMentions: { repliedUser: false } });
        }
    })    
];
