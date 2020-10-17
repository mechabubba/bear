const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const https = require("https");

module.exports = new CommandBlock({
    identity: "2b2t",
    summary: "Gets the current queue length of 2b2t.",
    description: "Gets the current queue length of 2b2t. Information fetched from [2b2t.io](https://2b2t.io/).",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, function(client, message, content, args) {
    https.get("https://2b2t.io/api/queue?last=true", (resp) => {
      let data = "";
      resp.on("data", (chunk) => data += chunk);
      resp.on("end", () => {
        let len = JSON.parse(data)[0][1];
        const embed = new MessageEmbed()
          .setColor("FFAA00")
          .setTitle(`The 2b2t queue is \`${len}\` users long.`);
        message.channel.send(embed);
      });
    }).on("error", (e) => {
      message.channel.send(`\`\`\`\n${e}\`\`\``);
    });
  }
);