/* eslint-disable no-unused-vars */
const BaseModule = require("./BaseModule");
const _ = require("lodash");

/**
 * @typedef {Object} ListenerData
 * @property {string} event
 * @property {?boolean} [once=false]
 */

/**
 * Callback function called when an event is emitted, as described here: https://nodejs.org/dist/latest/docs/api/events.html#events_event
 * @callback listener
 * @param {EventEmitter} emitter - Bound as first parameter by EventConstruct.load()
 * @param {...*} - Provided by the event being emitted
 * @this ListenerModule
 * @todo Should the bound parameter be included?
 */

/**
 * @extends {BaseModule}
 */
class ListenerModule extends BaseModule {
  /**
   * @param {ListenerData} data
   * @param {listener} run
   */
  constructor(data = {}, run) {
    super();
    ListenerModule.validateParameters(data, run);

    /**
     * The name of the event this listener is for
     * @type {string}
     */
    this.event = data.event;

    /**
     * Whether the listener should only trigger once (whether .on() or .once() is used)
     * @type {boolean}
     */
    this.once = Boolean(data.once);

    /**
     * Callback function called when ListenerModule.event is emitted
     * @type {listener}
     */
    this.run = run;
    // Note that bind() isn't used here in favor of doing it in EventConstruct.load() instead so it can also bind the emitter
  }

  unload() {
    return;
  }

  /**
   * @param {ListenerData} data
   * @param {listener} run
   * @private
   */
  static validateParameters(data, run) {
    if (!_.isPlainObject(data)) throw new TypeError("Listener data parameter must be an Object.");
    if (!_.isFunction(run)) throw new TypeError("Listener run parameter must be a function.");
    if (!_.isString(data.event)) throw new TypeError("Listener data.event must be a string.");
    if (_.has(data, "once") && !_.isNil(data.once)) if (!_.isBoolean(data.once)) throw new TypeError("Listener data.once name must be a boolean if included.");
  }

}

module.exports = ListenerModule;
