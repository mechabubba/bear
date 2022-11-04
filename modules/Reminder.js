const chrono = require("chrono-node");
const { CronTime } = require("cron");

/**
 * @class Reminder
 */
class Reminder {
    /**
     * Creates a reminder object based on a string. Previously, this was done directly in the remindme.js command to create an object with all this information; now I made some changes and threw it in here.
     * @param {String} content - String interpreted to a date.
     * @param {String} userID - User ID.
     * @param {String} guildID - Guild ID - undefined if DM.
     * @param {String} channelID - Channel ID - undefined if DM.
     * @param {boolean} secondGranularity - Is second level granularity allowed for this user?
     */
    constructor(content, userID, guildID = undefined, channelID = undefined, secondGranularity = false) {
        this.userID = userID;
        this.guildID = guildID;
        this.channelID = channelID;

        this.parse(content, { secondGranularity });
    }

    /**
     * Parses the given reminder using the provided constructor arguments.
     * @param {String} content The provided "date string" from the user.
     * @param {Object} options Options for the parser.
     * * * *
     * After parsing, you'll be rewarded with the following properties;
     * @property {boolean} isDM Determines if this reminder stemmed from a DM.
     * @property {boolean} isCron Determines if this reminder is of a cron interval.
     * @property {number} start Start date in milliseconds.
     * @property {(number|String)} end End date in milliseconds, or if its a cron statement it will be the string representing that statement.
     * @property {String} message The message corresponding with the reminder.
     */
    parse(content, options = {}) {
        // Determine if this was a DM reminder.
        if(!this.guildID || !this.channelID) {
            this.isDM = true;
        } else {
            this.isDM = false;
        }

        // Split the actual given time and message.
        const message = [];
        const args = content.split("|");
        for(let i = 0; i < args.length; i++) {
            args[i] = args[i].trim();
            if(i == 0) {
                if(args[i].length == 0) {
                    throw new TypeError(`You must include *some* form of time interval!`);
                } else {
                    content = args[i];
                }
            } else {
                message.push(args[i]);
            }
        }

        // Prepare some other instance variables.
        content = content.trim();
        this.start = Date.now();
        this.message = message.join(" | "); // Just incase there are any other bar characters past the first one.
        this.isCron = this.testCron(content);

        // Manual testing of the given human-formed date.
        switch(content.toLowerCase()) {
            case "@yearly":
            case "-yearly":
            case "@annually":
            case "-annually":
                this.isCron = true;
                content = "0 0 1 1 *";
                break;

            case "@monthly":
            case "-monthly":
                this.isCron = true;
                content = "0 0 1 * *";
                break;

            case "@weekly":
            case "-weekly":
                this.isCron = true;
                content = "0 0 * * 0";
                break;

            case "@daily":
            case "-daily":
            case "@midnight":
            case "-midnight":
                this.isCron = true;
                content = "0 0 * * *";
                break;

            case "@hourly":
            case "-hourly":
                this.isCron = true;
                content = "0 * * * *";
                break;
            
            case "@minutely":
            case "-minutely":
                this.isCron = true;
                content = "* * * * *";
                break;
            
            case "@secondly":
            case "-secondly":
                this.isCron = true;
                content = "* * * * * *";
                break;
        }

        if(!this.isCron) {
            // From here, we *know* its not any form of cron statement.
            // We'll use chrono to attempt to parse the human-formed date/time.
            const parsed = chrono.parseDate(content);
            if(parsed instanceof Date) {
                this.end = parsed.getTime(); // Success! It's an actual date.
            } else {
                throw new TypeError("The time given is either a malformed date or otherwise invalid!");
            }
        } else {
            // It was a cron statement from the start. Even so, we detect if theres a second-based cron interval, if the user isn't allowed to use it.
            if(!options.secondGranularity && content.split(" ").length >= 6) {
                throw new Error("Second-level granularity of cron statements is disallowed.");
            }
            this.end = content;
        }
    }

    /**
     * Creates a Reminder from an object, such as one from storage.
     * Courtesy of https://stackoverflow.com/a/50856428!
     * @param {Object} obj An object of data to create a Reminder from. 
     * @returns {Reminder} a Reminder from the data in object obj.
     */
    static fromObject(obj) {
        const reminder = Object.create(this.prototype) // Create a reminder object **without calling the constructor.**
        return Object.assign(reminder, obj);
    }

    // Helper functions to get the start and end times in seconds. This is used to format Discord timestamps.
    get startSecs() { return Math.round(this.start / 1000) }
    get endSecs() { return this.isCron ? undefined : Math.round(this.end / 1000); }

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
