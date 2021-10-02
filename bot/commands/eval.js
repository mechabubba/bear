const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { inspect } = require("util");
const _ = require("lodash");
const { sleep } = require("../../modules/miscellaneous");

const save = "\uD83D\uDCBE"; // The reaction used to indicate saving the output of the eval in the chat.

const clean = async function(input, token) {
    let value = input;
    if (_.isNil(value)) return null;
    if (value && value instanceof Promise) {
        value = await value;
    }
    if (!_.isString(value)) value = inspect(value);
    // This next line is just a basic precaution to prevent the bot from accidentally posting it
    // It **does not** make eval safe!
    value = value.replace(token, "<client.token>");
    return value;
};

module.exports = new CommandBlock({
    identity: ["eval", "evaluate", "js"],
    summary: "Evaluates arbitrary javascript.",
    description: "Evaluates arbitrary javascript. A huge security hole/risk for development purposes: arbitrary javascript evaluation. Should only be allowed to those who already possess the bot's token.",
    usage: "[javascript]",
    scope: ["dm", "text", "news"],
    locked: ["hosts", "trusted"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
}, async function(client, message, code, args) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();

    if (!code) return message.react(client.config.get("metadata.reactions.negative").value());
    log.debug(`Code provided to eval from ${message.author.tag}:`, "\n" + code);
    let cleaned = null;
    let output;
    try {
        const result = eval(code);
        cleaned = await clean(result, client.token);
        message.react(positive);
        log.debug(`Eval from ${message.author.tag} resulted in:`, result);
        output = await message.channel.send(`\`\`\`js\n${(cleaned && cleaned.length) > 1991 ? cleaned.substring(0, 1988) + "..." : (cleaned || "undefined")}\`\`\``);
    } catch (e) {
        cleaned = await clean(e, client.token);
        message.react(negative);
        log.error(`Eval from ${message.author.tag} caused an error:`, e);
        output = await message.channel.send(`<:_:${negative}> An evaluation error occurred;\`\`\`\n${(e.stack.length > 1940) ? e.stack.substring(0, 1937) + "..." : e.stack}\`\`\``);
    }

    // This is the shittiest solution ever... but it works!
    // Truth be told, I don't like Discords new additions to their platform, but I might be inclined to start using buttons just because their reaction API is the worst API on the fucking planet.
    // awaitReactions() is the worst function in discord.js.
    await sleep(500);
    await output.react(save);
    await sleep(10000);

    if (!output.deleted && output.reactions.cache.has(save)) {
        const reaction = output.reactions.cache.get(save);
        if (reaction.count <= 1 && output.deletable) {
            await output.delete();
        } else {
            await reaction.remove();
        }
    }
});
