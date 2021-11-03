const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { inspect } = require("util");
const { isNil, isString } = require("lodash");

/*
This command provides arbitrary javascript evaluation, and is disabled by default

If you want to use this command, pick one of the following:

- Editing ./data/modules.json after generation and setting the path for this module to true followed by a restart
- Running the command "load command ../bot/commands/eval" (this wont persist through restarts)
- Running the command "enable command ../bot/commands/eval"

Keep in mind that it should only be allowed to those who already possess your bot's token
*/

const clean = async function(input, token) {
    let value = input;
    if (isNil(value)) return null;
    if (value && value instanceof Promise) {
        value = await value;
    }
    if (!isString(value)) value = inspect(value);
    // This next line is just a basic precaution to prevent the bot from accidentally posting it
    // It **does not** make eval safe!
    value = value.replace(token, "password123");
    return value;
};

module.exports = new CommandBlock({
    names: ["eval", "evaluate", "js"],
    summary: "Evaluates arbitrary javascript",
    description: "An enormous security risk for development purposes: [arbitrary javascript evaluation](https://en.wikipedia.org/wiki/Arbitrary_code_execution). Uses [`eval()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) under the hood.",
    usage: "<code>",
    locked: "hosts",
    clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
}, async function(client, message, code, args) {
    if (!code) return message.react(client.config.get("metadata.reactions.negative").value());
    log.debug(`Code provided to eval from ${message.author.tag}:`, "\n" + code);
    let cleaned = null;
    try {
        const result = eval(code);
        cleaned = await clean(result, client.token);
        message.react(client.config.get("metadata.reactions.positive").value());
        log.debug(`Eval from ${message.author.tag} resulted in:`, result);
    } catch (error) {
        cleaned = await clean(error, client.token);
        message.react(client.config.get("metadata.reactions.negative").value());
        log.error(`Eval from ${message.author.tag} caused an error:`, error);
        return message.channel.send(`Failed to evaluate javascript, an error occurred: \`${error.message}\``);
    }
    if (cleaned && cleaned.length <= 1500) {
        message.channel.send(`\`\`\`\n${cleaned}\n\`\`\``);
    }
});
