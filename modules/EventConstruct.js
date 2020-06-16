/* eslint-disable no-unused-vars */
const { Collection } = require("discord.js");
const BaseConstruct = require("./BaseConstruct");
const ListenerModule = require("./ListenerModule");
const { collectionArrayPush, collectionArrayFilter } = require("./miscellaneous");
const log = require("./log");

/**
 * Event framework
 * @extends {BaseConstruct}
 */
class EventConstruct extends BaseConstruct {
  /**
   * @param {EventEmitter} emitter
   */
  constructor(emitter) {
    super();

    /**
     * Reference to the EventEmitter this EventConstruct is for
     * @type {EventEmitter}
     * @readonly
     */
    Object.defineProperty(this, "emitter", { value: emitter });

    /**
     * Cached ListenerModules mapped by their ids
     * @type {Collection<Snowflake, ListenerModule>}
     */
    this.cache = new Collection();

    /**
     * Event names mapped to arrays of file paths for modules that add listeners for those events
     * @type {Collection<string, string[]>}
     */
    this.pathsByEvent = new Collection();

    /**
     * Event names mapped to arrays of ids for ListenerModules that target those events
     * @type {Collection<string, Snowflake[]>}
     */
    this.idsByEvent = new Collection();

    /**
     * Module file paths mapped to arrays of ListenerModule ids originating from that module. If anonymous ListenerModules have been loaded `null` is mapped to an array of their ids.
     * @type {Collection<?string, Snowflake[]>}
     */
    this.idsByPath = new Collection();
  }

  /**
   * @param {ListenerModule} mod
   * @param {?string} [filePath=null]
   */
  load(mod, filePath = null) {
    // validation
    if (mod instanceof ListenerModule === false) return;
    // file path
    mod.filePath = filePath;
    // bind correct this value & prefix the emitter as the first parameter
    mod.run = mod.run.bind(mod, this.emitter);
    // .once() or .on()
    if (mod.once) {
      this.emitter.once(mod.event, mod.run);
    } else {
      this.emitter.on(mod.event, mod.run);
    }
    // collection data
    this.cache.set(mod.id, mod);
    collectionArrayPush(this.pathsByEvent, mod.event, mod.filePath);
    collectionArrayPush(this.idsByEvent, mod.event, mod.id);
    collectionArrayPush(this.idsByPath, mod.filePath, mod.id);
    // log
    log.trace("Loaded a listener module", mod);
  }

  /**
   * @param {ListenerModule} mod
   */
  unload(mod) {
    // validation
    if (mod instanceof ListenerModule === false) return;
    // remove listener
    if (this.emitter.listeners(mod.event).includes(mod.run)) {
      this.emitter.removeListener(mod.event, mod.run);
    }
    // collections
    this.cache.delete(mod.id);
    collectionArrayFilter(this.pathsByEvent, mod.event, mod.filePath);
    collectionArrayFilter(this.idsByEvent, mod.event, mod.id);
    collectionArrayFilter(this.idsByPath, mod.filePath, mod.id);
    // log
    log.trace("Unloaded a listener module", mod);
  }
}

module.exports = EventConstruct;
