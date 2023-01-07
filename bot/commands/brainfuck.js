const CommandBlock = require("../../modules/CommandBlock");
const { result, options } = require("../../modules/brainfuck");
const { fork } = require("child_process");

module.exports = new CommandBlock({
    names: ["brainfuck"],
    description: `Evaluates code for the esoteric programming language [brainfuck](https://esolangs.org/wiki/Brainfuck), created by Urban Müller.\n\nMemory is limited to 30,000 unsigned byte cells, and operation limit is set to ${options.operation_limit} operations. This implementation of brainfuck also implements the debug \`#\` opcode, which breaks the current execution and displays the first ${options.debug_limit} bytes in memory.\n\nBefore being ran, code is minified and all characters that are not brainfuck opcodes are removed.\n\nAfter being ran, your message will get a reaction indicating an error code. A positive reaction indicates a successful execution, and an alert reaction indicates that the execution couldn't be completed within the operation limit. An error will result in an appropriate error message.`,
    usage: "[bf code] or [[input text] | [bf code]]",
}, function(client, message, content, args) {
    if(!content) return message.reply(`${client.reactions.negative.emote} You must input a piece of code to evaluate. Perform \`help ${this.firstName}\` for more information.`);

    const index = content.indexOf("|") || 0;
    let [input, code] = [content.substring(0, index), content.substring(index + 1)].map(x => x.trim()); // eslint-disable-line prefer-const

    const child = fork("./modules/brainfuck", [code, input], { cwd: process.cwd() });
    child.on("message", (execution) => {
        let output = execution.output;
        if(output.length > 1993) output = output.substring(0, 1990) + "...";

        if(execution.result === result.FAILURE) {
            message.react(client.reactions.negative.id);
            return message.reply(`${client.reactions.negative.emote} ${execution.log}`);
        } else if(execution.result === result.WARNING) {
            message.react(client.reactions.alert.id);
        } else {
            message.react(client.reactions.positive.id);
        }
        return message.reply({ content: `\`\`\`\n${output}\`\`\``, allowedMentions: { repliedUser: false } });
    });
});
