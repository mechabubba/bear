const CommandBlock = require("../../modules/CommandBlock");
const { sleep, unescapeHTML } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");

const settings = {
    canUpdate: ["hosts"], /** What groups can run the `update` subcommand. */
    cooldown: 1000
};

/**
 * Gets a list of 4chan boards and organizes them based on if they're red or blue boards.
 * @param {Client} client
 * @returns {Object} An object with two properties; `all` is an array of all boards, and `nsfw` is an array of non-worksafe boards.
 */
const get4chanBoards = async () => {
    const resp = await fetch("https://a.4cdn.org/boards.json");
    if(!resp.ok) throw new Error(resp.statusText);

    const json = await resp.json();
    const boards = {
        all: [],
        nsfw: [],
    };

    for(let i = 0; i < json.boards.length; i++) {
        const board = json.boards[i];
        boards.all.push(board.board);
        if(board.ws_board == 0) {
            boards.nsfw.push(board.board);
        }
    }
    return boards;
};

module.exports = [
    new CommandBlock({
        names: ["4chan", "4c"],
        description: "Pulls the latest op from a 4chan board.",
        usage: "[board]",
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async (client, message, contents, [board, ...args]) => {
        if(board == "update") {
            // We need this to update our cache of available boards, incase hiroshimoot is pulling some /qb/ type shit.
            // We store this list of boards in a local object to keep everything in sync.
            const isallowed = (userID) => {
                for(const group of settings.canUpdate) {
                    const g = client.storage.get(["users", group]);
                    if(Array.isArray(g) && g.includes(userID)) return true;
                }
                return false;
            };

            if(!isallowed(message.author.id)) {
                return message.reply(`${client.reactions.negative.emote} You do not have permission to do this.`);
            }

            let boards;
            try {
                boards = await get4chanBoards(client);
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
            }

            const db = client.storage.get(["local", "4chan"]) ?? {};
            db.boards = boards;
            await client.storage.set(["local", "4chan"], db);
            return message.reply({ content: `${client.reactions.positive.emote} Board list updated.`, allowedMentions: { repliedUser: false } });
        }

        const boards = client.storage.get(["local", "4chan", "boards"]);
        if(!boards) {
            return message.reply(`${client.reactions.negative.emote} The board list is not cached. Run \`4chan update\` to do that - for general use, you'll only have to do it once!`);
        }

        if(!board || !boards.all.includes(board)) {
            return message.reply(`${client.reactions.negative.emote} A board was not provided or doesn't exist.`);
        }

        const nsfw = boards.nsfw.includes(board);
        if(nsfw && !message.channel.nsfw) {
            return message.reply(`${client.reactions.negative.emote} Red boards are only viewable in NSFW channels.`);
        }

        const now = Date.now();
        client.cookies[`4chan_cooldown`] = client.cookies[`4chan_cooldown`] ?? now;
        if(client.cookies[`4chan_cooldown`] > now) {
            await sleep(client.cookies[`4chan_cooldown`] - now);
        }
        client.cookies[`4chan_cooldown`] = Date.now() + settings.cooldown;

        try {
            const resp = await fetch(`https://a.4cdn.org/${board}/catalog.json`);
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            let i = 0, post = json[0].threads[i];
            while(post.sticky || post.capcode) {
                post = json[0].threads[++i]; // Get the first non-stickied and non-janny thread.
            }

            const embed = new MessageEmbed()
                .setColor(nsfw ? "FED6AF" : "D1D5EE")
                .setAuthor({ name: post.trip ?? post.name })
                .setTitle((post.sub ? `"${unescapeHTML(post.sub)}" - ` : "") + `No. ${post.no}`)
                .setURL(`https://boards.4chan.org/${board}/thread/${post.no}`)
                .setTimestamp(post.time * 1000);

            if(post.com) {
                const desc = unescapeHTML(post.com.replace(/<br>/g, "\n").replace(/(<([^>]+)>)/gi, ""));
                embed.setDescription(`\`\`\`\n${desc.length > 4089 ? desc.substring(0, 4086) + "..." : desc}\`\`\``);
            }

            if(post.tim && !post.filedeleted) {
                embed.setImage(`https://i.4cdn.org/${board}/${post.tim}${post.ext}`)
                    .setFooter({ text: post.filename + post.ext });
            }

            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),
];
