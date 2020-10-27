const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { inspect } = require("util");
const _ = require("lodash");

/*
A huge security hole/risk, but included for development purposes: arbitrary javascript evaluation
It should only be allowed to those who already possess the bot's token!
*/

const clean = async function(input, token) {
  let value = input;
  if (_.isNil(value)) return null;
  if (value && value instanceof Promise) {
    value = await value;
  }
  if (!_.isString(value)) value = inspect(value);
  // This next line is just a basic precaution to prevent the bot from accidentally posting it
  // It **does not** make eval safe!
  value = value.replace(token, "[token]");
  return value;
};

module.exports = new CommandBlock({
  identity: ["eval", "evaluate", "js"],
  summary: "Evaluates arbitrary javascript",
  description: "A huge security hole/risk for development purposes: arbitrary javascript evaluation. Should only be allowed to those who already possess the bot's token.",
  usage: "<code>",
  scope: ["dm", "text", "news"],
  nsfw: false,
  locked: ["hosts", "trusted"],
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
  userPermissions: null,
}, async function(client, message, code, args) {
  const positive = client.config.get("metadata.reactions.positive").value();
  const negative = client.config.get("metadata.reactions.negative").value();

  if (!code) return message.react(client.config.get("metadata.reactions.negative").value());
  log.debug(`Code provided to eval from ${message.author.tag}:`, "\n" + code);
  let cleaned = null;
  try {
    const result = eval(code);
    cleaned = await clean(result, client.token);
    message.react(positive);
    log.debug(`Eval from ${message.author.tag} resulted in:`, result);
  } catch (e) {
    cleaned = await clean(e, client.token);
    message.react(negative);
    log.error(`Eval from ${message.author.tag} caused an error:`, e);
    return message.channel.send(`<:_:${negative}> An evaluation error occurred;\`\`\`\n${e.stack}\`\`\``);
  }
  if (cleaned && cleaned.length <= 1500) {
    message.channel.send(`${cleaned}`);
  }
});
