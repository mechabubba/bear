const CommandBlock = require("../../modules/CommandBlock");
const { weightedRandom } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");

/**
 * Polar bear weights. The keys correspond to the images in `assets/bears/`. Higher numbers correspond to more common bears.
 * @todo I would like to credit whoever made these edits but I'm genuinely uncertain who did. I will look into it.
 */
const bears = {
    "bear.gif":   1000,
    "speedy.gif": 50,
    "child.gif":  10,
    "gay.gif":    10,
    "corrupted.gif": 10,
    "sugoi.gif":  1,
};

module.exports = new CommandBlock({
    names: ["bear"],
    description: "<a:_:588518103814504490>\n\n**Tip:** Try your luck to get a rare bear.",
    clientChannelPermissions: ["ATTACH_FILES"],
}, function(client, message, content, args) {
    if(!client.storage.has("local.bear")) {
        client.storage.set("local.bear", { points: 0 });
    }
    let bearpoints = client.storage.get("local.bear.points");
    bearpoints++;

    const img = weightedRandom(Object.keys(bears), bears);
    const embed = new MessageEmbed()
        .setColor("#FEFEFE")
        .setTitle("he's here...")
        .setImage(`attachment://${img}`)
        .setFooter({ text: `\uD83D\uDC3B ${bearpoints}` });
    message.reply({ embeds: [embed], files: [`assets/bears/${img}`], allowedMentions: { repliedUser: false } });

    client.storage.set("local.bear.points", bearpoints);
});
