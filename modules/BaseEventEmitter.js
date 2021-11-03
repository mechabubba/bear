const EventEmitter = require("events");
const { SnowflakeUtil, Util } = require("discord.js");

/**
 * @abstract
 */
class BaseEventEmitter extends EventEmitter {
    constructor(...args) {
        super(...args);

        /**
         * @type {Snowflake}
         */
        this.id = SnowflakeUtil.generate();
    }

    /**
     * The date this was initialized at
     * @type {Date}
     */
    get initializedAt() {
        return new Date(SnowflakeUtil.deconstruct(this.id).timestamp);
    }

    toJSON(...props) {
        return Util.flatten(this, ...props);
    }

    valueOf() {
        return this.id;
    }

    toString() {
        return this.id;
    }
}

module.exports = BaseEventEmitter;
