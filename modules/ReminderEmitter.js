const EventConstruct = require("./EventConstruct");
const Reminder = require("./Reminder");
const { CronJob } = require("cron");
const { randomBytes } = require("crypto");
const EventEmitter = require("events");
const { isEmpty } = require("lodash");

/**
 * ReminderEmitter class for the reminder command.
 * @extends {EventEmitter}
 */
class ReminderEmitter extends EventEmitter {
    constructor(client, options = {}) {
        super();
        this.jobs = {};
        this.events = new EventConstruct(this, "reminder event construct");
        Object.defineProperty(this, "client", { value: client }); // kind of annoying but its 4 am and i want this to work damnit

        if(!this.client.storage.has(["local", "reminders"])) {
            this.client.storage.set(["local", "reminders"], {});
        }
    }

    /**
     * Start a reminder.
     * @param {Reminder} reminder
     * @returns {string} A reminder ID that can be used to internally identify and stop a reminder.
     */
    start(reminder) {
        if(!(reminder instanceof Reminder)) throw new Error(`Reminder object expected; got ${typeof reminder}`);
        this.jobs[reminder.userID] ??= {};
        if(!reminder.ID) {
            reminder.ID = this.generateID(reminder.userID); // Generate a random, unique short ID if it doesn't exist.
        }

        // The CronJob class can handle cron statements as well as dates for long time timers.
        // This is an improvement upon setInterval/Timeout, which can only have timers up to 2,147,483,647ms (or ~24 days).
        const job = new CronJob(reminder.isCron ? reminder.end : new Date(reminder.end), () => {
            this._trigger(reminder);
        }, null, true, "America/Chicago", this);

        // Store our cron job in memory.
        // Also save the reminder to storage. This will create an object to this point automatically.
        this.jobs[reminder.userID][reminder.ID] = job;
        if(!this.client.storage.has(["local", "reminders", reminder.userID, reminder.ID])) {
            this.client.storage.set(["local", "reminders", reminder.userID, reminder.ID], reminder);
        }

        return reminder.ID;
    }

    /**
     * Trigger a reminder early via its object reference. Note that this subsequently removes normal reminders; cron statements must be removed normally.
     * @param {Reminder} reminder The reminder object.
     * @param {boolean} forceStop Should we forcefully stop this reminder?
     */
    _trigger(reminder, forceStop = false) {
        this.emit("reminderCall", reminder, forceStop);
    }

    /**
     * Trigger a reminder early via its userID and reminderID.
     * @param {string} userID The user ID to get the reminder from.
     * @param {string} reminderID The reminder ID.
     * @param {boolean} forceStop Should we forcefully stop this reminder?
     */
    trigger(userID, reminderID, forceStop = false) {
        this.jobs[userID] ??= {};
        const result = this.client.storage.get(["local", "reminders", userID, reminderID]);
        if(!result) throw new Error("The reminder wasn't found, or doesn't exist.");
        
        const reminder = Reminder.fromObject(result);
        this._trigger(reminder, forceStop);
    }

    /**
     * Stop a reminder.
     * @param {string} userID The user ID to get the reminder from..
     * @param {string} reminderID The reminder ID.
     */
    stop(userID, reminderID, _stopAll = false) {
        this.jobs[userID] ??= {};
        const reminder = this.client.storage.get(["local", "reminders", userID, reminderID]);
        if(!reminder) throw new Error("The reminder wasn't found, or doesn't exist.");
        
        if(this.jobs[userID][reminderID]) {
            this.jobs[userID][reminderID].stop(); // Stop cron timer before deleting the object.
        }
        delete this.jobs[userID][reminderID];
        this.client.storage.delete(["local", "reminders", userID, reminderID]);

        if(!_stopAll) { // (((very small optimization)))
            if(isEmpty(this.client.storage.get(["local", "reminders", userID]))) {
                this.client.storage.delete(["local", "reminders", userID]); // Delete object if its empty.
                delete this.jobs[userID];
            }
        }
    }

    /**
     * Stop all reminders.
     * @param {String} userID The user ID.
     */
    stopAll(userID) {
        this.jobs[userID] ??= {};
        for(const key in this.jobs[userID]) {
            this.stop(userID, key, true);
        }

        if(isEmpty(this.client.storage.get(["local", "reminders", userID]))) {
            this.client.storage.delete(["local", "reminders", userID]); // Delete object if its empty.
            delete this.jobs[userID];
        }
    }

    /**
     * Return an array of reminders that satisfy a filter.
     * @param {String} userID The user ID.
     * @param {(r: Reminder) => boolean} filter The filter to check each reminder against, with one parameter "r" as the reminder object.
     * @returns {{job: CronJob; reminder: Reminder}[]} The result of the filter.
     */
    async getReminders(userID, filter = (r) => true) {
        this.jobs[userID] ??= {};
        const result = [];

        const user_reminders = this.client.storage.get(["local", "reminders", userID]);
        if(!user_reminders) return result;

        for(const ID in user_reminders) {
            const reminder = Reminder.fromObject(user_reminders[ID]);

            const filtered = filter(reminder);
            const valid = await reminder.isValid(this.client);
            if(!filtered) { // Note to self: do not do any reminder stopping here, variable filter can be anything.
                continue;
            }
            if(!valid) {
                this.stop(userID, reminder.ID);
                continue;
            }

            result.push({
                job: this.jobs[userID][reminder.ID],
                reminder
            });
        }
        return result;
    }

    /**
     * Generates a small, random, unique ID.
     * @param {string} userID The users ID.
     * @param {number} length The amount of bytes of the ID.
     * @returns {string} A unique ID fit for a users reminder.
     */
    generateID(userID, length = 2) {
        const ID = randomBytes(length).toString("hex");
        if(this.client.storage.get(["local", "reminders", userID, ID])) this.generateID(userID); // Only regenerate if a collision is ran into.
        return ID;
    }
}

module.exports = ReminderEmitter;
