const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");

module.exports = new CommandBlock({
    identity: "bear",
    description: "the man can run",
    scope: ["dm", "text", "news"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, function(client, message, content, args) {
    if(!client.storage.has("local.bear").value()) {
        client.storage.set("local.bear", { points: 0 }).write();
    }
    let bearpoints = client.storage.get("local.bear.points").value();
    bearpoints++;

    const embed = new MessageEmbed()
        .setColor("#FEFEFE")
        .setTitle("he's here...")
        .attachFiles(["assets/bear.gif"])
        .setImage("attachment://bear.gif")
        .setFooter(`\uD83D\uDC3B ${bearpoints}`);
    message.channel.send(embed);

    client.storage.set("local.bear.points", bearpoints).write();
});
