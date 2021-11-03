const { Collection } = require("discord.js");
const BaseConstruct = require("./BaseConstruct");
const CommandBlock = require("./CommandBlock");
const log = require("./log");
const { isArray } = require("lodash");

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
         * @type {Collection<?string, [Snowflake]>}
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
            if (isArray(prefix)) {
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
     * @param {?string} [trimmedPath]
     */
    load(command, filePath = null, trimmedPath = null) {
        // validation
        if (command instanceof CommandBlock === false) return;
        // parent
        super.load(command, filePath, trimmedPath);
        // bind correct this value & prefix the client as the first parameter
        command.run = command.run.bind(command, this.client);
        // collections
        command.names.forEach((name) => {
            if (this.index.has(name) && this.cache.has(this.index.get(name))) {
                const oldCommand = this.cache.get(this.index.get(name));
                log.warn(`Command name "${name}" from ${!oldCommand.filePath ? "an anonymous block" : oldCommand.filePath} was overwritten in the index by ${!command.filePath ? "an anonymous block" : command.filePath}`);
            }
            if (/[\n\r\s]+/.test(name)) log.warn(`Command name "${name}" from ${!command.filePath ? "an anonymous block" : command.filePath} contains white space and won't be reached by the parsing in commandParser.js`);
            this.index.set(name, command.id);
        });
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
        command.names.forEach((name) => this.index.delete(name));
    }

    /**
     * @param {string} id
     * @param {Discord.Message} message
     * @param {?string} [content=null] Note that content should never be an empty string. A lack of content is represented by null, see how commandParser runs this function
     * @param {[string]} [args=[]]
     * @param {...*} [passThrough]
     */
    run(id, message, content = null, args = [], ...passThrough) {
        if (!this.cache.has(id)) return log.warn(`Command id "${id}" isn't mapped to a command in the cache, cannot run`);
        /** @type {CommandBlock} */
        const command = this.cache.get(id);
        if (!command.checkChannelType(message)) {
            this.client.emit("channelTypeRejection", command, message);
            return;
        }
        if (message.channel.type !== "dm") {
            if (!command.checkNotSafeForWork(message)) {
                this.client.emit("nsfwRejection", command, message);
                return;
            }
            if (!command.checkPermissions(message, command.clientPermissions, true, false)) {
                this.client.emit("permissionRejection", command, message, command.clientPermissions, true, false);
                return;
            }
            if (!command.checkPermissions(message, command.clientChannelPermissions, true, true)) {
                this.client.emit("permissionRejection", command, message, command.clientChannelPermissions, true, true);
                return;
            }
            if (!command.checkPermissions(message, command.userPermissions, false, false)) {
                this.client.emit("permissionRejection", command, message, command.userPermissions, false, false);
                return;
            }
            if (!command.checkPermissions(message, command.userChannelPermissions, false, true)) {
                this.client.emit("permissionRejection", command, message, command.userChannelPermissions, false, true);
                return;
            }
        }
        if (!command.checkLocked(message)) {
            this.client.emit("lockedRejection", command, message);
            return;
        }
        // all good
        this.client.emit("commandUsed", command, message, content, args, ...passThrough);
        command.run(message, content, args, ...passThrough);
    }

    /**
     * Run commands easily by name rather than id
     * @param {string} name
     * @param {Discord.Message} message
     * @param {...*} [passThrough]
     */
    runByName(name, message, ...passThrough) {
        if (!name || !message) return;
        if (!this.index.has(name)) {
            this.client.emit("ignoredMessage", name, message);
            return;
        }
        const id = this.index.get(name);
        if (!this.cache.has(id)) return log.warn(`Command name "${name}" was mapped to id "${id}" but no corresponding command block found in the cache`);
        this.run(id, message, ...passThrough);
    }
}

module.exports = CommandConstruct;

/**
 * Emitted whenever CommandConstruct.runByName() is ran with a command name not mapped in the index. Recommended for debugging purposes only, as 99% of the time this will be unrelated messages, not attempted command use.
 * @event Client#ignoredMessage
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {string} name The name which isn't mapped to an id in CommandConstruct.index
 * @param {Discord.Message} message Originating message
 */

/**
 * Emitted whenever a command is successfully ran
 * @event Client#commandUsed
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {CommandBlock} command
 * @param {Discord.Message} message
 * @param {?string} [content=null]
 * @param {[string]} [args=[]]
 * @param {...*} [extraParameters]
 */

/**
 * Emitted when someone attempts to use a command somewhere it cannot be used, based upon [channel type](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=type)
 * @event Client#channelTypeRejection
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {CommandBlock} command
 * @param {Discord.Message} message
 */

/**
 * Emitted when someone attempts to use a nsfw command in a non-nsfw channel
 * @event Client#nsfwRejection
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {CommandBlock} command
 * @param {Discord.Message} message
 */

/**
 * Emitted when a command cannot be run due to missing permissions or someone is denied access based on their permissions
 * @event Client#permissionRejection
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {CommandBlock} command
 * @param {Discord.Message} message
 * @param {PermissionResolvable} permissions PermissionResolvable provided by the command
 * @param {boolean} usedClient Whether the client or the message author was checked
 * @param {boolean} usedChannel Whether channel overrides were taken into account
 */

/**
 * Emitted when someone is denied access to a locked command
 * @event Client#lockedRejection
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {CommandBlock} command
 * @param {Discord.Message} message
 */
