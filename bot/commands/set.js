const CommandBlock = require("../../modules/CommandBlock");
const { sleep } = require("../../modules/miscellaneous");
const log = require("../../modules/log");

// Aliases for the `set` command.
const actions = {
    avatar:   ["i", "icon", "avatar"],
    username: ["u", "user", "name", "username"],
    presence: ["p", "presence"],
    status:   ["s", "status"],
    activity: ["a", "activity"],
};

// Valid avatar filetypes.
const fileTypes = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

// Aliarses for statuses.
const statuses = {
    // online: ["online", "on", "awake", "login", "active", "alive"],
    invisible: ["invisible", "invis", "offline", "off", "hidden", "logout", "inert", "inactive", "dead", "quit", "quit smoking"],
    idle: ["idle", "away", "asleep", "afk", "lazy", "unbindall"],
    dnd: ["dnd", "busy", "do", "do not", "do not disturb", "disturb", "occupied"],
};

// Aliases to shorten the activity text.
const activityTypes = ["playing", "game", "watching", "video", "listening", "music", "streaming", "twitch"];

const isValidUsername = function(input) {
    if (input.length < 2 || input.length > 32) return false;
    if (input.includes("@")) return false;
    if (input.includes("#")) return false;
    if (input.includes(":")) return false;
    if (input.includes("```")) return false;
    return true;
};

const isValidAttachment = function(attachments) {
    if (!attachments.size) return false;
    const url = attachments.get(attachments.firstKey()).url;
    if (!fileTypes.includes(url.toLowerCase().substring(url.lastIndexOf(".")))) return false;
    return true;
};

const isValidImageEmbed = function(embeds) {
    if (!embeds.length) return false;
    if (embeds[0].type !== "image") return false;
    return true;
};

const isValidImageLink = function(input) {
    if (!input) return false;
    if (!input.length) return false;
    if (!fileTypes.includes(input.toLowerCase().substring(input.lastIndexOf(".")))) return false;
    return true;
};

const resolveInputToImage = function(message, input) {
    if (isValidAttachment(message.attachments)) {
        return message.attachments.get(message.attachments.firstKey()).url;
    } else if (isValidImageEmbed(message.embeds)) {
        return message.embeds[0].url;
    } else if (isValidImageLink(input)) {
        return input;
    } else {
        return null;
    }
};

const resolveActivity = function(client, content, args) {
    const data = { "activity": { "name": "" } };
    if (!content) return data;
    const type = args[0].toLowerCase();
    data.activity.name = content;
    if (activityTypes.includes(type)) {
        data.activity.name = content.substring(type.length).trim();
        if (!data.activity.name.length) return data;
        if (type === "watching" || type === "video") {
            data.activity.type = "WATCHING";
        } else if (type === "listening" || type === "music") {
            data.activity.type = "LISTENING";
        } else if (type === "streaming" || type === "twitch") {
            data.activity.type = "STREAMING";
            data.activity.url = "https://twitch.tv/" + client.config.get("metadata.twitch").value();
        }
    }
    if (data.activity.name.length > 128) return null;
    return data;
};

