const log = require("./modules/log");
const package = require("./package.json");
const djsver = require("discord.js").version;
const semver = require("semver");

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
if(!semver.satisfies(process.version, package.engines.node)) {
    log.fatal(`node.js v${semver.clean(package.engines.node)}+ is required, currently ${process.version}`);
    process.exit(1);
} else if(!semver.satisfies(djsver, ">=13")) {
    log.fatal(`discord.js v13+ is required, currently v${djsver}`);
    process.exit(1);
} else {
    log.info(`Starting ${package.name} v${package.version} using node.js ${process.version} and discord.js v${djsver} on ${process.platform}`);
}

// rock n' roll
require("./bot");
