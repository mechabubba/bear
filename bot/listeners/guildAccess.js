const ListenerBlock = require("../../modules/ListenerBlock");

// The block list automatically leaves guilds on the list (referred to as blocked guilds)
// The allow list automatically leaves guilds not on the list (referred to as unknown guilds)
// Note that if the associated guild groups are null/empty, no guilds will be left
// Refer to the documentation in ./modules/defaultData.js for more info

module.exports = [
  new ListenerBlock({
    event: "ready",
    once: false,
  }, async function(client) {
    // Block list
    await client.guilds.checkBlocked();
    // Allow list
    await client.guilds.checkUnknown();
  }),
  new ListenerBlock({
    event: "guildCreate",
    once: false,
  }, async function(client, guild) {
    // It's alright to just ignore this event for the purposes of access control
    // if the guild isn't available or deleted. Owning the guild on the other
    // hand goes through as that will prompt a warn down the line
    if (!guild.available || guild.deleted) return;
    // Block list
    await client.guilds.checkBlocked(guild);
    // Allow list
    await client.guilds.checkUnknown(guild);
  }),
];
