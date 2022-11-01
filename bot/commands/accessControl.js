const CommandBlock = require("../../modules/CommandBlock");
const { numeric } = require("../../modules/regexes");
const log = require("../../modules/log");
const { startCase, pull } = require("lodash");
const { MessageMentions } = require("discord.js");
const { inspect } = require("util");

// There isn't a command for controlling users.allowed and guilds.allowed due to the potential for mishaps and misuse
// Such as preventing all command use or causing your bot to leave all of it's guilds
// If you want to make use of them, add ids manually or make your own command

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
        names: ["block", "deny"],
        description: "Prohibits a user or guild from interacting with the bot.",
        usage: "user/guild [ID]",
        locked: "hosts",
    }, async function(client, message, content, [type, id, ...args]) {
        if (!content) {
            return message.reply(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }

        const group = determineType(type);
        if (!group) return message.reply(`${client.reactions.negative.emote} Unrecognized type \`${type}\`! This must be either \`user\` or \`guild\`.`);
        if (!numeric.test(id)) return message.reply(`${client.reactions.negative.emote} A valid ID is required!`);

        let group_arr = client.storage.get(group.path) ?? [];
        if (group_arr.includes(id)) {
            message.react(client.reactions.inquiry.id);
            return message.reply(`${client.reactions.inquiry.emote} ${startCase(group.type)} \`${id}\` is already blocked!`);
        }
        group_arr.push(id);
        client.storage.set(group_arr);
        
        log.info(`${message.author.tag} blocked ${group.type} "${id}" from accessing ${client.user.tag}`);
        return message.reply({ content: `${client.reactions.positive.emote} Blocked ${group.type} \`${id}\`!`, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["unblock", "allow"],
        description: "Restore a user or guild's access to the bot.",
        usage: "user/guild [ID]",
        locked: "hosts",
    }, async function(client, message, content, [type, id, ...args]) {
        if (!content) {
            return message.reply(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }

        const group = determineType(type);
        if (!group) return message.reply(`${client.reactions.negative.emote} Unrecognized type \`type\`! This must be either \`user\` or \`guild\`.`);
        if (!numeric.test(id)) return message.reply(`${client.reactions.negative.emote} A valid ID is required!`);

        let group_arr = client.storage.get(group.path);
        if (!group_arr || !group_arr.includes(id)) {
            return message.reply(`${client.reactions.inquiry.emote} ${startCase(group.type)} \`${id}\` is not blocked!`);
        }
        pull(group_arr, id);

        if (!group_arr.length) {
            client.storage.delete(group.path);
        } else {
            client.storage.set(group.path, group_arr);
        }

        log.info(`${message.author.tag} unblocked ${group.type} "${id}"`);
        return message.reply({ content: `${client.reactions.positive.emote} Unblocked ${group.type} \`${id}\`!`, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["groups", "usergroups"],
        description: "Lists all registered usergroups.",
        locked: "hosts",
    }, async function(client, message, content, args) {
        return message.reply({ content: `\`\`\`\n${Object.keys(client.storage.get("users")).join(", ")}\`\`\``, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["group", "usergroup"],
        description: "Creates user groups and toggles given IDs in and out of them.\n\nTo see what user groups exist, consult the `groups` command.",
        usage: "[group] (userID)",
        locked: "hosts",
    }, async function(client, message, content, [group_name, userID]) {
        if (!content) {
            return message.reply(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }

        group_name = group_name.toLowerCase();
        if (forbiddenGroups.includes(group_name)) {
            return message.reply(`${client.reactions.negative.emote} Interacting with this group is forbidden.`);
        }

        const match = MessageMentions.USERS_PATTERN.exec(userID);
        if(match && match[1]) {
            userID = match[1];
        }

        const group_path = ["users", group_name];
        const group = client.storage.get(group_path);
        const replies = [];

        if (!group) {
            group = []; // The group does not exist, so we create it.
            replies.push(`Created group \`${group_name}\`.`);
        } else if (!userID) {
            // The group *does* exist, but no ID was provided.
            // Provide some information about what this group is.
            if (!group || !group.length) {
                replies.push(`The group \`${group_name}\` is empty.`);
            } else {
                replies.push(`The group \`${group_name}\` has ${array.length} ${array.length === 1 ? "user" : "users"};\`\`\`\n${group.join(", ")}\`\`\``);
            }
        }
        // Regardless of the above, if there's no ID, we're done. The ID doesn't exist regardless if the group exists.
        if (!userID) return message.reply({ content: `${client.reactions.positive.emote} ${replies.join("\n")}`, allowedMentions: { repliedUser: false } });
        
        if (!numeric.test(userID)) {
            replies.push(`The ID \`${userID}\` was invalid.`);
            return message.reply({ content: `${client.reactions.negative.emote} ${replies.join("\n")}` });
        }

        if (group.includes(userID)) {
            // We only need to check if the group already has the ID and if we need to disable if it's not disabled.
            pull(group, userID);
            if (!group.length) {
                client.storage.delete(group_path);
            } else {
                client.storage.set(group_path, group);
            }
            replies.push(`Removed ID \`${userID}\` from group \`${group_name}\`${!client.storage.has(group_path) ? ", and deleted the group." : ""}.`);
            return message.reply({ content: `${client.reactions.positive.emote} ${replies.join("\n")}`, allowedMentions: { repliedUser: false } });
        }

        // If this code is reached it's safe to assume we have an ID, the group is ready, and the ID doesn't already exist in the group.
        group.push(userID);
        client.storage.set(group_path, group);
        replies.push(`Added ID \`${userID}\` to group \`${group_name}\`.`);
        return message.reply({ content: `${client.reactions.positive.emote} ${replies.join("\n")}`, allowedMentions: { repliedUser: false } });
    }),
];
