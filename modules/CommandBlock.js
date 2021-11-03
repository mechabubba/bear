const BaseBlock = require("./BaseBlock");
const { isArrayOfStrings, isPermissionResolvable } = require("./miscellaneous");
const { has, defaultsDeep, isNil, isArray, isPlainObject, isFunction, isString, isBoolean } = require("lodash");
const log = require("./log");
const { defaultCommandData } = require("./defaultData");

/**
 * Data regarding the command such as it's names and metadata
 * @typedef {Object} CommandData
 * @property {[string]} names The CommandBlock's unique names
 * @property {(string|[string])} identity Deprecated property. The CommandBlock's unique names
 * @property {?string} [summary=null]  A summary describing this command block, expected to be only a sentence or so and not use any markdown formatting
 * @property {?string} [description=null] A description describing this command block, can be paragraphs long and include markdown formatting, but should be kept below 1800 characters
 * @property {?string} [usage=null] A string describing expected parameters and usage. There isn't a standard for these laid out yet, but in the default commands <> denotes a required parameter while [] denotes an optional one
 * @property {?[string]} [channelTypes=["dm", "text", "news"]] An array of [channel types](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=type) that this command block may be ran in. Most commonly used to limit commands to guilds or direct messages.
 * @property {?[string]} [scope=["dm", "text", "news"]] Deprecated property. An array of [channel types](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=type) that this command block may be ran in. Most commonly used to limit commands to guilds or direct messages.
 * @property {?boolean} [nsfw=false] Whether or not this command block may only be ran in a [nsfw channel](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=nsfw)
 * @property {?(boolean|string|[string])} [locked=false] Access control for commands. Accepts `false` (not locked), `true` (prevents being ran by anyone), user ids, and user group names. Can take any number of user ids and group names via array, mixing allowed.
 * @property {?PermissionResolvable} [clientPermissions=null] Permission the client (bot account) needs for the command to work
 * @property {?PermissionResolvable} [clientChannelPermissions=null] Permissions the client (bot account) needs for the command to work in a specific channel, taking into account channel overwrites
 * @property {?PermissionResolvable} [userPermissions=null] Permissions the user (person running the command) must have in guilds to use the command
 * @property {?PermissionResolvable} [userChannelPermissions=null] Permissions the user (person running the command) must have in guilds to use the command in a specific channel, taking into account channel overwrites
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
         * The unique names associated with this command block. Each is mapped to this CommandBlock's id in CommandConstruct#index
         * @type {[string]}
         * @name CommandBlock#names
         */
        if (has(data, "names")) {
            this.names = data.names;
        } else if (has(data, "identity")) {
            if (isArray(data.identity)) {
                this.names = data.identity;
            } else {
                this.names [data.identity];
            }
            this.identity = data.identity;
        }

        /**
         * The unique names associated with this command block. Deprecated in favor of CommandBlock#names
         * @deprecated In 0.0.8 and above, this property will stop working. Use CommandBlock#names and store them via array
         * @type {(string|[string])}
         * @name CommandBlock#identity
         * @todo Remove this and related code supporting the older property in 0.0.8
         */

        /**
         * A summary describing this command block, expected to be only a sentence or so and not use any markdown formatting
         * @type {?string}
         * @name CommandBlock#summary
         */

        /**
         * A description describing this command block, can be paragraphs long and include markdown formatting, but should be kept below 1800 characters
         * @type {?string}
         * @name CommandBlock#description
         */

        /**
         * A string describing expected parameters and usage. There isn't a standard for these laid out yet, but in the default commands <> denotes a required parameter while [] denotes an optional one
         * @type {?string}
         * @name CommandBlock#usage
         */

        /**
         * An array of [channel types](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=type) that this command block may be ran in. Most commonly used to limit commands to guilds or direct messages
         * @type {[string]}
         * @name CommandBlock#channelTypes
         */
        if (has(data, "channelTypes") && !isNil(data.channelTypes)) {
            this.channelTypes = data.channelTypes;
        } else if (has(data, "scope")) {
            this.scope = data.scope;
            this.channelTypes = data.scope;
        }

        /**
         * An array of [channel types](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=type) that this command block may be ran in. Most commonly used to limit commands to guilds or direct messages. Deprecated in favor of CommandBlock#channelTypes
         * @deprecated In 0.0.8 and above, this property will stop working. Use CommandBlock#channelTypes with the same usage
         * @type {[string]}
         * @name CommandBlock#scope
         * @todo Remove this and related code supporting the older property in 0.0.8
         */

        /**
         * Whether or not this command block may only be ran in a [nsfw channel](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=nsfw)
         * @type {boolean}
         * @name CommandBlock#nsfw
         */

        /**
         * Access control for commands. Accepts `false` (not locked), `true` (prevents being ran by anyone), user ids, and user group names. Can take any number of user ids and group names via array, mixing allowed.
         * @type {(boolean|string|[string])}
         * @name CommandBlock#locked
         */

        /**
         * Permissions the client (bot account) needs for the command to work
         * @type {?PermissionResolvable}
         * @name CommandBlock#clientPermissions
         */

        /**
         * Permissions the client (bot account) needs for the command to work in a specific channel, taking into account channel overwrites
         * @type {?PermissionResolvable}
         * @name CommandBlock#clientChannelPermissions
         */

        /**
         * Permissions the user (person running the command) must have in guilds to use the command
         * @type {?PermissionResolvable}
         * @name CommandBlock#userPermissions
         */

        /**
         * Permissions the user (person running the command) must have in guilds to use the command in a specific channel, taking into account channel overwrites
         * @type {?PermissionResolvable}
         * @name CommandBlock#userChannelPermissions
         */

        // Write properties to command block & default values for properties that weren't supplied
        defaultsDeep(this, data, defaultCommandData);

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
     * @deprecated Use names[0] instead
     * @type {string}
     * @readonly
     */
    get firstName() {
        return this.names[0];
    }

    /**
     * @type {string}
     * @readonly
     */
    get shortestName() {
        return this.names.reduce((acc, cur) => acc.length <= cur.length ? acc : cur);
    }

    /**
     * @type {string}
     * @readonly
     */
    get longestName() {
        return this.names.reduce((acc, cur) => acc.length < cur.length ? cur : acc);
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
     * @todo Parameter scope is now deprecated, remove warning in one of the next versions
     */
    static validateParameters(data, run) {
        if (!isPlainObject(data)) throw new TypeError("Command data parameter must be an Object.");
        if (!isFunction(run)) throw new TypeError("Command run parameter must be a function.");
        if (!has(data, "names") && !has(data, "identity")) throw new TypeError("CommandBlock#names is a required property and must be supplied.");
        if (has(data, "names")) if (!isArrayOfStrings(data.names)) throw new TypeError("CommandBlock#names must be an Array of strings.");
        if (has(data, "identity") && !isNil(data.identity)) {
            log.warn("Deprecation Warning: CommandBlock#identity was deprecated in favor of CommandBlock#names. This warning and support will be removed in a future version.");
            if (!isString(data.identity) && !isArrayOfStrings(data.identity)) throw new TypeError("CommandBlock#identity must be a string or an Array of strings.");
        }
        if (has(data, "summary") && !isNil(data.summary)) if (!isString(data.summary)) throw new TypeError("CommandBlock#summary must be a string.");
        if (has(data, "description") && !isNil(data.description)) if (!isString(data.description)) throw new TypeError("CommandBlock#description must be a string.");
        if (has(data, "usage") && !isNil(data.usage)) if (!isString(data.usage)) throw new TypeError("CommandBlock#usage must be a string.");
        if (has(data, "channelTypes") && !isNil(data.channelTypes)) if (!isArrayOfStrings(data.channelTypes, false)) throw new TypeError("CommandBlock#channelTypes must be an Array of strings.");
        if (has(data, "scope") && !isNil(data.scope)) {
            log.warn("Deprecation Warning: CommandBlock#scope was renamed to CommandBlock#channelTypes which retains same usage. This warning and support will be removed in a future version.");
            if (!isArrayOfStrings(data.scope, false)) throw new TypeError("CommandBlock#scope must be an Array of strings.");
        }
        if (has(data, "nsfw") && !isNil(data.nsfw)) if (!isBoolean(data.nsfw)) throw new TypeError("CommandBlock#nsfw must be a boolean.");
        if (has(data, "locked") && !isNil(data.locked)) if (!isBoolean(data.locked) && !isString(data.locked) && !isArrayOfStrings(data.locked)) throw new TypeError("CommandBlock#locked must be a boolean, string, or an Array of strings.");
        if (has(data, "clientPermissions") && !isNil(data.clientPermissions)) {
            if (isArray(data.clientPermissions)) {
                for (const value of data.clientPermissions) {
                    if (!isPermissionResolvable(value)) throw new TypeError("CommandBlock#clientPermissions Array must only contain PermissionResolvable");
                }
            } else if (!isPermissionResolvable(data.clientPermissions)) {
                throw new TypeError("CommandBlock#clientPermissions must be a PermissionResolvable");
            }
        }
        if (has(data, "clientChannelPermissions") && !isNil(data.clientChannelPermissions)) {
            if (isArray(data.clientChannelPermissions)) {
                for (const value of data.clientChannelPermissions) {
                    if (!isPermissionResolvable(value)) throw new TypeError("CommandBlock#clientChannelPermissions Array must only contain PermissionResolvable");
                }
            } else if (!isPermissionResolvable(data.clientChannelPermissions)) {
                throw new TypeError("CommandBlock#clientChannelPermissions must be a PermissionResolvable");
            }
        }
        if (has(data, "userPermissions") && !isNil(data.userPermissions)) {
            if (isArray(data.userPermissions)) {
                for (const value of data.userPermissions) {
                    if (!isPermissionResolvable(value)) throw new TypeError("CommandBlock#userPermissions Array must only contain PermissionResolvable");
                }
            } else if (!isPermissionResolvable(data.userPermissions)) {
                throw new TypeError("CommandBlock#userPermissions must be a PermissionResolvable");
            }
        }
        if (has(data, "userChannelPermissions") && !isNil(data.userChannelPermissions)) {
            if (isArray(data.userChannelPermissions)) {
                for (const value of data.userChannelPermissions) {
                    if (!isPermissionResolvable(value)) throw new TypeError("CommandBlock#userChannelPermissions Array must only contain PermissionResolvable");
                }
            } else if (!isPermissionResolvable(data.userChannelPermissions)) {
                throw new TypeError("CommandBlock#userChannelPermissions must be a PermissionResolvable");
            }
        }
    }
}

module.exports = CommandBlock;
