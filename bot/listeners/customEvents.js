/**
 * This module serves the same purpose as logging.js, but for every custom event implemented in sandplate.
 */
const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const chalk = require("chalk");

module.exports = [
  // new ListenerBlock({ event: "" }, (client) => log.trace("")),
];
