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

// Aliases to shorten the activity type.
const activityTypes = ["playing", "play", "game", "watching", "watch", "video", "listening", "listen", "music", "streaming", "stream", "twitch", "competing", "compete"];

const validateUsername = function(input) {
    if (input.length < 2 || input.length > 32) return false;
    if (input.includes("@")) return false;
    if (input.includes("#")) return false;
    if (input.includes(":")) return false;
    if (input.includes("```")) return false;
    return true;
};

const validateAttachment = function(attachments) {
    if (!attachments.size) return false;
    const url = attachments.get(attachments.firstKey()).url;
    if (!fileTypes.includes(url.toLowerCase().substring(url.lastIndexOf(".")))) return false;
    return true;
};

const validateEmbed = function(embeds) {
    if (!embeds.length) return false;
    if (embeds[0].type !== "image") return false;
    return true;
};

const validateImageLink = function(input) {
    if (!input) return false;
    if (!input.length) return false;
    if (!fileTypes.includes(input.toLowerCase().substring(input.lastIndexOf(".")))) return false;
    return true;
};

const resolveInputToImage = function(message, input) {
    if (validateAttachment(message.attachments)) {
        return message.attachments.get(message.attachments.firstKey()).url;
    } else if (validateEmbed(message.embeds)) {
        return message.embeds[0].url;
    } else if (validateImageLink(input)) {
        return input;
    } else {
        return null;
    }
};

const resolveActivity = function(client, content, args) {
    if (!content) return null;
    const activity = {};
    const type = args[0].toLowerCase();
    activity.name = content;

    if (activityTypes.includes(type)) {
        activity.name = content.substring(type.length).trim();
        if (activity.name.length > 0) {
            if (type === "watching" || type === "watch" || type === "video") {
                activity.type = "WATCHING";
            } else if (type === "listening" || type === "listen" || type === "music") {
                if (activity.name.toLowerCase().startsWith("to")) activity.name = activity.name.substring(2).trim();
                if (!activity.name.length) return null;
                activity.type = "LISTENING";
            } else if (type === "streaming" || type === "stream" || type === "twitch") {
                activity.type = "STREAMING";
                const url = client.config.get("metadata.twitch");
                if(!url) throw new Error("No Twitch channel configured; set config value `metadata.channel` to the username of the Twitch channel you want to display.");
                activity.url = "https://twitch.tv/" + url;
            } else if (type === "competing" || type === "compete") {
                if (activity.name.toLowerCase().startsWith("in")) activity.name = activity.name.substring(2).trim();
                if (!activity.name.length) return null;
                activity.type = "COMPETING";
            }
        }
    }

    if (activity.name.length > 128) throw new Error("Activity text must be 128 characters or shorter in length.");
    return { "activities": [activity] };
};

