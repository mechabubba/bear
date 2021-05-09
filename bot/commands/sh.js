const CommandBlock = require("../../modules/CommandBlock");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const spawn_cmd = {
  linux: "/bin/sh",
  win32: "cmd"
};

module.exports = new CommandBlock({
    identity: "sh",
    description: "Executes terminal commands. Multiple commands can be split by newlines.",
    usage: "[commands]",
    scope: ["dm", "text", "news"],
    locked: ["hosts"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
  }, function(client, message, content, args) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();
    if(!spawn_cmd[os.platform()]) return message.channel.send(`<:_:${negative}> You must set the shell for your OS in the \`spawn_cmd\` object at \`bot/commands/sh.js\`. See https://nodejs.org/api/os.html#os_os_platform for more information.`);
    
    const userinfo = os.userInfo();
    const cwd = client.cookies.get(`shell_cwd_${message.author.id}`) ? client.cookies.get(`shell_cwd_${message.author.id}`) : userinfo["homedir"];

    const shell = spawn(spawn_cmd[os.platform()], [], { cwd: cwd });
    shell.stdout.on("data", (d) => output += d + "\n");
    shell.stderr.on("data", (d) => output += d + "\n");

    let output = "";
    let cmds = content.split(/\r?\n/);
    for(i = 0; i < cmds.length; i++) {
      cmd = cmds[i].trim();
      shell.stdin.write(cmd + "\n");
    }

    // Saves current cwd as a cookie. For whatever reason, this isn't *perfect,* but its good enough from my testing.
    fs.readlink("/proc/" + shell.pid + "/cwd", (e, new_cwd) => {
      if(e) return;
      return client.cookies.set(`shell_cwd_${message.author.id}`, new_cwd);
    });
    shell.stdin.end();

    shell.on("close", (c) => {
      message.react(positive);
      if(output) {
        if(output.length > 1993) output = output.substring(0, 1990) + "...";
        message.channel.send(`\`\`\`\n${output}\`\`\``);
      }
    });
  }
);