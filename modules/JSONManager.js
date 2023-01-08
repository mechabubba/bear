const fs = require("fs");
const path = require("path");
const log = require("./log");
const { numeric } = require("./regexes");
const { get, set, setWith, has, unset, } = require("lodash");
const hasher = require("node-object-hash");
const { hash } = hasher();

/**
 * @typedef {Object} JSONManagerOptions
 * @property {boolean} force - Should we attempt to load the file by force? Defaults to false.
 * @property {Object} interval - Interval settings.
 * @property {boolean} interval.disable - Should we disable automatic file saving? Defaults to false - not recommended to enable.
 * @property {number} interval.duration - The value (in milliseconds) in which we save our object. Defaults to 2 minutes.
 * @property {boolean} interval.verbose - Displays logs whenever a save occurs. Defaults to false.
 * @property {boolean} manual - Manual mode; requires you to call `open()` explicitly. Defaults to false.
 * @property {boolean} safety - Disables loading a .json file if its already loaded. Defaults to true.
 * @property {boolean} verbose - Enable misc. console messaging? Defaults to false.
 */

/**
 * JSONManager is a simple class that helps us deal with reading from and writing to JSON files, with a small amount of configurable options.
 * This is done via some helpful functions in the lodash package.
 * This is a simple response to the overbearing and clunky nature of the lowdb module.
 */
class JSONManager {
    #ready;

    /**
     * Constructs our JSON manager.
     * @param {string} filepath - The file to load.
     * @param {JSONManagerOptions?} options - Specific manager options. Can be changed by changing the `objects` property of your .
     */
    constructor(filepath, options = {}) {
        this.filepath = filepath;
        this.options = options;
        this.options.force ??= false;
        this.options.interval ??= {};
        this.options.manual ??= false;
        this.options.safety ??= true;
        this.options.verbose ??= false;
        this.#ready = false;

        if(!this.filepath.endsWith(".json") && !this.options.force) {
            throw new Error(`Cannot load a non-JSON structured file; got ${this.filepath}.`);
        }

        if(!this.options.manual) {
            this.open();
        }
    }

    /**
     * Saves the JSON file.
     */
    save() {
        if(!this.ready) return;

        const _hash = hash(this.data);
        if(this._prevHash == _hash) {
            if(this.options.verbose) log.warn("Object has not changed since last save; not doing anything.");
            return;
        }
        this._prevHash = _hash;

        // Try writing to a temporary file first to avoid data loss.
        const temp_path = `${path.dirname(this.filepath)}/.${Date.now()}.${path.basename(this.filepath)}`;
        try {
            fs.writeFileSync(temp_path, JSON.stringify(this.data), { encoding: "utf8" });
        } catch(e) {
            log.error(e);
            return log.error("Couldn't save the file! Doing nothing.");
        }
        fs.writeFileSync(this.filepath, JSON.stringify(this.data), { encoding: "utf8" });
        fs.rmSync(temp_path);
    }

    /**
     * Resets (or kills) the interval in the event the user wants to change its duration or disable it.
     */
    _setInterval() {
        const i = this.options.interval; // small helper
        if(this.interval) {
            clearInterval(this.interval);
        }
        if(i.disable) return;

        i.duration ??= 300000; // 5 minute default.
        this.interval = setInterval(() => {
            if(this.options.verbose) log.warn(`Attempting to save file ${path.basename(this.filepath)}...`);
            this.save();
        }, i.duration);
    }

    open() {
        if(this.ready && this.options.safety) {
            if(this.options.verbose) log.warn("Attempting to reload the file while safetys are in place! Set `options.safety` to false to do this.");
            return;
        }

        try {
            fs.accessSync(this.filepath, fs.constants.F_OK);
        } catch(e) {
            log.warn(`File ${this.filepath} does not exist! Creating one now...`);
            
            fs.mkdirSync(path.dirname(this.filepath), { recursive: true });
            fs.appendFileSync(this.filepath, "{}");
        }

        const data = fs.readFileSync(this.filepath, { encoding: "utf8" });
        try {
            this.data = JSON.parse(data);
            this.#ready = true;
            log.info(`JSON file ${this.filepath} has been parsed!`);
        } catch(e) {
            log.error(e);
            throw new Error(`An error occured whilst parsing the JSON.`);
        }
        
        this._setInterval();
        this._prevHash = hash(this.data);

        // On exit, we exit gracefully and save our database once more.
        process.on("exit", () => this.close());
        // Note that some (all? not sure...) signals do not also call the `exit` event, so there may be some data loss if you are not careful. Please be mindful of this!
    }

    /**
     * Saves and closes the JSON file, disallowing any further editing.
     */
    close() {
        if(this.options.verbose) log.info(`Attempting to save file ${path.basename(this.filepath)}...`);
        
        this.options.interval.disable = true;
        this._setInterval();

        this.save();
        delete this.data;
        this.#ready = false;
    }

    /**
     * Returns if the JSON object is ready to be edited.
     */
    get ready() {
        return this.#ready;
    }

    /**
     * Gets the value of a property, if it exists.
     * @param {string|string[]} key 
     * @returns 
     */
    get(key) {
        if(!this.ready) return this.__warn();
        return get(this.data, key, undefined);
    }

    /**
     * Sets the value of a property.
     * @param {string|string[]} key 
     * @param {*} value 
     * @returns 
     */
    set(key, value) {
        if(!this.ready) return this.__warn();
        setWith(this.data, key, value, Object);
    }

    /**
     * Returns if the property exists in an object or not.
     * @param {string|string[]} key 
     * @returns 
     */
    has(key) {
        if(!this.ready) return this.__warn();
        return has(this.data, key);
    }

    /**
     * Removes a property from an object.
     * @param {string|string[]} key 
     * @returns 
     */
    delete(key) {
        if(!this.ready) return this.__warn();
        return unset(this.data, key);
    }

    get isEmpty() {
        return Object.entries(this.data).length == 0;
    }

    __warn() {
        log.warn("Attempted to access the object without it fully loaded! Doing nothing.");
    }
}

module.exports = JSONManager;

/**
 * @todo might want to do json-safe type checking (we are potentially hashing the object with data that cannot be serialized into json if it gets saved [functions, classes, etc...])
 */
