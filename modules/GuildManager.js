const log = require("./log");
const Discord = require("discord.js");
const { isArray } = require("lodash");
const chalk = require("chalk");

/**
 * Extension of the discord.js GuildManager
 * @extends {Discord.GuildManager}
 */
class GuildManager extends Discord.GuildManager {
    constructor(client, iterable) {
        super(client, iterable);
    }

    /**
     * Leaves a specific guild if available & not owned by the bot while optionally emitting a custom event
     * @param {Discord.Guild} guild
     * @param {?string} event
     */
    async leaveGuild(guild, event = null) {
        if (!guild || !guild.available || guild.deleted) return;
        if (this.client.user.id === guild.ownerID) return log.warn(`${event ? chalk.gray(`[${event}]`) : ""} ${this.client.user.tag} failed to leave guild "${guild.name}" (${guild.id}) as it owns the guild and must first transfer ownership`);
        try {
            await guild.leave();
        } catch (error) {
            log.error(`${this.client.user.tag} failed to leave guild "${guild.name}" (${guild.id}) due to an error:`, error);
            return;
        }
        if (event) this.client.emit(event, guild);
    }

    /**
     * Used by guild access control internally to leave guilds in a collection filtered by a predicate
     * @param {Discord.Collection<Discord.Snowflake, Discord.Guild>} collection
     * @param {function} predicate
     * @param {?string} event
     * @private
     */
    async filterGuilds(collection, predicate, event = null) {
        const guilds = collection.filter(predicate);
        if (!guilds.size) return;
        // This is how you ignore returned values from array destructuring: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Ignoring_some_returned_values
        for (const [, guild] of guilds) {
            await this.leaveGuild(guild, event);
        }
    }

    /**
     * Used by guild access control internally to get & check a guild group prior to use
     * @param {string} name
     * @returns {false|[string]} Returns false if group is falsy, empty, or doesn't exist, otherwise returns the group
     * @private
     */
    getGuildGroup(name) {
        if (!name || !this.client.config.has(["guilds", name]).value()) return false;
        const group = this.client.config.get(["guilds", name]).value();
        if (!group || !isArray(group) || !group.length) return false;
        return group;
    }

    /**
     * Checks & leaves blocked guilds in the cache, or a specific guild if supplied
     * Note that if the associated guild group (`guilds.blocked`) is null or empty, no guilds will be left.
     * You can refer to the documentation in `./modules/defaultData.js` for info about guild groups and access control.
     * @param {?Discord.Guild} [guild]
     */
    checkBlocked(guild = null) {
        const blocked = this.getGuildGroup("blocked");
        if (!blocked) return;
        const predicate = (value) => blocked.includes(value.id);
        if (guild) {
            if (predicate(guild)) this.leaveGuild(guild, "blockedGuild");
        } else {
            this.filterGuilds(this.cache, predicate, "blockedGuild");
        }
    }

    /**
     * Checks & leaves guilds missing from the allow list in the cache, or a specific guild if supplied
     * Note that if the associated guild group (`guilds.allowed`) is null or empty, no guilds will be left.
     * You can refer to the documentation in `./modules/defaultData.js` for info about guild groups and access control.
     * @param {?Discord.Guild} [guild]
     */
    checkUnknown(guild = null) {
        const allowed = this.getGuildGroup("allowed");
        if (!allowed) return;
        const predicate = (value) => !allowed.includes(value.id);
        if (guild) {
            if (predicate(guild)) this.leaveGuild(guild, "unknownGuild");
        } else {
            this.filterGuilds(this.cache, predicate, "unknownGuild");
        }
    }

}

module.exports = GuildManager;

/**
 * Emitted whenever a blocked guild is detected and subsequently left
 * @event Client#blockedGuild
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {Discord.Guild} guild The guild that was left
 */

/**
 * Emitted whenever an unknown guild is detected and subsequently left
 * @event Client#unknownGuild
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {Discord.Guild} guild The guild that was left
 */
