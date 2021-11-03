const BaseConstruct = require("./BaseConstruct");
const Response = require("./Response");
const { disabledModules } = require("./defaultData");
const log = require("./log");
const { has, isString, isArray, isNil, cloneDeep } = require("lodash");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const fse = require("fs-extra");
const path = require("path");
const filehound = require("filehound");
const { drop } = require("lodash");

/**
 * Handler framework
 *
 * As is, you shouldn't instantiate this anywhere other than in the Client class's constructor, unless you're prepared to deal with overlapping lowdb databases. This will be fixed in future versions.
 */
class Handler {
    constructor() {
        /**
         * Absolute path used for the modules database
         * @type {string}
         * @readonly
         */
        this.dbPath = path.join(__dirname, "..", "data", "modules.json");

        /**
         * Absolute path to the presumed working directory
         * @type {string}
         * @readonly
         */
        this.workingDirectory = path.join(__dirname, "..");

        /**
         * The amount of subfolders to trim from the beginning of paths
         * @type {string}
         * @readonly
         */
        this.folderLevels = this.workingDirectory.split(path.sep).length;

        // Determine whether the modules database exists prior to using low()
        const generating = !fse.pathExistsSync(this.dbPath);

        /**
         * Modules database via lowdb
         */
        this.modules = low(new FileSync(this.dbPath));

        // Handle modules that were configured to be disabled by default
        // All modules not present in the modules database are implicitly enabled (and will be added upon load)
        if (generating) {
            for (const trimmedPath of disabledModules) {
                const resolvedPath = Handler.resolvePath(path.join(this.workingDirectory, trimmedPath));
                if (!resolvedPath.success) continue;
                // Putting the path in an array prevents periods from being interpreted as traversing the db
                if (!this.modules.has([trimmedPath]).value()) this.modules.set([trimmedPath], false).write();
            }
            log.info("A database of enabled modules has been generated at ./data/modules.json");
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
                obj.code = error.code;
                obj.message = `Path "${filePath}" couldn't be resolved, module not found`;
                log.warn("[resolvePath]", obj.message, error);
            } else {
                obj.message = "Error while resolving file path";
                log.error("[resolvePath]", error);
            }
        }
        if (has(obj, "value") && isString(obj.value)) {
            obj.success = true;
            obj.message = "Path successfully resolved";
        } else if (!has(obj, "error")) {
            obj.success = false;
            obj.message = "Something went wrong while resolving path, but didn't result in an error";
        }
        return new Response(obj);
    }

    /**
     * @param {string} filePath
     */
    trimPath(filePath) {
        if (!filePath) return "";
        const splitPath = filePath.split(path.sep);
        if (!filePath.startsWith(this.workingDirectory)) return splitPath.join(path.posix.sep);
        return drop(splitPath, this.folderLevels).join(path.posix.sep);
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
            const resolvedPath = Handler.resolvePath(filePath);
            if (resolvedPath.success && !resolvedPath.error) {
                target = resolvedPath.value;
                if (has(require.cache, target)) {
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
        const obj = {
            success: true,
            value: filePath,
        };
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
        const resolvedPaths = [];
        for (const filePath of filePaths) {
            const result = this.unloadModule(construct, filePath);
            if (result.success && !result.error) ++successes;
            if (result.value) resolvedPaths.push(result.value);
        }
        return new Response({
            message: `Unloaded ${successes}/${filePaths.length} modules${directoryPath ? ` in "${directoryPath}"` : ""}`,
            success: true,
            value: resolvedPaths,
        });
    }

    /**
     * @param {BaseConstruct} construct
     * @param {BaseBlock|[BaseBlock]} mod
     * @param {?string} [filePath=null]
     * @param {?string} [trimmedPath=null]
     */
    loadModule(construct, mod, filePath = null, trimmedPath = null) {
        if (!construct || !mod) return new Response({ message: "Required parameters weren't supplied", success: false });
        if (construct instanceof BaseConstruct === false) return new Response({ message: "Construct provided wasn't a construct", success: false });
        if (isArray(mod)) {
            for (const block of mod) {
                construct.load(block, filePath, trimmedPath);
            }
            return new Response({
                message: `Loaded ${mod.length} ${mod.length === 1 ? "block" : "blocks"} from ${!filePath ? "code anonymously" : filePath}`,
                success: true,
                value: filePath,
            });
        } else {
            construct.load(mod, filePath, trimmedPath);
            return new Response({
                message: `Loaded 1 block from ${!filePath ? "code anonymously" : `"${filePath}"`}`,
                success: true,
                value: filePath,
            });
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
        const resolvedPath = Handler.resolvePath(filePath);
        if (!resolvedPath.success || resolvedPath.error) return resolvedPath;
        const trimmedPath = this.trimPath(resolvedPath.value);
        // Putting the path in an array prevents periods from being interpreted as traversing the db
        if (!this.modules.has([trimmedPath]).value()) {
            this.modules.set([trimmedPath], true).write();
        } else if (respectDisabled && !this.modules.get([trimmedPath]).value()) {
            log.debug(`Skipping disabled module "${resolvedPath.value}"`);
            return new Response({ message: `Module "${resolvedPath.value}" was disabled`, success: true });
        }
        let mod;
        try {
            mod = require(resolvedPath.value);
        } catch (error) {
            log.error("[requireModule]", error);
            return new Response({ message: "Error while requiring module", success: false, error: error });
        }
        if (isNil(mod)) return new Response({ message: `Something went wrong while requiring module "${resolvedPath.value}" but didn't result in an error`, success: false });
        // The use of cloneDeep prevents the require.cache from being affected by changes to the module
        return this.loadModule(construct, cloneDeep(mod), resolvedPath.value, trimmedPath);
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
        const resolvedPaths = [];
        for (const filePath of filePaths) {
            const result = this.requireModule(construct, filePath, respectDisabled);
            if (result.success && !result.error) {
                if (!result.value) {
                    ++disabled;
                } else {
                    ++successes;
                    resolvedPaths.push(result.value);
                }
            }
        }
        return new Response({
            message: `Loaded ${successes}/${filePaths.length - disabled} modules${disabled ? ` (${disabled} disabled)` : ""}${directoryPath ? ` in "${directoryPath}"` : ""}`,
            success: true,
            value: resolvedPaths,
        });
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
        if (isNil(filePaths)) return new Response({ message: "Something went wrong while searching directory but didn't result in an error", success: false });
        if (!filePaths.length) return new Response({ message: `No files found in "${directoryPath}", skipping`, success: true, value: null });
        return new Response({
            message: `Found ${filePaths.length} ${!filePaths.length ? "file" : "files"} under "${directoryPath}"`,
            success: true,
            value: filePaths.map(filePath => path.join("..", filePath)),
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
