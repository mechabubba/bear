const { CronJob } = require("cron");
const Reminder = require("./Reminder");
const EventConstruct = require("./EventConstruct");
const EventEmitter = require("events");
//const log = require("./log");

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
    
    let user = reminder.user;
    if(!this.reminders.has(user)) this.reminders.set(user, {});

    let id;
    if(!reminder.id) {
      id = this.generateID(user);
      reminder.id = id;
    } else {
      id = reminder.id;
    }

    let job = new CronJob(reminder.end, function() {
      this.emit("reminderCall", reminder);
      if(!reminder.isCron) {
        this.stop(reminder.user, reminder.id);
      }
    }, null, true, "America/Chicago", this);

    this.reminders.get(user)[id] = {
      "job": job,
      "reminder": reminder
    };

    return id;
  }

  /**
   * Stop a reminder.
   * @param {String} userID 
   * @param {String} reminderID 
   */
  stop(userID, reminderID) {
    if(!this.reminders.has(userID)) this.reminders.set(userID, {});
    let rs = this.reminders.get(userID);

    if(!rs[reminderID]) throw new Error("The reminder wasn't found, or doesn't exist.");
    
    rs[reminderID].job.stop();
    delete rs[reminderID];
    
    return;
  }

  /**
   * Return the reminders that correspond to a user ID.
   * @param {String} userID 
   * @returns {Object} An object of all active jobs.
   */
  activeReminders(userID) { // unfinished
    if(!this.reminders.has(userID)) this.reminders.set(userID, {});
    let rs = this.reminders.get(userID);

    return rs;
  }

  /**
   * Generates a random ID.
   * @returns {String} A user ID.
   */
  generateID(user) { // maybe finished idunnolol
    const id = require("crypto").randomBytes(2).toString('hex');
    const rs = this.reminders.get(user);
    for(let key in rs) {
      if(rs[key].id == id) return this.generateID(user);
    }
    return id;
  }
}

module.exports = ReminderEmitter;