const CommandBlock = require("../../modules/CommandBlock");
const { weightedRandom } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");

/**
 * Polar bear weights. The keys correspond to the images in `assets/bears/`. Higher numbers correspond to more rare bears.
 * @todo I would like to credit whoever made these edits but I'm genuinely uncertain who did. I will look into it.
 */
const bears = {
    "bear.gif":   1000,
    "speedy.gif": 100,
    "child.gif":  50,
    "gay.gif":    50,
    "corrupted.gif": 50,
    "sugoi.gif":  1,
};

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

    const img = weightedRandom(Object.keys(bears), bears);
    const embed = new MessageEmbed()
        .setColor("#FEFEFE")
        .setTitle("he's here...")
        .attachFiles([`assets/bears/${img}`])
        .setImage(`attachment://${img}`)
        .setFooter(`\uD83D\uDC3B ${bearpoints}`);
    message.channel.send(embed);

    client.storage.set("local.bear.points", bearpoints).write();
});
