const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const chalk = require("chalk");

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
    await client.guilds.leaveBlocked();
    // Allow list
    await client.guilds.leaveUnknown();
  }),
  new ListenerBlock({
    event: "guildCreate",
    once: false,
  }, async function(client, guild) {
    if (!guild.available || guild.deleted || client.user.id === guild.ownerID) return;
    // Block list
    await client.guilds.leaveBlocked(guild);
    // Allow list
    await client.guilds.leaveUnknown(guild);
  }),
];
