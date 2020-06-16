/**
 * Default config data
 * @namespace
 * @property {Object} client - Config options concerning the client
 * @property {?string} client.token - Token of the account to login with
 * @property {Object} commands - Config options concerning commands
 * @property {string} commands.directory - Path of a folder where modules are located
 * @property {string[]} commands.scope - An array of channel types where commands are allowed. https://discord.js.org/#/docs/main/stable/class/Channel?scrollTo=type
 * @property {?(string|string[])} commands.prefix - Command prefixes. Supports any amount of them, including none (null), one (string), or any (array)
 * @property {boolean} commands.mentions - Whether mentioning the bot as a prefix is enabled
 * @property {Object} events - Config options concerning discord.js events
 * @property {string} events.directory - Path of a folder where modules are located
 * @property {Object} metadata - Metadata for the bot such as configurable visuals, links, and invites
 * @property {ColorResolvable} metadata.color - Embed color used throughout the bot. https://discord.js.org/#/docs/main/master/typedef/ColorResolvable
 * @property {Object} metadata.reactions - Reactions used throughout the bot. https://discord.js.org/#/docs/main/master/typedef/EmojiIdentifierResolvable
 * @property {EmojiIdentifierResolvable} metadata.reactions.positive - Emoji representing something positive, yes, confirmation, acceptance
 * @property {EmojiIdentifierResolvable} metadata.reactions.negative - Emoji representing something negative, no, denial, refusal
 * @property {EmojiIdentifierResolvable} metadata.reactions.inquiry - Emoji representing something unknown, questioning, confusion
 * @property {EmojiIdentifierResolvable} metadata.reactions.alert - Emoji representing something that invokes attention, a warning, an alert
 * @property {Object} users - User groups, arrays that contain user ids. Null means that group and by extension feature it's for is disabled
 * @property {?Snowflake[]} users.hosts - Represents the people hosting the bot, or more specifically, the people who have access to the bot's token.
 * @property {?Snowflake[]} users.trusted - Trusted users. Just an example group, not relied upon by anything.
 * @property {?Snowflake[]} users.blocked - Used by command internals, acts as a "block list" where user ids in the group are not allowed to run commands
 * @property {?Snowflake[]} users.allowed - Used by command internals, acts as an "allow list" where only user ids in the group are allowed to run commands
 * @property {Object} guilds - Guild groups, arrays that contain guild ids. Null means that group and by extension feature it's for is disabled
 * @property {?Snowflake[]} guilds.blocked - Used by bot access control, acts as a "block list" where the bot will auto leave guilds on the list (id based)
 * @property {?Snowflake[]} guilds.allowed - Used by bot access control, acts as an "allow list" where the bot will auto leave guilds not on the list (id based)
 */
const defaultConfig = {
  "client": {
    "token": null,
  },
  "commands": {
    "directory": "./bot/commands/",
    "scope": ["dm", "text", "news"],
    "prefix": null,
    "mentions": true,
  },
  "events": {
    "directory": "./bot/listeners/",
  },
  "metadata": {
    "color": "#2F3136",
    "reactions": {
      "positive": "✅",
      "negative": "❎",
      "inquiry": "❔",
      "alert": "❕",
    },
  },
  "users": {
    "hosts": null,
    "trusted": null,
    "blocked": null,
    "allowed": null,
  },
  "guilds": {
    "blocked": null,
    "allowed": null,
  },
};

module.exports = defaultConfig;
