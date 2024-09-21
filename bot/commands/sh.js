const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");
const { isAvailable } = require("../../modules/miscellaneous");
const fs = require("fs");
const os = require("os");
const { spawn, execSync } = require("child_process");

const spawn_cmd = {
    linux: "/bin/sh",
    win32: "cmd",
};
let cowfiles;

module.exports = [
    new CommandBlock({
        names: ["sh"],
        description: "Executes terminal commands. Multiple commands can be split by newlines.",
        usage: "[commands]",
        locked: ["hosts"],
    }, function(client, message, content, args) {
		return cmd(client, message, content, args);
    }),
    new CommandBlock({
        names: ["fortune"],
        description: "Get a fortune.\n\nRelies on [cowsay](https://salsa.debian.org/debian/cowsay) and [fortune-mod](https://github.com/shlomif/fortune-mod).",
        usage: "(cowfile), list",
    }, function(client, message, content, [cowfile, ...args]) {
        if (cowfile && !cowfiles.includes(cowfile)) {
            if (cowfile == "list") {
                return message.reply({
                    content: `Valid cowfiles;\`\`\`\n${cowfiles.join(", ")}\`\`\``,
                    allowedMentions: { repliedUser: false },
                });
            }
            return message.reply(`${client.reactions.negative.emote} Cowfile not found.`);
        }
        const input = `fortune | cowsay ${cowfile ? `-f ${cowfile}` : ""}`;
        return cmd(client, message, input, args, false);
    }),
];

// Small hack to get around `client.commands.runByName` not working super well with group permissions.
const cmd = (client, message, content, _, is_sh = true) => {
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
    if(is_sh) {
        if(os.platform() == "linux") {
            fs.readlink("/proc/" + shell.pid + "/cwd", (e, new_cwd) => {
                if(e) return;
                if(!("shell_cwds" in client.cookies)) {
                    client.cookies["shell_cwds"] = {};
                }
                client.cookies["shell_cwds"][message.author.id] = new_cwd;
            });
        }
    }
    shell.stdin.end();

    shell.on("close", (c) => {
        if(output) {
            if(output.length > 1993) output = output.substring(0, 1990) + "...";
			message.reply({ content: `\`\`\`\n${output}\`\`\``, allowedMentions: { repliedUser: false } });
        }
    });
}

// Ran on command initialization.
if (!isAvailable("fortune") || !isAvailable("cowsay")) {
    log.warn("Either cowsay or fortune wasn't found on your path; until either of these are accessible, the `fortune` command will be unavailable. Run the `debug` bot command for more information.");
    module.exports.splice(-1);
} else {
    // In order: get list, cut off header line, and replace all newlines to strings.
    cowfiles = execSync("cowsay -l | tail -n +2 | tr '\n' ' '").toString();
    cowfiles = cowfiles.split(" ").slice(0, -1);
}
