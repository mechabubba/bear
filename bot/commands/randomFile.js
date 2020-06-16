const CommandModule = require("../../modules/CommandModule");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const fetch = require("node-fetch");

module.exports = new CommandModule({
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
      return message.react("⏳");
    }
  }
  client.cookies.set(`wm-rate-limit-${message.author.id}`, moment().add("10", "s").valueOf());
  const response = await fetch("http://commons.wikimedia.org/w/api.php?action=query&generator=random&grnnamespace=6&prop=imageinfo&iiprop=url&format=json");
  const json = await response.json();
  const page = json.query.pages[Object.keys(json.query.pages)[0]];
  const { url } = page.imageinfo[0];
  const fileEmbed = new MessageEmbed()
    .setTitle("Random File")
    .setDescription(page.title.replace(/\.[^/.]+$/, "").substring(5))
    .setFooter("File retrieved from Wikimedia Commons. This has a 10 second cool down.")
    .setTimestamp();
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(url.toLowerCase().substring(url.lastIndexOf(".")))) {
    fileEmbed.setImage(url);
  } else {
    fileEmbed.addField("Link", url);
  }
  return message.channel.send(fileEmbed);
});
