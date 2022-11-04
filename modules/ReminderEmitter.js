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
        this.reminders = new Map();
        this.events = new EventConstruct(this, "reminder event construct");
        Object.defineProperty(this, "client", { value: client }); // kind of annoying but its 4 am and i want this to work damnit

        if(!client.storage.has("local.reminders")) {
            client.storage.set("local.reminders", {});
        }
    }

    /**
     * Start a reminder.
     * @param {Reminder} reminder
     * @returns {string} A reminder ID that can be used to internally identify and stop a reminder.
     */
    start(reminder) {
        if(!(reminder instanceof Reminder)) throw new Error(`Reminder object expected; got ${typeof reminder}`);
        if(!this.reminders.has(reminder.userID)) this.reminders.set(reminder.userID, new Map());
        if(!reminder.ID) reminder.ID = this.generateID(reminder.userID);

        // The CronJob class can handle cron statements as well as dates for long time timers.
        // This is an improvement upon setInterval/Timeout, which can only have timers up to 2,147,483,647ms (or ~24 days).
        const job = new CronJob(reminder.isCron ? reminder.end : new Date(reminder.end), () => {
            this._trigger(reminder);
        }, null, true, "America/Chicago", this);

        // Store the reminder in memory with our cron job.
        this.reminders.get(reminder.userID).set(reminder.ID, {
            "job": job,
            "reminder": reminder,
        });

        // Also save the reminder to storage. This will create an object to this point automatically.
        this.client.storage.set(["local", "reminders", reminder.userID, reminder.ID], reminder);

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
        if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
        if(!this.reminders.get(userID).has(reminderID)) throw new Error("The reminder wasn't found, or doesn't exist.");
        const reminder = this.reminders.get(userID).get(reminderID).reminder;
        this._trigger(reminder, forceStop);
    }

    /**
     * Stop a reminder.
     * @param {string} userID The user ID to get the reminder from..
     * @param {string} reminderID The reminder ID.
     */
    stop(userID, reminderID, stopAll = false) {
        if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
        if(!this.reminders.get(userID).has(reminderID)) throw new Error("The reminder wasn't found, or doesn't exist.");
        const data = this.reminders.get(userID).get(reminderID);
        data.job.stop(); // Stop cron timer before deleting the object.

        this.reminders.get(userID).delete(reminderID);
        this.client.storage.delete(["local", "reminders", userID, reminderID], reminder);
        if(!stopAll) { // (((very small optimization)))
            if(isEmpty(this.client.storage.get(["local", "reminders", userID]))) {
                this.client.storage.delete(["local", "reminders", userID]); // Delete object if its empty.
            }
        }
    }

    /**
     * Stop all reminders.
     * @param {string} userID
     */
    stopAll(userID) {
        if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
        for(const key of this.reminders.get(userID).keys()) {
            this.stop(userID, key, true);
        }
        if(isEmpty(this.client.storage.get(["local", "reminders", userID]))) {
            this.client.storage.delete(["local", "reminders", userID]); // Delete object if its empty.
        }
    }

    /**
     * Return the reminders that correspond to a user ID.
     * @param {string} userID
     * @returns {Object} An object of all active jobs.
     */
    getActiveReminders(userID) {
        if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
        return this.reminders.get(userID);
    }

    /**
     * Generates a small, random, unique ID.
     * @returns {string} A unique ID fit for a users reminder.
     */
    generateID(userID, length = 2) {
        const id = randomBytes(length).toString("hex");
        if(this.reminders.get(userID).has(id)) return this.generateID(userID); // Only regenerate if a collision is ran into.
        return id;
    }
}

module.exports = ReminderEmitter;
