const CommandBlock = require("../../modules/CommandBlock");
const Response = require("../../modules/Response");
const Handler = require("../../modules/Handler");
const log = require("../../modules/log");
const _ = require("lodash");
const commands = ["c", "cmd", "cmds", "command", "commands"];
const events = ["e", "event", "events", "l", "listen", "listener", "listeners"];
const determineConstruct = function(choice) {
    if (commands.includes(choice)) {
        return "commands";
    } else if (events.includes(choice)) {
        return "events";
    } else {
        return null;
    }
};
const resolveInputToPaths = function(client, constructProperty, content, choice) {
    log.debug("\nconstructProperty", constructProperty, "\ncontent", content, "\nchoice", choice);
    const input = content.substring(choice.length).trim();
    const obj = {
        message: `Didn't resolve input "${input}" as `,
        value: input,
    };
    if (input === "") {
        obj.message = `Resolved input "${input}" as targeting anonymous blocks`;
        obj.value = null;
    } else if (constructProperty === "commands") {
        obj.message += "a command name or targeting anonymous blocks, assuming it's a path";
        if (client.commands.index.has(input)) {
            const id = client.commands.index.get(input);
            if (client.commands.cache.has(id)) {
                obj.message = `Resolved input "${input}" as a command name`;
                obj.value = client.commands.cache.get(id).filePath;
            } else {
                log.warn(`Command name "${input}" was mapped in command index but corresponding id "${id}" isn't mapped in command cache`);
            }
        }
    } else if (constructProperty === "events") {
        if (client.events.pathsByEvent.has(input)) {
            obj.message = `Resolved input "${input}" as an event name`;
            obj.value = client.events.pathsByEvent.get(input);
        } else {
            obj.message += "an event name in use or targeting anonymous blocks, assuming it's a path";
        }
    }
    return new Response(obj);
};

module.exports = [
    new CommandBlock({
        identity: "load",
        description: "Loads command or event modules by file path. Note that the /modules/ folder is treated as the working directory.",
        usage: "command/event [path]",
        locked: "hosts",
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.reply(`Usage: \`${this.firstName} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.reply(`Unknown construct "${choice}"\nUsage: \`${this.firstName} ${this.usage}\``);
        const filePath = content.substring(choice.length).trim();
        if (!filePath.length) return message.reply(`A path is required\nUsage: \`${this.firstName} ${this.usage}\``);
        const loadResult = Handler.requireModule(client[constructProperty], filePath);
        return message.reply(`\`\`\`\n${loadResult.message}\n\`\`\``);
    }),
    new CommandBlock({
        identity: "unload",
        description: "Unloads command or event modules by command name, event name, or file path. Note that the /modules/ folder is treated as the working directory.",
        usage: "command/event [name/path]",
        locked: "hosts",
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.reply(`Usage: \`${this.firstName} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.reply(`Unknown construct "${choice}"\nUsage: \`${this.firstName} ${this.usage}\``);
        const pathsResult = resolveInputToPaths(client, constructProperty, content, choice);
        const unloadResult = _.isArray(pathsResult.value) ? Handler.unloadMultipleModules(client[constructProperty], pathsResult.value) : Handler.unloadModule(client[constructProperty], pathsResult.value);
        return message.reply(`\`\`\`\n${pathsResult.message}\n${unloadResult.message}\n\`\`\``);
    }),
    new CommandBlock({
        identity: "reload",
        description: "Reloads command or event modules by command name, event name, or file path. Note that the /modules/ folder is treated as the working directory.",
        usage: "command/event [name/path]",
        locked: "hosts",
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.reply(`Usage: \`${this.firstName} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.reply(`Unknown construct "${choice}"\nUsage: \`${this.firstName} ${this.usage}\``);
        const pathsResult = resolveInputToPaths(client, constructProperty, content, choice);
        if (!pathsResult.value) return message.reply(`A path or name is required\nIf targeting anonymous blocks, use \`unload\` instead\nUsage: \`${this.firstName} ${this.usage}\``);
        const unloadResult = _.isArray(pathsResult.value) ? Handler.unloadMultipleModules(client[constructProperty], pathsResult.value) : Handler.unloadModule(client[constructProperty], pathsResult.value);
        if (!unloadResult.success || unloadResult.error) return message.reply(`\`\`\`\n${pathsResult.message}\n${unloadResult.message}\n\`\`\``);
        const loadResult = _.isArray(pathsResult.value) ? Handler.requireMultipleModules(client[constructProperty], pathsResult.value) : Handler.requireModule(client[constructProperty], pathsResult.value);
        return message.reply(`\`\`\`\n${pathsResult.message}\n${unloadResult.message}\n${loadResult.message}\n\`\`\``);
    }),
];
