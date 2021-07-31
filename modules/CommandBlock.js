const BaseBlock = require("./BaseBlock");
const { isArrayOfStrings, isPermissionResolvable } = require("./miscellaneous");
const { has, isNil, isArray, isPlainObject, isFunction, isString, isBoolean } = require("lodash");
const log = require("./log");
const { defaultCommandBlock } = require("./defaultData");

/**
 * Data regarding the command such as it's names and metadata
 * @typedef {Object} CommandData
 * @property {(string|[string])} identity The command's name(s)
 * @property {?string} [summary=null] A sentence about what the command does, should be kept relatively short
 * @property {?string} [description=null] Description about what the command does and it's usage, should be kept below 1800 characters
 * @property {?string} [usage=null] String containing argument usage descriptors
 * @property {?[string]} [channelTypes=["dm", "text", "news"]] An array of channel types where the command is allowed https://discord.js.org/#/docs/main/stable/class/Channel?scrollTo=type
 * @property {?boolean} [nsfw=false] Whether or not the command is nsfw
 * @property {?(boolean|string|[string])} [locked=false] Powerful command access control. `false` command is not locked, `true` command is locked, `string` command is locked to a user group name or an account id, `Array` command is locked to any number of group names or account ids
 * @property {?PermissionResolvable} [clientPermissions=null] PermissionResolvable the client must have in guilds for the command to work
 * @property {?PermissionResolvable} [clientChannelPermissions=null] PermissionResolvable the client must have in guilds (taking into account channel overrides) for the command to work
 * @property {?PermissionResolvable} [userPermissions=null] PermissionResolvable the user of the command must have in guilds to use the command
 * @property {?PermissionResolvable} [userChannelPermissions=null] PermissionResolvable the user of the command must have in guilds (taking into account channel overrides) to use the command
 */

/**
 * Function used as a command's run method
 * @callback run
 * @param {Client} client Bound as the first parameter by CommandConstruct.load()
 * @param {Discord.Message} message
 * @param {?string} [content=null]
 * @param {Array} [args=[]]
 * @param {...*}
 * @todo Is there a way to specify that this callback's this value is an instance of CommandBlock?
 */

/**
 * @extends {BaseBlock}
 */
class CommandBlock extends BaseBlock {
  /**
   * @param {CommandData} data
   * @param {run} code
   */
  constructor(data = {}, run) {
    super();
    CommandBlock.validateParameters(data, run);

    // Data

    /**
     * @type {(string|[string])}
     */
    this.identity = data.identity;

    /**
     * @type {?string}
     */
    this.summary = has(data, "summary") && !isNil(data.summary) ? data.summary : defaultCommandBlock.summary;

    /**
     * @type {?string}
     */
    this.description = has(data, "description") && !isNil(data.description) ? data.description : defaultCommandBlock.description;

    /**
     * @type {?string}
     */
    this.usage = has(data, "usage") && !isNil(data.usage) ? data.usage : defaultCommandBlock.usage;

    /**
     * @type {[string]}
     */
    this.channelTypes = has(data, "channelTypes") && !isNil(data.channelTypes) ? data.channelTypes : defaultCommandBlock.channelTypes;

    /**
     * @type {boolean}
     */
    this.nsfw = has(data, "nsfw") && !isNil(data.nsfw) ? data.nsfw : defaultCommandBlock.nsfw;

    /**
     * @type {(boolean|string|[string])}
     */
    this.locked = has(data, "locked") && !isNil(data.locked) ? data.locked : defaultCommandBlock.locked;

    /**
     * @type {?PermissionResolvable}
     */
    this.clientPermissions = has(data, "clientPermissions") && !isNil(data.clientPermissions) ? data.clientPermissions : defaultCommandBlock.clientPermissions;

    /**
     * @type {?PermissionResolvable}
     */
    this.clientChannelPermissions = has(data, "clientChannelPermissions") && !isNil(data.clientChannelPermissions) ? data.clientChannelPermissions : defaultCommandBlock.clientChannelPermissions;

    /**
     * @type {?PermissionResolvable}
     */
    this.userPermissions = has(data, "userPermissions") && !isNil(data.userPermissions) ? data.userPermissions : defaultCommandBlock.userPermissions;

    /**
     * @type {?PermissionResolvable}
     */
    this.userChannelPermissions = has(data, "userChannelPermissions") && !isNil(data.userChannelPermissions) ? data.userChannelPermissions : defaultCommandBlock.userChannelPermissions;

    // Methods
    // Note that bind() isn't used here in favor of doing it in CommandConstruct's load method, so that it can bind parameters as well

    /**
     * Function used as a command's run method
     * @type {run}
     * @abstract
     */
    this.run = run;
  }

  /**
   * @type {string}
   * @readonly
   */
  get firstName() {
    if (isArray(this.identity)) {
      return this.identity[0];
    } else {
      return this.identity;
    }
  }

  /**
   * @type {string}
   * @readonly
   */
  get shortestName() {
    if (isArray(this.identity)) {
      return this.identity.reduce((acc, cur) => acc.length <= cur.length ? acc : cur);
    } else {
      return this.identity;
    }
  }

  /**
   * @type {string}
   * @readonly
   */
  get longestName() {
    if (isArray(this.identity)) {
      return this.identity.reduce((acc, cur) => acc.length < cur.length ? cur : acc);
    } else {
      return this.identity;
    }
  }

  /**
   * @param {Discord.Message} message
   * @returns {boolean}
   */
  checkChannelType(message) {
    return this.channelTypes.includes(message.channel.type);
  }

  /**
   * @param {Discord.Message} message
   * @returns {boolean}
   */
  checkNotSafeForWork(message) {
    if (message.channel.type === "dm") return true;
    if (!this.nsfw) return true;
    return message.channel.nsfw;
  }

