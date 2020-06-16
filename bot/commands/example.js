const CommandModule = require("../../modules/CommandModule");

module.exports = new CommandModule({
  identity: "example",
}, function(client, message, content, args) {
  if (!content) return message.channel.send(`hello world, ${message.author.tag}!`);
  message.channel.send(`\`${message.author.tag}\`, you ran this example command with:\n\`\`\`\n${content}\`\`\`and that parsed into arguments as:\n\`${args}\``);
});
