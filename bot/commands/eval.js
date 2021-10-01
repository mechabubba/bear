const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { inspect } = require("util");
const _ = require("lodash");

const autodelete = "💾";

const clean = async function(input, token) {
    let value = input;
    if (_.isNil(value)) return null;
    if (value && value instanceof Promise) {
        value = await value;
    }
    if (!_.isString(value)) value = inspect(value);
    // This next line is just a basic precaution to prevent the bot from accidentally posting it
    // It **does not** make eval safe!
    value = value.replace(token, "<token>");
    return value;
};

module.exports = new CommandBlock({
    identity: ["eval", "evaluate", "js"],
    summary: "Evaluates arbitrary javascript.",
    description: "Evaluates arbitrary javascript. A huge security hole/risk for development purposes: arbitrary javascript evaluation. Should only be allowed to those who already possess the bot's token.",
    usage: "[javascript]",
    scope: ["dm", "text", "news"],
    locked: ["hosts", "trusted"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"]
}, async function(client, message, code, args) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();
    if (!code) return message.react(client.config.get("metadata.reactions.negative").value());

    log.debug(`Code provided to eval from ${message.author.tag}:`, "\n" + code);

    let cleaned = null;
    try {
        const result = eval(code);
        cleaned = await clean(result, client.token);
        await message.react(positive);
        log.debug(`Eval from ${message.author.tag} resulted in:`, result);
    } catch (e) {
        cleaned = await clean(e, client.token);
        await message.react(negative);
        log.error(`Eval from ${message.author.tag} caused an error:`, e);
        return message.channel.send(`<:_:${negative}> An evaluation error occurred;\`\`\`\n${e.stack}\`\`\``);
    }

    if(cleaned && cleaned.length > 1991) cleaned = cleaned.substring(0, 1988) + "...";
    const msg = await message.channel.send(`\`\`\`js\n${cleaned || "undefined"}\`\`\``);
    await msg.react(autodelete);

    // tjios doesnt fuckign work
    const filter = (reaction, user) => [autodelete].includes(reaction.emoji.name) && user.id === message.author.id;
    msg.awaitReactions({ filter, time: 5000, max: 1, errors: ["time"] }).then((collected) => {
        // this is bad programming practice
        // im not going to fix it
        // ¯\_(ツ)_/¯
    }).catch((e) => {
        console.log("no reactions. deleting this bih");
        msg.delete();
    });
});
