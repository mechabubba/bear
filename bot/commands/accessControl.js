const CommandBlock = require("../../modules/CommandBlock");
const { isNumeric } = require("../../modules/miscellaneous");
const log = require("../../modules/log");
const { startCase } = require("lodash");
const { inspect } = require("util");

// There isn't a command for controlling users.allowed and guilds.allowed due to the potential for mishaps and misuse.
// You wouldn't want to prevent all command use or cause the bot to leave all of it's guilds by accident, right?
// If you want to make use of them, do it manually.

// Aliases for user and guild.
const types = {
    user: ["u", "user", "users", "account", "accounts"],
    guild: ["g", "guild", "guilds", "s", "server", "servers"],
};

// Groups forbidden to interact with.
const forbiddenGroups = ["allowed"];

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
        description: "Prohibits a user or guild from interacting with the bot.",
        usage: "user/guild [ID]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, [type, id, ...args]) {
        if (!content) {
            return message.channel.send(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }

        const group = determineType(type);
        if (!group) {
            return message.channel.send(`${client.reactions.negative.emote} Unrecognized type \`type\`! This must be either \`user\` or \`guild\`.`);
        }
        if (!isNumeric(id)) {
            return message.channel.send(`${client.reactions.negative.emote} A valid ID is required!`);
        }
        
        if (client.storage.get(group.path).value() === null) {
            client.storage.set(group.path, []).write();
        } else if (client.storage.get(group.path).includes(id).value()) {
            message.react(client.reactions.inquiry.id);
            return message.channel.send(`${client.reactions.inquiry.emote} ${startCase(group.type)} \`${id}\` is already blocked!`);
        }

        client.storage.get(group.path).push(id).write();
        log.info(`${message.author.tag} blocked ${group.type} "${id}" from accessing ${client.user.tag}`);
        return message.channel.send(`${client.reactions.positive.emote} Blocked ${group.type} \`${id}\`!`);
    }),
    new CommandBlock({
        identity: ["unblock", "allow"],
        description: "Restore a user or guild's access to the bot.",
        usage: "user/guild [ID]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, [type, id, ...args]) {
        if (!content) {
            return message.channel.send(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }

        const group = determineType(type);
        if (!group) {
            return message.channel.send(`${client.reactions.negative.emote} Unrecognized type \`type\`! This must be either \`user\` or \`guild\`.`);
        }
        if (!isNumeric(id)) {
            return message.channel.send(`${client.reactions.negative.emote} A valid ID is required!`);
        }

        if (client.storage.get(group.path).value() === null || !client.storage.get(group.path).includes(id).value()) {
            return message.channel.send(`${client.reactions.inquiry.emote} ${startCase(group.type)} \`${id}\` is not blocked!`);
        }
        client.storage.get(group.path).pull(id).write();
        log.info(`${message.author.tag} unblocked ${group.type} "${id}"`);
        if (!client.storage.get(group.path).value().length) {
            client.storage.set(group.path, null).write();
        }
        return message.channel.send(`${client.reactions.positive.emote} Unblocked ${group.type} \`${id}\`!`);
    }),
    new CommandBlock({
        identity: ["groups", "usergroups"],
        description: "Lists all registered usergroups.",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        return message.channel.send(`\`\`\`\n${Object.keys(client.storage.get("users").value()).join(", ")}\`\`\``);
    }),
    new CommandBlock({
        identity: ["group", "usergroup"],
        description: "Creates user groups and toggles given IDs in and out of them.",
        usage: "[group] (userID)",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        if (!content) {
            return message.channel.send(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }

        const name = args[0].toLowerCase();
        if (forbiddenGroups.includes(name)) {
            return message.channel.send(`${client.reactions.negative.emote} Interacting with this group is forbidden.`);
        }

        const group = ["users", name];
        let reply = "";
        const id = args.length > 1 ? args[1] : null;
        if (!client.storage.has(group).value()) {
            // the group does not exist, so we create it.
            client.storage.set(group, null).write();
            reply = `${client.reactions.positive.emote} Created group \`${name}\`!`;
        } else if (!id) {
            // the group *does* exist, but no id was provided
            const array = client.storage.get(group).value();
            if (!array || !array.length) {
                reply = `The group \`${name}\` is empty.`;
            } else {
                reply = `The group \`${name}\` has ${array.length} ${array.length === 1 ? "user" : "users"};\`\`\`\n${inspect(array)}\`\`\``;
            }
        }

        // regardless of the above, if there's no id, we're done
        if (!id) return message.channel.send(reply); // the id doesn't exist regardless if the group exists.
        if (!isNumeric(id)) {
            reply += `\nThe ID \`${id}\` was invalid.`;
            return message.channel.send(reply);
        }

        // if the group is disabled, prepare it
        if (client.storage.get(group).value() === null) {
            client.storage.set(group, []).write();
        } else if (client.storage.get(group).includes(id).value()) {
            // only need to check if the group already has the id & if we need to disable if it's not disabled
            client.storage.get(group).pull(id).write();
            reply += `\nRemoved ID \`${id}\` from group \`${name}\`.`;
            if (!client.storage.get(group).value().length) client.storage.set(group, null).write();
            return message.channel.send(reply);
        }

        // if this code is reached it's safe to assume we have an id, the group is ready, and the id doesn't already exist in the group
        client.storage.get(group).push(id).write();
        reply += `\nAdded ID \`${id}\` to group \`${name}\`.`;
        return message.channel.send(reply);
    }),
];
