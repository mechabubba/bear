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
    log.debug("checking for blocked guilds");
    const blocked = client.config.get("guilds.blocked").value();
    if (blocked !== null) {
      log.debug("there is at least one blocked guild");
      const blockedGuilds = client.guilds.cache.array().filter(guild => blocked.includes(guild.id));
      log.debug(blockedGuilds);
      if (blockedGuilds.length) {
        log.debug("we are in at least one blocked guild");
        for (const guild of blockedGuilds) {
          if (!guild.available) continue;
          log.info(`${chalk.gray("[blocked guild]")} Automatically leaving ${guild.name} (${guild.id})`);
          guild.leave();
        }
      }
    }
    // allow list
    const allowed = client.config.get("guilds.allowed").value();
    if (allowed !== null) {
      const unknownGuilds = client.guilds.cache.array().filter(guild => !allowed.includes(guild.id));
      if (unknownGuilds.length) {
        for (const guild of unknownGuilds) {
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
