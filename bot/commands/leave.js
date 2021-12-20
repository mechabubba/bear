const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");

module.exports = new CommandBlock({
    identity: "leave",
    description: "Instructs the bot to leave a specific guild.",
    usage: "[guild ID]",
    scope: ["dm", "text", "news"],
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, async function(client, message, content, args) {
    if (!content) return message.channel.send(`${client.reactions.negative.emote} Missing an argument. Preform \`help ${this.firstName}\` for more information.`);
    if (!client.guilds.cache.has(content)) return message.channel.send(`${client.user.tag} did not have \`${content}\` mapped to a guild in the guilds cache`);
    const guild = client.guilds.cache.get(content);
    if (!guild.available) return message.channel.send(`${client.reactions.negative.emote} The guild was unavailable and could not be interacted with. This is indicative of a server outage.`);
    try {
        await guild.leave();
    } catch (error) {
        log.error("[leave]", error);
        message.react(client.reactions.negative.id);
        return message.channel.send(`${client.reactions.negative.emote} Failed to leave guild "${guild.name}" (\`${guild.id}\`) due to an error:\`\`\`\n${error.message}\`\`\``);
    }
    log.info(`${client.user.tag} left guild "${guild.name}" (${guild.id}) as instructed by ${message.author.tag}`);
    if (message.channel.guild.id !== guild.id) {
        message.react(client.reactions.negative.id);
        message.channel.send(`${client.reactions.positive.emote} Left guild "${guild.name}" (\`${guild.id}\`).`);
    }
});
