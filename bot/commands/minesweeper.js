const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const mineemoji = "\uD83D\uDCA5"

module.exports = new CommandBlock({
    identity: ["minesweeper", "ms", "minesweep"],
    description: "Generates a playable minesweeper board.",
    usage: "[length] [width] [mines]",
    scope: ["dm", "text", "news"],
    nsfw: false,
    locked: false,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    userPermissions: null,
  }, function(client, message, content, [length, width, maxmines]) {
    if(!length || !width || !maxmines) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.channel.send("Usage: \`minesweeper [length] [width] [mines]\`");
    }

    let area = length * width
    if(maxmines > area) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.reply("The mines on the field outnumber the fields area!");
    }
    else if(area == 0) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.reply("You can't create an empty board!");
    }
    else if(area > 198) {
      message.react(client.config.get("metadata.reactions.negative").value());
      return message.reply("Only a maximum of 198 spaces are allowed on the field.");
    }

    let board = Array.from({length: length});
    for(i = 0; i < board.length; i++) {
      board[i] = Array.from({length: width});
    }

    let curmines = 0;
    while(curmines < maxmines) {
      let rlen = Math.floor(Math.random() * length);
      let rwid = Math.floor(Math.random() * width);
      if(board[rlen][rwid] == mineemoji) {
        continue;
      } else {
        board[rlen][rwid] = mineemoji;
        curmines++;
      }
    }

    for(i = 0; i < board.length; i++) {
      for(j = 0; j < board[i].length; j++) {
        let mines = 0;
        if(board[i][j] == mineemoji) continue;
        if((j - 1 != -1) && board[i][j-1] == mineemoji) mines++; // left
        if((j - 1 != -1) && (i - 1 != -1) && board[i-1][j-1] == mineemoji) mines++;  // top left
        if((i - 1 != -1) && board[i-1][j] == mineemoji) mines++; // top
        if((i - 1 != -1) && (j + 1 != board[i].length) && board[i-1][j+1] == mineemoji) mines++; // top right
        if((j + 1 != board[i].length) && board[i][j+1] == mineemoji) mines++; // right
        if((j + 1 != board[i].length) && (i + 1 != board.length) && board[i+1][j+1] == mineemoji) mines++; // bottom right
        if((i + 1 != board.length) && board[i+1][j] == mineemoji) mines++; // bottom
        if((i + 1 != board.length) && (j - 1 != -1) && board[i+1][j-1] == mineemoji) mines++; // bottom left
        board[i][j] = mines + "\u20E3";
      }
    }
    
    let tab = "";
    for(i = 0; i < board.length; i++) {
      for(j = 0; j < board[i].length; j++) {
        tab += ("||" + board[i][j] + "||");
      }
      tab += "\n";
    }
    
    message.react(client.config.get("metadata.reactions.positive").value());
    const embed = new MessageEmbed()
      .setColor("C0C0C0")
      .setTitle("Minesweeper")
      .setDescription(tab)
      .setFooter(`${length}x${width} • ${maxmines} Mines`, "https://b.catgirlsare.sexy/koRa.png");
    return message.channel.send(embed);
  }
);