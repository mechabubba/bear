const CommandBlock = require("../../modules/CommandBlock");
const { DateTime } = require("luxon");

const sdate = new Date(1993, 8, 1); // The beginning of Eternal September. Month index starts at 0.

module.exports = [
    new CommandBlock({
        names: ["thetime", "time"],
        description: "Tells the time.",
    }, (client, message, content, args) => {
        return message.reply({ content: `It is currently **${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}.**`, allowedMentions: { repliedUser: false } });
    }),
    new CommandBlock({
        names: ["sdate"],
        description: "Gets the date with respect to [the September that never ended](https://en.wikipedia.org/wiki/Eternal_September).",
    }, function(client, message, content, args) {
        const since = Math.ceil((Date.now() - sdate.getTime()) / (1000 * 60 * 60 * 24));
        const d1 = (since % 10);
        const d2 = (since / 10) % 10 | 0;
        let suffix;
        if(d2 == 1) {
            suffix = "th";
        } else {
            switch(d1) {
                case 1: suffix = "st"; break;
                case 2: suffix = "nd"; break;
                case 3: suffix = "rd"; break;
                default: suffix = "th"; break;
            }
        }
        return message.reply({ content: `Today is **September ${since + suffix}, 1993.**`, allowedMentions: { repliedUser: false } });
    }),
];
