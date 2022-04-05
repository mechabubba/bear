const CommandBlock = require("../../modules/CommandBlock");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const spawn_cmd = {
    linux: "/bin/sh",
    win32: "cmd",
};

module.exports = new CommandBlock({
    names: ["sh"],
    description: "Executes terminal commands. Multiple commands can be split by newlines.",
    usage: "[commands]",
    locked: ["hosts"],
}, function(client, message, content, args) {
    if(!spawn_cmd[os.platform()]) return message.reply(`${client.reactions.negative.emote} You must set the shell for your OS in the \`spawn_cmd\` object at \`bot/commands/sh.js\`. See https://nodejs.org/api/os.html#os_os_platform for more information.`);

    const userinfo = os.userInfo();
    const cwd = (`shell_cwd_${message.author.id}` in client.cookies) ? client.cookies[`shell_cwd_${message.author.id}`] : userinfo["homedir"];

    const shell = spawn(spawn_cmd[os.platform()], [], { cwd: cwd });
    shell.stdout.on("data", (d) => output += d + "\n");
    shell.stderr.on("data", (d) => output += d + "\n");

    let output = "";
    const cmds = content.split(/\r?\n/);
    for(let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i].trim() + "\n";
        shell.stdin.write(cmd);
    }

    // Saves current cwd as a cookie. For whatever reason, this isn't *perfect,* but its good enough from my testing.
    if(os.platform() == "linux") {
        fs.readlink("/proc/" + shell.pid + "/cwd", (e, new_cwd) => {
            if(e) return;
            client.cookies[`shell_cwd_${message.author.id}`] = new_cwd;
        });
    }
    shell.stdin.end();

    shell.on("close", (c) => {
        if(output) {
            if(output.length > 1993) output = output.substring(0, 1990) + "...";
            message.reply({ content: `\`\`\`\n${output}\`\`\``, allowedMentions: { repliedUser: false } });
        }
    });
});
