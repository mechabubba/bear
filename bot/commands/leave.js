const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { numeric } = require("../../modules/regexes");

module.exports = new CommandBlock({
    names: ["leave"],
    summary: "Leave a guild",
    description: "Instruct the bot to leave a specific guild.",
    usage: "<id>",
    locked: "hosts",
    clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, async function(client, message, content, args) {
    if (!content) return message.channel.send(`Arguments are required\nUsage: \`${this.names[0]} ${this.usage}\``);
    if (!numeric.test(content)) return message.channel.send(`The id \`${content}\` was invalid`);
    if (!client.guilds.cache.has(content)) return message.channel.send(`${client.user.tag} did not have \`${content}\` mapped to a guild in the guilds cache`);
    const guild = client.guilds.cache.get(content);
    if (!guild.available) return message.channel.send("The guild was unavailable and could not be interacted with. This is indicative of a server outage.");
    if (guild.deleted) return message.channel.send(`I have already left or been kicked from "${guild.name}" (${guild.id})`);
    if (client.user.id === guild.ownerID) return message.channel.send("I own the specified guild and cannot leave without transferring ownership.");
    try {
        await guild.leave();
    } catch (error) {
        message.react(client.config.get("metadata.reactions.negative").value());
        log.error(`Failed to leave guild "${guild.name}" (${guild.id}) as instructed by ${message.author.tag} due to an error:`, error);
        return message.channel.send(`Failed to leave guild "${guild.name}" (${guild.id}) due to an error: \`${error.message}\``);
    }
    log.info(`${client.user.tag} left guild "${guild.name}" (${guild.id}) as instructed by ${message.author.tag}`);
    if (message.channel.guild.id !== guild.id) {
        message.react(client.config.get("metadata.reactions.positive").value());
        message.channel.send(`Left guild \`${guild.name}\` (id \`${guild.id}\`)`);
    }
});
