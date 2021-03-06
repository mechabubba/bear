const CommandBlock = require("../../modules/CommandBlock");
const { fork } = require("child_process");

module.exports = new CommandBlock({
    identity: "brainfuck",
    summary: "Evaluates brainfuck code.",
    description: "Evaluates code for the esoteric programming language [brainfuck](https://esolangs.org/wiki/Brainfuck), created by Urban Müller.\n• Memory is limited to 30,000 unsigned byte cells.\n• You must split input with a pipe `|` character.",
    scope: ["dm", "text", "news"],
    usage: "(input text) [bf code]",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
  }, function(client, message, content, args) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();
    const alert = client.config.get("metadata.reactions.alert").value();

    let index = content.indexOf("|") || 0;
    let [input, code] = [content.substring(0, index), content.substring(index + 1)].map(x => x.trim());

    if(!code) return message.channel.send(`<:_:${negative}> You didn't send any code! Perform \`help ${this.firstName}\` for more information.`);
    code = code.replace(/[^\+\-\[\].,<>]+/g, ""); // Sanitizes the code of any text other than the specified opcodes.

    const child = fork("./modules/brainfuck", [input, code], { cwd: process.cwd() });
    child.on("message", (data) => {
      let output = data.output;
      if(output.length > 1993) output = output.substring(0, 1990) + "...";

      let reaction;
      if(data.level == "warning") reaction = alert
      else if(data.level == "error") reaction = negative
      else reaction = positive

      message.react(reaction);
      message.channel.send(`<:_:${reaction}> ${data.log}`);
      return message.channel.send(`\`\`\`\n${output}\`\`\``);
    });
  }
);
