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
 * Numeric match up to (and a little bit over) the safe number limit. First group is the number.
 */
module.exports.numeric_safeish = /^0*([1-9]\d{0,16}|0)$/;

/**
 * Numeric match up to (and a little bit over) the safe number limit, except zero. First group is the number.
 */
module.exports.numeric_safeish_nonnull = /^0*([1-9]\d{0,16})$/;

/**
 * Matches only characters in the ranges A-Z, a-z, and any digit character (0-9) from the beginning to the end of the string.
 */
module.exports.alphanumeric = /^[A-Za-z\d]+$/;

/**
 * Matches the format for a discord authentication token from the beginning to the end of the string.
 *
 * Source: https://github.com/sapphiredev/utilities/blob/384ff845115c37aaeb20b0b23051954f75f1d0bf/packages/discord-utilities/src/lib/regexes.ts#L121
 */
module.exports.token = /(?<mfaToken>mfa\.[a-z0-9_-]{20,})|(?<basicToken>[a-z0-9_-]{23,28}\.[a-z0-9_-]{6,7}\.[a-z0-9_-]{27})/i;

/**
 * Matches discord message URLs with capturing groups for the three ids (guild, channel, and message)
 *
 * The latter two ids may be omitted (ie. `https://discord.com/channels/1` is valid), as some purposes only require certain ids
 */
module.exports.messageURL = /^https?:\/\/discord(?:app)?\.com\/channels\/(\d+)\/?(\d+)?\/?(\d+)?\/?$/i;

/**
 * Matches the format of a URL.
 * 
 * Taken from https://urlregex.com/.
 */
module.exports.URL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\](\w*)))?)/;

/**
 * Matches an IPv4 IP.
 * 
 * Taken from https://stackoverflow.com/a/36760050/17188891.
 */
module.exports.IPv4 = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/;
