const chalk = require("chalk");
const moment = require("moment");

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

// Functions
const timestamp = () => chalk.gray(moment().format("hh:mm:ss a"));
const prefix = (id) => `${timestamp()} ${styles[id](labels[id])}`;

// Exported methods
module.exports = console.log.bind(null, timestamp());
module.exports.trace = console.log.bind(null, prefix(5));
module.exports.debug = console.log.bind(null, prefix(4));
module.exports.info = console.log.bind(null, prefix(3));
module.exports.warn = console.log.bind(null, prefix(2));
module.exports.error = console.error.bind(null, prefix(1));
module.exports.fatal = console.error.bind(null, prefix(0));
