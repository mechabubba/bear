/** booru.js - Image boards n' boorus n' stuff. */
const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");
const CommandBlock = require("../../modules/CommandBlock");
const { sleep, gitinfo, unescapeHTML } = require("../../modules/miscellaneous");

const log = require("../../modules/log");

const r34_post_limit = 1000; // The amount of posts to request from rule34.xxx. Set this to 1000 for a large amount of images.
const r34_cooldown = 500;    // Rate-limited to 2 requests per second.
const e621_cooldown = 500;   // Rate-limited to 2 requests per second.
const chan_cooldown = 1000;  // Rate-limited to 1 request per second.
const chan_canupdate = ["hosts"]; // A list of groups that can use the "4chan update" subcommand.

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
        identity: ["rule34", "r34"],
        description: "Gets (pseudo)random posts from [rule34](https://rule34.xxx).",
        usage: "(...tags)",
        nsfw: true,
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
    }, async function(client, message, content, args) {
        const _now = Date.now();
        client.cookies["r34_cd"] = client.cookies["r34_cd"] ?? _now;
        if(client.cookies["r34_cd"] > _now) {
            await sleep(client.cookies["r34_cd"] - _now);
        }
        client.cookies["r34_cd"] = Date.now() + r34_cooldown;

        message.channel.startTyping();
        try {
            log.debug(`https://api.rule34.xxx/index.php?page=dapi&s=post&json=1&q=index&limit=${r34_post_limit}&tags=${[...args].join("+")}`);
            const resp = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&json=1&q=index&limit=${r34_post_limit}&tags=${[...args].join("+")}`, {
                headers: { "User-Agent": `bear/${gitinfo("%h")} (by mechabubba)` }
            })
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            if(json.length == 0) throw new Error("No posts were found.");

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

            message.channel.stopTyping(true);
            return message.channel.send(embed);
        } catch(e) {
            message.channel.stopTyping(true);
            return message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);
        }
    }),
    new CommandBlock({
        identity: ["e621"],
        description: "Gets random posts from [e621](https://e621.net).",
        usage: "(...tags)",
        nsfw: true,
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
    }, async function(client, message, contents, args) {
        const _now = Date.now();
        client.cookies["e621_cd"] = client.cookies["e621_cd"] ?? _now;
        if(client.cookies["e621_cd"] > _now) {
            await sleep(client.cookies["e621_cd"] - _now);
        }
        client.cookies["chan_cd"] = Date.now() + e621_cooldown;
        
        message.channel.startTyping();
        try {
            log.debug(`https://e621.net/posts.json?limit=1&tags=${encodeURIComponent([...args, "order:random"].join(" "))}`);
            const resp = await fetch(`https://e621.net/posts.json?limit=1&tags=${encodeURIComponent([...args, "order:random"].join(" "))}`, {
                headers: { "User-Agent": `bear/${gitinfo("%h")} (by mechabubba)` }
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

            message.channel.stopTyping(true);
            return message.channel.send(embed);
        } catch(e) {
            message.channel.stopTyping(true);
            return message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);
        }
    }),
    new CommandBlock({
        identity: ["4chan", "4c"],
        description: "Pulls the latest op from a 4chan board.",
        usage: "[board]",
        scope: ["dm", "text", "news"],
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
    }, async function(client, message, contents, [board, ...args]) {
        // Updates our board cache.
        if(board == "update") {
            let canupdate = false;
            for(const group of chan_canupdate) {
                const g = client.storage.get(["users", group]).value();
                if(Array.isArray(g) && g.includes(message.author.id)) {
                    canupdate = true;
                    break;
                };
            }
            if(!canupdate) {
                return message.channel.send(`${client.reactions.negative.emote} You do not have permission to do this.`);
            }

            let boards;
            try {
                boards = get4chanBoards(client);
            } catch(e) {
                return message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);
            }

            client.storage.set(["local", "4chan", "boards"], boards).write();
            return message.channel.send(`${client.reactions.positive.emote} Board list updated.`);
        }

        // @todo on bot/command init, keep these in memory.
        const boards = client.storage.get(["local", "4chan", "boards"]).value();

        if(!board || !boards.any.includes(board)) {
            return message.channel.send(`${client.reactions.negative.emote} A board was not provided or doesn't exist.`);
        }

        const nsfw = boards.nsfw.includes(board);
        if(nsfw && !message.channel.nsfw) {
            return message.channel.send(`${client.reactions.negative.emote} This board is only viewable in a NSFW channel.`);
        }

        const _now = Date.now();
        client.cookies["chan_cd"] = client.cookies["chan_cd"] ?? _now;
        if(client.cookies["chan_cd"] > _now) {
            await sleep(client.cookies["chan_cd"] - _now);
        }
        client.cookies["chan_cd"] = Date.now() + chan_cooldown;

        message.channel.startTyping();
        try {
            const resp = await fetch(`https://a.4cdn.org/${board}/catalog.json`);
            if(!resp.ok) throw new Error(resp.statusText);

            const json = await resp.json();
            let i = 0, post = json[0].threads[i];
            while(post.sticky || post.capcode) { // get the first non-stickied and non-janny thread
                post = json[0].threads[++i];
            }

            const desc = unescapeHTML(post.com.replace(/\<br\>/g, "\n").replace(/(<([^>]+)>)/gi, ""));
            const embed = new MessageEmbed()
                .setColor(nsfw ? "FED6AF" : "D1D5EE")
                .setAuthor(post.trip ?? post.name)
                .setTitle((post.sub ? `"${unescapeHTML(post.sub)}" - ` : "") + `No. ${post.no}`)
                .setURL(`https://boards.4chan.org/${board}/thread/${post.no}`)
                .setDescription(`\`\`\`\n${desc.length > 4089 ? desc.substring(0, 4086) + "..." : desc}\`\`\``)
                .setTimestamp(post.time * 1000);

            if(post.tim && !post.filedeleted) {
                embed.setImage(`https://i.4cdn.org/${board}/${post.tim}${post.ext}`)
                    .setFooter(post.filename + post.ext);
            }

            message.channel.stopTyping(true);
            return message.channel.send(embed);

        } catch(e) {
            message.channel.stopTyping(true);
            return message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);
        }
    }),
    new CommandBlock({
        identity: ["bible"],
        description: "Pulls scriptures and psalms from the catholic bible.",
        usage: "[excerpt]",
        scope: ["dm", "text", "news"],
        locked: "hosts",
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, async function(client, message, contents, args) {
        return message.channel.send("todo because after the above two i need jesus");
    })
];