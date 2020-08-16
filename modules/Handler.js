/* eslint-disable no-unused-vars */
const BaseConstruct = require("./BaseConstruct");
const Response = require("./Response");
const { disabledModules } = require("./defaultData");
const log = require("./log");
const _ = require("lodash");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const fse = require("fs-extra");
const path = require("path");
const modulesFile = path.join(__dirname, "../data/modules.json");
const filehound = require("filehound");

/**
 * Handler framework
 */
class Handler {
  /**
   * @param {Client} client
   */
  constructor(client) {
    /**
     * Reference to the Client this Handler is for
     * @type {Client}
     * @name Handler#client
     * @readonly
     */
    Object.defineProperty(this, "client", { value: client });

    // Cache whether modules.json exists prior to using low()
    const generating = !fse.pathExistsSync(modulesFile);

    /**
     * Modules database via lowdb
     */
    this.modules = low(new FileSync(modulesFile));

    // Handle modules configured to be disabled by default
    if (generating) {
      const modules = {};
      // If a module hasn't been explicitly disabled, it is implicitly enabled
      for (const module of disabledModules) {
        const resolvedPath = Handler.resolvePath(module);
        if (!resolvedPath.success) continue;
        modules[resolvedPath] = false;
      }
      this.modules.defaultsDeep(modules).write();
      log.info("A modules.json file has been generated in ./data/");
    }
  }

  /**
   * @param {string} filePath
   */
  static resolvePath(filePath) {
    if (!filePath) return new Response({ message: "Required parameters weren't supplied", success: false });
    const obj = {};
    try {
      obj.value = require.resolve(filePath);
    } catch (error) {
      obj.error = error;
      obj.success = false;
      if (error.code === "MODULE_NOT_FOUND") {
        obj.message = `Path "${filePath}" couldn't be resolved, module not found`;
        log.warn("[resolvePath]", obj.message, error);
      } else {
        obj.message = "Error while resolving file path";
        log.error("[resolvePath]", error);
      }
    }
    if (_.has(obj, "value") && _.isString(obj.value)) {
      obj.success = true;
      obj.message = "Path successfully resolved";
    } else if (!_.has(obj, "error")) {
      obj.success = false;
      obj.message = "Something went wrong while resolving path, but didn't result in an error";
    }
    return new Response(obj);
  }

  /**
   * @param {BaseConstruct} construct
   * @param {?string} [filePath=null]
   */
  unloadModule(construct, filePath = null) {
    if (!construct) return new Response({ message: "Required parameters weren't supplied", success: false });
    if (construct instanceof BaseConstruct === false) return new Response({ message: "Construct provided wasn't a construct", success: false });
    let target = null, cache = false, blocks = false, ids = [];
    if (filePath) {
      const resolvedPath = this.resolvePath(filePath);
      if (resolvedPath.success && !resolvedPath.error) {
        target = resolvedPath.value;
        if (_.has(require.cache, target)) {
          delete require.cache[target];
          cache = true;
        }
      } else {
        return resolvedPath;
      }
    }
    if (construct.idsByPath.has(target)) {
      ids = construct.idsByPath.get(target);
      for (const id of ids) {
        if (!construct.cache.has(id)) continue;
        construct.unload(construct.cache.get(id));
      }
      blocks = true;
    }
    const obj = { success: true };
    if (blocks || cache) {
      obj.message = `Unloaded ${cache ? `"${target}" from the cache` : ""}${cache && blocks ? " and " : ""}${blocks ? (target ? `${ids.length} ${ids.length === 1 ? "block" : "blocks"} mapped to that path` : "all anonymous blocks") : ""} from the ${construct.name}`;
    } else {
      obj.message = `Didn't unload anything as "${target}" wasn't cached nor mapped to any blocks`;
    }
    return new Response(obj);
  }

  /**
   * @param {BaseConstruct} construct
   * @param {[string]} filePaths
   * @param {?string} [directoryPath=null]
   */
  unloadMultipleModules(construct, filePaths, directoryPath = null) {
    if (!construct || !filePaths) return new Response({ message: "Required parameters weren't supplied", success: false });
    if (!filePaths.length) return new Response({ message: `Unloaded 0/0 modules (No modules to unload, skipped)`, success: true });
    let successes = 0;
    for (const filePath of filePaths) {
      const result = this.unloadModule(construct, filePath);
      if (result.success && !result.error) ++successes;
    }
    return new Response({ message: `Unloaded ${successes}/${filePaths.length} modules${directoryPath ? ` in "${directoryPath}"` : ""}`, success: true });
  }

