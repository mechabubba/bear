const CommandBlock = require("../../modules/CommandBlock");

module.exports = new CommandBlock({
    names: ["example"],
}, function(client, message, content, args) {
    if (!content) return message.channel.send(`hello world, ${message.author.tag}!`);
    message.channel.send(`\`${message.author.tag}\`, you ran this example command with:\n\`\`\`\n${content}\`\`\`and that parsed into arguments as:\n\`${args.join("`, `")}\``);
});
