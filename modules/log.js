/**
 * Modified logging module from sandplate. [Original source code](https://github.com/06000208/sandplate/blob/main/modules/log.js)
 * @module logger
 * @example
 * const log = require("./util/logger");
 */
const chalk = require("chalk");

// Label names
const labels = {
    0: "fatal",
    1: "error",
    2: " warn",
    3: " info",
    4: "debug",
    5: "trace",
};

// Label styles
const styles = {
    0: chalk.bgRed.black,
    1: chalk.red,
    2: chalk.yellow,
    3: chalk.white.bold,
    4: chalk.green,
    5: chalk.gray,
};

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
    const prefix = `${chalk.gray(moment().format("HH:mm:ss.SSS"))} ${styles[level](labels[level])}`;
    return level > 1 ? console.log(prefix, ...args) : console.error(prefix, ...args);
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
