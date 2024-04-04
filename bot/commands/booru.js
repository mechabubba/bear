/** Image boards n' boorus n' stuff. */
const CommandBlock = require("../../modules/CommandBlock");
const { sleep, useragents } = require("../../modules/miscellaneous");
const { URL } = require("../../modules/regexes");
const { MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");

/**
 * The result returned from execute().
 * @typedef {Object} BooruOptions
 * @property {string} url The url of the post.
 * @property {string} endpoint The endpoint to reach.
 * @property {string?} params URL parameters.
 * @property {string?} tags The tag parameter name.
 * @property {string} responseType The format of the response.
 * @property {number} cooldown How long in ms to cooldown.
 * @property {number} postLimit The limit on how many posts to grab. This is usually in place due to non-random searching.
 * @property {string} color The color of the site/embed.
 */

/**
 * Booru information.
 * @readonly
 * @type {[BooruOptions]}
 */
const boorus = {
    "danbooru": {
        url: "https://danbooru.donmai.us/posts/",
        endpoint: "https://danbooru.donmai.us/posts.json",
        params: "limit=1",
        responseType: "json",
        cooldown: 500,
        color: "1E1E2C",
    },
    "r34": {
        url: "https://rule34.xxx/index.php?page=post&s=view&id=",
        endpoint: "https://api.rule34.xxx/index.php",
        params: "page=dapi&s=post&json=1&q=index&limit=500", /** This booru lacks a random filter, so pull a shitload. */
        responseType: "json",
        cooldown: 500,
        color: "AAE5A3",
    },
    "e621": {
        url: "https://e621.net/posts/",
        endpoint: "https://e621.net/posts.json",
        params: "limit=1",
        responseType: "json",
        cooldown: 500,
        color: "223457",
    },
    "e926": {
        url: "https://e926.net/posts/",
        endpoint: "https://e926.net/posts.json",
        params: "limit=1",
        responseType: "json",
        cooldown: 500,
        color: "223457",
    },
    "safebooru": {
        url: "https://safebooru.org/index.php?page=post&s=view&id=",
        endpoint: "https://safebooru.org/index.php?page=dapi&s=post&q=index",
        params: "",
        responseType: "xml",
        cooldown: 500,
        color: "FFFFFF",
    },
    "derpibooru": {
        url: "https://derpibooru.org/images/",
        endpoint: "https://derpibooru.org/api/v1/json/search/images",
        params: "per_page=1&random_image=y",
        responseType: "json",
        tags: "q",
        cooldown: 500,
        color: "1D2B44",
    },
    "furbooru": {
        url: "https://furbooru.org/images/",
        endpoint: "https://furbooru.org/api/v1/json/search/images",
        params: "per_page=1&random_image=y",
        responseType: "json",
        tags: "q",
        cooldown: 500,
        color: "251C36",
    }
};

/**
 * Helper function to wait if we're on cooldown from pulling data from a site.
 * @todo rewrite will make it so adding client as param is moot, wahoo :)
 */
const cooldown = async (client, source) => {
    const now = Date.now();
    client.cookies[`${source}_cooldown`] = client.cookies[`${source}_cooldown`] ?? now;
    if(client.cookies[`${source}_cooldown`] > now) {
        await sleep(client.cookies[`${source}_cooldown`] - now);
    }
    client.cookies[`${source}_cooldown`] = Date.now() + boorus[source].cooldown;
}

/**
 * Helper function to fetch stuff from an endpoint.
 * @param {string} source The booru source.
 * @param {string} tags The tags to use.
 * @returns 
 */
const fetchContent = async (source, tags) => {
    const url = `${boorus[source].endpoint}?${boorus[source].params}${boorus[source].params ? '&' : ''}${boorus[source].tags ?? "tags"}=${tags}`;
    const resp = await fetch(url, {
        headers: {
            "User-Agent": useragents.bear
        }
    });
    if (!resp.ok) throw new Error(resp.statusText);

    const result = await resp[boorus[source].responseType]();
    return result;
}

/**
 * The result returned from execute().
 * @typedef {Object} EmbedOptions
 * @property {string} full_img A URL to the image.
 * @property {string} sample_img A URL to a thumbnail.
 * @property {string} id The post ID.
 */

/**
 * Creates an embed from the data.
 * @param {string} soruce 
 * @param {EmbedOptions} data 
 */
const createEmbed = (source, data) => {
    const embed = new MessageEmbed()
        .setColor(boorus[source].color)
        .setURL(`${boorus[source].url}${data.id}`)
        .setTitle(`ID: ${data.id}`)
        .setImage(data.full_img || "");

    const ext = data.full_img.match(URL)[5];
    if(ext == "webm" || ext == "swf" || ext == "mp4" || ext == "mkv") {
        embed.title += " \uD83C\uDFA5";
    }

    return embed;
}

module.exports = [
    new CommandBlock({
        names: ["danbooru"],
        description: "Gets random posts from [danbooru](https://danbooru.donmai.us).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"]
    }, async (client, message, content, args) => {
        await cooldown(client, "danbooru");

        try {
            const json = await fetchContent("danbooru", encodeURIComponent([...args, "order:random"].join(" ")));
            console.debug(json);
            if(json.length == 0) throw new Error("No posts were found.");

            const embed = createEmbed("e621", {
                full_img: json[0].file_url,
                sample_img: json[0].large_file_url,
                id: json[0].id
            });
            console.debug(embed)
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),

    new CommandBlock({
        names: ["rule34", "r34"],
        description: "Gets (pseudo)random posts from [rule34](https://rule34.xxx).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async (client, message, content, args) => {
        await cooldown(client, "r34");

        try {
            const json = await fetchContent("r34", [...args].join("+")); // @todo reason to shallow copy?
            const img = json[Math.floor(Math.random() * json.length)];

            const embed = createEmbed("r34", {
                full_img: img["file_url"],
                sample_img: img["sample_url"],
                id: img["id"]
            });
            console.debug(embed);
            console.debug(typeof embed);
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            if(e.type === "invalid-json") {
                e.message = "Invalid json response recieved. This typically means no posts were found.";
            }
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),

    new CommandBlock({
        names: ["e621"],
        description: "Gets random posts from [e621](https://e621.net).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async (client, message, contents, args) => {
        await cooldown(client, "e621");

        try {
            const json = await fetchContent("e621", encodeURIComponent([...args, "order:random"].join(" ")));
            if(json.posts.length == 0) throw new Error("No posts were found.");

            const embed = createEmbed("e621", {
                full_img: json.posts[0].file.url,
                sample_img: json.posts[0].sample.url,
                id: json.posts[0].id
            });
            console.debug(embed);
            console.debug(typeof embed);
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),

    new CommandBlock({
        names: ["e926"],
        description: "Gets random posts from [e926](https://e926.net).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async (client, message, contents, args) => {
        await cooldown(client, "e926");

        try {
            const json = await fetchContent("e926", encodeURIComponent([...args, "order:random"].join(" ")));
            if(json.posts.length == 0) throw new Error("No posts were found.");

            const embed = createEmbed("e926", {
                full_img: json.posts[0].file.url,
                sample_img: json.posts[0].sample.url,
                id: json.posts[0].id
            });
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),

    new CommandBlock({
        names: ["derpibooru"],
        description: "Gets random posts from [Derpibooru](https://derpibooru.org/).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async (client, message, contents, args) => {
        await cooldown(client, "derpibooru");

        try {
            const json = await fetchContent("derpibooru", encodeURIComponent(args.join(" ")));
            if(json.images.length == 0) throw new Error("No posts were found.");

            const embed = createEmbed("derpibooru", {
                full_img: json.images[0].representations.full,
                sample_img: json.images[0].representations.medium,
                id: json.images[0].id
            });
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),

    new CommandBlock({
        names: ["furbooru"],
        description: "Gets random posts from [Furbooru](https://derpibooru.org/).",
        usage: "[...tags]",
        nsfw: true,
        clientChannelPermissions: ["ATTACH_FILES"],
    }, async (client, message, contents, args) => {
        await cooldown(client, "furbooru");

        try {
            const json = await fetchContent("furbooru", encodeURIComponent(args.join(" ")));
            if(json.images.length == 0) throw new Error("No posts were found.");

            const embed = createEmbed("furbooru", {
                full_img: json.images[0].representations.full,
                sample_img: json.images[0].representations.medium,
                id: json.images[0].id
            });
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
        }
    }),
];
