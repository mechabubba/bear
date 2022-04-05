const CommandBlock = require("../../modules/CommandBlock");
const { WebhookClient } = require("discord.js");

/** @todo May want to look into how the bot reacts when it cant `message.delete()` or `message.react()` */
module.exports = [
    new CommandBlock({
        names: ["ping", "latency"],
        summary: "Simple connection test.",
        description: "Provides the time it took to recieve the message. Generally used to check if the bot is responsive.",
    }, async function(client, message, content, args) {
        const msg = await message.reply({ content: "<a:_:597509670210633729>", allowedMentions: { repliedUser: false } });
        msg.edit({ content: `\uD83C\uDFD3 Pong!\nResponse time is \`${msg.createdTimestamp - message.createdTimestamp}ms\`.`, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["echo", "e"],
        description: "Echoes text.",
        usage: "[...text]",
        clientChannelPermissions: ["MANAGE_MESSAGES"],
    }, async function(client, message, content, args) {
        await message.channel.send({ content: content || "** **", allowedMentions: { parse: [] } });
        return message.delete();
    }),
    new CommandBlock({
        names: ["wecho"],
        description: "Echoes text via a Discord webhook.\n\n**Warning:** This is not secure; if used publicly, people WILL be able to get your webhooks ID and token, which will let them use it aswell! Use only as a utility!",
        usage: "[hook_url] [...text]",
        locked: ["hosts"],
    }, async function(client, message, content, [hook_url, ...args]) {
        const matched = hook_url.match(/discord.com\/api\/webhooks\/([^\/]+)\/([^\/]+)/);
        if(!matched[1] || !matched[2]) {
            return message.reply(`${client.reactions.negative.emote} Invalid webhook url provided.`);
        }

        try {
            const hook = new WebhookClient({ id: matched[1], token: matched[2] });
            await hook.send({ content: args.join(" ") || "** **", allowedMentions: { parse: [] } });
            return message.react(client.reactions.positive.id);
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    })
];
