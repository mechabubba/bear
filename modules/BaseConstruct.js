const { Collection } = require("discord.js");
const Base = require("./Base");
const BaseBlock = require("./BaseBlock");
const { collectionArrayPush, collectionArrayFilter } = require("./miscellaneous");

/**
 * @extends {Base}
 * @abstract
 */
class BaseConstruct extends Base {
    /**
     * @param {string} [name="unnamed construct"]
     */
    constructor(name = "unnamed construct") {
        super();

        /**
         * Human readable name for use in log messages and such
         * @type {string}
         */
        this.name = name;

        /**
         * Cached blocks mapped by their ids
         * @type {Collection<Snowflake, BaseBlock>}
         */
        this.cache = new Collection();

        /**
         * Module file paths mapped to arrays containing the ids of blocks originating from that module. If anonymous blocks were loaded, `null` is mapped to an array of their ids
         * @type {Collection<?string, [Snowflake]>}
         */
        this.idsByPath = new Collection();
    }

    /**
     * @param {BaseBlock} block
     * @param {?string} [filePath=null]
     * @param {?string} [trimmedPath=null]
     */
    load(block, filePath = null, trimmedPath = null) {
        // validation
        if (block instanceof BaseBlock === false) return;
        // file path
        block.filePath = filePath;
        // trimmed path
        block.trimmedPath = trimmedPath;
        // collections
        this.cache.set(block.id, block);
        collectionArrayPush(this.idsByPath, block.filePath, block.id);
    }

    /**
     * @param {BaseBlock} block
     */
    unload(block) {
        // validation
        if (block instanceof BaseBlock === false) return;
        // collections
        this.cache.delete(block.id);
        collectionArrayFilter(this.idsByPath, block.filePath, block.id);
    }
}

module.exports = BaseConstruct;
