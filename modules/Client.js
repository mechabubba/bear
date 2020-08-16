const CommandConstruct = require("./CommandConstruct");
const EventConstruct = require("./EventConstruct");
const Handler = require("./Handler");
const log = require("./log");
const Discord = require("discord.js");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const fse = require("fs-extra");
const path = require("path");
const configPath = path.join(__dirname, "../data/config.json");
const defaultConfig = require("./defaultConfig");

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
     * Arbitrary Collection
     * @type {Discord.Collection<*, *>}
     */
    this.cookies = new Discord.Collection();

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
  }
}

module.exports = Client;
