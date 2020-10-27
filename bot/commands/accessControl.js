const CommandBlock = require("../../modules/CommandBlock");
const { isNumeric } = require("../../modules/miscellaneous");
const log = require("../../modules/log");
const { startCase } = require("lodash");
const { inspect } = require("util");

// There isn't a command for controlling users.allowed and guilds.allowed due to the potential for mishaps and misuse.
// You wouldn't want to prevent all command use or cause the bot to leave all of it's guilds by accident, right?
// If you want to make use of them, do it manually.

const types = {
  user: ["u", "user", "users", "account", "accounts"],
  guild: ["g", "guild", "guilds", "s", "server", "servers"],
};

const determineType = function(input) {
  const type = input.toLowerCase();
  if (types.user.includes(type)) {
    return {
      path: "users.blocked",
      type: "user",
    };
  } else if (types.guild.includes(type)) {
    return {
      path: "guilds.blocked",
      type: "guild",
    };
  } else {
    return null;
  }
};

module.exports = [
  new CommandBlock({
    identity: ["block", "deny"],
    summary: "Deny access to the bot",
    description: "Prohibits a user or guild from interacting with the bot.",
    usage: "user/guild <id>",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, [type, id, ...args]) {
    if (!content) return message.channel.send(`Usage: \`${this.firstName} ${this.usage}\``);
    const group = determineType(type);
    if (!group) return message.channel.send(`Unrecognized type\nUsage: \`${this.firstName} ${this.usage}\``);
    if (!isNumeric(id)) return message.channel.send(`An id is required\nUsage: \`${this.firstName} ${this.usage}\``);
    if (client.storage.get(group.path).value() === null) {
      client.storage.set(group.path, []).write();
    } else if (client.storage.get(group.path).includes(id).value()) {
      return message.channel.send(`${startCase(group.type)} \`${id}\` is already blocked`);
    }
    client.storage.get(group.path).push(id).write();
    log.info(`${message.author.tag} blocked ${group.type} "${id}" from accessing ${client.user.tag}`);
    return message.channel.send(`Blocked ${group.type} \`${id}\``);
  }),
  new CommandBlock({
    identity: ["unblock", "allow"],
    summary: "Restore access to the bot",
    description: "Restore a user or guild's access to the bot.",
    usage: "user/guild <id>",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, [type, id, ...args]) {
    if (!content) return message.channel.send(`Usage: \`${this.firstName} ${this.usage}\``);
    const group = determineType(type);
    if (!group) return message.channel.send(`Unrecognized type\nUsage: \`${this.firstName} ${this.usage}\``);
    if (!isNumeric(id)) return message.channel.send(`An id is required\nUsage: \`${this.firstName} ${this.usage}\``);
    if (client.storage.get(group.path).value() === null || !client.storage.get(group.path).includes(id).value()) {
      return message.channel.send(`${startCase(group.type)} \`${id}\` isn't blocked`);
    }
    client.storage.get(group.path).pull(id).write();
    log.info(`${message.author.tag} unblocked ${group.type} "${id}"`);
    if (!client.storage.get(group.path).value().length) {
      client.storage.set(group.path, null).write();
    }
    return message.channel.send(`Unblocked ${group.type} \`${id}\``);
  }),
  new CommandBlock({
    identity: ["group", "usergroup", "usergroups"],
    summary: "Modify user groups",
    description: "Create user groups and toggle ids in/out of them.",
    usage: "<group> [id]",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    if (!content) return message.channel.send(`Usage: \`${this.firstName} ${this.usage}\``);
    const name = args[0].toLowerCase();
    if (name === "allowed") return message.channel.send("Interacting with that group is forbidden");
    const group = ["users", name]; // not using an object like the block/unblock commands because this only interacts with user groups
    let reply = "";
    const id = args.length > 1 ? args[1] : null;
    if (!client.storage.has(group).value()) {
      // group does not exist
      client.storage.set(group, null).write();
      reply = `Created group \`${name}\``;
    } else if (!id) {
      // if group does exist & no id
      const array = client.storage.get(group).value();
      if (!array || !array.length) {
        reply = `The group \`${name}\` is empty`;
      } else {
        reply = `The group \`${name}\` has ${array.length} ${array.length === 1 ? "user" : "users"}:\n\`${inspect(array)}\``;
      }
    }
    // regardless of the above, if there's no id, we're done
    if (!id) return message.channel.send(reply);
    if (!isNumeric(id)) {
      reply += `\nThe id \`${id}\` was invalid`;
      return message.channel.send(reply);
    }
    // if the group is disabled, prepare it
    if (client.storage.get(group).value() === null) {
      client.storage.set(group, []).write();
    } else if (client.storage.get(group).includes(id).value()) {
      // only need to check if the group already has the id & if we need to disable if it's not disabled
      client.storage.get(group).pull(id).write();
      reply += `\nRemoved id \`${id}\` from group \`${name}\``;
      if (!client.storage.get(group).value().length) client.storage.set(group, null).write();
      return message.channel.send(reply);
    }
    // if this code is reached it's safe to assume we have an id, the group is ready, and the id doesn't already exist in the group
    client.storage.get(group).push(id).write();
    reply += `\nAdded id \`${id}\` to group \`${name}\``;
    return message.channel.send(reply);
  }),
];
