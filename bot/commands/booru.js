/** booru.js - Image boards n' boorus n' stuff. */
const CommandBlock = require("../../modules/CommandBlock");
const { sleep, unescapeHTML, useragents } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");
const { isArray } = require("lodash");
const fetch = require("node-fetch");

const r34_post_limit = 500;  // The amount of posts to request from rule34.xxx. [1-1000]
const r34_cooldown = 500;    // Rate-limited to 2 requests per second.
const e621_cooldown = 500;   // Rate-limited to 2 requests per second.
const chan_canupdate = ["hosts"]; // A list of groups that can use the "4chan update" subcommand.
const chan_cooldown = 1000;  // Rate-limited to 1 request per second.

/**
 * Gets a list of 4chan boards and organizes them based on if they're red or blue boards.
 * @param {Client} client 
 * @returns 
 */
const get4chanBoards = async () => {
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
        names: ["rule34", "r34"],
        description: "Gets (pseudo)random posts from [rule34](https://rule34.xxx).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async function(client, message, content, args) {
        const _now = Date.now();
        client.cookies["r34_cd"] = client.cookies["r34_cd"] ?? _now;
        if(client.cookies["r34_cd"] > _now) {
            await sleep(client.cookies["r34_cd"] - _now);
        }
        client.cookies["r34_cd"] = Date.now() + r34_cooldown;

        try {
            const resp = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&json=1&q=index&limit=${r34_post_limit}&tags=${[...args].join("+")}`, {
                headers: { "User-Agent": useragents.bear }
            })
            if(!resp.ok) throw new Error(resp.statusText);

            const text = await resp.text();
            if(!text) throw new Error("No posts were found."); // Empty response indicates no posts found.
            
            const json = await resp.json();
            const img = json[Math.floor(Math.random() * json.length)];
            img.tags = img.tags.split(" ");

            const embed = new MessageEmbed()
                .setColor("AAE5A3")
                .setURL(`https://rule34.xxx/index.php?page=post&s=view&id=${img.id}`);

            if(img.tags.includes("video")) {
                embed.setTitle(`ID: #${img.id} \uD83C\uDFA5`)
                    .setImage(img.sample_url);
            } else {
                embed.setTitle(`ID: #${img.id}`)
                    .setImage(img.file_url);
            }

            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),
    new CommandBlock({
        names: ["e621"],
        description: "Gets random posts from [e621](https://e621.net).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async function(client, message, contents, args) {
        const _now = Date.now();
        client.cookies["e621_cd"] = client.cookies["e621_cd"] ?? _now;
        if(client.cookies["e621_cd"] > _now) {
            await sleep(client.cookies["e621_cd"] - _now);
        }
        client.cookies["chan_cd"] = Date.now() + e621_cooldown;
        
        try {
            const resp = await fetch(`https://e621.net/posts.json?limit=1&tags=${encodeURIComponent([...args, "order:random"].join(" "))}`, {
                headers: { "User-Agent": useragents.bear }
            })
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            if(json.posts.length == 0) throw new Error("No posts were found.");

            const img = json.posts[0];
            const embed = new MessageEmbed()
                .setColor("223457")
                .setURL(`https://e621.net/posts/${img.id}`);

            if(img.file.ext == "webm" || img.file.ext == "swf") {
                embed.setTitle(`ID: #${img.id} \uD83C\uDFA5`)
                    .setImage(img.sample.url);
            } else {
                embed.setTitle(`ID: #${img.id}`)
                    .setImage(img.file.url);
            }

            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),
    new CommandBlock({
        names: ["4chan", "4c"],
        description: "Pulls the latest op from a 4chan board.",
        usage: "[board]",
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async function(client, message, contents, [board, ...args]) {
        if(board == "update") {
            // We need this to update our cache of available boards, incase some /qb/ shit gets pulled.
            const isallowed = (userID) => {
                for(const group of chan_canupdate) {
                    const g = client.storage.get(["users", group]);
                    if(isArray(g) && g.includes(userID)) return true;
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
            return message.reply(`${client.reactions.negative.emote} The board list is not cached. Run \`4chan update\` to do that!`);
        }

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
