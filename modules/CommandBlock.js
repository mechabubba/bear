const BaseBlock = require("./BaseBlock");
const { isArrayOfStrings, isPermissionResolvable } = require("./miscellaneous");
const _ = require("lodash");

/**
 * Data regarding the command such as it's names and metadata
 * @typedef {Object} CommandData
 * @property {(string|[string])} identity - The command's name(s)
 * @property {?string} [summary=null] - A sentence about what the command does, should be kept relatively short
 * @property {?string} [description="No Description Provided"] - Description about what the command does and it's usage, should be kept below 1800 characters
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
    this.summary = _.has(data, "summary") && !_.isNil(data.summary) ? data.summary : null;

    /**
     * @type {string}
     */
    this.description = _.has(data, "description") && !_.isNil(data.description) ? data.description : "No Description Provided";

    /**
     * @type {?string}
     */
    this.usage = _.has(data, "usage") && !_.isNil(data.usage) ? data.usage : null;

    /**
     * @type {[string]}
     */
    this.scope = _.has(data, "scope") && !_.isNil(data.scope) ? data.scope : ["dm", "text", "news"];

    /**
     * @type {boolean}
     */
    this.nsfw = _.has(data, "nsfw") && !_.isNil(data.nsfw) ? data.nsfw : false;

    /**
     * @type {(boolean|string|[string])}
     */
    this.locked = _.has(data, "locked") && !_.isNil(data.locked) ? data.locked : false;

    /**
     * @type {?PermissionResolvable}
     */
    this.clientPermissions = _.has(data, "clientPermissions") && !_.isNil(data.clientPermissions) ? data.clientPermissions : null;

    /**
     * @type {?PermissionResolvable}
     */
    this.userPermissions = _.has(data, "userPermissions") && !_.isNil(data.userPermissions) ? data.userPermissions : null;

    // Methods
    // Note that bind() isn't used here in favor of doing it in CommandConstruct's load method, so that it can bind parameters as well

    /**
     * @type {run}
     */
    this.run = run;
  }

  /**
   * @type {string}
   * @readonly
   */
  get firstName() {
    if (_.isArray(this.identity)) {
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
    if (_.isArray(this.identity)) {
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
    if (_.isArray(this.identity)) {
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
    if (!_.isPlainObject(data)) throw new TypeError("Command data parameter must be an Object.");
    if (!_.isFunction(run)) throw new TypeError("Command run parameter must be a function.");
    if (!_.isString(data.identity) && !isArrayOfStrings(data.identity)) throw new TypeError("Command data.identity must be a string or an Array of strings.");
    if (_.has(data, "summary") && !_.isNil(data.summary)) if (!_.isString(data.summary)) throw new TypeError("Command data.summary must be a string.");
    if (_.has(data, "description") && !_.isNil(data.description)) if (!_.isString(data.description)) throw new TypeError("Command data.description must be a string.");
    if (_.has(data, "usage") && !_.isNil(data.usage)) if (!_.isString(data.usage)) throw new TypeError("Command data.usage must be a string.");
    if (_.has(data, "scope") && !_.isNil(data.scope)) if (!isArrayOfStrings(data.scope)) throw new TypeError("Command data.scope must be an Array of strings.");
    if (_.has(data, "nsfw") && !_.isNil(data.nsfw)) if (!_.isBoolean(data.nsfw)) throw new TypeError("Command data.nsfw must be a boolean.");
    if (_.has(data, "locked") && !_.isNil(data.locked)) if (!_.isBoolean(data.locked) && !_.isString(data.locked) && !isArrayOfStrings(data.locked)) throw new TypeError("Command data.locked must be a boolean, string, or an Array of strings.");
    if (_.has(data, "clientPermissions") && !_.isNil(data.clientPermissions)) {
      if (_.isArray(data.clientPermissions)) {
        for (const value of data.clientPermissions) {
          if (!isPermissionResolvable(value)) throw new TypeError("Command data.clientPermissions Array must only contain PermissionResolvable");
        }
      } else if (!isPermissionResolvable(data.clientPermissions)) {
        throw new TypeError("Command data.clientPermissions must be a PermissionResolvable");
      }
    }
    if (_.has(data, "userPermissions") && !_.isNil(data.userPermissions)) {
      if (_.isArray(data.userPermissions)) {
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
