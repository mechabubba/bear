/**
 * This module serves the same purpose as logging.js, but for every custom event implemented in sandplate
 */
const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const chalk = require("chalk");

module.exports = [
  // Guild Access Control (from modules/GuildManager.js)
  new ListenerBlock({ event: "blockedGuild" }, (client, guild) => log.debug(`${chalk.gray("[blockedGuild]")} ${client.user.tag} automatically left ${guild.name} (${guild.id})`)),
  new ListenerBlock({ event: "unknownGuild" }, (client, guild) => log.debug(`${chalk.gray("[unknownGuild]")} ${client.user.tag} automatically left ${guild.name} (${guild.id})`)),
  // Commands (from modules/CommandConstruct.js)
  new ListenerBlock({ event: "commandUsed" }, (client, command, message, content, args, ...extraParameters) => log.debug(`${chalk.gray("[command]")} ${message.author.tag} ran "${command.firstName}${(!content ? "\"" : `" with "${content}"`)}`)),
  new ListenerBlock({ event: "channelTypeRejection" }, (client, command, message) => log.debug(`${chalk.gray("[command]")} ${message.author.tag} attempted to run "${command.firstName}" somewhere it cannot be used (${message.channel.type})`)),
  new ListenerBlock({ event: "nsfwRejection" }, (client, command, message) => log.debug(`${chalk.gray("[command]")} ${message.author.tag} attempted to run "${command.firstName}" in a non-nsfw channel`)),
  new ListenerBlock({ event: "lockedRejection" }, (client, command, message) => log.debug(`${chalk.gray("[command]")} ${message.author.tag} attempted to run "${command.firstName}" and was denied`)),
  new ListenerBlock({ event: "permissionRejection" }, (client, command, message, permissions, useClient, useChannel) => {
    const member = useClient ? message.guild.me : message.member;
    log.debug(`${chalk.gray("[command]")} ${member.user.tag} lacked permissions necessary to run "${command.firstName}"${(useClient ? ` for ${message.author.tag}` : "")}${useChannel ? ` in <#${message.channel.id}>` : ""}`);
  }),
];
