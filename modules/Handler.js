/* eslint-disable no-unused-vars */
const log = require("./log.js");
const _ = require("lodash");
const filehound = require("filehound");
const fse = require("fs-extra");
const slash = require("slash");
const path = require("path");

/**
 * Handler framework
 */
class Handler {
  constructor() {
    throw new Error(`The ${this.constructor.name} class cannot be instantiated.`);
  }

  /**
   * @param {BaseConstruct} construct
   * @param {?string} [filePath=null]
   */
  static unloadModule(construct, filePath = null) {
    if (!construct.idsByPath.has(filePath)) return;
    const ids = construct.idsByPath.get(filePath);
    for (const id of ids) {
      if (!construct.cache.has(id)) continue;
      construct.unload(construct.cache.get(id));
    }
    if (filePath) {
      delete require.cache[require.resolve(filePath)];
    }
  }

  /**
   * @param {BaseConstruct} construct
   * @param {(Array|*)} mod - Short for module
   * @param {?string} [filePath=null]
   */
  static loadModule(construct, mod, filePath = null) {
    if (_.isArray(mod)) {
      for (const element of mod) {
        construct.load(element, filePath);
      }
    } else {
      construct.load(mod, filePath);
    }
  }

  /**
   * @param {BaseConstruct} construct
   * @param {string} filePath
   * @todo There's a notable discrepancy between fse and require with paths that use ../ or ./
   */
  static requireModule(construct, filePath) {
    if (fse.pathExistsSync(filePath) !== true) return log.debug(`File ${filePath} not found`);
    const mod = require(filePath);
    Handler.loadModule(construct, mod, filePath);
  }

  /**
   * @param {BaseConstruct} construct
   * @param {string} directoryPath - Path to a directory
   */
  static async setup(construct, directoryPath) {
    const files = await filehound.create().paths(directoryPath).ext(".js").find();
    if (!files.length) return log.debug(`Nothing to load under ${directoryPath}, skipping`);
    for (const filePath of files) {
      Handler.requireModule(construct, slash(path.join(__dirname, "../", filePath)));
    }
    // Loaded ${successes}/${files.length} modules under ${directoryPath}
  }
}

module.exports = Handler;
