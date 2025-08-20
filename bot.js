const Client = require("./modules/Client");
const log = require("./modules/log");
const fse = require("fs-extra");
const { Intents, PartialType, SnowflakeUtil } = require("discord.js");
const { token } = require("./modules/regexes");

// Instantiate client
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
    partials: [
        "USER",
        "CHANNEL",
        "GUILD_MEMBER",
        "MESSAGE"
    ]
});

// Token validation (config)
if (client.config.has("client.token")) {
    if (token.exec(client.config.get("client.token")).groups.basicToken) {
        log.info("Token stored in the config successfully matched token regex, will attempt to login");
    } else {
        const id = SnowflakeUtil.generate();
        log.warn("Token stored in the config didn't match token regex, won't try to use it");
        fse.ensureFileSync(client.dbPath);
        fse.copySync(client.dbPath, `./data/config.backup.${id}.json`);
        client.config.set("client.token", null);
        log.warn(`The token in the config has been reset to null and a backup of the config with the invalid token has been created at ./data/config.backup.${id}.json`);
    }
}

// Token validation (command line argument)
const argv = process.argv.slice(2);
if (argv.length) {
    if (argv.length > 1) log.warn("Regarding command line arguments, only using the first argument to pass in a token is supported. All further arguments are ignored.");
    if (token.exec(argv[0]).groups.basicToken) {
        log.info("Command line argument matched token regex, will attempt to login");
        client.cookies.set("token", argv[0]);
    } else {
        log.warn("Command line argument didn't match token regex, won't try to use it");
    }
}

// Initialize bot
const init = async function() {
    const commandLoadResult = await client.handler.requireDirectory(client.commands, client.config.get("commands.directory"), true);
    const eventLoadResult = await client.handler.requireDirectory(client.events, client.config.get("events.directory"), true);
    const remindersLoadResult = client.handler.requireModule(client.reminders.events, "../bot/reminderCall.js");
    log.info(commandLoadResult.message);
    log.info(eventLoadResult.message);
    log.info(remindersLoadResult.message);
    // Ground control to major tom
    if (client.cookies["token"] || client.config.get("client.token") !== null) {
        client.login(client.cookies["token"] || client.config.get("client.token"));
    } else {
        log.warn("No token available to login with! Please set one in config.json or pass one in as an argument");
        process.exit(0);
    }
};

init();
