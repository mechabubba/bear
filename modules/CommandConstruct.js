const { Collection } = require("discord.js");
const BaseConstruct = require("./BaseConstruct");
const CommandBlock = require("./CommandBlock");
const { forAny } = require("./miscellaneous");
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
   * @param {string} [name]
   */
  constructor(client, name) {
    super(name);

    /**
     * Reference to the Client this CommandConstruct is for
     * @type {Client}
     * @name CommandConstruct#client
     * @readonly
     */
    Object.defineProperty(this, "client", { value: client });

    /**
     * Cached CommandBlocks mapped by their ids
     * @type {Collection<Snowflake, CommandBlock>}
     * @name CommandConstruct#cache
     */

    /**
     * Module file paths mapped to arrays containing the ids of CommandBlocks originating from that module. If anonymous CommandBlocks were loaded, `null` is mapped to an array of their ids
     * @type {Collection<?string, Snowflake[]>}
     * @name CommandConstruct#idsByPath
     */

    /**
     * Index of command names mapped to command ids
     * @type {Collection<string, Snowflake>}
     */
    this.index = new Collection();
  }

  /**
   * @type {string}
   * @readonly
   */
  get firstPrefix() {
    const prefix = this.client.config.get("commands.prefix").value();
    const mentions = this.client.config.get("commands.mentions").value();
    if (prefix) {
      if (_.isArray(prefix)) {
        return prefix[0];
      } else {
        return prefix;
      }
    } else if (mentions) {
      return `@${this.client.user.username} `;
    } else {
      return "";
    }
  }

  /**
   * @param {CommandBlock} command
   * @param {?string} [filePath]
   */
  load(command, filePath) {
    // validation
    if (command instanceof CommandBlock === false) return;
    // parent
    super.load(command, filePath);
    // bind correct this value & prefix the client as the first parameter
    command.run = command.run.bind(command, this.client);
    // collections
    forAny((name) => {
      if (this.index.has(name) && this.cache.has(this.index.get(name))) {
        const oldCommand = this.cache.get(this.index.get(name));
        log.warn(`Command name "${name}" from ${!oldCommand.filePath ? "an anonymous block" : oldCommand.filePath} was overwritten in the index by ${!command.filePath ? "an anonymous block" : command.filePath}`);
      }
      if (/[\n\r\s]+/.test(name)) log.warn(`Command name "${name}" from ${!command.filePath ? "an anonymous block" : command.filePath} contains white space and won't be reached by the parsing in commandParser.js`);
      this.index.set(name, command.id);
    }, command.identity);
    // log
    log.trace("Loaded a command", command);
  }

  /**
   * @param {CommandBlock} command
   */
  unload(command) {
    // validation
    if (command instanceof CommandBlock === false) return;
    // parent
    super.unload(command);
    // collections
    forAny((name) => this.index.delete(name), command.identity);
    // log
    log.trace("Unloaded a command", command);
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
