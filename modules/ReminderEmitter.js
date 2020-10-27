const { CronJob } = require("cron");
const Reminder = require("./Reminder");
const EventConstruct = require("./EventConstruct");
const EventEmitter = require("events");

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

    if(!reminder.id) {
      reminder.id = this.generateID(reminder.userID);
    }

    let job = new CronJob(reminder.end, function() {
      this.emit("reminderCall", reminder);
      if(!reminder.iscron) {
        this.stop(reminder.userID, reminder.id);
      }
    }, null, true, "America/Chicago", this);

    this.reminders.get(reminder.userID).set(reminder.id, {
      "job": job,
      "reminder": reminder
    });

    return reminder.id;
  }

  /**
   * Stop a reminder.
   * @param {String} userID 
   * @param {String} reminderID 
   */
  stop(userID, reminderID) {
    if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
    let rs = this.reminders.get(userID).get(reminderID);
    if(!rs) throw new Error("The reminder wasn't found, or doesn't exist.");

    rs.job.stop();
    this.reminders.get(userID).delete(reminderID);
    
    return;
  }

  /**
   * Return the reminders that correspond to a user ID.
   * @param {String} userID 
   * @returns {Object} An object of all active jobs.
   */
  activeReminders(userID) { // unfinished
    if(!this.reminders.has(userID)) this.reminders.set(userID, new Map());
    let rs = this.reminders.get(userID);
    return rs;
  }

  /**
   * Generates a random ID.
   * @returns {String} A user ID.
   */
  generateID(userID) {
    const id = require("crypto").randomBytes(2).toString("hex");
    const rs = this.reminders.get(userID);
    for(const key in rs.keys()) {
      if(key == id) return this.generateID(userID);
    }
    return id;
  }
};

module.exports = ReminderEmitter;
