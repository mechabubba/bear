const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const seedrandom = require("seedrandom");
const mineemoji = "\uD83D\uDCA5";

module.exports = new CommandBlock({
    identity: ["minesweeper", "ms", "minesweep"],
    summary: "Generates a Minesweeper board.",
    description: "Generates a playable Minesweeper board, using spoiler tags. The seed is optional and is random by default.",
    usage: "[length] [width] [mines] (-seed [...values])",
    scope: ["dm", "text", "news"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"]
  }, function(client, message, content, [length, width, maxmines, hasseed, ...args]) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();

    seed = hasseed == "-seed" ? args.join(" ") : undefined;
    let rng = seedrandom(seed);

    if(!length || !width || !maxmines) {
      message.react(negative);
      return message.channel.send(`<:_:${negative}> Missing an argument. Perform \`help ${this.firstName}\` for more information.`);
    }

    let area = length * width;
    if(maxmines > area) {
      message.react(negative);
      return message.reply(`<:_:${negative}> The mines on the field outnumber the fields area.`);
    } else if(area == 0) {
      message.react(negative);
      return message.reply(`<:_:${negative}> You can't create an empty board!`);
    } else if(area > 198) {
      message.react(negative);
      return message.reply(`<:_:${negative}> The board exceeds a maximum of 198 cells.`);
    }

    /* 
    // Embed descriptions are only able to hold 2048 characters.
    // Minesweeper cells are at most 7 characters (4 for the spoiler bars, at most 3 for the numbers - mines are 2 characters).
    // Newlines take up one character in themselves.

    // I *would* use this, however Discord messages limits the message to *display* only the first 198 emotes; the content is sent, and can be viewed in the "Edit message" box or if you're grabbing the raw content of the message via the API, however everything after 198 emotes does not display.
    let charea = (area * 7) + (length - 1);
    if(charea > 2048) {
      message.react(negative);
      return message.reply(`<:_:${negative}> The board exceeds a maximum of 2048 characters.`);
    }
    */

    let board = Array.from({length: length});
    for(i = 0; i < board.length; i++) {
      board[i] = Array.from({length: width});
    }

    let curmines = 0;
    while(curmines < maxmines) {
      let rl = Math.floor(rng() * length);
      let rw = Math.floor(rng() * width);
      if(board[rl][rw] == mineemoji) {
        continue;
      } else {
        board[rl][rw] = mineemoji;
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
    
    message.react(positive);
    const embed = new MessageEmbed()
      .setColor("C0C0C0")
      .setTitle("Minesweeper")
      .setDescription(tab)
      .attachFiles(["assets/mine.png"])
      .setFooter(`${length}x${width} • ${maxmines} mines${seed ? ` • ${seed}` : ``}`, "attachment://mine.png");
    return message.channel.send(embed);
  }
);
