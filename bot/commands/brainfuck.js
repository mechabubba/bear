const CommandBlock = require("../../modules/CommandBlock");
const { fork } = require("child_process");

module.exports = new CommandBlock({
    identity: "brainfuck",
    summary: "Evaluates brainfuck code.",
    description: "Evaluates code for the esoteric programming language [brainfuck](https://esolangs.org/wiki/Brainfuck), created by Urban Müller.\n• Memory is limited to 30,000 unsigned byte cells.",
    scope: ["dm", "text", "news"],
    usage: "[bf code] or [(input text) | (bf code)]",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, function(client, message, content, args) {
    if(!content) return message.channel.send(`${client.reactions.negative.emote} You didn't send any code! Perform \`help ${this.firstName}\` for more information.`);

    const index = content.indexOf("|") || 0;
    let [input, code] = [content.substring(0, index), content.substring(index + 1)].map(x => x.trim()); // eslint-disable-line prefer-const
    code = code.replace(/[^+\-[\].,<>]+/g, ""); // Sanitizes the code of any text other than the specified opcodes.

    message.channel.startTyping();
    const child = fork("./modules/brainfuck", [input, code], { cwd: process.cwd() });
    child.on("message", (data) => {
        message.channel.stopTyping(true);
        let output = data.output;
        if(output.length > 1993) output = output.substring(0, 1990) + "...";

        let reaction, emote;
        if(data.level == "warning") {
            reaction = client.reactions.alert.id;
            emote = client.reactions.alert.emote;
        }
        else if(data.level == "error") {
            reaction = client.reactions.negative.id;
            emote = client.reactions.negative.emote;
        }
        else {
            reaction = client.reactions.positive.id;
            emote = client.reactions.positive.emote;
        }

        message.react(reaction);
        message.channel.send(`${emote} ${data.log}`);
        return message.channel.send(`\`\`\`\n${output}\`\`\``);
    });
});
