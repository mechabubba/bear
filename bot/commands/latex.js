const CommandBlock = require("../../modules/CommandBlock");
const { spawn, execSync } = require("child_process");
const { accessSync, constants } = require("fs");
const { Util, MessageAttachment } = require("discord.js");
const log = require("../../modules/log");

module.exports = new CommandBlock({
    names: ["latex"],
    description: "*Tries* to render a string of latex. Note that sometimes it will shit the bed without any discernable reason.\n\nThe renderer is from the standard texlive debian package, with images generated through a special binary based on [mathtex](https://github.com/mechabubba/mathtex) by Josh Forkosh Associates, Inc (modified by mechabubba).\n\nThis project is a work in progress.",
    usage: "[LᴬTₑX]"
}, function(client, message, content, args) {
    const opts = {
        defaultPackages: ["amsmath", "amsfonts", "amssymb", "color"], // Default packages (currently already handled by mathtex).
        newPackages: [],
    };

    // First, check if mathtex exists in the bin directory. If it doesn't, don't try to do anything.
    try {
        accessSync("./bin/mathtex", constants.R_OK | constants.X_OK);
    } catch(e) {
        return message.reply(`${client.reactions.negative.emote} mathtex is not installed or is otherwise inaccessible. :(`);
    }

    if (!content) {
        return message.reply(`${client.reactions.negative.emote} You must input a piece of text to render!`);
    }

    // Handle user provided packages.
    // These are placed in array which allows them to be prefaced before all other commands.
    // A future consideration should be the run order of each package, but this preserves the order in which they're typed.
    const matches = content.matchAll(/\\usepackage{([a-z0-9-_]+)}/g);
    for (const match of matches) {
        const pkg = match[1];
        if(!packageinstalled(pkg)) {
            return message.reply(`${client.reactions.negative.emote} Package \`${pkg}\` is not installed.`);
        }
        if(!opts.defaultPackages.includes(pkg) && !opts.newPackages.includes(pkg)) {
            opts.packages.push(pkg);
        }
        content = content.replace(new RegExp(`\\\\usepackage{${pkg}}`, "g"), "")
    }

    let eqn = `${opts.newPackages.map(x => `\\usepackage{${x}}`).join(" ")} \\color{white} ${content}`; 
    let buf = Buffer.from([]);
    let err = ""; // Variable to store stderr data.

    const child = spawn("./bin/mathtex", ["-m 0", "-d 240", "-s", "-t", eqn]);
    let threw = false;

    child.stdout.on("data", (d) => {
        //log.debug(d.toString('utf8'));
        buf = Buffer.concat([buf, d])
    });
    child.stderr.on("data", (d) => {
        if (!d.toString().includes("locate")) {
            threw = true; // temp because of weird bug that might be fixed
        }
        err += d.toString();
    });
    child.on("close", (code) => {
        if(threw) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${err}\`\`\``);
        }

        // mathtex supports .png and .gif output via a directive. Check for either via magic bytes here.
        let ext = buf.subarray(0, 8).toString("latin1");
        if(ext.startsWith('\x89\x50\x4E\x47\x0D\x0A\x1A\x0A')) {
            ext = "png";
        } else if (ext.startsWith('\x47\x49\x46\x38')) {
            ext = "gif";
        } else {
            // Should never happen...
            ext = undefined; 
        }
        const attachment = new MessageAttachment(buf, `out${ext ? `.${ext}` : ""}`);
        return message.reply({ files: [attachment], allowedMentions: { repliedUser: false } });
    });
});

/**
 * Helper function that searches for installed latex packages.
 * @param {string} name The package to search for.
 * @returns {boolean} Whether its installed or not.
 */
const packageinstalled = (name) => {
    try {
        execSync(`kpsewhich ${name}.sty`);
    } catch(e) {
        return false;
    }
    return true;
}

