const log = require("./modules/log");
const package = require("./package.json");
const Discord = require("discord.js");

// node.js process event listeners (if you can improve these, please contribute!)
// https://nodejs.org/api/process.html (list is under Process Events)
process.on("uncaughtException", (error, origin) => {
    log.fatal(`${origin},`, error);
    return process.exit(1); // Always let code exit on uncaught exceptions
});
process.on("unhandledRejection", (reason, promise) => log.error(`unhandledRejection\n`, promise));
process.on("rejectionHandled", (promise) => log.debug("rejectionHandled\n", promise));
process.on("warning", (warning) => log.warn(warning));
process.on("exit", (code) => code === 0 ? log.info("Exiting peacefully") : log.warn("Exiting abnormally with code:", code));

// node.js and discord.js version checks
const nodeVersion = process.version.slice(1).split(".");
if (Number(nodeVersion[0]) < 16 || Number(nodeVersion[1]) < 6) { // version < minVer
    log.fatal(`node.js v16.6+ is required, currently ${process.version}`);
    process.exit(1);
} else if (Number(Discord.version.split(".")[0]) < 12) { // version < minVer
    log.fatal(`discord.js v12+ is required, currently v${Discord.version}`);
    process.exit(1);
} else {
    log.info(`Starting ${package.name} v${package.version} using node.js ${process.version} and discord.js v${Discord.version} on ${process.platform}`);
}

// Work in progress
require("./bot");
