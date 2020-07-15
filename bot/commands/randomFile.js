const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const fetch = require("node-fetch");
const fileTypes = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

module.exports = new CommandBlock({
  identity: ["file", "wikimedia", "commons", "cc", "wm"],
  summary: "Retrieves a random file (occasionally NSFW)",
  description: "Retrieves a random file from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Main_Page). This, rarely, will contain NSFW or graphic content.",
  usage: null,
  scope: ["dm", "text", "news"],
  nsfw: true,
  locked: false,
  clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "ADD_REACTIONS"],
  userPermissions: null,
}, async function(client, message, content, args) {
  if (client.cookies.has(`wm-rate-limit-${message.author.id}`)) {
    if (moment().isBefore(client.cookies.get(`wm-rate-limit-${message.author.id}`))) {
      return message.react(client.config.get("metadata.reactions.cooldown").value());
    }
  }
  client.cookies.set(`wm-rate-limit-${message.author.id}`, moment().add("10", "s").valueOf());
  const response = await fetch("http://commons.wikimedia.org/w/api.php?action=query&generator=random&grnnamespace=6&prop=imageinfo&iiprop=url|timestamp&format=json");
  const json = await response.json();
  const page = json.query.pages[Object.keys(json.query.pages)[0]];
  const { timestamp, url, descriptionshorturl } = page.imageinfo[0];
  let title = page.title.replace(/\.[^/.]+$/, "").substring(5);
  if (title.length > 200) title = title.substring(0, 200).trim() + "...";
  const fileEmbed = new MessageEmbed()
    .setTitle(title)
    .setURL(descriptionshorturl)
    .setFooter("This has a 10 second cool down")
    .setTimestamp(timestamp)
    .setColor(client.config.get("metadata.color").value());
  if (fileTypes.includes(url.toLowerCase().substring(url.lastIndexOf(".")))) {
    fileEmbed.setImage(url);
  } else {
    fileEmbed.setDescription("Cannot display this file, use the above link to view");
  }
  return message.channel.send(fileEmbed);
});
