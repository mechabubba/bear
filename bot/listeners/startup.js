const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const { has } = require("lodash");

module.exports = new ListenerBlock({
    event: "ready",
    once: true,
}, async function(client) {
    // This code runs after the bot is online and workable, as this is a listener for the ready event
    // But it will only run once, so it's safe to use for things such as scheduling tasks or other one time operations

    // Add bot owner to hosts user group
    // If the users.hosts group is an empty array, this won't happen.
    if (client.config.get("users.hosts").value() === null) {
        const application = await client.fetchApplication();
        // This supports teams, but only the team's owner.
        // If anyone wants to implement real support for team members, it would be appreciated.
        const owner = has(application, "owner.members") ? application.owner.ownerID : application.owner.id;
        client.config.set("users.hosts", [owner]).write();
        log.info(`Added the bot's owner "${owner}" to the hosts user group.`);
    }

    log.info("App is now fully functional");
});
