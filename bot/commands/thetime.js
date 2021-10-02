const CommandBlock = require("../../modules/CommandBlock");
const { DateTime } = require("luxon");

const sdate = new Date(1993, 8, 1); // its the right date, but the month index starts at 0 :/

module.exports = [
    new CommandBlock({
        identity: ["thetime", "time"],
        description: "Tells the time.",
        scope: ["dm", "text", "news"],
        clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES"],
    }, (client, message, content, args) => {
        return message.channel.send(`It is currently **${DateTime.now().toLocaleString(DateTime.DATETIME_FULL)}.**`);
    }),
    new CommandBlock({
        identity: ["sdate"],
        description: "Gets the date from eternal september.",
    }, function(client, message, content, args) {
        const since = (Date.now() - sdate.getTime()) / (1000 * 3600 * 24) | 0;
        let suffix;
        switch(since % 100) { // this is kinda stupid
            case 1:
            case 21:
            case 31:
            case 41:
            case 51:
            case 61:
            case 71:
            case 81:
            case 91:
                suffix = "st";
                break;
            case 2:
            case 22:
            case 32:
            case 42:
            case 52:
            case 62:
            case 72:
            case 82:
            case 92:
                suffix = "nd";
                break;
            case 3:
            case 23:
            case 33:
            case 43:
            case 53:
            case 63:
            case 73:
            case 83:
            case 93:
                suffix = "rd";
                break;
            default:
                suffix = "th";
                break;
        }
        message.channel.send(`Today is **September ${since + suffix}, 1993.**`);
    }),
];
