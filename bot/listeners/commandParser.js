const ListenerBlock = require("../../modules/ListenerBlock");
const { isArray } = require("lodash"); // Used by forAny and resultFromAny

module.exports = new ListenerBlock({
  event: "message",
  once: false,
}, function(client, message) {
  if (message.author.bot) return;
  const config = client.config.get("commands").value();
  if (!config.channelTypes.includes(message.channel.type)) return;
  const users = client.config.get("users").value();
  if (users.allowed !== null) {
    if (!users.allowed.includes(message.author.id)) return;
  }
  if (users.blocked !== null) {
    if (users.blocked.includes(message.author.id)) return;
  }
  let content = message.content.trim();
  const lowercase = content.toLowerCase();
  let prefixed = false;
  if (config.prefix) {
    if (isArray(config.prefix)) {
      for (const prefix of config.prefix) {
        if (lowercase.startsWith(prefix)) {
          prefixed = true;
          content = content.substring(prefix.length).trim();
          break;
        }
      }
    } else if (lowercase.startsWith(config.prefix)) {
      prefixed = true;
      content = content.substring(config.prefix.length).trim();
    }
  }
  if (!prefixed) {
    if (!config.mentions) return;
    if (!lowercase.startsWith("<@")) return;
    if (!RegExp(`^<@!?${client.user.id}>`).test(lowercase)) return;
    content = content.substring(content.indexOf(">") + 1).trim();
  }
  if (!content.length) return;
  const args = content.split(/[\n\r\s]+/g);
  const name = args.shift().toLowerCase();
  content = content.slice(name.length).trim();
  client.emit("commandParsed", name, message, content.length ? content : null, args);
  client.commands.runByName(name, message, content.length ? content : null, args);
});

/**
 * Emitted whenever a command is successfully parsed
 * @event Client#commandParsed
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {string} commandName
 * @param {Discord.Message} message
 * @param {?string} [content=null]
 * @param {[string]} [args=[]]
 * @param {...*} [extraParameters]
 */
