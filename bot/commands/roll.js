const CommandBlock = require("../../modules/CommandBlock");
const { numeric } = require("../../modules/regexes");

const dice_expression = /(\d+)?[dD](\d+)/;
const max_dice = 200;
const max_sides = 1000;

module.exports = new CommandBlock({
    names: ["roll"],
    description: "Rolls some dice. Default roll bound is 100.",
    usage: "[sides] or [die_count]d[sides]",
}, async function(client, message, content, [bound = "100"]) {
    let rolls = [];
    let total = amount = sides = 0;
    
    if(numeric.test(bound)) {
        amount = 1;
        sides = parseInt(bound);
    } else if(dice_expression.test(bound)) {
        const matched = bound.match(dice_expression);
        amount = matched[1] ? parseInt(matched[1]) : 1;
        sides = parseInt(matched[2]);
    } else {
        return message.reply(`${client.reactions.negative.emote} The expression provided is not a roll expression.`);
    }

    if(amount > max_dice) {
        return message.reply(`${client.reactions.negative.emote} The max amount of dice you can roll is ${max_dice}.`);
    } else if(sides > max_sides) {
        return message.reply(`${client.reactions.negative.emote} The max amount of sides a die can have is ${max_sides}.`);
    }

    for(let i = 0; i < amount; i++) {
        let roll = Math.ceil(Math.random() * sides);
        rolls.push(roll);
        total += roll;
    }

    if(rolls.length > 1) {
        return message.reply({ content: `You rolled a total of **${total}**.\nRolls: ${rolls.join(", ")}`, allowedMentions: { repliedUser: false } });
    } else {
        return message.reply({ content: `You rolled **${total}**.`, allowedMentions: { repliedUser: false } });
    }
});