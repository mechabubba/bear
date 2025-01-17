const CommandBlock = require("../../modules/CommandBlock");
const { WebhookClient } = require("discord.js");

const sdate = new Date(1993, 8, 1); // The beginning of Eternal September. Month index starts at 0.

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
        usage: "(...text)",
        clientChannelPermissions: ["MANAGE_MESSAGES"],
    }, async function(client, message, content, args) {
        await message.channel.send({ content: content || "** **", allowedMentions: { parse: [] } });
        return message.delete();
    }),
    new CommandBlock({
        names: ["wecho"],
        description: "Echoes text via a Discord webhook.\n\n**Warning:** This is not secure. If used in an open channel, people WILL be able to get your webhooks ID and token, which will let them use it aswell. Use this only as a utility!",
        usage: "[hook_url] (...text)",
        locked: ["hosts"],
    }, async function(client, message, content, [hook_url, ...args]) {
        const matched = hook_url.match(/discord.com\/api\/webhooks\/([^/]+)\/([^/]+)/);
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
    }),
    new CommandBlock({
        names: ["thetime", "time"],
        description: "Tells the time. Optionally tells the time within a specified timezone.",
        usage: "(timezone)",
    }, (client, message, content, [zone, ...args]) => {
        let date = DateTime.now();
        if (zone) {
            date = date.setZone(zone);
            if (!date.isValid) {
                return message.reply(`${client.reactions.negative.emote} The provided timezone is invalid.`);
            }
        }
        return message.reply({ content: `It is currently **${date.toLocaleString(DateTime.DATETIME_FULL, { timeZoneName: "short" })}.**`, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["sdate"],
        description: "Gets the date with respect to [the September that never ended](https://en.wikipedia.org/wiki/Eternal_September).",
    }, function(client, message, content, args) {
        const since = Math.ceil((Date.now() - sdate.getTime()) / (1000 * 60 * 60 * 24));
        const d1 = (since % 10);
        const d2 = (since / 10) % 10 | 0;
        let suffix;
        if(d2 == 1) {
            suffix = "th";
        } else {
            switch(d1) {
                case 1: suffix = "st"; break;
                case 2: suffix = "nd"; break;
                case 3: suffix = "rd"; break;
                default: suffix = "th"; break;
            }
        }
        return message.reply({ content: `Today is **September ${since + suffix}, 1993.**`, allowedMentions: { repliedUser: false } });
    }),
];
