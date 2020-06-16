/* eslint-disable no-unused-vars */
const { Collection } = require("discord.js");
const BaseConstruct = require("./BaseConstruct");
const CommandModule = require("./CommandModule");
const { collectionArrayPush, collectionArrayFilter, forAny } = require("./miscellaneous");
const log = require("./log");
const chalk = require("chalk");
const _ = require("lodash");

/**
 * Command framework
 * @extends {BaseConstruct}
 */
class CommandConstruct extends BaseConstruct {
  /**
   * @param {Client} client
   */
  constructor(client) {
    super();

    /**
     * Reference to the Client this CommandConstruct is for
     * @type {Client}
     * @readonly
     */
    Object.defineProperty(this, "client", { value: client });

    /**
     * Cached CommandModules mapped by their ids
     * @type {Collection<Snowflake, CommandModule>}
     */
    this.cache = new Collection();

    /**
     * Index of command names mapped to command ids
     * @type {Collection<string, Snowflake>}
     */
    this.index = new Collection();

    /**
     * Module file paths mapped to arrays of CommandModules ids originating from that module. If anonymous CommandModules have been loaded `null` is mapped to an array of their ids.
     * @type {Collection<?string, Snowflake[]>}
     */
    this.idsByPath = new Collection();
  }

  /**
   * @param {CommandModule} command
   * @param {?string} [filePath=null]
   */
  load(command, filePath = null) {
    // validation
    if (command instanceof CommandModule === false) return;
    // file path
    command.filePath = filePath;
    // bind correct this value & prefix the client as the first parameter
    command.run = command.run.bind(command, this.client);
    // collections
    this.cache.set(command.id, command);
    forAny((name) => {
      if (this.index.has(name) && this.cache.has(this.index.get(name))) {
        const oldCommand = this.cache.get(this.index.get(name));
        log.warn(`Command name "${name}" from ${oldCommand.filePath === false ? "(anonymous)" : oldCommand.filePath} was overwritten in the index by ${command.filePath === false ? "(anonymous)" : command.filePath}`);
      }
      if (/[\n\r\s]+/.test(name)) log.warn(`Command name "${name}" contains white space and won't be reached by the parsing in commandParser.js\n(from ${command.filePath === false ? "(anonymous)" : command.filePath})`);
      this.index.set(name, command.id);
    }, command.identity);
    collectionArrayPush(this.idsByPath, command.filePath, command.id);
    // log
    log.trace("Loaded a command module", command);
  }

  /**
   * @param {CommandModule} command
   */
  unload(command) {
    // validation
    if (command instanceof CommandModule === false) return;
    // collections
    this.cache.delete(command.id);
    forAny((name) => this.index.delete(name), command.identity);
    collectionArrayFilter(this.idsByPath, command.filePath, command.id);
    // log
    log.trace("Unloaded a command module", command);
  }

  /**
   * @param {string} name
   * @param {Message} Message
   * @param {?string} [content=null]
   * @param {string[]} [args=[]]
   * @param {...*} [passThrough]
   */
  run(name, message, content = null, args = [], ...passThrough) {
    if (!name || !message) return;
    if (!this.index.has(name)) return;
    const id = this.index.get(name);
    if (!this.cache.has(id)) return log.warn(`Command name "${name}" was mapped in command index but corresponding id "${id}" isn't mapped in command cache`);
    const command = this.cache.get(id);
    if (!command.scope.includes(message.channel.type)) return;
    if (message.channel.type !== "dm") {
      if (command.nsfw) {
        if (message.channel.nsfw === false) return;
      }
      if (command.clientPermissions) {
        if (!message.guild.me.hasPermission(command.clientPermissions, false, true, true)) return;
      }
      if (command.userPermissions) {
        if (!message.member.hasPermission(command.userPermissions, false, true, true)) return;
      }
    }
    if (command.locked !== false) {
      if (command.locked === true) return;
      if (_.isString(command.locked)) {
        if (command.locked !== message.author.id) {
          if (!this.client.config.has(["users", command.locked]).value()) return;
          if (this.client.config.isNil(["users", command.locked]).value()) return;
          if (!this.client.config.get(["users", command.locked]).includes(message.author.id).value()) return;
        }
      } else if (_.isArray(command.locked)) {
        if (!command.locked.includes(message.author.id)) {
          if (command.locked.some((group) => {
            if (!this.client.config.has(["users", group]).value()) return false;
            if (this.client.config.isNil(["users", group]).value()) return false;
            if (!this.client.config.get(["users", group]).includes(message.author.id).value()) return false;
            return true;
          }) === false) return;
        }
      }
    }
    log.debug(`${chalk.gray("[command]")} ${message.author.tag} ran "${name}${(!content ? "\"" : `" with "${content}"`)}`);
    command.run(message, content, args, ...passThrough);
  }
}

module.exports = CommandConstruct;
