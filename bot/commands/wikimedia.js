const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const fetch = require("node-fetch");
const fileTypes = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const { has } = require("lodash");

module.exports = new CommandBlock({
    names: ["file", "wm", "wikimedia", "commons", "cc"],
    summary: "Retrieves a file from wikimedia (occasionally NSFW)",
    description: "Query a random or specific file from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Main_Page). This, rarely, will contain NSFW, graphic, or otherwise inappropriate content.",
    usage: "[page id]",
    nsfw: true,
    locked: false,
    clientChannelPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "ADD_REACTIONS"],
}, async function(client, message, content, args) {
    if (client.cookies.has(`wm-rate-limit-${message.author.id}`)) {
        if (moment().isBefore(client.cookies.get(`wm-rate-limit-${message.author.id}`))) {
            return message.react(client.config.get("metadata.reactions.cooldown").value());
        }
    }
    if (content && !/^\d+$/.test(content)) return message.channel.send(`Cannot query page as \`${content}\` is not a valid page id`);
    client.cookies.set(`wm-rate-limit-${message.author.id}`, moment().add("10", "s").valueOf());
    const response = await fetch(`http://commons.wikimedia.org/w/api.php?action=query${content ? "&pageids=" + content : "&generator=random&grnnamespace=6"}&prop=imageinfo&iiprop=url|timestamp&format=json`);
    const json = await response.json();
    const page = json.query.pages[Object.keys(json.query.pages)[0]];
    const embed = new MessageEmbed().setFooter(`This has a 10s cool down. Page ID: ${page.pageid}`);
    const color = client.config.get("metadata.color").value();
    if (color) embed.setColor(color);
    if (has(page, "missing")) {
        embed.setTitle("No page").setDescription("The queried page does not exist.");
        return message.channel.send(embed);
    }
    embed.setURL(`https://commons.wikimedia.org/w/index.php?curid=${page.pageid}`);
    if (!has(page, "imageinfo")) {
        embed.setTitle(page.title).setDescription("The queried page is not a file.");
        return message.channel.send(embed);
    }
    const { timestamp, url } = page.imageinfo[0];
    let title = page.title.replace(/\.[^/.]+$/, "").substring(5);
    if (title.length > 200) title = title.substring(0, 200).trim() + "...";
    embed.setTitle(title).setTimestamp(timestamp);
    if (fileTypes.includes(url.toLowerCase().substring(url.lastIndexOf(".")))) {
        embed.setImage(url);
    } else {
        embed.setDescription("Cannot display this file, use the above link to view.");
    }
    return message.channel.send(embed);
});
