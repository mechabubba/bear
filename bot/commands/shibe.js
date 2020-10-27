// shibes <3
const CommandBlock = require("../../modules/CommandBlock");
const http = require("http");

module.exports = new CommandBlock({
    identity: "shibe",
    summary: "Gets a shibe.",
    description: "Gets a shibe. Images fetched from [shibe.online](https://shibe.online/).",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
    userPermissions: null,
  }, function(client, message, content, args) {
    const negative = client.config.get("metadata.reactions.negative").value();
    http.get('http://shibe.online/api/shibes?count=1&urls=true&httpsUrls=true', (resp) => {
      let data = "";
      resp.on("data", (chunk) => data += chunk);
      resp.on("end", () => {
        let link = JSON.parse(data)[0];
        message.channel.send({ files: [link] })
      });
    }).on("error", (e) => {
      message.channel.send(`<:_:${negative}> An error occured;\`\`\`\n${e.message}\`\`\``);
    });
  }
);