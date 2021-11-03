/**
 * Default config data. Note that in 0.0.8 and above, much of the how configuration works will change. See issue #35
 * @namespace
 * @property {Object} client Config options concerning the client
 * @property {?string} client.token Token of the account to login with
 * @property {Object} commands Config options concerning commands
 * @property {string} commands.directory Path of a folder where modules are located
 * @property {?(string|[string])} commands.prefix Command prefixes. Supports any amount of them, including none (null), one (string), or any (array)
 * @property {boolean} commands.mentions Whether mentioning the bot as a prefix is enabled
 * @property {boolean} commands.parseUserMessages Whether messages from users are parsed
 * @property {boolean} commands.parseBotMessages Whether messages from bots are parsed
 * @property {boolean} commands.parseSelfMessages Whether messages from the client user are parsed
 * @property {[string]} commands.channelTypes An array of [channel types](https://discord.js.org/#/docs/main/stable/class/TextChannel?scrollTo=type) that this command block may be ran in. Most commonly used to limit commands to guilds or direct messages.
 * @property {Object} events Config options concerning discord.js events
 * @property {string} events.directory Path of a folder where modules are located
 * @property {Object} metadata Metadata for the bot such as configurable visuals, links, and invites
 * @property {?ColorResolvable} metadata.color Embed color used throughout the bot (no color will be used if null) https://discord.js.org/#/docs/main/master/typedef/ColorResolvable
 * @property {?string} metadata.twitch Twitch account name used as part of the PresenceData activity.url for the streaming status https://discord.js.org/#/docs/main/stable/typedef/PresenceData
 * @property {Object} metadata.reactions Reactions used throughout the bot. https://discord.js.org/#/docs/main/master/typedef/EmojiIdentifierResolvable
 * @property {EmojiIdentifierResolvable} metadata.reactions.positive Emoji representing something positive, yes, confirmation, acceptance
 * @property {EmojiIdentifierResolvable} metadata.reactions.negative Emoji representing something negative, no, denial, refusal
 * @property {EmojiIdentifierResolvable} metadata.reactions.inquiry Emoji representing something unknown, questioning, confusion
 * @property {EmojiIdentifierResolvable} metadata.reactions.alert Emoji representing something that invokes attention, a warning, an alert
 * @property {EmojiIdentifierResolvable} metadata.reactions.cooldown Emoji representing something involving time, a cool down, a delay, a rate limit
 * @property {Object} users User groups, arrays that contain user ids. Null means that group and by extension feature it's for is disabled
 * @property {?[Snowflake]} users.hosts Represents the people hosting the bot, or more specifically, the people who have access to the bot's token.
 * @property {?[Snowflake]} users.trusted Trusted users. Just an example group, not relied upon by anything.
 * @property {?[Snowflake]} users.blocked Used by command internals, acts as a "block list" where user ids in the group are not allowed to run commands
 * @property {?[Snowflake]} users.allowed Used by command internals, acts as an "allow list" where only user ids in the group are allowed to run commands
 * @property {Object} guilds Guild groups, arrays that contain guild ids. Null means that group and by extension feature it's for is disabled
 * @property {?[Snowflake]} guilds.blocked Used by guild access control, acts as a "block list" where the bot will auto leave guilds on the list
 * @property {?[Snowflake]} guilds.allowed Used by guild access control, acts as an "allow list" where the bot will auto leave guilds not on the list
 */
module.exports.config = {
    "client": {
        "token": null,
    },
    "commands": {
        "directory": "./bot/commands/",
        "prefix": null,
        "mentions": true,
        "parseUserMessages": true,
        "parseBotMessages": false,
        "parseSelfMessages": false,
        "channelTypes": ["dm", "text", "news"],
    },
    "events": {
        "directory": "./bot/listeners/",
    },
    "metadata": {
        "color": null,
        "twitch": null,
        "reactions": {
            "positive": "✅",
            "negative": "❎",
            "inquiry": "❔",
            "alert": "❕",
            "cooldown": "⏳",
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

/**
 * Paths of modules to be disabled by default when creating modules.json
 */
module.exports.disabledModules = [
    "bot/commands/template.js",
    "bot/commands/templateMultiple.js",
    "bot/commands/eval.js",
];

/**
 * Default CommandBlock property data
 * These may be moved to static properties of CommandBlock, but [expected year for feature publication is 2022](https://github.com/tc39/proposals/blob/master/finished-proposals.md) and I'm not switching to babel parser yet
 * See documentation for these properties in ./modules/CommandBlock.js
 */
module.exports.defaultCommandData = {
    summary: null,
    description: null,
    usage: null,
    channelTypes: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: null,
    clientChannelPermissions: null,
    userPermissions: null,
    userChannelPermissions: null,
};

/**
 * Default ListenerBlock properties
 * As of right now, there aren't any
 * Same deal as the default CommandBlock properties above re: static properties on the class
 */
module.exports.defaultListenerData = {};