  /**
   * @param {BaseConstruct} construct
   * @param {(*|[*])} mod
   * @param {?string} [filePath=null]
   */
  loadModule(construct, mod, filePath = null) {
    if (!construct || !mod) return new Response({ message: "Required parameters weren't supplied", success: false });
    if (construct instanceof BaseConstruct === false) return new Response({ message: "Construct provided wasn't a construct", success: false });
    if (_.isArray(mod)) {
      for (const block of mod) {
        construct.load(block, filePath);
      }
      return new Response({ message: `Loaded ${mod.length} ${mod.length === 1 ? "block" : "blocks"} from ${!filePath ? "code anonymously" : filePath}`, success: true });
    } else {
      construct.load(mod, filePath);
      return new Response({ message: `Loaded 1 block from ${!filePath ? "code anonymously" : `"${filePath}"`}`, success: true });
    }
  }

  /**
   * @param {BaseConstruct} construct
   * @param {string} filePath
   * @param {boolean} [respectDisabled=false]
   */
  requireModule(construct, filePath, respectDisabled = false) {
    if (!construct || !filePath) return new Response({ message: "Required parameters weren't supplied", success: false });
    if (construct instanceof BaseConstruct === false) return new Response({ message: "Construct provided wasn't a construct", success: false });
    const resolvedPath = this.resolvePath(filePath);
    if (!resolvedPath.success || resolvedPath.error) return resolvedPath;
    if (!this.modules.has(resolvedPath.value).value()) {
      this.modules.set(resolvedPath.value, true).write();
    } else if (respectDisabled && !this.modules.get(resolvedPath.value).value()) {
      return new Response({
        message: `Module "${resolvedPath.value}" was disabled`,
        success: false,
        code: "disabled",
      });
    }
    let mod;
    try {
      mod = require(resolvedPath.value);
    } catch (error) {
      log.error("[requireModule]", error);
      return new Response({ message: "Error while requiring module", success: false, error: error });
    }
    if (_.isNil(mod)) return new Response({ message: `Something went wrong while requiring module "${resolvedPath.value}" but didn't result in an error`, success: false });
    return this.loadModule(construct, mod, resolvedPath.value);
  }

  /**
   * @param {BaseConstruct} construct
   * @param {[string]} filePaths
   * @param {boolean} [respectDisabled=false]
   * @param {?string} [directoryPath=null]
   */
  requireMultipleModules(construct, filePaths, respectDisabled = false, directoryPath = null) {
    if (!construct || !filePaths) return new Response({ message: "Required parameters weren't supplied", success: false });
    if (!filePaths.length) return new Response({ message: `Loaded 0/0 modules (No modules to require, skipped)`, success: true });
    let successes = 0, disabled = 0;
    for (const filePath of filePaths) {
      const result = this.requireModule(construct, filePath, respectDisabled);
      if (result.success && !result.error) ++successes;
      if (respectDisabled && result.code && result.code === "disabled") ++disabled;
    }
    return new Response({ message: `Loaded ${successes}/${filePaths.length - disabled} modules${disabled ? ` (${disabled} disabled)` : ""}${directoryPath ? ` in "${directoryPath}"` : ""}`, success: true });
  }

  /**
   * @param {string} directoryPath
   */
  static async searchDirectory(directoryPath) {
    if (!directoryPath) return new Response({ message: "Required parameters weren't supplied", success: false });
    const filePaths = await filehound.create().paths(directoryPath).ext(".js").find().catch(error => {
      log.error(error);
      return new Response({ message: "Error while attempting to search directory", success: false, error: error });
    });
    if (_.isNil(filePaths)) return new Response({ message: "Something went wrong while searching directory but didn't result in an error", success: false });
    if (!filePaths.length) return new Response({ message: `No files found in "${directoryPath}", skipping`, success: true, value: null });
    return new Response({
      message: `Found ${filePaths.length} ${!filePaths.length ? "file" : "files"} under "${directoryPath}"`,
      success: true,
      value: filePaths.map(filePath => path.join("../", filePath)),
    });
  }

  /**
   * @param {BaseConstruct} construct
   * @param {string} directoryPath
   * @param {boolean} [respectDisabled=false]
   */
  async requireDirectory(construct, directoryPath, respectDisabled = false) {
    if (!construct || !directoryPath) return new Response({ message: "Required parameters weren't supplied", success: false });
    if (construct instanceof BaseConstruct === false) return new Response({ message: "Construct provided wasn't a construct", success: false });
    const result = await Handler.searchDirectory(directoryPath);
    if (!result.value || !result.success) return result;
    return this.requireMultipleModules(construct, result.value, respectDisabled, directoryPath);
  }

  /**
   * @param {BaseConstruct} construct
   * @param {string} directoryPath
   */
  async unloadDirectory(construct, directoryPath) {
    if (!construct || !directoryPath) return new Response({ message: "Required parameters weren't supplied", success: false });
    if (construct instanceof BaseConstruct === false) return new Response({ message: "Construct provided wasn't a construct", success: false });
    const result = await Handler.searchDirectory(directoryPath);
    if (!result.value || !result.success) return result;
    return this.unloadMultipleModules(construct, result.value, directoryPath);
  }
}

module.exports = Handler;
