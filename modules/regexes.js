/**
 * This module contains useful regular expressions
 *
 * Note that there are also useful regexes in discord.js accessible as static properties, specifically:
 *
 * - [GuildTemplate.GUILD_TEMPLATES_PATTERN](https://discord.js.org/#/docs/main/stable/class/GuildTemplate?scrollTo=GUILD_TEMPLATES_PATTERN)
 * - [Invite.INVITES_PATTERN](https://discord.js.org/#/docs/main/stable/class/Invite?scrollTo=INVITES_PATTERN)
 * - [MessageMentions.EVERYONE_PATTERN](https://discord.js.org/#/docs/main/stable/class/MessageMentions?scrollTo=EVERYONE_PATTERN)
 * - [MessageMentions.USERS_PATTERN](https://discord.js.org/#/docs/main/stable/class/MessageMentions?scrollTo=USERS_PATTERN)
 * - [MessageMentions.ROLES_PATTERN](https://discord.js.org/#/docs/main/stable/class/MessageMentions?scrollTo=ROLES_PATTERN)
 * - [MessageMentions.CHANNELS_PATTERN](https://discord.js.org/#/docs/main/stable/class/MessageMentions?scrollTo=CHANNELS_PATTERN)
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#creating_a_regular_expression
 * @module regexes
 */

/**
 * Matches only characters in the ranges A-Z and a-z from the beginning to the end of the string.
 */
module.exports.alphabetic = /^[A-Za-z]+$/;

/**
 * Matches only digit characters (0-9) from the beginning to the end of the string.
 */
module.exports.numeric = /^\d+$/;

/**
 * Matches only characters in the ranges A-Z, a-z, and any digit character (0-9) from the beginning to the end of the string.
 */
module.exports.alphanumeric = /^[A-Za-z\d]+$/;

/**
 * Matches the format for a discord authentication token from the beginning to the end of the string.
 */
module.exports.token = /^[\w]{24}\.[\w-]{6}\.[\w-]{27}$/;

/**
 * Matches discord message URLs with capturing groups for the three ids (guild, channel, and message)
 *
 * The latter two ids may be omitted (ie. `https://discord.com/channels/1` is valid), as some purposes only require certain ids
 */
module.exports.messageURL = /^https?:\/\/discord(?:app)?\.com\/channels\/(\d+)\/?(\d+)?\/?(\d+)?\/?$/i;
