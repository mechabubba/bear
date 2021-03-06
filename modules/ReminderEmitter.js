const { CronJob } = require("cron");
const Reminder = require("./Reminder");
const EventConstruct = require("./EventConstruct");
const EventEmitter = require("events");
const { randomBytes } = require("crypto");
const log = require("./log");

/**
 * ReminderEmitter class for the reminder command.
 * @extends {EventEmitter}
 */
class ReminderEmitter extends EventEmitter {
  constructor(client) {
    super();
    this.reminders = new Map();
    this.events = new EventConstruct(this, "reminder event construct");
    Object.defineProperty(this, "client", { value: client }); // kind of annoying but its 4 am and i want this to work damnit
  }

  /**
   * Start a reminder.
   * @param {Reminder} reminder 
   * @returns {String} A reminder ID that can be used to internally identify and stop a reminder.
   */
  start(reminder) {
    if(!reminder instanceof Reminder) throw new Error(`Reminder object expected; got ${typeof reminder}`);
    if(!this.reminders.has(reminder.userID)) this.reminders.set(reminder.userID, new Map());
    if(!reminder.id) reminder.id = this.generateID(reminder.userID);

    let job = new CronJob(reminder.end, () => this._trigger(reminder), null, true, "America/Chicago", this);

    this.reminders.get(reminder.userID).set(reminder.id, {
      "job": job,
      "reminder": reminder
    });

    return reminder.id;
  }

  /**
   * Trigger a reminder early via its object. Note that this subsequently removes normal reminders; cron statements must be removed normally.
   * @param {Reminder} reminder
   * @param {boolean} cronremove
   */
  _trigger(reminder, cronremove) {
    this.emit("reminderCall", reminder);
    if(!reminder.iscron || cronremove) {
      this.stop(reminder.userID, reminder.id);
    }
  }

  /**
   * Trigger a reminder early via its userID and reminderID.
   * @param {string} userID
   * @param {string} reminderID
   * @param {boolean} cronremove
   */
  trigger(userID, reminderID, cronremove = false) {
    if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
    if(!this.reminders.get(userID).has(reminderID)) throw new Error("The reminder wasn't found, or doesn't exist.");
    let reminder = this.reminders.get(userID).get(reminderID).reminder;
    this._trigger(reminder, cronremove);
  }

  /**
   * Stop a reminder.
   * @param {String} userID 
   * @param {String} reminderID 
   */
  stop(userID, reminderID) {
    if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
    if(!this.reminders.get(userID).has(reminderID)) throw new Error("The reminder wasn't found, or doesn't exist.");

    let robj = this.reminders.get(userID).get(reminderID);
    robj.job.stop();
    this.reminders.get(userID).delete(reminderID);
    log.debug(`done stopping ${reminderID}.`);
  }

  /**
   * Return the reminders that correspond to a user ID.
   * @param {String} userID 
   * @returns {Object} An object of all active jobs.
   */
  activeReminders(userID) {
    if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
    let rs = this.reminders.get(userID);
    return rs;
  }

  /**
   * Generates a small, random, unique ID.
   * @returns {String} A user ID.
   */
  generateID(userID) {
    const id = randomBytes(2).toString("hex");
    const rs = this.reminders.get(userID);
    for(const key in rs.keys()) {
      if(key == id) return this.generateID(userID);
    }
    return id;
  }
};

module.exports = ReminderEmitter;
