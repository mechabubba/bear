const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");

module.exports = new CommandBlock({
  identity: "leave",
  summary: "Leave a guild",
  description: "Instruct the bot to leave specific guilds.",
  usage: "<guild id>",
  scope: ["dm", "text", "news"],
  nsfw: false,
  locked: "hosts",
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
  userPermissions: null,
}, async function(client, message, content, args) {
  if (!content) return message.channel.send(`Arguments required\nUsage: \`${this.firstName} ${this.usage}\``);
  if (!client.guilds.cache.has(content)) return message.channel.send(`${client.user.tag} did not have \`${content}\` mapped to a guild in the guilds cache`);
  const guild = client.guilds.cache.get(content);
  if (!guild.available) return message.channel.send("Guild was marked as unavailable and thus couldn't be interacted with. This is indicative of a server outage.");
  try {
    await guild.leave();
  } catch (error) {
    log.error("[leave]", error);
    message.react(client.config.get("metadata.reactions.negative").value());
    return message.channel.send(`Failed to leave guild "${guild.name}" (${guild.id}) due to an error: \`${error.message}\``);
  }
  log.info(`${client.user.tag} left guild "${guild.name}" (${guild.id}) as instructed by ${message.author.tag}`);
  if (message.channel.guild.id !== guild.id) {
    message.react(client.config.get("metadata.reactions.positive").value());
    message.channel.send(`Left guild \`${guild.name}\` (id \`${guild.id}\`)`);
  }
  return;
});
