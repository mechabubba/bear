const chrono = require("chrono-node");
const { CronTime } = require("cron");

/**
 * @class Reminder
 */
class Reminder {
    /**
     * Creates a reminder object based on a string. Previously, this was done directly in the remindme.js command to create an object with all this information; now I made some changes and threw it in here.
     * @param {String} dateinfo - String interpreted to a date.
     * @param {String} userID - User ID.
     * @param {String} guildID - Guild ID - undefined if DM.
     * @param {String} channelID - Channel ID - undefined if DM.
     */
    constructor(dateinfo, userID, guildID = undefined, channelID = undefined, secondgranularity = false) {
        if(!dateinfo) throw new Error("Date info string required.");
        if(!userID) throw new Error("User ID required.");
        if(!guildID || !channelID) {
            this.isDM = true;
        }
        this.rawinput = dateinfo;

        // Split actual timestamp and message(s).
        const message = [];
        const args = dateinfo.split("|");
        for(let i = 0; i < args.length; i++) {
            args[i] = args[i].trim();
            if(i == 0) {
                if(args[i].length == 0) {
                    throw new TypeError(`You must include *some* form of time interval!`);
                } else {
                    dateinfo = args[i];
                }
            } else {
                message.push(args[i]);
            }
        }

        this.start = new Date();
        this.message = message.join(" | ");

        dateinfo = dateinfo.trim().toLowerCase();

        this.userID = userID;
        if(!this.isDM) {
            this.guildID = guildID;
            this.channelID = channelID;
        }

        this.iscron = this.testcron(dateinfo);

        // Manual testing of the given human-formed date.
        switch(dateinfo) {
            case "@yearly":
            case "-yearly":
            case "@annually":
            case "-annually":
                this.iscron = true;
                dateinfo = "0 0 1 1 *";
                break;

            case "@monthly":
            case "-monthly":
                this.iscron = true;
                dateinfo = "0 0 1 * *";
                break;

            case "@weekly":
            case "-weekly":
                this.iscron = true;
                dateinfo = "0 0 * * 0";
                break;

            case "@daily":
            case "-daily":
            case "@midnight":
            case "-midnight":
                this.iscron = true;
                dateinfo = "0 0 * * *";
                break;

            case "@hourly":
            case "-hourly":
                this.iscron = true;
                dateinfo = "0 * * * *";
                break;
        }

        if(!this.iscron) {
            // From here, we *know* its not any form of cron statement.
            const parsed = chrono.parseDate(dateinfo);

            if(parsed instanceof Date) {
                // It's a date!
                this.end = parsed;
            } else {
                throw new TypeError("The time given is either a malformed date or otherwise invalid!");
            }
        } else {
            // It was a cron statement from the start. Even so, we detect if theres a second-based cron interval, if the user isn't allowed to use it.
            this.iscron = true;

            if(!secondgranularity) {
                const arr = dateinfo.split(" ");
                if(arr.length >= 6) throw new Error("Second-level granularity of cron statements is disallowed.");
            }
            this.end = dateinfo;
        }
    }

    /**
     * Tests if a string is a cron expression, using the CronTime class.
     * @param {String} expression Possible cron expression.
     */
    testcron(expression) {
        if(!expression) return false;
        try {
            new CronTime(expression);
        } catch(e) {
            return false;
        }
        return true;
    }
}

module.exports = Reminder;
