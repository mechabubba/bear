const CommandBlock = require("../../modules/CommandBlock");
const { fork } = require("child_process");

module.exports = new CommandBlock({
    identity: "brainfuck",
    summary: "Evaluates brainfuck code.",
    description: "Evaluates code for the esoteric programming language [brainfuck](https://esolangs.org/wiki/Brainfuck), created by Urban Müller.\n• Memory is limited to 30,000 unsigned byte cells.",
    scope: ["dm", "text", "news"],
    locked: false,
    usage: "[bf_code] or [(any input text) | (bf_code)]",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, function(client, message, content, args) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();
    const alert = client.config.get("metadata.reactions.alert").value();

    let index = content.indexOf("|") || 0;
    let [input, code] = [content.substring(0, index), content.substring(index + 1)].map(x => x.trim());

    if(!code) return message.channel.send(`<:_:${negative}> You didn't send any code! Perform \`help ${this.firstName}\` for more information.`);
    code = code.replace(/[^\+\-\[\].,<>]+/g, ""); // Sanitizes the code of any text other than the specified opcodes.

    const child = fork("./modules/brainfuck", [input, code], { cwd: process.cwd() });
    child.on("message", (msg) => {
      let result = msg.result;
      if(result.length > 1993) result = msg.result.substring(0, 1990) + "...";

      if(msg.warning) {
        message.channel.send(`<:_:${alert}> ${msg.warning}`);
      } else if(msg.error) {
        message.react(negative);
        message.channel.send(`<:_:${negative}> An error occured;\`\`\`\n${msg.error}\`\`\``);
      } else {
        message.react(positive);
      }

      return message.channel.send(`\`\`\`\n${result}\`\`\``);
    });
  }
);
