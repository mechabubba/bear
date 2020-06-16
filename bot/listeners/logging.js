const ListenerModule = require("../../modules/ListenerModule");
const log = require("../../modules/log");
const chalk = require("chalk");

module.exports = [
  new ListenerModule({ event: "debug" }, (client, debug) => log.trace(debug)),
  new ListenerModule({ event: "warn" }, (client, warn) => log.warn(warn)),
  new ListenerModule({ event: "error" }, (client, error) => log.error(error)),
  new ListenerModule({ event: "ready" }, (client) => log.info(`${chalk.green("[READY]")} ${client.user.tag} is ready and serving ${client.guilds.cache.size} servers`)),
  new ListenerModule({ event: "shardError" }, (client, error, id) => log.error(`[Shard ${id}] ${error.message}`)),
  new ListenerModule({ event: "shardReady" }, (client, id, unavailableGuilds) => log.info(`${chalk.green("[READY]")} [Shard ${id}] Shard is ready and serving ${client.user.tag}`)),
  new ListenerModule({ event: "shardDisconnect" }, (client, event, id) => { // Only emits when websocket won't try to reconnect
    if (event.code === 1000) {
      client.log.info(`[Shard ${id}] Websocket disconnected normally, ${event.reason} (${event.code})`);
    } else {
      client.log.error(`[Shard ${id}] Websocket disconnected abnormally, ${event.reason} (${event.code})`);
    }
  }),
  new ListenerModule({ event: "shardReconnecting" }, (client, id) => log.warn(`[Shard ${id}] Websocket currently closed, attempting to reconnect...`)),
  new ListenerModule({ event: "shardResume" }, (client, id, replayedEvents) => log.info(`[Shard ${id}] Resumed websocket connection, replayed ${replayedEvents} events`)),
  new ListenerModule({ event: "rateLimit" }, (client, rateLimitInfo) => log.warn(`${client.user.tag} hit a rate limit!`, rateLimitInfo)),
  new ListenerModule({ event: "guildUnavailable" }, (client, guild) => log.warn(`Guild ${guild.id} became unavailable`)),
];
