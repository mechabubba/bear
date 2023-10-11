/* eslint-disable no-undef */
const CommandBlock = require("../../modules/CommandBlock");
const { spawn, execSync } = require("child_process");
const { createHash } = require("crypto");
const { Util, MessageAttachment } = require("discord.js");
const log = require("../../modules/log");

module.exports = new CommandBlock({
    names: ["latex"],
    description: "*Tries* to render a string of latex.\nNotes;\n- GIF functionality is broken.\n- Sometimes it shits the bed.\n\nRenderer modified and based on [mathtex]() by Josh Forkosh Associates, Inc.",
    usage: "[LᴬTₑX]"
}, function(client, message, content, args) {
    const opts = {
        encoding: "png",
        packages: ["color"],
    };

    if (!content) {
        return message.reply(`${client.reactions.negative.emote} You must input a piece of text to render.`);
    }

    // pre-pre-processing?
    // og binary handles these options poorly. should be looked into...
    
    // handle gif vs png output. gif seems to be broken...?
    content.replace(/\\png/, "");
    if (content.includes("\\gif")) {
        content.replace(/\\gif/, "");
        opts.encoding = "";
    }

    // handle user provided packages
    // these are placed in array which prefaces them before all other commands
    // a future consideration should be the run order of each package, but this preserves the order in which they're typed
    const matches = content.matchAll(/\\usepackage{([a-z0-9-_]+)}/g);
    for (const match of matches) {
        const pkg = match[1];
        if(!packageinstalled(pkg)) {
            return message.reply(`${client.reactions.negative.emote} Package \`${pkg}\` is not installed.`);
        }
        if(!opts.packages.includes(pkg)) {
            opts.packages.push(pkg);
        }
        content = content.replace(new RegExp(`\\\\usepackage{${pkg}}`, "g"), "")
    }

    let eqn = `${opts.encoding ? `\\${opts.encoding}` : ""} ${opts.packages.map(x => `\\usepackage{${x}}`).join(" ")} \\color{white} ${content}`; 
    let buf = Buffer.from([]);
    log.debug(`INPUT EQN: ${eqn}`);

    const child = spawn("./bin/mathtex", [eqn, "-m 0", "-n 1", "-s 1"]);
    let threw = false;

    child.stdout.on("data", (d) => {
        log.debug(d);
        log.debug(d.toString('utf8'));
        buf = Buffer.concat([buf, d])
    });
    child.stderr.on("data", (d) => {
        threw = true;
        log.error(d);
        log.error(d.toString());
        return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${d}\`\`\``);
    });
    
    child.on("close", (code) => {
        if(threw) {
            return;
        }

        let ext = buf.subarray(0, 8).toString("latin1");
        if(ext.startsWith('\x89\x50\x4E\x47\x0D\x0A\x1A\x0A')) {
            ext = "png";
        } else if (ext.startsWith('\x47\x49\x46\x38')) {
            ext = "gif";
        } else {
            ext = undefined;
        }
        const attachment = new MessageAttachment(buf, `out${ext ? `.${ext}` : ""}`);
        return message.reply({ files: [attachment], allowedMentions: { repliedUser: false } });
    });
});

const packageinstalled = (name) => {
    try {
        execSync(`kpsewhich ${name}.sty`);
    } catch(e) {
        return false;
    }
    return true;
}

