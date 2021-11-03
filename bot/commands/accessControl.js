const CommandBlock = require("../../modules/CommandBlock");
const { numeric } = require("../../modules/regexes");
const log = require("../../modules/log");
const { startCase } = require("lodash");
const { inspect } = require("util");

// There isn't a command for controlling users.allowed and guilds.allowed due to the potential for mishaps and misuse
// Such as preventing all command use or causing your bot to leave all of it's guilds
// If you want to make use of them, add ids manually or make your own command

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
        names: ["block", "deny"],
        summary: "Deny access to the bot",
        description: "Prohibits a user or guild from interacting with the bot.",
        usage: "user/guild <id>",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, content, [type, id, ...args]) {
        if (!content) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const group = determineType(type);
        if (!group) return message.channel.send(`Unrecognized type\nUsage: \`${this.names[0]} ${this.usage}\``);
        if (!numeric.test(id)) return message.channel.send(`An id is required\nUsage: \`${this.names[0]} ${this.usage}\``);
        if (client.config.get(group.path).value() === null) {
            client.config.set(group.path, []).write();
        } else if (client.config.get(group.path).includes(id).value()) {
            return message.channel.send(`${startCase(group.type)} \`${id}\` is already blocked`);
        }
        client.config.get(group.path).push(id).write();
        if (group.type === "guild" && client.guilds.cache.has(id)) await client.guilds.leaveGuild(client.guilds.cache.get(id), "blockedGuild");
        log.info(`${message.author.tag} blocked ${group.type} "${id}" from accessing ${client.user.tag}`);
        return message.channel.send(`Blocked ${group.type} \`${id}\``);
    }),
    new CommandBlock({
        names: ["unblock", "allow"],
        summary: "Restore access to the bot",
        description: "Restore a user or guild's access to the bot.",
        usage: "user/guild <id>",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, function(client, message, content, [type, id, ...args]) {
        if (!content) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const group = determineType(type);
        if (!group) return message.channel.send(`Unrecognized type\nUsage: \`${this.names[0]} ${this.usage}\``);
        if (!numeric.test(id)) return message.channel.send(`An id is required\nUsage: \`${this.names[0]} ${this.usage}\``);
        if (client.config.get(group.path).value() === null || !client.config.get(group.path).includes(id).value()) {
            return message.channel.send(`${startCase(group.type)} \`${id}\` isn't blocked`);
        }
        client.config.get(group.path).pull(id).write();
        log.info(`${message.author.tag} unblocked ${group.type} "${id}"`);
        if (!client.config.get(group.path).value().length) {
            client.config.set(group.path, null).write();
        }
        return message.channel.send(`Unblocked ${group.type} \`${id}\``);
    }),
    new CommandBlock({
        names: ["group", "usergroup", "usergroups"],
        summary: "Modify user groups",
        description: "Create user groups and toggle ids in/out of them.",
        usage: "<group> [id]",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, function(client, message, content, args) {
        if (!content) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const name = args[0].toLowerCase();
        if (name === "allowed") return message.channel.send("Interacting with that group is forbidden");
        // not using an object like the block/unblock commands because this only interacts with user groups
        const group = ["users", name];
        let reply = "";
        const id = args.length > 1 ? args[1] : null;
        if (!client.config.has(group).value()) {
            // group does not exist
            client.config.set(group, null).write();
            reply = `Created group \`${name}\``;
        } else if (!id) {
            // if group does exist & no id
            const array = client.config.get(group).value();
            if (!array || !array.length) {
                reply = `The group \`${name}\` is empty`;
            } else {
                reply = `The group \`${name}\` has ${array.length} ${array.length === 1 ? "user" : "users"}:\n\`${inspect(array)}\``;
            }
        }
        // regardless of the above, if there's no id, we're done
        if (!id) return message.channel.send(reply);
        if (!numeric.test(id)) {
            reply += `\nThe id \`${id}\` was invalid`;
            return message.channel.send(reply);
        }
        // if the group is disabled, prepare it
        if (client.config.get(group).value() === null) {
            client.config.set(group, []).write();
        } else if (client.config.get(group).includes(id).value()) {
            // only need to check if the group already has the id & if we need to disable if it's not disabled
            client.config.get(group).pull(id).write();
            reply += `\nRemoved id \`${id}\` from group \`${name}\``;
            if (!client.config.get(group).value().length) client.config.set(group, null).write();
            return message.channel.send(reply);
        }
        // if this code is reached it's safe to assume we have an id, the group is ready, and the id doesn't already exist in the group
        client.config.get(group).push(id).write();
        reply += `\nAdded id \`${id}\` to group \`${name}\``;
        return message.channel.send(reply);
    }),
];
