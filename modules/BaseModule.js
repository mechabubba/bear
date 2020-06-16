const { SnowflakeUtil, Util } = require("discord.js");

/**
 * @abstract
 */
class BaseModule {
  constructor() {
    /**
     * @type {Snowflake}
     */
    this.id = SnowflakeUtil.generate();

    /**
     * @type {?string}
     */
    this.filePath = null;
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

module.exports = BaseModule;
