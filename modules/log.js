/**
 * Modified logging module from sandplate. [Original source code](https://github.com/06000208/sandplate/blob/main/modules/log.js)
 * @module logger
 * @example
 * const log = require("./util/logger");
 */
const chalk = require("chalk");
const { DateTime } = require("luxon");
const color = {
    "fatal": chalk.bgRed.black,
    "error": chalk.red,
    " warn": chalk.yellow,
    " info": chalk.white.bold,
    " http": chalk.blue,
    "debug": chalk.green,
    "trace": chalk.gray,
};
const errors = ["fatal", "error"];
const timestamp = "HH:mm:ss.SSS";

/**
 * Logger's timestamp format
 * @readonly
 * @todo If it was possible to store this in `.env` that would be nice
 */
module.exports.timestamp = timestamp;

/**
 * Internal function used for logging
 * @param {*} level
 * @param  {...any} args
 * @private
 */
const print = function(level, ...args) {
    const prefix = `${chalk.gray(DateTime.now().toFormat(timestamp))} ${color[level](level)}`;
    return errors.includes(level) ? console.error(prefix, ...args) : console.log(prefix, ...args);
};

/**
 * Default exported logging function
 *
 * Using `log()` by itself is an alias to `log.info()`
 * @param  {...any} args
 * @function log
 * @example
 * log("example")
 * log.fatal("example");
 * log.error("example");
 * log.warn("example");
 * log.info("example");
 * log.debug("example");
 * log.trace("example");
 */
module.exports = (...args) => print(" info", ...args);
module.exports.fatal = (...args) => print("fatal", ...args);
module.exports.error = (...args) => print("error", ...args);
module.exports.warn = (...args) => print(" warn", ...args);
module.exports.info = (...args) => print(" info", ...args);
module.exports.debug = (...args) => print("debug", ...args);
module.exports.trace = (...args) => print("trace", ...args);
