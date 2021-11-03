const GuildManager = require("./GuildManager");
const CommandConstruct = require("./CommandConstruct");
const EventConstruct = require("./EventConstruct");
const Handler = require("./Handler");
const log = require("./log");
const Discord = require("discord.js");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const fse = require("fs-extra");
const path = require("path");
const { config } = require("./defaultData");

/**
 * Extension of the discord.js client
 * @extends {Discord.Client}
 */
class Client extends Discord.Client {
    /**
     * @param {ClientOptions} options Options for the client
     */
    constructor(options) {
        super(options);

        /**
         * Replace this.guilds with our extended GuildManager
         */
        this.guilds = new GuildManager(this);

        /**
         * Full file path used for the configuration file
         * @type {string}
         * @readonly
         */
        this.dbPath = path.join(__dirname, "..", "data", "config.json");

        // Log to the console if the config will be created
        if (!fse.pathExistsSync(this.dbPath)) log.info(`A default config file will be generated at ./data/config.json`);

        /**
         * Config database via lowdb
         */
        this.config = low(new FileSync(this.dbPath));
        this.config.defaultsDeep(config).write();

        /**
         * Arbitrary Collection
         * @type {Discord.Collection<*, *>}
         */
        this.cookies = new Discord.Collection();

        /**
         * Handler framework
         * @type {Handler}
         */
        this.handler = new Handler();

        /**
         * Commands
         * @type {CommandConstruct}
         */
        this.commands = new CommandConstruct(this, "bot command construct");

        /**
         * Events
         * @type {EventConstruct}
         */
        this.events = new EventConstruct(this, "discord.js event construct");
    }
}

module.exports = Client;
