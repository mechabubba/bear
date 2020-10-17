const chrono = require("chrono-node");
const { CronTime } = require("cron");
//const log = require("./log");

/**
 * @class Reminder
 */
class Reminder {
  /**
   * Creates a reminder object based on a string. Previously, this was done directly in the remindme.js command to create an object with all this information; now I made some changes and threw it in here.
   * @param {String} dateinfo String interpreted to a date.
   * @param {String} guildID
   * @param {String} userID
   * @param {String} channelID
   */
  constructor(dateinfo, guildID, userID, channelID) {
    if(!dateinfo) throw new Error("Date info string required.")
    this.rawinput = dateinfo;

    // Split actual timestamp and message(s).
    let message = []
    let args = dateinfo.split("|");
    for(let i = 0; i < args.length; i++) {
      args[i] = args[i].trim();
      if(i == 0) {
        if(args[i].length <= 0) throw new Error(`You must include *some* form of time interval!`);
      } else {
        message.push(args[i]);
      }
    }

    this.start   = new Date();
    this.message = message.join(" | ").replace(/@/gi, "@\u200B") || "";

    if(dateinfo.includes("-private")) {
      this.private = true;
      dateinfo = dateinfo.replace(/-private/gi, "").trim();
    }

    if(!guildID || !userID || (!channelID && !this.private)) throw new Error("Missing guild, channel, or user.");
    this.guildID   = guildID;
    this.channelID = channelID;
    this.userID    = userID;

    this.iscron = this.testcron(dateinfo);
    
    // Manual testing of the given human-formed date.
    if(!this.iscron) {
      switch(dateinfo.toLowerCase()) {
        // Common unofficial cron statements.
        case "@yearly":
        case "-yearly":
        case "@annually":
        case "-annually":
          this.iscron = true;
          this.end = "0 0 1 1 *";
          break;

        case "@monthly":
        case "-monthly":
          this.iscron = true;
          this.end = "0 0 1 * *";
          break;

        case "@weekly":
        case "-weekly":
          this.iscron = true;
          this.end = "0 0 * * 0";
          break;

        case "@daily":
        case "-daily":
        case "@midnight":
        case "-midnight":
          this.iscron = true;
          this.end = "0 0 * * *";
          break;

        case "@hourly":
        case "-hourly":
          this.iscron = true;
          this.end = "0 * * * *";
          break;
      }
      if(!this.iscron) {
        // From here, we *know* its not any form of cron statement.
        this.iscron = false;

        let parsed = chrono.parseDate(dateinfo);

        if(parsed instanceof Date) {
          // It's a date!
          this.end = parsed;
        } else {
          throw new Error("The time given is either a malformed date or otherwise invalid!");
        }
      }
    } else {
      // it was cron from da start
      this.iscron = true;
      this.end = dateinfo;
    }
  }

  /**
   * Tests if a string is a cron expression, using the CronTime class.
   * @param {String} expression Possible cron expression.
   */
  testcron(expression) {
    if(expression.trim() == "") return false;
    try { new CronTime(expression) } catch(e) { return false }
    return true;
  }
}

module.exports = Reminder;