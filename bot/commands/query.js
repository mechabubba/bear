/*
todo: i kinda wanna write my own srcds server querier... that'd be kinda Neat.
*/
const { query } = require("gamedig");
const { MessageEmbed } = require("discord.js");
const CommandBlock = require("../../modules/CommandBlock");
//const log = require("../../modules/log");

module.exports = new CommandBlock({
    identity: ["query", "q"],
    description: "Querys a source engine server. The port is optional and defaults to \`27015\`.",
    usage: "ip:port",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, async function(client, message, content, [ip, port]) {
    const online = client.config.get("metadata.reactions.online").value();
    const offline = client.config.get("metadata.reactions.offline").value();
    const negative = client.config.get("metadata.reactions.negative").value();

    if(!ip) return message.channel.send(`<:_:${negative}> You must input a server IP. Perform \`help ${this.firstName}\` for more information.`);
    ip = ip.toLowerCase();

    if(ip.match(/:/g)) {
      let split = ip.split(":");
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
        port: port || "27015"
      });
    } catch(e) { 
      embed.setTitle(vanity);
      embed.setColor("#F04747")
      embed.setFooter("This server is offline.", `https://cdn.discordapp.com/emojis/${offline}.png`);
      return message.channel.send(embed);
    }

    //let rules = "";
    //for(let [key, value] of Object.entries(info.raw.rules)) rules += `${key} ${value}\n`;
    //log.debug(rules);
    //log.debug(rules.length);

    embed.setColor("#43B581")
    embed.setFooter("This server is online!", `https://cdn.discordapp.com/emojis/${online}.png`);

    embed.setTitle(info.name);
    embed.addField(`Basic Info`, `IP: \`${vanity}\`\nConnect: steam://connect/${vanity}`);

    let players = "";
    for(i = 0; i < info.players.length; i++) {
      let ply = info.players[i];
      players += `${i + 1}. ${ply.name ? `${ply.name} (${ply.score})` : "Joining in..."}\n`;
    }
    if(!players) {
      players = "Dead server. :(";
    }
    embed.addField(`Current Players (${info.players.length} / ${info.maxplayers}${info.players.length >= info.maxplayers ? " - full!" : ``})`, players);
    embed.addField(`Current Map`, `\`${info.map}\``);

    return message.channel.send(embed);
  }
);