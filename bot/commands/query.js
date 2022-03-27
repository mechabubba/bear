const dns = require("dns").promises;
const { MessageEmbed, Util } = require("discord.js");
const query = require("source-server-query");
const CommandBlock = require("../../modules/CommandBlock");

const ipv4 = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/; // https://stackoverflow.com/a/36760050/17188891

module.exports = new CommandBlock({
    identity: ["query", "q", "srcds"],
    description: "Querys a Source engine server. The port is optional and is `27015` by default.",
    usage: "ip:port",
    locked: "hosts",
}, async function(client, message, content, [ip, port]) {
    if(!ip) return message.reply(`${client.reactions.negative.emote} You must input a server IP. Perform \`help ${this.firstName}\` for more information.`);
    ip = ip.toLowerCase();

    if(ip.match(/:/g)) {
        const split = ip.split(":");
        ip = split[0];
        port = split[split.length - 1];

        let parsed = parseInt(port);
        if(!parsed || (parsed < 0 || parsed > 65535)) {
            port = 27015;
        } else {
            port = parsed;
        }
    } else {
        port = 27015;
    }

    const vanity = ip + (port == 27015 ? "" : `:${port}`);

    if(!ipv4.test(ip)) {
        try {
            ip = await resolveHostname(ip);
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``)
        }
    }

    const embed = new MessageEmbed();
    let info, players;
    try {
        info = await query.info(ip, port);
        players = await query.players(ip, port);
    } catch(e) {
        embed.setTitle(vanity)
            .setColor("#F04747")
            .setFooter({ text: "This server is offline.", iconURL: `https://cdn.discordapp.com/emojis/${client.reactions.offline.id}.png` });
        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
    console.log(info);
    console.log(players);

    embed.setTitle(info.name)
        .setColor("#43B581")
        .addField(`Basic Info`, `IP: \`${vanity}\`\nConnect: steam://connect/${vanity}`)
        .setFooter({ text: "This server is online!", iconURL: `https://cdn.discordapp.com/emojis/${client.reactions.online.id}.png` });

    let plys = "";
    players.sort((a, b) => (a.score < b.score) ? 1 : -1);
    for(let i = 0; i < players.length; i++) {
        const ply = players[i];
        plys += `${i + 1}. ${ply.name ? `${ply.name} (${ply.score})` : "Joining in..."}\n`;
    }
    if(!plys) plys = "Dead server. :(";
    plys = Util.escapeMarkdown(plys);

    embed.addField(`Current Players (${info.players}/${info.maxplayers}${info.players >= info.maxplayers ? " - full!" : ``})`, plys)
        .addField(`Current Map`, `\`${info.map}\``);

    return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
});

/**
 * Resolves an IP from a given hostname.
 * https://stackoverflow.com/a/71580190/17188891
 * @param {string} hostname - The hostname to give it. 
 * @returns {string} The IP, if it could be resolved.
 */
async function resolveHostname(hostname) {
    let obj = await dns.lookup(hostname).catch((error) => {
        throw error;
    });
    if(obj?.address) {
        return obj.address;
    }
    throw new Error("IP could not be resolved.");
}