const CommandBlock = require("../../modules/CommandBlock");
const responses = ["As I see it, yes.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don't count on it.", "It is certain.", "It is decidedly so.", "Most likely.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Outlook good.", "Reply hazy, try again.", "Signs point to yes.", "Very doubtful.", "Without a doubt.", "Yes.", "Yes - definitely.", "You may rely on it."];

module.exports = new CommandBlock({
    names: ["8ball", "8"],
    description: "Shakes a magic 8 ball.",
    usage: "[query]",
}, async function(client, message, content, args) {
    if(!content) return message.reply(`${client.reactions.negative.emote} You need to ask it something!`);
    return message.reply({ content: `\uD83C\uDFB1 ${responses[Math.floor(Math.random() * responses.length)]}`, allowedMentions: { repliedUser: false } }); // if you're reading this, im sorry for ruining the magic
});
