const ListenerBlock = require("../../modules/ListenerBlock");
const _ = require("lodash"); // Used by forAny and resultFromAny

module.exports = new ListenerBlock({
  event: "message",
  once: false,
}, function(client, message) {
  if (message.author.bot) return;
  const config = client.config.get("commands").value();
  if (!config.scope.includes(message.channel.type)) return;
  const users = client.config.get("users").value();
  if (users.allowed !== null) {
    if (!users.allowed.includes(message.author.id)) return;
  }
  if (users.blocked !== null) {
    if (users.blocked.includes(message.author.id)) return;
  }
  let content = message.content.trim();
  let prefixed = false;
  if (config.prefix) {
    if (_.isArray(config.prefix)) {
      for (const prefix of config.prefix) {
        if (content.startsWith(prefix)) {
          prefixed = true;
          content = content.substring(prefix.length).trim();
          break;
        }
      }
    } else if (content.startsWith(config.prefix)) {
      prefixed = true;
      content = content.substring(config.prefix.length).trim();
    }
  }
  if (!prefixed) {
    if (!config.mentions) return;
    if (!content.startsWith("<@")) return;
    if (!RegExp(`^<@!?${client.user.id}>`).test(content)) return;
    content = content.substring(content.indexOf(">") + 1).trim();
  }
  if (content.length === 0) return;
  const args = content.split(/[\n\r\s]+/g);
  const name = args.shift().toLowerCase();
  content = content.slice(name.length).trim();
  if (content.length === 0) content = null;
  client.commands.run(name, message, content, args);
});
