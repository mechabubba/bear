const ListenerBlock = require("../../modules/ListenerBlock");
const log = require("../../modules/log");
const chalk = require("chalk");

module.exports = [
  new ListenerBlock({ event: "debug" }, (client, debug) => log.trace(debug)),
  new ListenerBlock({ event: "warn" }, (client, warn) => log.warn(warn)),
  new ListenerBlock({ event: "error" }, (client, error) => log.error(error)),
  new ListenerBlock({ event: "ready" }, (client) => log.info(`${chalk.green("[READY]")} ${client.user.tag} is ready and serving ${client.guilds.cache.size} servers`)),
  new ListenerBlock({ event: "shardError" }, (client, error, id) => log.error(`[SHARD ${id}] ${error.message}`)),
  new ListenerBlock({ event: "shardReady" }, (client, id, unavailableGuilds) => log.info(`${chalk.green("[READY]")} [SHARD ${id}] Shard is ready and serving ${client.user.tag}`)),
  new ListenerBlock({ event: "shardDisconnect" }, (client, event, id) => { // Only emits when websocket won't try to reconnect
    if (event.code === 1000) {
      client.log.info(`[SHARD ${id}] Websocket disconnected normally, ${event.reason} (${event.code})`);
    } else {
      client.log.error(`[SHARD ${id}] Websocket disconnected abnormally, ${event.reason} (${event.code})`);
    }
  }),
  new ListenerBlock({ event: "shardReconnecting" }, (client, id) => log.warn(`[Shard ${id}] Websocket currently closed, attempting to reconnect...`)),
  new ListenerBlock({ event: "shardResume" }, (client, id, replayedEvents) => log.info(`[Shard ${id}] Resumed websocket connection, replayed ${replayedEvents} events`)),
  new ListenerBlock({ event: "rateLimit" }, (client, rateLimitInfo) => log.warn(`${client.user.tag} hit a rate limit!`, rateLimitInfo)),
  new ListenerBlock({ event: "guildUnavailable" }, (client, guild) => log.warn(`Guild ${guild.id} became unavailable`)),
];
