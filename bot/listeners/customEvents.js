/**
 * This module serves the same purpose as logging.js, but for every custom event implemented in sandplate
 */
const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const chalk = require("chalk");

module.exports = [
  // Guild Access Control
  new ListenerBlock({ event: "blockedGuild" }, (client, guild) => log.debug(`${chalk.gray("[blockedGuild]")} ${client.user.tag} automatically left ${guild.name} (${guild.id})`)),
  new ListenerBlock({ event: "unknownGuild" }, (client, guild) => log.debug(`${chalk.gray("[unknownGuild]")} ${client.user.tag} automatically left ${guild.name} (${guild.id})`)),
];