  /**
   * @param {Discord.Message} message
   * @returns {boolean}
   */
  checkLocked(message) {
    if (!this.locked) return true;
    if (this.locked === true) return false;
    if (isString(this.locked)) {
      if (this.locked === message.author.id) return true;
      if (!message.client.config.has(["users", this.locked]).value()) return false;
      if (message.client.config.isNil(["users", this.locked]).value()) return false;
      return message.client.config.get(["users", this.locked]).includes(message.author.id).value();
    } else if (isArray(this.locked)) {
      if (this.locked.includes(message.author.id)) return true;
      return this.locked.some((group) => {
        if (!message.client.config.has(["users", group]).value()) return false;
        if (message.client.config.isNil(["users", group]).value()) return false;
        return message.client.config.get(["users", group]).includes(message.author.id).value();
      });
    } else {
      return false;
    }
  }

  /**
   * @param {Discord.Message} message
   * @param {PermissionResolvable} permissions PermissionResolvable
   * @param {boolean} [useClient=true] Whether to check the client or message author
   * @param {boolean} [useChannel=false] Whether or not to take into account channel overrides
   * @returns {boolean}
   */
  checkPermissions(message, permissions, useClient = true, useChannel = false) {
    if (message.channel.type === "dm") return true;
    if (!permissions) return true;
    /** @type {Discord.GuildMember} */
    const member = useClient ? message.guild.me : message.member;
    if (useChannel) {
      // This supports channel overrides, administrator, and guild owner https://github.com/discordjs/discord.js/blob/51551f544b80d7d27ab0b315da01dfc560b2c115/src/structures/GuildChannel.js#L153
      return message.channel.permissionsFor(member).has(permissions, true);
    } else {
      // checkAdmin and checkOwner options default to true https://discord.js.org/#/docs/main/stable/class/GuildMember?scrollTo=hasPermission
      return member.hasPermission(permissions);
    }
  }

  /**
   * @param {CommandData} data
   * @param {run} run
   * @private
   * @todo May be worth looking into schema based validation
   * @todo Parameter scope is now depreciated, remove warning in one of the next versions
   */
  static validateParameters(data, run) {
    if (!isPlainObject(data)) throw new TypeError("Command data parameter must be an Object.");
    if (!isFunction(run)) throw new TypeError("Command run parameter must be a function.");
    if (!isString(data.identity) && !isArrayOfStrings(data.identity)) throw new TypeError("Command data.identity must be a string or an Array of strings.");
    if (has(data, "summary") && !isNil(data.summary)) if (!isString(data.summary)) throw new TypeError("Command data.summary must be a string.");
    if (has(data, "description") && !isNil(data.description)) if (!isString(data.description)) throw new TypeError("Command data.description must be a string.");
    if (has(data, "usage") && !isNil(data.usage)) if (!isString(data.usage)) throw new TypeError("Command data.usage must be a string.");
    if (has(data, "scope")) log.warn("Depreciation Warning: Command parameter \"scope\" was renamed to \"channelTypes\" and now does nothing, new parameter retains same usage. This warning will be removed in a future version.");
    if (has(data, "channelTypes") && !isNil(data.channelTypes)) if (!isArrayOfStrings(data.channelTypes, false)) throw new TypeError("Command data.channelTypes must be an Array of strings.");
    if (has(data, "nsfw") && !isNil(data.nsfw)) if (!isBoolean(data.nsfw)) throw new TypeError("Command data.nsfw must be a boolean.");
    if (has(data, "locked") && !isNil(data.locked)) if (!isBoolean(data.locked) && !isString(data.locked) && !isArrayOfStrings(data.locked)) throw new TypeError("Command data.locked must be a boolean, string, or an Array of strings.");
    if (has(data, "clientPermissions") && !isNil(data.clientPermissions)) {
      if (isArray(data.clientPermissions)) {
        for (const value of data.clientPermissions) {
          if (!isPermissionResolvable(value)) throw new TypeError("Command data.clientPermissions Array must only contain PermissionResolvable");
        }
      } else if (!isPermissionResolvable(data.clientPermissions)) {
        throw new TypeError("Command data.clientPermissions must be a PermissionResolvable");
      }
    }
    if (has(data, "clientChannelPermissions") && !isNil(data.clientChannelPermissions)) {
      if (isArray(data.clientChannelPermissions)) {
        for (const value of data.clientChannelPermissions) {
          if (!isPermissionResolvable(value)) throw new TypeError("Command data.clientChannelPermissions Array must only contain PermissionResolvable");
        }
      } else if (!isPermissionResolvable(data.clientChannelPermissions)) {
        throw new TypeError("Command data.clientChannelPermissions must be a PermissionResolvable");
      }
    }
    if (has(data, "userPermissions") && !isNil(data.userPermissions)) {
      if (isArray(data.userPermissions)) {
        for (const value of data.userPermissions) {
          if (!isPermissionResolvable(value)) throw new TypeError("Command data.userPermissions Array must only contain PermissionResolvable");
        }
      } else if (!isPermissionResolvable(data.userPermissions)) {
        throw new TypeError("Command data.userPermissions must be a PermissionResolvable");
      }
    }
    if (has(data, "userChannelPermissions") && !isNil(data.userChannelPermissions)) {
      if (isArray(data.userChannelPermissions)) {
        for (const value of data.userChannelPermissions) {
          if (!isPermissionResolvable(value)) throw new TypeError("Command data.userChannelPermissions Array must only contain PermissionResolvable");
        }
      } else if (!isPermissionResolvable(data.userChannelPermissions)) {
        throw new TypeError("Command data.userChannelPermissions must be a PermissionResolvable");
      }
    }
  }
}

module.exports = CommandBlock;
