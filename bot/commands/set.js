const CommandBlock = require("../../modules/CommandBlock");
const { sleep } = require("../../modules/miscellaneous");
const log = require("../../modules/log");
const actions = {
  avatar: ["i", "icon", "a", "avatar"],
  username: ["u", "user", "name", "username"],
  presence: ["p", "presence"],
  status: ["s", "status"],
  activity: ["activity", "game"],
};
const fileTypes = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const statuses = {
  // online: ["online", "on", "awake", "login", "active", "alive"],
  invisible: ["invisible", "invis", "offline", "off", "hidden", "logout", "inert", "inactive", "dead", "quit", "quit smoking"],
  idle: ["idle", "away", "asleep", "afk", "lazy", "unbindall"],
  dnd: ["dnd", "busy", "do", "do not", "do not disturb", "disturb", "occupied"],
};
const activityTypes = ["playing", "watching", "listening"];
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
const resolveActivity = function(content, args) {
  const data = { "activity": { "name": "" } };
  if (!content) return data;
  const type = args[0].toLowerCase();
  data.activity.name = content;
  if (activityTypes.includes(type)) {
    data.activity.name = content.substring(type.length).trim();
    if (!data.activity.name.length) return data;
    if (type === "watching") {
      data.activity.type = "WATCHING";
    } else if (type === "listening") {
      data.activity.type = "LISTENING";
    }
  }
  if (data.activity.name.length > 128) return null;
  return data;
};

module.exports = [
  new CommandBlock({
    identity: "set",
    summary: null,
    description: null,
    usage: "[action] [input]",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    if (!content) return message.channel.send(`Usage: \`${this.firstName} ${this.usage}\``);
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
      return message.channel.send(`Unrecognized action\nUsage: \`${this.firstName} ${this.usage}\``);
    }
  }),
  new CommandBlock({
    identity: ["setavatar", "seticon"],
    summary: null,
    description: null,
    usage: "<image attachment/link>",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    // Avatar
    await sleep(2000); // Wait 2 seconds to give image links a higher chance of embedding
    const url = resolveInputToImage(await message.fetch(), content);
    if (!url) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`No image detected\nUsage: \`${this.firstName} ${this.usage}\``);
    }
    try {
      await client.user.setAvatar(url);
    } catch (error) {
      log.error("[set avatar]", error);
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`Failed to change avatar, an error occurred: \`${error.message}\``);
    }
    log.info(`${client.user.tag}'s avatar has been changed by ${message.author.tag}`);
    message.react(client.config.get("metadata.reactions.positive").value());
    return message.channel.send(`Changed avatar to \`${url}\``);
  }),
  new CommandBlock({
    identity: ["setname", "setusername"],
    summary: null,
    description: null,
    usage: "<text>",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    // Username
    if (!content) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`No text detected\nUsage: \`${this.firstName} ${this.usage}\``);
    }
    if (!validateUsername(content)) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`Username must be 2 to 32 characters long and not contain \`@\`, \`#\`, \`:\`, or \` \`\`\` \`\nUsage: \`${this.firstName} ${this.usage}\``);
    }
    const tag = client.user.tag;
    try {
      await client.user.setUsername(content);
    } catch (error) {
      log.error("[set username]", error);
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`Failed to change username, an error occurred: \`${error.message}\``);
    }
    log.info(`${tag}'s username has been changed to ${client.user.tag} by ${message.author.tag}`);
    message.react(client.config.get("metadata.reactions.positive").value());
    return message.channel.send(`Changed username from \`${tag}\` to \`${client.user.tag}\``);
  }),
  new CommandBlock({
    identity: ["presence", "setpresence"],
    summary: null,
    description: null,
    usage: "<json>",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    // Presence
    if (!content) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`No json detected\nUsage: \`${this.firstName} ${this.usage}\`\n<https://discord.js.org/#/docs/main/stable/typedef/PresenceData>`);
    }
    let data = content;
    if (data.startsWith("```")) data = data.substring(3).trim();
    if (data.startsWith("json")) data = data.substring(4).trim();
    if (data.endsWith("```")) data = data.slice(0, -3).trim();
    try {
      data = JSON.parse(data);
    } catch (error) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`Failed to parse JSON: \`${error.message}\``);
    }
    try {
      await client.user.setPresence(data);
    } catch (error) {
      log.error("[set presence]", error);
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`Failed to set presence, an error occurred: \`${error.message}\``);
    }
    log.info(`${client.user.tag}'s presence has been updated by ${message.author.tag}`);
    message.react(client.config.get("metadata.reactions.positive").value());
    return message.channel.send(`Updated presence`);
  }),
  new CommandBlock({
    identity: ["status", "setstatus"],
    summary: null,
    description: null,
    usage: "[status]",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    // Status
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
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`Failed to set status, an error occurred: \`${error.message}\``);
    }
    log.info(`${client.user.tag}'s status has been updated to ${status} by ${message.author.tag}`);
    message.react(client.config.get("metadata.reactions.positive").value());
    return message.channel.send(`${!content ? "Reset" : "Updated"} status`);
  }),
  new CommandBlock({
    identity: ["activity", "setactivity"],
    summary: null,
    description: null,
    usage: "[type] [text]",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: "hosts",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, args) {
    const data = resolveActivity(content, args);
    if (!data) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send("Activity text must be 128 characters or shorter in length");
    }
    try {
      await client.user.setPresence(data);
    } catch (error) {
      log.error("[set activity]", error);
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send(`Failed to set activity, an error occurred: \`${error.message}\``);
    }
    log.info(`${client.user.tag}'s activity has been updated by ${message.author.tag}`);
    message.react(client.config.get("metadata.reactions.positive").value());
    return message.channel.send(`${!data.activity.name.length ? "Cleared" : "Updated"} activity`);
  }),
];
