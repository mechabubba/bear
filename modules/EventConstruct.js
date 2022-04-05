const { Collection } = require("discord.js");
const BaseConstruct = require("./BaseConstruct");
const ListenerBlock = require("./ListenerBlock");
const { collectionArrayPush, collectionArrayFilter } = require("./miscellaneous");

/**
 * Event framework
 * @extends {BaseConstruct}
 */
class EventConstruct extends BaseConstruct {
    /**
     * @param {EventEmitter} emitter
     * @param {string} [name]
     */
    constructor(emitter, name) {
        super(name);

        /**
         * Reference to the EventEmitter this EventConstruct is for
         * @name EventConstruct#emitter
         * @type {EventEmitter}
         * @readonly
         */
        Object.defineProperty(this, "emitter", { value: emitter });

        /**
         * Cached ListenerBlocks mapped by their ids
         * @type {Collection<Snowflake, ListenerBlock>}
         * @name EventConstruct#cache
         */

        /**
         * Module file paths mapped to arrays containing the ids of ListenerBlocks originating from that module. If anonymous ListenerBlocks were loaded, `null` is mapped to an array of their ids
         * @type {Collection<?string, [Snowflake]>}
         * @name EventConstruct#idsByPath
         */

        /**
         * Event names mapped to arrays of ids for ListenerBlocks that target those events
         * @type {Collection<string, [Snowflake]>}
         */
        this.idsByEvent = new Collection();

        /**
         * Event names mapped to arrays of file paths for modules that add listeners for those events
         * @type {Collection<string, [string]>}
         */
        this.pathsByEvent = new Collection();
    }

    /**
     * @param {ListenerBlock} block
     * @param {?string} [filePath]
     * @param {?string} [trimmedPath]
     */
    load(block, filePath = null, trimmedPath = null) {
        // validation
        if (block instanceof ListenerBlock === false) return;
        // parent
        super.load(block, filePath, trimmedPath);
        // bind correct this value & prefix the emitter as the first parameter
        block.run = block.run.bind(block, this.emitter);
        // .once() or .on()
        if (block.once) {
            this.emitter.once(block.event, block.run);
        } else {
            this.emitter.on(block.event, block.run);
        }
        // collections
        collectionArrayPush(this.idsByEvent, block.event, block.id);
        collectionArrayPush(this.pathsByEvent, block.event, block.filePath);
    }

    /**
     * @param {ListenerBlock} block
     */
    unload(block) {
        // validation
        if (block instanceof ListenerBlock === false) return;
        // parent
        super.unload(block);
        // remove listener
        if (this.emitter.listeners(block.event).includes(block.run)) {
            this.emitter.removeListener(block.event, block.run);
        }
        // collections
        collectionArrayFilter(this.pathsByEvent, block.event, block.filePath);
        collectionArrayFilter(this.idsByEvent, block.event, block.id);
    }
}

module.exports = EventConstruct;
