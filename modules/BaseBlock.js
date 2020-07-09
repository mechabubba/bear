const Base = require("./Base");

/**
 * @extends {Base}
 * @abstract
 */
class BaseBlock extends Base {
  constructor() {
    super();

    /**
     * @type {?string}
     */
    this.filePath = null;
  }
}

module.exports = BaseBlock;
