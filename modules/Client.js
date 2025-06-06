const GuildManager = require("./GuildManager");
const CommandConstruct = require("./CommandConstruct");
const EventConstruct = require("./EventConstruct");
const ReminderEmitter = require("./ReminderEmitter");
const Handler = require("./Handler");
const { TimedIntervalCache } = require("./RandomStructs"); 
const log = require("./log");

const Discord = require("discord.js");
const JSONManager = require("./JSONManager");
const fse = require("fs-extra");
const path = require("path");

const { defaultConfig, defaultStorage, defaultJSONManagerConfig } = require("./defaultData");

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
         * @todo this needs to be removed probably in favor of the defaultConfig and defaultStorage vars above
         * @type {string}
         * @readonly
         */
        this.configPath = path.join(__dirname, "../data/config.json");
        this.storagePath = path.join(__dirname, "../data/storage.json");

        // Log to the console if the config will be created
        if (!fse.pathExistsSync(this.configPath)) log.info(`A default config file will be generated at ./data/config.json`);

        /**
         * Config database via JSONManager class
         */
        this.config = new JSONManager(this.configPath, defaultJSONManagerConfig);
        if(this.config.isEmpty) this.config.data = defaultConfig;

        /**
         * Storage database via JSONManager class
         */
        this.storage = new JSONManager(this.storagePath, defaultJSONManagerConfig);
        if(this.storage.isEmpty) this.storage.data = defaultStorage;

        /**
         * Arbitrary object for temporary data.
         */
        this.cookies = {};

        /**
         * Handler framework
         * @type {Handler}
         */
        this.handler = new Handler(this);

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

        /**
         * Reminders
         * @type {ReminderEmitter}
         */
        this.reminders = new ReminderEmitter(this);

        /**
         * Temporary command logging.
         * @type {TimedIntervalCache}
         */
        this.cmdlog = new TimedIntervalCache();

        /**
         * Temporary message chains.
         * @type {TimedIntervalCache}
         */
        this.chains = new TimedIntervalCache({
            tts: 1800000
        });
    }
}

module.exports = Client;
