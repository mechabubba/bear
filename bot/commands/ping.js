const CommandBlock = require("../../modules/CommandBlock");
const { WebhookClient } = require("discord.js");

/** @todo May want to look into how the bot reacts when it cant `message.delete()` or `message.react()` */
module.exports = [
    new CommandBlock({
        identity: ["ping", "latency"],
        summary: "Simple connection test.",
        description: "Provides the time it took to recieve the message. Generally used to check if the bot is responsive.",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, content, args) {
        const msg = await message.channel.send("<a:_:597509670210633729>");
        msg.edit(`\uD83C\uDFD3 Pong!\nResponse time is \`${msg.createdTimestamp - message.createdTimestamp}ms\`.`);
    }),
    new CommandBlock({
        identity: ["echo", "e"],
        description: "Echoes text.",
        usage: "[...text]",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, content, args) {
        await message.channel.send({ content: content, allowedMentions: { parse: [] } });
        return message.delete();
    }),
    new CommandBlock({
        identity: ["wecho"],
        description: "Echoes text via a Discord webhook.\n\n**Warning:** This is not secure; if used publicly, people WILL be able to get your webhooks ID and token, which will let them use it aswell! Use only as a utility!",
        usage: "[hook_url] [...text]",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES"],
        locked: ["hosts"],
    }, async function(client, message, content, [hook_url, ...args]) {
        const matched = hook_url.match(/discord.com\/api\/webhooks\/([^\/]+)\/([^\/]+)/);
        if(!matched[1] || !matched[2]) {
            return message.channel.send(`${client.reactions.negative.emote} Invalid webhook url provided.`);
        }

        try {
            const hook = new WebhookClient(matched[1], matched[2]);
            await hook.send({ content: args.join(" "), allowedMentions: { parse: [] } });
            return message.delete();
        } catch(e) {
            message.react(client.reactions.negative.id);
            return message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);
        }
    })
];