module.exports = [
    new CommandBlock({
        identity: "set",
        summary: "Controls the profile of the bot.",
        description: "Acts as an advanced shortcut to the `setavatar`, `setname`, `presence`, `status`, and `activity` commands.",
        usage: "[action] [input]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        if (!content) {
            message.react(client.reactions.negative.id);
            return message.channel.send(`${client.reactions.negative.emote} Missing an argument. Perform \`help ${this.firstName}\` for more information.`);
        }

        const action = args[0].toLowerCase();
        const input = {
            content: content.substring(action.length).trim(),
            args: args.slice(1),
        };

        if (!input.content.length) input.content = null;
        if (actions.avatar.includes(action)) {
            // Avatar
            return client.commands.run("setavatar", message, input.content, input.args);
        } else if (actions.username.includes(action)) {
            // Username
            return client.commands.run("setname", message, input.content, input.args);
        } else if (actions.presence.includes(action)) {
            // Presence
            return client.commands.run("setpresence", message, input.content, input.args);
        } else if (actions.status.includes(action)) {
            // Status
            return client.commands.run("setstatus", message, input.content, input.args);
        } else if (actions.activity.includes(action) || activityTypes.includes(action)) {
            // Activity
            const useParsed = !activityTypes.includes(action);
            return client.commands.run("setactivity", message, useParsed ? input.content : content, useParsed ? input.args : args);
        } else {
            // Unrecognized
            message.react(client.reactions.negative.id);
            return message.channel.send(`${client.reactions.negative.emote} Unrecognized action. Perform \`help ${this.firstName}\` for more information.`);
        }
    }),
    new CommandBlock({
        identity: ["setavatar", "seticon"],
        summary: "Changes the bot's avatar.",
        description: "Changes the bot's avatar. Be aware that this has a strict cooldown (shared with changing the bot's name) in the Discord API.",
        usage: "[attachment/link]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        await sleep(2000); // Wait 2 seconds to give image links a higher chance of embedding
        const url = resolveInputToImage(await message.fetch(), content);
        if (!url) {
            return message.channel.send(`${client.reactions.negative.emote} No image detected; you need to attatch or link to an image. Perform \`help ${this.firstName}\` for more information.`);
        }

        try {
            await client.user.setAvatar(url);
        } catch (error) {
            log.error("[set avatar]", error);
            return message.channel.send(`${client.reactions.negative.emote} Failed to change avatar, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s avatar has been changed by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        identity: ["setname", "setusername"],
        summary: "Changes the bot's name.",
        description: "Changes the bot's username. Be aware that this has a strict cooldown (shared with changing the bot's avatar) in the Discord API.",
        usage: "[text]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        if (!content) {
            return message.channel.send(`${client.reactions.negative.emote} No text provided. Perform \`help ${this.firstName}\` for more information.`);
        }
        if (!isValidUsername(content)) {
            return message.channel.send(`${client.reactions.negative.emote} Username must be 2 to 32 characters long and not contain \`@\`, \`#\`, \`:\`, or \` \`\`\` \`.`);
        }

        const tag = client.user.tag;
        try {
            await client.user.setUsername(content);
        } catch (error) {
            log.error("[set username]", error);
            return message.channel.send(`${client.reactions.negative.emote} Failed to change username, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${tag}'s username has been changed to ${client.user.tag} by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        identity: ["presence", "setpresence"],
        summary: "Sets the bot's presence with json.",
        description: "Sets the bot's presence with raw JSON. Refer to the `[PresenceData](https://discord.js.org/#/docs/main/stable/typedef/PresenceData)` object for what properties and values to use. Using a codeblock with your JSON input is supported so long that your message contains a singular string of valid JSON somewhere within it.",
        usage: "[JSON]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        if (!content) {
            return message.channel.send(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }
        if (!content.includes("{") || !content.includes("}")) {
            return message.channel.send(`${client.reactions.negative.emote} Input isn't enclosed in curly brackets; you must pass in valid JSON.`);
        }

        let data = content.substring(content.indexOf("{"), content.lastIndexOf("}") + 1).trim();
        try {
            data = JSON.parse(data);
        } catch (error) {
            return message.channel.send(`${client.reactions.negative.emote} Failed to parse JSON;\`\`\`\n${error.message}\`\`\``);
        }

        try {
            await client.user.setPresence(data);
        } catch (error) {
            log.error("[set presence]", error);
            return message.channel.send(`${client.reactions.negative.emote} Failed to set presence, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s presence has been updated by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        identity: ["status", "setstatus"],
        summary: "Sets the bot's status.",
        description: "Sets the bot's status. All four statuses are supported (online, idle, do not disturb, and invisible)",
        usage: "[status]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        let status = "online";
        if (content) {
            if (statuses.invisible.includes(content)) {
                status = "invisible";
            } else if (statuses.idle.includes(content)) {
                status = "idle";
            } else if (statuses.dnd.includes(content)) {
                status = "dnd";
            }
        }

        try {
            await client.user.setStatus(status);
        } catch (error) {
            log.error("[set status]", error);
            return message.channel.send(`${client.reactions.negative.emote} Failed to set status, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s status has been updated to ${status} by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        identity: ["activity", "setactivity"],
        summary: "Sets the bot's activity.",
        description: "Sets the bot's activity. All four activities are supported (playing, watching, listening, and streaming)",
        usage: "[type] [text]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
    }, async function(client, message, content, args) {
        if (!content) {
            return message.channel.send(`${client.reactions.negative.emote} No input provided. Perform \`help ${this.firstName}\` for more information.`);
        }
        const data = resolveActivity(client, content, args);
        if (!data) {
            return message.channel.send(`${client.reactions.negative.emote} Activity text must be 128 characters or shorter in length.`);
        }

        try {
            await client.user.setPresence(data);
        } catch (error) {
            log.error("[set activity]", error);
            message.react(client.reactions.negative.id);
            return message.channel.send(`${client.reactions.negative.emote} Failed to set activity, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s activity has been updated by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
];
