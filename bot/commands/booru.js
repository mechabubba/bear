/** booru.js - Image boards n' boorus n' stuff. */
const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");
const CommandBlock = require("../../modules/CommandBlock");
const { sleep, unescapeHTML } = require("../../modules/miscellaneous");

const chan_canupdate = ["hosts"]; // A list of groups that can use the "4chan update" subcommand.

/**
 * Gets a list of 4chan boards and organizes them based on if they're red or blue boards.
 * @param {Client} client 
 * @returns 
 */
const get4chanBoards = async (client) => {
    const resp = await fetch("https://a.4cdn.org/boards.json");
    if(!resp.ok) throw new Error(resp.statusText);
    
    const json = await resp.json();
    const boards = {
        all: [],
        nsfw: []
    };

    for(let i = 0; i < json.boards.length; i++) {
        const board = json.boards[i];
        boards.all.push(board.board);
        if(board.ws_board == 0) {
            boards.nsfw.push(board.board)
        }
    }
    return boards;
}

module.exports = [
    new CommandBlock({
        identity: ["4chan", "4c"],
        description: "Pulls the latest op from a 4chan board.",
        usage: "[board]",
        clientPermissions: ["ATTACH_FILES"],
    }, async function(client, message, contents, [board, ...args]) {
        // Updates our board cache.
        if(board == "update") {
            let canupdate = false;
            for(const group of chan_canupdate) {
                const g = await client.storage.get(["users", group]).value();
                if(Array.isArray(g) && g.includes(message.author.id)) {
                    canupdate = true;
                    break;
                };
            }
            if(!canupdate) {
                return message.reply(`${client.reactions.negative.emote} You do not have permission to do this.`);
            }

            let boards;
            try {
                boards = await get4chanBoards(client);
            } catch(e) {
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
            }

            // very much a bandaid solution before the eventual merge to a sql database. i know this is messy.
            let db = client.storage.get(["local", "4chan"]).value();
            db.boards = boards;
            await client.storage.set(["local", "4chan"], db).write();
            return message.reply({ content: `${client.reactions.positive.emote} Board list updated.`, allowedMentions: { repliedUser: false } });
        }

        // @todo on bot/command init, keep these in memory.
        const boards = await client.storage.get(["local", "4chan", "boards"]).value();
        if(!board || !boards.all.includes(board)) {
            return message.reply(`${client.reactions.negative.emote} A board was not provided or doesn't exist.`);
        }

        const nsfw = boards.nsfw.includes(board);
        if(nsfw && !message.channel.nsfw) {
            return message.reply(`${client.reactions.negative.emote} Red boards are only viewable in NSFW channels.`);
        }

        const _now = Date.now();
        client.cookies["chan_cd"] = client.cookies["chan_cd"] ?? _now;
        if(client.cookies["chan_cd"] > _now) {
            await sleep(client.cookies["chan_cd"] - _now);
        }
        client.cookies["chan_cd"] = Date.now() + chan_cooldown;

        try {
            const resp = await fetch(`https://a.4cdn.org/${board}/catalog.json`);
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            let i = 0, post = json[0].threads[i];
            while(post.sticky || post.capcode) { // get the first non-stickied and non-janny thread
                post = json[0].threads[++i];
            }

            const embed = new MessageEmbed()
                .setColor(nsfw ? "FED6AF" : "D1D5EE")
                .setAuthor(post.trip ?? post.name)
                .setTitle((post.sub ? `"${unescapeHTML(post.sub)}" - ` : "") + `No. ${post.no}`)
                .setURL(`https://boards.4chan.org/${board}/thread/${post.no}`)
                .setTimestamp(post.time * 1000);

            if(post.com) {
                const desc = unescapeHTML(post.com.replace(/\<br\>/g, "\n").replace(/(<([^>]+)>)/gi, ""));
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
    })
];
