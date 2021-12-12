const CommandBlock = require("../../modules/CommandBlock");
const { DateTime } = require("luxon");

const sdate = new Date(1993, 8, 1); // The beginning of Eternal September. Month index starts at 0.

module.exports = [
    new CommandBlock({
        identity: ["thetime", "time"],
        description: "Tells the time.",
        scope: ["dm", "text", "news"],
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
    }, (client, message, content, args) => {
        return message.channel.send(`It is currently **${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}.**`);
    }),
    new CommandBlock({
        identity: ["sdate"],
        description: "Gets the date from eternal september.",
        scope: ["dm", "text", "news"],
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
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
        
        return message.channel.send(`Today is **September ${since + suffix}, 1993.**`);
    }),
];