module.exports = [
    new CommandBlock({
        names: ["set"],
        description: "Acts as an advanced shortcut to the `setavatar`, `setname`, `presence`, `status`, and `activity` commands.",
        usage: "[action] [input]",
        locked: "hosts",
    }, function(client, message, content, args) {
        if (!content) return message.reply(`${client.reactions.negative.emote} Missing an argument. Perform \`help ${this.firstName}\` for more information.`);

        const action = args[0].toLowerCase();
        const input = {
            content: content.substring(action.length).trim(),
            args: args.slice(1),
        };

        if (!input.content.length) input.content = null;
        if (actions.avatar.includes(action)) {
            // Avatar
            return client.commands.runByName("setavatar", message, input.content, input.args);
        } else if (actions.username.includes(action)) {
            // Username
            return client.commands.runByName("setname", message, input.content, input.args);
        } else if (actions.presence.includes(action)) {
            // Presence
            return client.commands.runByName("setpresence", message, input.content, input.args);
        } else if (actions.status.includes(action)) {
            // Status
            return client.commands.runByName("setstatus", message, input.content, input.args);
        } else if (actions.activity.includes(action) || activityTypes.includes(action)) {
            // Activity
            const useParsed = !activityTypes.includes(action);
            return client.commands.runByName("setactivity", message, useParsed ? input.content : content, useParsed ? input.args : args);
        } else {
            // Unrecognized
            return message.reply(`${client.reactions.negative.emote} Unrecognized action. Perform \`help ${this.firstName}\` for more information.`);
        }
    }),
    new CommandBlock({
        names: ["setavatar", "seticon"],
        description: "Changes the bot's avatar. Be aware that this has a **very** strict cooldown (shared with changing the bot's name, around two requests per hour) in the Discord API.",
        usage: "[image attachment/link]",
        locked: "hosts",
    }, async function(client, message, content, args) {
        await sleep(2000); // Wait 2 seconds to give image links a higher chance of embedding
        
        const url = resolveInputToImage(await message.fetch(), content);
        if (!url) return message.reply(`${client.reactions.negative.emote} No image detected; you need to attatch or link to an image. Perform \`help ${this.firstName}\` for more information.`);
        
        try {
            await client.user.setAvatar(url);
        } catch (error) {
            log.error("[set avatar]", error);
            return message.reply(`${client.reactions.negative.emote} Failed to change avatar, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s avatar has been changed by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        names: ["setname", "setusername"],
        description: "Changes the bot's username. Be aware that this has a strict cool down (shared with changing the bot's avatar) in the discord api.",
        usage: "[text]",
        locked: "hosts",
    }, async function(client, message, content, args) {
        if (!content) return message.reply(`${client.reactions.negative.emote} No text provided. Perform \`help ${this.firstName}\` for more information.`);
        if (!validateUsername(content)) return message.reply(`${client.reactions.negative.emote} Username must be 2 to 32 characters long and not contain \`@\`, \`#\`, \`:\`, or \` \`\`\` \`.`);
        
        try {
            await client.user.setUsername(content);
        } catch (error) {
            log.error("[set username]", error);
            return message.reply(`${client.reactions.negative.emote} Failed to change username, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s username has been changed to ${client.user.tag} by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        names: ["presence", "setpresence"],
        description: "Sets the bot's presence with raw JSON. Refer to the [`PresenceData`](https://discord.js.org/#/docs/main/stable/typedef/PresenceData) object for what properties and values to use. Using a codeblock with your JSON input is supported so long that your message contains a singular string of valid json somewhere within it.",
        usage: "[JSON]",
        locked: "hosts",
    }, async function(client, message, content, args) {
        if (!content) return message.channel.send(`${client.reactions.negative.emote} You must input a piece of JSON. Perform \`help ${this.firstName}\` for more information.`);
        if (!content.includes("{") || !content.includes("}")) return message.channel.send(`${client.reactions.negative.emote} Provided input isn't enclosed in curly brackets; valid json is required. Perform \`help ${this.firstName}\` for more information.`);

        let data = content.substring(content.indexOf("{"), content.lastIndexOf("}") + 1).trim();
        try {
            data = JSON.parse(data);
        } catch (error) {
            return message.reply(`${client.reactions.negative.emote} Failed to parse JSON;\`\`\`\n${error.message}\`\`\``);
        }

        try {
            await client.user.setPresence(data);
        } catch (error) {
            log.error("[set presence]", error);
            return message.reply(`${client.reactions.negative.emote} Failed to set presence, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s presence has been updated by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        names: ["status", "setstatus"],
        description: "Sets the bot's status. All four statuses are supported; `online`, `idle`, `dnd`, and `invisible`.",
        usage: "[status]",
        locked: "hosts",
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
            return message.reply(`${client.reactions.negative.emote} Failed to set status, an error occurred;\`\`\`\n${error.message}\`\`\``);
        }

        log.info(`${client.user.tag}'s status has been updated to ${status} by ${message.author.tag}`);
        return message.react(client.reactions.positive.id);
    }),
    new CommandBlock({
        names: ["activity", "setactivity"],
        description: "Sets the bot's activity. All five activities are supported; `PLAYING`, `WATCHING`, `LISTENING`, `STREAMING`, and `COMPETING`.",
        usage: "[type] [text]",
        locked: "hosts",
    }, async function(client, message, content, args) {
        try {
            const data = resolveActivity(client, content, args);
            let activity;
            if(!data) {
                await client.user.setPresence({ activity: null });
            } else {
                await client.user.setPresence(data);
                activity = data.activities[0];
            }
            log.info(`${client.user.tag}'s activity has been ${activity ? "cleared" : "updated"} by ${message.author.tag}`);
        } catch(error) {
            log.error("[set activity]", error);
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${error.message}\`\`\``);
        }

        return message.react(client.reactions.positive.id);
    }),
];
