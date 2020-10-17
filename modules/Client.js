const CommandConstruct = require("./CommandConstruct");
const EventConstruct = require("./EventConstruct");
const ReminderEmitter = require("./ReminderEmitter");
const Handler = require("./Handler");
const log = require("./log");

const Discord = require("discord.js");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const fse = require("fs-extra");
const path = require("path");

const configPath = path.join(__dirname, "../data/config.json");
const storagePath = path.join(__dirname, "../data/storage.json");
const { defaultConfig, defaultStorage } = require("./defaults");

/**
 * Extension of the discord.js client
 * @extends {Discord.Client}
 */
class Client extends Discord.Client {
  /**
   * @param {ClientOptions} options - Options for the client
   */
  constructor(options) {
    super(options);

    // Log to the console if config.json will be created
    if (fse.pathExistsSync(configPath) !== true) {
      log.info("A default config.json file will be generated in ./data/");
    }
    /**
     * Config database via lowdb
     */
    this.config = low(new FileSync(configPath));
    this.config.defaultsDeep(defaultConfig).write();

    /**
     * Storage database via lowdb
     */
    this.storage = low(new FileSync(storagePath));
    this.storage.defaultsDeep(defaultStorage).write()

    /**
     * Arbitrary Collection
     * @type {Discord.Collection<*, *>}
     */
    this.cookies = new Discord.Collection();

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
  }
}

module.exports = Client;
