const log = require("./modules/log");
const sandplate = require("./sandplate.json");
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
if (Number(process.version.slice(1).split(".")[0]) < 14) { // version < minVer
  log.fatal(`node.js v14+ is required, currently ${process.version}`);
  process.exit(1);
} else if (Number(Discord.version.split(".")[0]) < 12) { // version < minVer
  log.fatal(`discord.js v12+ is required, currently v${Discord.version}`);
  process.exit(1);
} else {
  log.info(`Starting ${package.name === "sandplate" ? `sandplate v${package.version} using node.js ${process.version} and discord.js v${Discord.version}` : `${package.name} v${package.version} using node.js ${process.version}, discord.js v${Discord.version}, and sandplate v${sandplate.version}`} on ${process.platform}`);
}

// Work in progress
require("./bot");
