const ListenerBlock = require("../../modules/ListenerBlock");
const { isArray } = require("lodash");

/**
 * @todo Abstract message parsing to it's own function
 * @todo Should access control for unknown and blocked users be moved to their own functions?
 */
module.exports = new ListenerBlock({
    event: "message",
    once: false,
}, function(client, message) {
    const configuration = client.config.get("commands").value();
    // Only parse messages from configured accounts
    if (!configuration.parseUserMessages && !message.author.bot) return;
    if (!configuration.parseBotMessages && message.author.bot) return;
    if (!configuration.parseSelfMessages && message.author.id === client.user.id) return;
    // Only parse messages from configured channel types
    if (!configuration.channelTypes.includes(message.channel.type)) {
        client.emit("ignoredChannel", message);
        return;
    }
    // Access control
    const users = client.config.get("users").value();
    if (users.blocked !== null) {
        if (users.blocked.includes(message.author.id)) {
            client.emit("blockedUser", message);
            return;
        }
    }
    if (users.allowed !== null) {
        if (!users.allowed.includes(message.author.id)) {
            client.emit("unknownUser", message);
            return;
        }
    }
    // Parsing
    let content = message.content.trim();
    const lowercase = content.toLowerCase();
    let prefixed = false;
    if (configuration.prefix) {
        if (isArray(configuration.prefix)) {
            for (const prefix of configuration.prefix) {
                if (lowercase.startsWith(prefix)) {
                    prefixed = true;
                    content = content.substring(prefix.length).trim();
                    break;
                }
            }
        } else if (lowercase.startsWith(configuration.prefix)) {
            /** @todo Remove this in 0.0.8 */
            prefixed = true;
            content = content.substring(configuration.prefix.length).trim();
        }
    }
    if (!prefixed) {
        if (!configuration.mentions) return;
        if (!lowercase.startsWith("<@")) return;
        /** @todo This line could be better if it didn't use a regexp */
        if (!RegExp(`^<@!?${client.user.id}>`).test(lowercase)) return;
        content = content.substring(content.indexOf(">") + 1).trim();
    }
    if (!content.length) return;
    const args = content.split(/[\n\r\s]+/g);
    const name = args.shift().toLowerCase();
    content = content.slice(name.length).trim();
    client.emit("commandParsed", name, message, content.length ? content : null, args);
    client.commands.runByName(name, message, content.length ? content : null, args);
});

/**
 * Emitted whenever the parser ignores a message due to the channel type. Recommended for debugging purposes only.
 * @event Client#ignoredChannel
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {Discord.Message} message
 */

/**
 * Emitted whenever the parser ignores a message due to the user being blocked, prior to parsing for a command. Recommended for debugging purposes only.
 * @event Client#blockedUser
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {Discord.Message} message
 */

/**
 * Emitted whenever the parser ignores a message due to the user being unknown, prior to parsing for a command. Recommended for debugging purposes only.
 * @event Client#unknownUser
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {Discord.Message} message
 */

/**
 * Emitted whenever a command is successfully parsed
 * @event Client#commandParsed
 * @param {Client} client Bound as the first parameter by EventConstruct.load()
 * @param {string} commandName
 * @param {Discord.Message} message
 * @param {?string} [content=null]
 * @param {[string]} [args=[]]
 * @param {...*} [extraParameters]
 */
