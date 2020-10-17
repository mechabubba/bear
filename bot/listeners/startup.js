const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const _ = require("lodash");

module.exports = new ListenerBlock({
  event: "ready",
  once: true,
}, async function(client) {
  // this code is after the bot is online and workable as this is a listener for the ready event,
  // but it'll only run once, so it's safe to use for things such as scheduling tasks, cron jobs, etc

  // Add bot owner to hosts user group
  if (client.storage.get("users.hosts").value() === null) {
    const application = await client.fetchApplication();
    const owner = _.has(application, "owner.members") ? application.owner.ownerID : application.owner.id;
    client.storage.set("users.hosts", [owner]).write();
  }

  log.info(`App is now fully functional`);
});
