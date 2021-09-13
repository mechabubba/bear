const CommandBlock = require("../../modules/CommandBlock");
const responses = ["As I see it, yes.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.", "Don't count on it.", "It is certain.", "It is decidedly so.", "Most likely.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Outlook good.", "Reply hazy, try again.", "Signs point to yes.", "Very doubtful.", "Without a doubt.", "Yes.", "Yes - definitely.", "You may rely on it."];

module.exports = new CommandBlock({
    identity: ["8ball", "8"],
    description: "Shakes a magic 8 ball.",
    usage: "[query]",
    scope: ["dm", "text", "news"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
}, async function(client, message, content, args) {
    const negative = client.config.get("metadata.reactions.negative").value();
    if(!content) return message.channel.send(`<:_:${negative}> You need to ask it something.`);
    return message.channel.send(`\uD83C\uDFB1 ${responses[Math.floor(Math.random() * responses.length)]}`); // if you're reading this, im sorry for ruining the magic
});
