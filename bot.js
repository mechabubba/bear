const Client = require("./modules/Client");
const log = require("./modules/log");
const fse = require("fs-extra");
const { SnowflakeUtil } = require("discord.js");
const { token } = require("./modules/regexes");

// Instantiate client
const client = new Client({
    disableMentions: "all",
    // This changes the default value for the equivalent message option, good practice imo
    // https://discord.js.org/#/docs/main/stable/typedef/MessageOptions?scrollTo=disableMentions
});

// Token validation (config)
if (client.config.get("client.token").value() !== null) {
    if (token.test(client.config.get("client.token").value())) {
        log.info("Token stored in the config successfully matched token regex, will attempt to login");
    } else {
        const id = SnowflakeUtil.generate();
        log.warn("Token stored in the config didn't match token regex, won't try to use it");
        fse.ensureFileSync(client.dbPath);
        fse.copySync(client.dbPath, `./data/config.backup.${id}.json`);
        client.config.set("client.token", null).write();
        log.warn(`The token in the config has been reset to null and a backup of the config with the invalid token has been created at ./data/config.backup.${id}.json`);
    }
}

// Token validation (command line argument)
const argv = process.argv.slice(2);
if (argv.length) {
    if (argv.length > 1) log.warn("Regarding command line arguments, only using the first argument to pass in a token is supported. All further arguments are ignored.");
    if (token.test(argv[0])) {
        log.info("Command line argument matched token regex, will attempt to login");
        client.cookies.set("token", argv[0]);
    } else {
        log.warn("Command line argument didn't match token regex, won't try to use it");
    }
}

// Initialize bot
const init = async function() {
    const commandLoadResult = await client.handler.requireDirectory(client.commands, client.config.get("commands.directory").value(), true);
    const eventLoadResult = await client.handler.requireDirectory(client.events, client.config.get("events.directory").value(), true);
    log.info(commandLoadResult.message);
    log.info(eventLoadResult.message);
    // Ground control to major tom
    if (client.cookies.has("token") || client.config.get("client.token").value() !== null) {
        client.login(client.cookies.has("token") ? client.cookies.get("token") : client.config.get("client.token").value());
    } else {
        log.warn("No token available! Set one in the config or pass one in as a cli argument");
        process.exit(0);
    }
};

init();
