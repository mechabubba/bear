const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const finance = require("yahoo-finance");

// Groups who can create aliases for ticker symbols.
const canalias = ["hosts"];

module.exports = new CommandBlock({
    identity: ["finance", "f"],
    description: "Gets stock and crypto data from [Yahoo! Finance](https://finance.yahoo.com).",
    scope: ["dm", "text", "news"],
    usage: "[symbol]",
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, function(client, message, content, [symbol, ...args]) {
    if(!symbol) return message.channel.send(`${client.reactions.negative.emote} You must use a valid symbol. See \`help finance\` for more information.`);
    if(!client.storage.has(["local", "finance_aliases"]).value()) {
        client.storage.set(["local", "finance_aliases"], {}).write();
    }

    const isallowed = (client, userID) => {
        for(const group of canalias) {
            const g = client.storage.get(["users", group]).value();
            if(Array.isArray(g) && g.includes(userID)) return true;
        }
        return false;
    };

    switch(symbol) {
        case "addalias": {
            if(!isallowed(client, message.author.id)) return;
            const [alias, sym] = [args[0], args[1]];
            client.storage.set(["local", "finance_aliases", alias], sym).write();
            return message.channel.send(`${client.reactions.positive.emote} Set alias \`${alias}\` for symbol \`${sym}\`.`);
        }

        case "removealias": {
            if(!isallowed(client, message.author.id)) return;
            const alias = args[0];
            if(!client.storage.has(["local", "finance_aliases", alias]).value()) return message.channel.send(`<:_:${negative}> This alias doesn't exist!`);
            client.storage.get(["local", "finance_aliases"]).unset(alias).value();
            return message.channel.send(`${client.reactions.positive.emote} Removed alias \`${alias}\`.`);
        }

        default: {
            message.channel.startTyping();
            if(client.storage.has(["local", "finance_aliases", symbol]).value()) {
                symbol = client.storage.get(["local", "finance_aliases", symbol]).value();
            }
            finance.quote({
                symbol: symbol,
            }, (e, quotes) => {
                message.channel.stopTyping(true);
                if(e) return message.channel.send(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e}\`\`\``);

                const [sd, p] = [quotes.summaryDetail, quotes.price];
                if(p.regularMarketPrice == null || p.regularMarketChange == null || p.regularMarketChangePercent == null) return message.channel.send(`${client.reactions.negative.emote} The ticker symbol was not found.`);

                const embed = new MessageEmbed();
                const gain = p.regularMarketChangePercent >= 0;
                if(p.regularMarketChangePercent == 0) {
                    embed.setColor("#6B6F82");
                } else if(gain) {
                    embed.setColor("#43B581");
                } else {
                    embed.setColor("#F04747");
                }

                embed.setAuthor(p.shortName || p.longName ? `${p.shortName || p.longName} (${p.symbol})` : p.symbol, null, `https://finance.yahoo.com/quote/${p.symbol}`)
                    .setTitle(`\`${(p.regularMarketPrice).toFixed(4)}\` ${gain ? "+" : ""}${(p.regularMarketChange).toFixed(4)} (${gain ? "+" : ""}${(p.regularMarketChangePercent * 100).toFixed(4)}%)`)
                    .setFooter("Data from Yahoo! Finance")
                    .setTimestamp(p.regularMarketTime);

                const desc = (sd.previousClose != null ? `Prev. Close:   ${(sd.previousClose).toFixed(4)}\n` : "") +
                       (sd.dayLow != null && sd.dayHigh != null ? `Day's Range:   ${(sd.dayLow).toFixed(4)} - ${(sd.dayHigh).toFixed(4)}\n` : "") +
                       (sd.fiftyTwoWeekLow != null && sd.fiftyTwoWeekHigh != null ? `52 Week Range: ${(sd.fiftyTwoWeekLow).toFixed(4)} - ${(sd.fiftyTwoWeekHigh).toFixed(4)}\n` : "") +
                       (sd.marketCap != null ? `Market Cap:    ${sd.marketCap}\n` : "") +
                       (sd.volume != null ? `Volume:        ${sd.volume}` : "");
                embed.setDescription(`\`\`\`\n${desc.trim()}\`\`\``);
                return message.channel.send(embed);
            });
        }
    }
});
