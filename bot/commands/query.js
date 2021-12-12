const { query } = require("gamedig");
const { MessageEmbed, Util } = require("discord.js");
const CommandBlock = require("../../modules/CommandBlock");
const log = require("../../modules/log");

module.exports = new CommandBlock({
    identity: ["query", "q", "srcds"],
    summary: "Querys a source engine server.",
    description: "Querys a source engine server. The port is optional and defaults to `27015`.",
    usage: "ip:port",
    scope: ["dm", "text", "news"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, async function(client, message, content, [ip, port]) {
    if(!ip) return message.channel.send(`${client.reactions.negative.emote} You must input a server IP. Perform \`help ${this.firstName}\` for more information.`);
    ip = ip.toLowerCase();

    message.channel.startTyping();
    if(ip.match(/:/g)) {
        const split = ip.split(":");
        ip = split[0];
        port = split[split.length - 1];
    }

    const vanity = ip + (port ? `:${port}` : "");
    const embed = new MessageEmbed();

    let info;
    try {
        info = await query({
            type: "protocol-valve",
            host: ip,
            port: port || "27015",
        });
    } catch(e) {
        embed.setTitle(vanity)
            .setColor("#F04747")
            .setFooter("This server is offline.", `https://cdn.discordapp.com/emojis/${client.reactions.offline.id}.png`);
        message.channel.stopTyping(true);
        return message.channel.send(embed);
    }

    embed.setTitle(info.name)
        .setColor("#43B581")
        .addField(`Basic Info`, `IP: \`${vanity}\`\nConnect: steam://connect/${vanity}`)
        .setFooter("This server is online!", `https://cdn.discordapp.com/emojis/${client.reactions.online.id}.png`);

    let players = "";
    info.players.sort((a, b) => (a.score < b.score) ? 1 : -1);
    for(let i = 0; i < info.players.length; i++) {
        const ply = info.players[i];
        players += `${i + 1}. ${ply.name ? `${ply.name} (${ply.score})` : "Joining in..."}\n`;
    }
    if(!players) players = "Dead server. :(";
    players = Util.escapeMarkdown(players);

    embed.addField(`Current Players (${info.players.length} / ${info.maxplayers}${info.players.length >= info.maxplayers ? " - full!" : ``})`, players)
        .addField(`Current Map`, `\`${info.map}\``);

    message.channel.stopTyping(true);
    return message.channel.send(embed);
});
