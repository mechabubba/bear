const BaseBlock = require("./BaseBlock");
const { isArrayOfStrings, isPermissionResolvable } = require("./miscellaneous");
const { has, isNil, isArray, isPlainObject, isFunction, isString, isBoolean } = require("lodash");

/**
 * Data regarding the command such as it's names and metadata
 * @typedef {Object} CommandData
 * @property {(string|[string])} identity - The command's name(s)
 * @property {?string} [summary=null] - A sentence about what the command does, should be kept relatively short
 * @property {?string} [description=null] - Description about what the command does and it's usage, should be kept below 1800 characters
 * @property {?string} [usage=null] - String containing argument usage descriptors
 * @property {?[string]} [scope=["dm", "text", "news"]] - An array of channel types where the command is allowed https://discord.js.org/#/docs/main/stable/class/Channel?scrollTo=type
 * @property {?boolean} [nsfw=false] - Whether or not the command is nsfw
 * @property {?(boolean|string|[string])} [locked=false] - Powerful command access control. `false` command is not locked, `true` command is locked, `string` command is locked to a user group name or an account id, `Array` command is locked to any number of group names or account ids
 * @property {?PermissionResolvable} [clientPermissions=null] - PermissionResolvable the client must have in the scope of a guild for the command to work
 * @property {?PermissionResolvable} [userPermissions=null] - PermissionResolvable the user of the command must have in the scope of a guild to use the command
 */

/**
 * Function used as a command's run method
 * @callback run
 * @param {Client} client - Bound as the first parameter by CommandConstruct.load()
 * @param {Message} message
 * @param {?string} [content=null]
 * @param {Array} [args=[]]
 * @param {...*}
 * @todo Should the bound parameter be included?
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
    this.summary = has(data, "summary") && !isNil(data.summary) ? data.summary : null;

    /**
     * @type {?string}
     */
    this.description = has(data, "description") && !isNil(data.description) ? data.description : null;

    /**
     * @type {?string}
     */
    this.usage = has(data, "usage") && !isNil(data.usage) ? data.usage : null;

    /**
     * @type {[string]}
     */
    this.scope = has(data, "scope") && !isNil(data.scope) ? data.scope : ["dm", "text", "news"];

    /**
     * @type {boolean}
     */
    this.nsfw = has(data, "nsfw") && !isNil(data.nsfw) ? data.nsfw : false;

    /**
     * @type {(boolean|string|[string])}
     */
    this.locked = has(data, "locked") && !isNil(data.locked) ? data.locked : false;

    /**
     * @type {?PermissionResolvable}
     */
    this.clientPermissions = has(data, "clientPermissions") && !isNil(data.clientPermissions) ? data.clientPermissions : null;

    /**
     * @type {?PermissionResolvable}
     */
    this.userPermissions = has(data, "userPermissions") && !isNil(data.userPermissions) ? data.userPermissions : null;

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
   * @param {CommandData} data
   * @param {run} run
   * @private
   * @todo May be worth looking into schema based validation
   */
  static validateParameters(data, run) {
    if (!isPlainObject(data)) throw new TypeError("Command data parameter must be an Object.");
    if (!isFunction(run)) throw new TypeError("Command run parameter must be a function.");
    if (!isString(data.identity) && !isArrayOfStrings(data.identity)) throw new TypeError("Command data.identity must be a string or an Array of strings.");
    if (has(data, "summary") && !isNil(data.summary)) if (!isString(data.summary)) throw new TypeError("Command data.summary must be a string.");
    if (has(data, "description") && !isNil(data.description)) if (!isString(data.description)) throw new TypeError("Command data.description must be a string.");
    if (has(data, "usage") && !isNil(data.usage)) if (!isString(data.usage)) throw new TypeError("Command data.usage must be a string.");
    if (has(data, "scope") && !isNil(data.scope)) if (!isArrayOfStrings(data.scope)) throw new TypeError("Command data.scope must be an Array of strings.");
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
    if (has(data, "userPermissions") && !isNil(data.userPermissions)) {
      if (isArray(data.userPermissions)) {
        for (const value of data.userPermissions) {
          if (!isPermissionResolvable(value)) throw new TypeError("Command data.userPermissions Array must only contain PermissionResolvable");
        }
      } else if (!isPermissionResolvable(data.userPermissions)) {
        throw new TypeError("Command data.userPermissions must be a PermissionResolvable");
      }
    }
  }
}

module.exports = CommandBlock;
