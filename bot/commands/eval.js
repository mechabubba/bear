const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { inspect } = require("util");
const { isNil, isString, isError } = require("lodash");
const { sleep } = require("../../modules/miscellaneous");

const save = "\uD83D\uDCBE"; // The reaction used to indicate saving the output of the eval in the chat.

module.exports = new CommandBlock({
    names: ["eval", "evaluate", "js"],
    description: "A huge security hole/risk for development purposes, this command evaluates arbitrary javascript evaluation. This command should only be allowed to those who already possess the bot's token.",
    usage: "[javascript]",
    locked: ["hosts", "trusted"],
    clientChannelPermissions: ["USE_EXTERNAL_EMOJIS", "ADD_REACTIONS"],
}, async function(client, message, code, args) {
    if (!code) return message.react(client.reactions.negative.id);
    
    let output;
    try {
        const result = eval(code);
        const cleaned = (isString(result) ? result : inspect(result)).replace(client.token, "<client.token>"); // This is *only* a basic precaution. 
        message.react(client.reactions.positive.id);
        log.debug(`Eval from ${message.author.tag} resulted in:`, result);
        output = await message.reply({ content: `\`\`\`js\n${cleaned.length > 1991 ? cleaned.substring(0, 1988) + "..." : (cleaned || "undefined")}\`\`\``, allowedMentions: { repliedUser: false } });
    } catch (e) {
        const result = (isError(e) ? e.stack : e);
        const cleaned = result.replace(client.token, "<client.token>");
        message.react(client.reactions.negative.id);
        log.error(`Eval from ${message.author.tag} caused an error:`, cleaned);
        output = await message.reply(`${client.reactions.negative.emote} An evaluation error occurred;\`\`\`\n${(cleaned.length > 1940) ? cleaned.substring(0, 1937) + "..." : cleaned}\`\`\``);
    }

    // This is the shittiest solution ever... but it works!
    // Truth be told, I don't like Discords new additions to their platform, but I might be inclined to start using buttons just because their reaction API is the worst API on the fucking planet.
    // awaitReactions() is the worst function in discord.js.
    if(output.deletable) {
        await sleep(500);
        await output.react(save);
        await sleep(10 * 1000); // Change this to how many seconds you want to wait before checking if we should save the output.

        if (!output.deleted && output.reactions.cache.has(save)) {
            const reaction = output.reactions.resolve(save);
            if (reaction.count <= 1 || isNil(reaction.users.resolve(message.author.id))) {
                await output.delete();
            } else {
                await reaction.remove();
            }
        }
    }
});
