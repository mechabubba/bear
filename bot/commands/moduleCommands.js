const CommandBlock = require("../../modules/CommandBlock");
const Response = require("../../modules/Response");
const log = require("../../modules/log");
const { forAny } = require("../../modules/miscellaneous");
const { isArray } = require("lodash");
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
        names: ["load"],
        summary: "Load modules by path",
        description: "Load command or event modules by file path. Note that the /modules/ folder is treated as the working directory.",
        usage: "command/event <path>",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.channel.send(`Unknown construct "${choice}"\nUsage: \`${this.names[0]} ${this.usage}\``);
        const filePath = content.substring(choice.length).trim();
        if (!filePath.length) return message.channel.send(`A path is required\nUsage: \`${this.names[0]} ${this.usage}\``);
        const loadResult = client.handler.requireModule(client[constructProperty], filePath, false);
        return message.channel.send(`\`\`\`\n${loadResult.message}\n\`\`\``);
    }),
    new CommandBlock({
        names: ["unload"],
        summary: "Unload modules by name/path",
        description: "Unload command or event modules by command name, event name, or file path. Note that the /modules/ folder is treated as the working directory.",
        usage: "command/event [name/path]",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.channel.send(`Unknown construct "${choice}"\nUsage: \`${this.names[0]} ${this.usage}\``);
        const pathsResult = resolveInputToPaths(client, constructProperty, content, choice);
        const unloadResult = isArray(pathsResult.value) ? client.handler.unloadMultipleModules(client[constructProperty], pathsResult.value) : client.handler.unloadModule(client[constructProperty], pathsResult.value);
        return message.channel.send(`\`\`\`\n${pathsResult.message}\n${unloadResult.message}\n\`\`\``);
    }),
    new CommandBlock({
        names: ["reload"],
        summary: "Reload modules by name/path",
        description: "Reloading command or event modules by command name, event name, or file path. Note that the /modules/ folder is treated as the working directory.",
        usage: "command/event <name/path>",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.channel.send(`Unknown construct "${choice}"\nUsage: \`${this.names[0]} ${this.usage}\``);
        const pathsResult = resolveInputToPaths(client, constructProperty, content, choice);
        if (!pathsResult.value) return message.channel.send(`A path or name is required\nIf targeting anonymous blocks, use \`unload\` instead\nUsage: \`${this.names[0]} ${this.usage}\``);
        const unloadResult = isArray(pathsResult.value) ? client.handler.unloadMultipleModules(client[constructProperty], pathsResult.value) : client.handler.unloadModule(client[constructProperty], pathsResult.value);
        if (!unloadResult.success || unloadResult.error) return message.channel.send(`\`\`\`\n${pathsResult.message}\n${unloadResult.message}\n\`\`\``);
        const loadResult = isArray(pathsResult.value) ? client.handler.requireMultipleModules(client[constructProperty], pathsResult.value, false) : client.handler.requireModule(client[constructProperty], pathsResult.value, false);
        return message.channel.send(`\`\`\`\n${pathsResult.message}\n${unloadResult.message}\n${loadResult.message}\n\`\`\``);
    }),
    new CommandBlock({
        names: ["enable"],
        summary: "Enable modules by path",
        description: "Enable command or event modules by file path. Note that paths should be written relative to the /modules/ folder (for example, navigating to `/bot/commands/` should be `../bot/commands`)",
        usage: "command/event <path>",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.channel.send(`Unknown construct "${choice}"\nUsage: \`${this.names[0]} ${this.usage}\``);
        const filePath = content.substring(choice.length).trim();
        if (!filePath.length) return message.channel.send(`A path is required\nUsage: \`${this.names[0]} ${this.usage}\``);
        const loadResult = client.handler.requireModule(client[constructProperty], filePath, false);
        // Putting the path in an array prevents periods from being interpreted as traversing the db
        if (loadResult.value) client.handler.modules.set([client.handler.trimPath(loadResult.value)], true).write();
        return message.channel.send(`\`\`\`\n${loadResult.message}\n${loadResult.value ? "Enabled the module" : ""}\n\`\`\``);
    }),
    new CommandBlock({
        names: ["disable"],
        summary: "Disable modules by name/path",
        description: "Disable command or event modules by command name, event name, or file path. Note that paths should be written relative to the /modules/ folder (for example, navigating to `/bot/commands/` should be `../bot/commands`)",
        usage: "command/event <name/path>",
        locked: "hosts",
        clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, function(client, message, content, [choice, args]) {
        if (!choice) return message.channel.send(`Usage: \`${this.names[0]} ${this.usage}\``);
        const constructProperty = determineConstruct(choice);
        if (!constructProperty) return message.channel.send(`Unknown construct "${choice}"\nUsage: \`${this.names[0]} ${this.usage}\``);
        const pathsResult = resolveInputToPaths(client, constructProperty, content, choice);
        const multipleModules = isArray(pathsResult.value);
        const unloadResult = multipleModules ? client.handler.unloadMultipleModules(client[constructProperty], pathsResult.value) : client.handler.unloadModule(client[constructProperty], pathsResult.value);
        forAny((resolvedPath) => {
            // Putting the path in an array prevents periods from being interpreted as traversing the db
            client.handler.modules.set([client.handler.trimPath(resolvedPath)], false).write();
        }, unloadResult.value);
        return message.channel.send(`\`\`\`\n${pathsResult.message}\n${unloadResult.message}\n${unloadResult.value ? `Disabled ${multipleModules ? `${unloadResult.value.length} modules` : "1 module"}` : ""}\n\`\`\``);
    }),
];
