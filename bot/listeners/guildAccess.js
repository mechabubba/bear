const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const chalk = require("chalk");

// Block list auto leaves guilds on the list if enabled
// Allow list auto leaves guilds not on the list if enabled
// Both are disabled by default via the guild groups they use being null
// Refer to documentation in ./modules/defaultConfig.js for info about guild groups

module.exports = [
  new ListenerBlock({
    event: "ready",
    once: false,
  }, function(client) {
    // block list
    const blocked = client.config.get("guilds.blocked").value();
    if (blocked !== null) {
      const blockedGuilds = client.guilds.cache.filter((guild) => blocked.includes(guild.id));
      if (blockedGuilds.length > 0) {
        for (const guild in blockedGuilds) {
          if (!guild.available) continue;
          log.info(`${chalk.gray("[blocked guild]")} Automatically leaving ${guild.name} (${guild.id})`);
          guild.leave();
        }
      }
    }
    // allow list
    const allowed = client.config.get("guilds.allowed").value();
    if (allowed !== null) {
      const unknownGuilds = client.guilds.cache.filter((guild) => !allowed.includes(guild.id));
      if (unknownGuilds.length > 0) {
        for (const guild in unknownGuilds) {
          if (!guild.available) continue;
          log.info(`${chalk.gray("[unknown guild")} Automatically leaving ${guild.name} (${guild.id})`);
          guild.leave();
        }
      }
    }
  }),
  new ListenerBlock({
    event: "guildCreate",
    once: false,
  }, function(client, guild) {
    if (!guild.available) return;
    // block list
    const blocked = client.config.get("guilds.blocked").value();
    if (blocked !== null) {
      if (blocked.includes(guild.id)) {
        log.info(`${chalk.gray("[blocked guild]")} Automatically leaving ${guild.name} (${guild.id})`);
        guild.leave();
      }
    }
    // allow list
    const allowed = client.config.get("guilds.allowed").value();
    if (allowed !== null) {
      if (!allowed.includes(guild.id)) {
        log.info(`${chalk.gray("[unknown guild")} Automatically leaving ${guild.name} (${guild.id})`);
        guild.leave();
      }
    }
  }),
];
