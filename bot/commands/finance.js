const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const finance = require("yahoo-finance");

// Groups who can create aliases for ticker symbols.
const canalias = ["hosts"];

module.exports = new CommandBlock({
    names: ["finance", "f"],
    description: "Gets stock and crypto data from [Yahoo! Finance](https://finance.yahoo.com).",
    usage: "[symbol]",
}, function(client, message, content, [symbol, ...args]) {
    if(!client.storage.has(["local", "finance_aliases"])) {
        client.storage.set(["local", "finance_aliases"], {});
    }

    if(!symbol) return message.reply(`${client.reactions.negative.emote} You must use a valid symbol. See \`help finance\` for more information.`);

    const isallowed = (userID) => {
        for(const group of canalias) {
            const g = client.storage.get(["users", group]);
            if(Array.isArray(g) && g.includes(userID)) return true;
        }
        return false;
    };

    switch(symbol) {
        case "addalias": {
            if(!isallowed(message.author.id)) {
                return message.reply(`${client.reactions.negative.emote} You do not have permission to do this.`);
            }

            const [alias, sym] = [args[0], args[1]];
            client.storage.set(["local", "finance_aliases", alias], sym);
            return message.reply({ content: `${client.reactions.positive.emote} Set alias \`${alias}\` for symbol \`${sym}\`.`, allowedMentions: { repliedUser: false } });
        }

        case "removealias": {
            if(!isallowed(message.author.id)) {
                return message.reply(`${client.reactions.negative.emote} You do not have permission to do this.`);
            }

            const alias = args[0];
            if(!client.storage.has(["local", "finance_aliases", alias])) {
                return message.reply(`${client.reactions.negative.emote} This alias doesn't exist!`);
            }

            client.storage.delete(["local", "finance_aliases", alias]);
            return message.reply({ content: `${client.reactions.positive.emote} Removed alias \`${alias}\`.`, allowedMentions: { repliedUser: false } });
        }

        default: {
            symbol = symbol ?? client.storage.get(["local", "finance_aliases", symbol]);
            finance.quote({ symbol: symbol }, (e, quotes) => {
                if(e) return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);

                const [sd, p] = [quotes.summaryDetail, quotes.price];
                if(p.regularMarketPrice == null || p.regularMarketChange == null || p.regularMarketChangePercent == null) {
                    return message.reply(`${client.reactions.negative.emote} The ticker symbol was not found.`);
                }

                const embed = new MessageEmbed();
                const gain = p.regularMarketChangePercent >= 0;
                if(p.regularMarketChangePercent == 0) {
                    embed.setColor("#6B6F82");
                } else if(gain) {
                    embed.setColor("#43B581");
                } else {
                    embed.setColor("#F04747");
                }

                embed.setTitle(`\`${(p.regularMarketPrice).toFixed(4)}\` ${gain ? "+" : ""}${(p.regularMarketChange).toFixed(4)} (${gain ? "+" : ""}${(p.regularMarketChangePercent * 100).toFixed(4)}%)`)
                    .setFooter({ text: "Data from Yahoo! Finance" })
                    .setTimestamp(p.regularMarketTime)
                    .setAuthor({
                        name: p.shortName || p.longName ? `${p.shortName || p.longName} (${p.symbol})` : p.symbol,
                        url: `https://finance.yahoo.com/quote/${p.symbol}`
                    });

                const desc = (sd.previousClose != null ? `Prev. Close:   ${(sd.previousClose).toFixed(4)}\n` : "") +
                    (sd.dayLow != null && sd.dayHigh != null ? `Day's Range:   ${(sd.dayLow).toFixed(4)} - ${(sd.dayHigh).toFixed(4)}\n` : "") +
                    (sd.fiftyTwoWeekLow != null && sd.fiftyTwoWeekHigh != null ? `52 Week Range: ${(sd.fiftyTwoWeekLow).toFixed(4)} - ${(sd.fiftyTwoWeekHigh).toFixed(4)}\n` : "") +
                    (sd.marketCap != null ? `Market Cap:    ${sd.marketCap}\n` : "") +
                    (sd.volume != null ? `Volume:        ${sd.volume}` : "");
                embed.setDescription(`\`\`\`\n${desc.trim()}\`\`\``);
                return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
            });
        }
    }
});
