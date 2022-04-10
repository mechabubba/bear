const CommandBlock = require("../../modules/CommandBlock");
const { fork } = require("child_process");

module.exports = new CommandBlock({
    names: ["brainfuck"],
    description: "Evaluates code for the esoteric programming language [brainfuck](https://esolangs.org/wiki/Brainfuck), created by Urban Müller. Memory is limited to 30,000 unsigned byte cells.\n\nA positive emote indicates a completed operation. An alert emote indicates that the operation couldn't be completed within the operation limit.",
    usage: "[bf code] or [(input text) | (bf code)]",
}, function(client, message, content, args) {
    if(!content) return message.reply(`${client.reactions.negative.emote} You didn't send any code! Perform \`help ${this.firstName}\` for more information.`);

    const index = content.indexOf("|") || 0;
    let [input, code] = [content.substring(0, index), content.substring(index + 1)].map(x => x.trim()); // eslint-disable-line prefer-const
    code = code.replace(/[^+\-[\].,<>]+/g, ""); // Sanitizes the code of any text other than the specified opcodes.

    const child = fork("./modules/brainfuck", [input, code], { cwd: process.cwd() });
    child.on("message", (data) => {
        let output = data.output;
        if(output.length > 1993) output = output.substring(0, 1990) + "...";

        if(data.level == "warning") {
            message.react(client.reactions.alert.id);
        } else if(data.level == "error") {
            message.react(client.reactions.negative.id);
        } else {
            message.react(client.reactions.positive.id);
        }

        return message.reply({ content: `\`\`\`\n${output}\`\`\``, allowedMentions: { repliedUser: false } });
    });
});
