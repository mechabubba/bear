const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const seedrandom = require("seedrandom");

const tiles = [
    "．",
    "１",
    "２",
    "３",
    "４",
    "５",
    "６",
    "７",
    "８",
    "＠", // Mine
];
const discordsux = 199; // The limit to how many mines can be viewed on the Discord client app. (read the comment below)

module.exports = new CommandBlock({
    identity: ["minesweeper", "ms"],
    summary: "Generates a Minesweeper board.",
    description: "Generates a playable Minesweeper board, using spoiler tags. The seed is optional and is random by default.\n\n**Tip:** The upper left corner will never be a mine; start there!",
    usage: "[length] [width] [mines] (-seed [...values])",
    scope: ["dm", "text", "news"],
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, async function(client, message, content, [length, width, maxmines, hasseed, ...args]) {
    const seed = hasseed == "-seed" ? args.join(" ") : undefined;
    const rng = seedrandom(seed);

    if(!length || !width || !maxmines) {
        return message.channel.send(`${client.reactions.negative.emote} Missing an argument. Perform \`help ${this.firstName}\` for more information.`);
    }

    const area = length * width;
    if(maxmines > (area - 1)) {
        return message.reply(`${client.reactions.negative.emote} The mines on the field outnumber the fields fillable area.`);
    } else if(area == 0) {
        return message.reply(`${client.reactions.negative.emote} You can't create an empty board!`);
    } else if(area > discordsux) {
        return message.reply(`${client.reactions.negative.emote} The board exceeds a maximum of \`${discordsux}\` cells.`);
    }

    // This implementation of minesweeper is a little weird, and here's why.
    // - Embed descriptions are only able to hold 2048 characters.
    // - Minesweeper cells are at most 5 characters (4 for the spoiler bars, 1 for the character itself.
    // - A previous implementation used emojis; with emojis it would be at most 3 for the numbers - mine emojis are 2 characters).
    // - Newlines take up one character in themselves.

    // The commented out solution below would theoretically allow any size minesweeper field below 2048 characters, but at the moment its not possible to use.
    // Discord's official web and mobile clients limit messages to display only the first 199 components. To clarify, the content is sent, and can be viewed in the "Edit message" box or if you're grabbing the raw content of the message via the API. However, everything after 199 components does not display.
    // In this case, a "component" is a piece of spoiler text or an emoji.
    // If for some ungodly reason a Discord employee is reading this, please remove or unrestrict these limitations from bots! You're hindering some great stuff here. :(
    /*
    let charea = (area * 5) + (length - 1);
    if(charea > (2000 - suffix.length)) {
      message.react(negative);
      return message.reply(`<:_:${negative}> The board exceeds a maximum of 2048 characters.`);
    }
    */

    const board = Array.from({ length: length });
    for(let i = 0; i < board.length; i++) {
        board[i] = Array.from({ length: width });
    }

    let curmines = 0;
    while(curmines < maxmines) {
        const rl = Math.floor(rng() * length);
        const rw = Math.floor(rng() * width);
        if(rl == 0 && rw == 0) continue; // Ignore the top left of the board.
        if(board[rl][rw] == tiles[9]) {
            continue;
        } else {
            board[rl][rw] = tiles[9];
            curmines++;
        }
    }

    for(let i = 0; i < board.length; i++) {
        for(let j = 0; j < board[i].length; j++) {
            let mines = 0;
            if(board[i][j] === tiles[9]) continue;
            if((j - 1 != -1) && board[i][j - 1] == tiles[9]) mines++; // left
            if((j - 1 != -1) && (i - 1 != -1) && board[i - 1][j - 1] == tiles[9]) mines++;  // top left
            if((i - 1 != -1) && board[i - 1][j] == tiles[9]) mines++; // top
            if((i - 1 != -1) && (j + 1 != board[i].length) && board[i - 1][j + 1] == tiles[9]) mines++; // top right
            if((j + 1 != board[i].length) && board[i][j + 1] == tiles[9]) mines++; // right
            if((j + 1 != board[i].length) && (i + 1 != board.length) && board[i + 1][j + 1] == tiles[9]) mines++; // bottom right
            if((i + 1 != board.length) && board[i + 1][j] == tiles[9]) mines++; // bottom
            if((i + 1 != board.length) && (j - 1 != -1) && board[i + 1][j - 1] == tiles[9]) mines++; // bottom left
            board[i][j] = tiles[mines];
        }
    }

    let tab = "";
    for(let i = 0; i < board.length; i++) {
        for(let j = 0; j < board[i].length; j++) {
            tab += ("||" + board[i][j] + "||");
        }
        tab += "\n";
    }

    const embed = new MessageEmbed()
        .setColor("#C0C0C0")
        .setTitle("Minesweeper")
        .setDescription(tab)
        .attachFiles(["assets/mine.png"])
        .setFooter(`${length} \u00D7 ${width} tiles • ${maxmines} mines${seed ? ` • ${seed}` : ``}`, "attachment://mine.png");
    return message.channel.send(embed);
});
