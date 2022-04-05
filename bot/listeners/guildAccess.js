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
        // Don't need to bother with checks if the guild isn't available or deleted
        // Not checking for owning the guild here as that will log warnings down the line
        if (!guild.available || guild.deleted) return;
        // Block list
        await client.guilds.checkBlocked(guild);
        // Allow list
        await client.guilds.checkUnknown(guild);
    }),
];
