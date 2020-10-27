const ListenerBlock = require("../../modules/ListenerBlock");
const _ = require("lodash"); // Used by forAny and resultFromAny

module.exports = new ListenerBlock({
  event: "message",
  once: false,
}, function(client, message) {
  if (message.author.bot) return;
  const config = client.config.get("commands").value();
  if (!config.scope.includes(message.channel.type)) return;
  const users = client.storage.get("users").value();
  if (users.allowed !== null) {
    if (!users.allowed.includes(message.author.id)) return;
  }
  if (users.blocked !== null) {
    if (users.blocked.includes(message.author.id)) return;
  }
  const input = {
    prefixed: false,
  };
  input.parsed = message.content.trim();
  input.lowercase = input.parsed.toLowerCase();
  if (config.prefix) {
    if (_.isArray(config.prefix)) {
      for (const prefix of config.prefix) {
        if (input.lowercase.startsWith(prefix)) {
          input.prefixed = true;
          input.parsed = input.parsed.substring(prefix.length).trim();
          break;
        }
      }
    } else if (input.lowercase.startsWith(config.prefix)) {
      input.prefixed = true;
      input.parsed = input.parsed.substring(config.prefix.length).trim();
    }
  }
  if (!input.prefixed) {
    if (!config.mentions) return;
    if (!input.lowercase.startsWith("<@")) return;
    if (!RegExp(`^<@!?${client.user.id}>`).test(input.lowercase)) return;
    input.parsed = input.parsed.substring(input.parsed.indexOf(">") + 1).trim();
  }
  if (!input.parsed.length) return;
  const args = input.parsed.split(/[\n\r\s]+/g);
  const name = args.shift().toLowerCase();
  input.parsed = input.parsed.slice(name.length).trim();
  if (!input.parsed.length) input.parsed = null;
  client.emit("command", message);
  client.commands.run(name, message, input.parsed, args);
});
