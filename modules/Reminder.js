const chrono = require("chrono-node");
const { CronTime } = require("cron");
const log = require("./log");

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
     * @param {boolean} secondGranularity - Is second level granularity allowed for this user?
     */
    constructor(dateinfo, userID, guildID = undefined, channelID = undefined, secondGranularity = false) {
        this.dateinfo = dateinfo;
        this.userID = userID;
        this.guildID = guildID;
        this.channelID = channelID;
        this.secondGranularity = secondGranularity;

        this.parse();
    }

    /**
     * Parses the given reminder using the provided constructor arguments.
     * After parsing, you'll be rewarded with the following properties;
     * @property {boolean} isDM Determines if this reminder stemmed from a DM.
     * @property {boolean} isCron Determines if this reminder is of a cron interval.
     * @property {number} start Start date in milliseconds.
     * @property {(number|String)} end End date in milliseconds, or if its a cron statement it will be the string representing that statement.
     * @property {String} message The message corresponding with the reminder.
     * @property {String} dateinfo The raw time input.
     */
    parse() {
        // Determine if this was a DM reminder.
        if(!this.guildID || !this.channelID) {
            this.isDM = true;
        } else {
            this.isDM = false;
        }

        // Split the actual given time and message.
        const message = [];
        const args = this.dateinfo.split("|");
        for(let i = 0; i < args.length; i++) {
            args[i] = args[i].trim();
            if(i == 0) {
                if(args[i].length == 0) {
                    throw new TypeError(`You must include *some* form of time interval!`);
                } else {
                    this.dateinfo = args[i];
                }
            } else {
                message.push(args[i]);
            }
        }

        // Prepare some other instance variables.
        this.start = Date.now();
        this.message = message.join(" | "); // Just incase there are any bar characters after the original.
        this.dateinfo = this.dateinfo.trim();
        this.isCron = this.testCron(this.dateinfo);

        // Manual testing of the given human-formed date.
        switch(this.dateinfo.toLowerCase()) {
            case "@yearly":
            case "-yearly":
            case "@annually":
            case "-annually":
                this.isCron = true;
                this.dateinfo = "0 0 1 1 *";
                break;

            case "@monthly":
            case "-monthly":
                this.isCron = true;
                this.dateinfo = "0 0 1 * *";
                break;

            case "@weekly":
            case "-weekly":
                this.isCron = true;
                this.dateinfo = "0 0 * * 0";
                break;

            case "@daily":
            case "-daily":
            case "@midnight":
            case "-midnight":
                this.isCron = true;
                this.dateinfo = "0 0 * * *";
                break;

            case "@hourly":
            case "-hourly":
                this.isCron = true;
                this.dateinfo = "0 * * * *";
                break;
            
            case "@minutely":
            case "-minutely":
                this.isCron = true;
                this.dateinfo = "* * * * *";
                break;
            
            case "@secondly":
            case "-secondly":
                this.isCron = true;
                this.dateinfo = "* * * * * *";
                break;
        }

        if(!this.isCron) {
            // From here, we *know* its not any form of cron statement.
            // We'll use chrono to attempt to parse the human-formed date/time.
            const parsed = chrono.parseDate(this.dateinfo);
            if(parsed instanceof Date) {
                this.end = parsed.getTime(); // Success! It's an actual date.
            } else {
                throw new TypeError("The time given is either a malformed date or otherwise invalid!");
            }
        } else {
            // It was a cron statement from the start. Even so, we detect if theres a second-based cron interval, if the user isn't allowed to use it.
            if(!this.secondGranularity) {
                const arr = this.dateinfo.split(" ");
                if(arr.length >= 6) throw new Error("Second-level granularity of cron statements is disallowed.");
            }
            this.end = this.dateinfo;
        }
    }

    // Helper functions to get the start and end times in seconds.
    // This is used to format Discord timestamps.
    get startSecs() { return Math.round(this.start / 1000) }
    get endSecs() { return this.iscron ? undefined : Math.round(this.end / 1000); }

    /**
     * Tests if a string is a cron expression by attempting to parse it with the CronTime class.
     * @param {String} expression Possible cron expression.
     * @returns {boolean} Whether the provided expression was a cron expression.
     */
    testCron(expression) {
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
