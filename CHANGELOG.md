## `0.0.7` / `2020-XX-XX`

_The changelog for this version is incomplete/w.i.p and currently being written_

- A new class, `BaseEventEmitter`, which is the same as [Base](https://github.com/06000208/sandplate/blob/master/modules/Base.js) but extends [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter). Closes [#20](https://github.com/06000208/sandplate/issues/20)

- Changed the approach used for the [Handler](https://github.com/06000208/sandplate/blob/master/modules/Handler.js) class, now instantiated on the [Client](https://github.com/06000208/sandplate/blob/master/modules/Client.js) rather than being static. Note that `resolvePath()` and the new `searchDirectory()` are both still static methods. Closes [#25](https://github.com/06000208/sandplate/issues/25)
  - Moved most of `requireDirectory()`'s logic to it's own function, `searchDirectory()`, and improved it
  - A new handler function, `unloadDirectory()`, which does the exact opposite of `requireDirectory()`
  - `unloadModule()`, `unloadMultipleModules()`, `loadModule()`, `requireModule()`, and `requireMultipleModules()` now return the resolved paths they've successfully performed their tasks with, if any

- Changed `defaultConfig.js` into `defaultData.js` and updated usage accordingly
  - Updated old references here in CHANGELOG.md and elsewhere so people won't go looking for a file that doesn't exist

- Added the capacity for codes to the Response class, similar to the [Error.code](https://nodejs.org/api/errors.html#errors_error_code) property

- New modules.json lowdb database as a built in way to disable modules, which is optionally respected by `requireDirectory()`, `requireMultipleModules()`, or `requireModule()`. This is so disabling modules plays much nicer with git (no longer requiring file renames), and with the new approach, disabled modules not loaded on start up can still be easily loaded later if desired. Closes [#26](https://github.com/06000208/sandplate/issues/26)
  - Modules `./bot/commands/templateMultiple.js` and `./bot/commands/example.js` have been renamed back accordingly and disabled by default using the new method in `defaultData.js`
  - New commands `enable` and `disable` which act the same way as `load` and `unload` but also enable/disable the modules you target accordingly
  - The `eval` command is now disabled by default

- Deep cloning required modules rather than passing around a reference to the [require cache](https://nodejs.org/api/modules.html#modules_require_cache). Closes [#32](https://github.com/06000208/sandplate/issues/32)

- Created a `sandplate.json` file in the root. This allows sandplate's version and a few other things to be referenced separately from what's in package.json. Admittedly, I'm pretty unsure about it, but I don't think it's a half bad solution. I think it comes down to a compromise while sandplate isn't currently in the form of an NPM package.

- Added a simple version command

- Improved `metadata.color` and `metadata.twitch` to support being null and changed both their defaults to such. Closes [#27](https://github.com/06000208/sandplate/issues/27)

- Minor syntax improvements in `Client.js`, `CommandConstruct.js`, and `bot.js`

- Minor updates/fixes to the guild, help, and ping commands, as well as some log messages across the bot and README.md

- Removed some leftover log messages (although they may be added back later)

## `0.0.6` / `2020-08-12`

- When merging the branches, some minor stuff went awry. The /temp/ folder has been restored, and a merge conflict left over in CONTRIBUTING.md has been fixed.

- Fixed a bunch of mistakes in the various markdown files and clarified something in README.md

## `0.0.5` / `2020-07-31`

In regards to the github repository, It's about time to give it a fresh new coat of paint, updating the README and adding templates, etc.

Sandplate is not out of initial development yet, but the `initial-development` branch is going to be merged into master as there's no real reason to have it separate now that we've gotten into the flow of things.
  
As was started with `0.0.5`, specific versions that are in development will continue to have their own branches until being completed and merged.

**Changes**

- Prefixes are now checked case insensitively

- Changed how arrays are documented (an array of strings is now `[string]` as opposed to `string[]`)

- Fixed guild access control (`guildAccess.js`), it was quite broken and [stank](https://en.wikipedia.org/wiki/Code_smell). Not sure how I didn't notice this previously.

- Added `metadata.twitch` and `metadata.reaction.cooldown` to `defaultConfig.js` (after 0.0.6, now `defaultData.js`)

- Renamed `randomFile.js` to `wikimedia.js`, added new functionality, improved the embed and what data is displayed, how unknown api responses & files that can't be displayed are handled, and adjusted it to make use of `metadata.reaction.cooldown` appropriately

- Improved `eval.js`'s check for promises, abandoned code block syntax highlighting in favor of the error resilience gained from always using `util.inspect()`, added error message replies, and adjusted the wall of text prevention

- Gave many commands summaries/descriptions and improved existing ones, as well as more names

- [Issue #6](https://github.com/06000208/sandplate/issues/6) changes for `run.bat` (a new check for when npm modules aren't installed alongside bringing back the check for the configuration file now fixed and with with a better response)

- Disabled the featureless templates/example commands (other than `template.js`) by default, as their only purpose is documentation. `example.js` is now `example.js.disabled`, and so on. To restore them, simply remove the `.disabled` extension and use the load command or restart the bot.

**Handler Framework Overhaul**

The handler framework and all classes related to modules have been overhauled! Issues [#10](https://github.com/06000208/sandplate/issues/10) and [#11](https://github.com/06000208/sandplate/issues/11) are relevant to most of this.

- Loading modules is now noticeably faster
- New `Response` class as a way for functions to return more data to their caller
- A new handler function, `resolvePath()`, which is essentially a wrapper for `require.resolve()` that takes care of try/catching and returns data using the Response class
- Two new handler functions, `unloadMultipleModules()` and `requireMultipleModules()`, which both take an array of file paths and use `unloadModule()` and `requireModule()`, respectively, on each path in the array, allowing for bulk loading or unloading
- All handler functions now make use of the Response class as what they return, and they have gone through numerous changes and improvements to their logic
- Handling of paths in general has been improved, and paths mapped in collections as well as the `.filePath` property on block instances are the same paths resolved to by the require internals, such as [`require.cache`](https://nodejs.org/api/modules.html#modules_require_cache) or `require.resolve()`

  This means that everything is far more consistent internally, and that any number of different dynamic paths will work so long as they all resolve to the same path

  `fs-extra` is no longer used to check that files exist, as `resolvePath()` handles that far better and with identical behavior to `require()`, as described above

  You won't need to use `resolvePath()` externally to resolve a path before use though, as `unloadModule()` and `requireModule()` already use it themselves internally

- The `setup()` handler function has been renamed to `requireDirectory()` and now uses `requireMultipleModules()`
- Fixed config properties `commands.directory` and `events.directory` not being used by the bot
- Use of the term "Module" for the classes exported by modules has been ditched in favor of "Block", with `BaseModule` becoming `BaseBlock`, `CommandModule` becoming `CommandBlock`, and so on! This way, the term module only refers to [actual modules](https://nodejs.org/docs/latest-v12.x/api/modules.html#modules_modules), and the terminology of "blocks" for the classes exported by modules works quite well.
- All modules under `./bot/` have been updated to use `CommandBlock` and `ListenerBlock` accordingly
- Construct instances now have ids and names, as described in [issue #11](https://github.com/06000208/sandplate/issues/11)
- `BaseBlock`, `BaseConstruct`, `CommandConstruct`, and `EventConstruct` have all been entirely reworked

  `BaseBlock` and `BaseConstruct` both extend a new class, `Base`, in order to easily share some features such as having snowflake ids, and before they were mostly incomplete blank slates, with most (or all) of their code being in the classes that extended them

  This is no longer the case, with `CommandConstruct` and `EventConstruct` being altered and reworked accordingly. As an example, `BaseConstruct` now has `load` and `unload` methods itself, which the two construct classes call in their own `load` and `unload` methods using `super`

  For more detail, I would recommend viewing all the classes themselves

- `firstPrefix` getter for `CommandConstruct` and command name related getters for `CommandBlock` (Issues [#8](https://github.com/06000208/sandplate/issues/8) and [#9](https://github.com/06000208/sandplate/issues/9), respectively)

**New Commands**

Several new commands as described in [issue #5](https://github.com/06000208/sandplate/issues/5), mostly focused around aiding development or controlling the bot. If you notice anything wrong or done poorly with these commands, please point it out in the discord or make an issue!

- `help.js` List commands or query specific command info

  - `help [command]`

- `leave.js` Instruct the bot to leave a specific guild

  - `leave <guild id>`

- `guild.js` Log a list of guilds to the console or fetch info about individual guilds

  - `guild [guild id]`

  Usage Examples:

  - `guild`
  - `guild 273550655673860106`

- `accessControl.js` Blocking/unblocking users and guilds, and modifying user groups

  - `block user/guild <id>`
  - `unblock user/guild <id>`
  - `group <group> [id]`

  Usage Examples:

  - `block user 642469616932880395`
  - `block guild 273550655673860106`
  - `unblock user 642469616932880395`
  - `unblock guild 273550655673860106`
  - `group hosts`
  - `group trusted`
  - `group example`
  - `group example 642469616932880395`
    
  Note the following:

    - If a group does not exist, it will be created
    - Adding/removing ids to/from groups works like a toggle
    - When a guild is blocked, it will be left on the next [`ready`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-ready) or [`guildCreate`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate) event.

- `moduleCommands.js` Loading, unloading, and reloading of modules, commands, listeners, and events

  - `load command/event <path>`
  - `unload command/event [name/path]`
  - `reload command/event <name/path>`

  Usage Examples:

  - `load command ../bot/commands/ping.js`
  - `load listener ../bot/listeners/startup.js`
  - `unload command ping`
  - `unload cmd ping`
  - `unload c ../bot/commands/ping.js`
  - `unload commands`
  - `reload event ready`
  - `reload e message`
  - `reload command ping`
  - `reload command ../bot/commands/ping.js`
  - `reload listener ../bot/listeners/startup.js`

- `set.js` Setting the bot's avatar, name, presence, activity, and status

  - `setavatar <image attachment/link>`
  - `setname <text>`
  - `presence <json>`
  - `status [status]`
  - `activity [watching/listening] [text]`
  - `set avatar <image attachment/link>`
  - `set name <text>`
  - `set presence <json>`
  - `set playing/watching/listening [text]`
  - `set status [status]`

  Usage Examples:

  - `setavatar` (with an attached image)
  - `setavatar https://example.com/avatar.jpg` (with a real image link)
  - `set avatar` (with an attached image)
  - `set avatar https://example.com/avatar.jpg` (with a real image link)
  - `setname Example Bot`
  - `setusername Yet Another Bot`
  - `set name Example Bot`
  - `set username Yet Another Bot`
  - `presence { "activity": { "name": "with discord.js" } }`
  - `set presence { "activity": { "name": "with discord.js" } }`
  - Using `presence` or `set presence` with a code block works too
  - `status online`
  - `status offline`
  - `status invisible`
  - `status idle`
  - `status afk`
  - `status dnd`
  - `status busy`
  - `status do not disturb`
  - `set status online`
  - `set status offline`
  - `set status invisible`
  - `set status idle`
  - `set status afk`
  - `set status dnd`
  - `set status busy`
  - `set status do not disturb`
  - Using `status` or `set status` with no input or an unrecognized status will reset status to online
  - `activity with discord.js`
  - `activity listening to Caravan Palace`
  - `activity playing with discord.js`
  - `activity watching some birds`
  - `activity streaming Bob Ross`
  - `set activity with discord.js`
  - `set playing with discord.js`
  - `set listening to Caravan Palace`
  - `set watching some birds`
  - `set watching YouTube`
  - `set activity watching YouTube`
  - `set activity watching YouTube`
  - `set streaming Bob Ross`
  - `set activity streaming Bob Ross`
  - Using `activity` or `set activity` will clear activity

## `0.0.4` / `2020-06-18`

- Changed `log.js` to use a wrapper function, included the alternative approach commented out, and simplified the default export to be the same as `log.info()`

  - This fixes [issue #7](https://github.com/06000208/sandplate/issues/7)

- Removed a broken check from `run.bat` as a temporary fix

## `0.0.3` / `2020-06-16`

With this update, sandplate can now login!

I'm going to keep this brief and refrain from explaining too much (particularly regarding usage) as that's the role of documentation and guides, which can come later.

- For running the bot on windows, `run.bat` is an interactive batch script for using the bot, with features like toggleable auto restarting or setting a non-persisted token to use.

- An implementation of the handler framework as described [here](https://github.com/06000208/sandplate/issues/2)

  This is built around the `Handler` class, a container for several static functions that work based on passing in an instance of a construct class as the first parameter

  "Constructs" are classes that extend `BaseConstruct` and focus around certain type of module or file, with methods and collections related to what they're for. In a way, they're similar to Managers in discord.js

  Presently, `load` and `unload` methods alongside `idsByPath` and `cache` [collections](https://discord.js.org/#/docs/collection/master/class/Collection) are required for constructs to be compatible with `Handler`'s functions

  - `CommandConstruct`
  - `EventConstruct`

  "Modules" in this sense are [modules](https://nodejs.org/docs/latest-v12.x/api/modules.html#modules_modules) that export instances of classes that extend `BaseModule`. However, they're not limited to exporting one instance per file, as exporting an array of instances is supported.

  All module classes get a [snowflake](https://discord.com/developers/docs/reference#snowflakes) as their id during the instantiation of `BaseModule`

  - `CommandModule`
  - `ListenerModule`

  Some additional info regarding command modules:

  - When creating new instances of CommandModule, the only data key required is identity, the rest can be set to null or omitted for default values
  - Command run functions get mutated to have the discord.js `client` as their first parameter through the use of [`Function.prototype.bind()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind)
  - Commands can have any number of command names. Any one command doesn't have a "primary" name or aliases, it just has names, mapped to it's id.
  - Commands can control their "scope", or what [channel types](https://discord.js.org/#/docs/main/stable/class/Channel?scrollTo=type) the command will run in, both globally via the config and per command
  - Commands have access control with user groups or individual accounts
  - Commands can be marked as nsfw, which prevents them from running outside of nsfw channels
  - Commands can optionally require permissions of the user (the person running the command) or the client to have in order to use the command

  Some additional info regarding listener modules:

  - Listener modules are capable of choosing whether `emitter.on()` or `emitter.once()` is used for the listener callback function
  - Listener callback functions get mutated to have the [EventEmitter](https://nodejs.org/docs/latest-v12.x/api/events.html) the construct loading them belongs to as their first parameter through the use of [`Function.prototype.bind()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind)

  This is obviously leaving out a lot, so check the code itself for jsdoc documentation. They can all be found in `./modules/`, such as `./modules/CommandModule.js` or `./modules/ListenerModule.js`

- Several command modules are included with v0.0.3 (located in `./bot/commands/`)

  - `quit.js` Logs out the bot followed by process exit
  - `ping.js` Simple connection test
  - `eval.js` A huge security hole/risk, evaluating arbitrary javascript
  - `randomFile.js` An in depth command example that retrieves a random file from [Wikimedia Commons](https://commons.wikimedia.org/wiki/Main_Page). Also serves as an example of external API use.
  - `example.js` A minimalist command example that shows
  - `template.js` A more comprehensive command template
  - `templateMultiple.js` A template that demonstrates exporting multiple commands from one module

- Several listener modules are included with v0.0.3 (located in `./bot/listeners/`)

  - `commandParser.js` Listener for the [`message`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-message) event that's responsible for determining if messages are prefixed, responsible filtering out anything that isn't valid command use, parsing messages into arguments, and running commands.
    - Sandplate can be configured with any number of string prefixes, including none, and has support for @mention prefixes. Refer to `./modules/defaultConfig.js` (after 0.0.6, now `./modules/defaultData.js`) for documentation about this
  - `startup.js` Listener for the [`ready`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-ready) event, runs after the bot is online and workable, but will only run once, so it's safe for things like cron jobs or startup code. Currently just adds the bot owner's account id to the hosts user group if the hosts group is null.
  - `guildAccess.js` Implementation of guild access control using the [`ready`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-ready) and [`guildCreate`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate) events, which demonstrates exporting multiple event listeners from one module. refer to `./modules/defaultConfig.js` (after 0.0.6, now `./modules/defaultData.js`) for some information regarding guild groups and this, allow and block lists are both disabled (null) by default.
  - `logging.js` Logging and log messages for the [`debug`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-debug), [`warn`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-warn), [`error`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-error), [`ready`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-ready), [`shardError`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardError), [`shardReady`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardReady), [`shardDisconnect`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardDisconnect), [`shardReconnecting`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardReconnecting), [`shardResume`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardResume), [`rateLimit`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-rateLimit), and [`guildUnavailable`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildUnavailable) events

- `Client` class, an extension of discord.js's [Client](https://discord.js.org/#/docs/main/stable/class/Client) class with:

  - `client.config`, Bot configuration via lowdb. Stored at `./data/config.json` and generated with default values from `./modules/defaultConfig.js` (after 0.0.6, now `./modules/defaultData.js`) which also contains comprehensive documentation for the config file
  - `client.cookies`, An arbitrary [Collection](https://discord.js.org/#/docs/collection/master/class/Collection) for usage by anything in the bot. Think of browser cookies, but not persisted.
  - Instances of `CommandConstruct` and `EventConstruct` for the bot's commands and discord.js's events

- Minor tweaks to `./index.js`

- `./bot.js` now contains basic bot code and the login logic

  - Uses the extended client
  - You can now login with either a persisted token stored in your `./data/config.json` file or with a non-persisted token using a command prompt argument: `node index.js token` (where "token" is your discord bot token)
  - Tokens are validated against a regexp

- `./modules/miscellaneous.js` A miscellaneous functions module. Some are useful in general, others are for convenience and code clarity, as it's often simpler for logic to be a reusable function rather than complicated alternatives or implementing the logic multiple times where needed to achieve the same result. Located at

  - `sleep` Lets you "pause" for X amount of time in milliseconds (this is setTimeout's promise based variant)
  - `lovely` A small shortcut to JSON.stringify with optional discord code block wrapping
  - `isArrayOfStrings` Checks if a value is a non-empty array that only contains strings
  - `isPermissionResolvable` Checks if a value is resolvable as a permission, but does _not_ include circular array checking logic
  - `collectionArrayPush` Logic for easier appending to arrays stored in collections
  - `collectionArrayFilter` Logic for easier removal of elements from arrays stored in collections
  - `forAny` Logic for handling both one or multiple of something with the same callback function

- Config for jsdoc to ignore `./node_modules` (may need to be improved)

## `0.0.2` / `2020-05-22`

- Folder and app structure changes:

  - Renamed `events` folders to `listeners` in favor of being more semantically correct
  - Folders like `listeners` and `commands` will now be located in what they belong to (moved to be within `./bot/`)
  - Removed `./storage/` folder as it's redundant for the time being, may bring it back in the future
  - Updated the gitignore files accordingly

- `./modules/log.js`, a logging module for aesthetically pleasing and slightly more useful console logging

  - Timestamps and colored labels
  - Implemented using [bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind) instead of a wrapper function, preserving expected stack trace behavior
  - For example usage see [this page](https://github.com/06000208/sandplate/wiki/Log-Module-Usage).

- Created `./index.js`

  - Intended as the application start point and to be the "core" of the app
  - Added event listeners for node.js [`process`](https://nodejs.org/api/process.html) events `uncaughtException`, `unhandledRejection`, `rejectionHandled`, `warning`, and `exit` for logging purposes
  - Version checks for node.js and discord.js, both required to be at least v12.0.0

- Created `./bot.js`, just an empty file to start off with.

  As a side note, splitting interactions with discord.js and the client off into it's own file like this is a practice that was adopted from how discord.js's [ShardingManager](https://discord.js.org/#/docs/main/stable/class/ShardingManager) works.

## `0.0.1` / `2020-05-08`

First version!

- Reworked and cleaned up the repository, made initial-development branch for major version `0.x.x`, updated `README.md`

- `CHANGELOG.md`, this file! Note that dates are in the format `YYYY-MM-DD`.

- [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), for collaboration purposes

- [ESLint](https://eslint.org/) configuration files for consistent code style

- A `.gitignore` file and several `.gitkeep` files to include folders in the repository

- Several folders

  - `./temp/` Folder you can use for "temporary" files, such as ones created by the bot and then no longer needed after doing something with them
  - `./storage/` Folder you can use for files your bot may store, download, or miscellaneous files related to the bot that you want to keep with it
  - `./data/` Used for bot data- config files, databases, user data, etc
  - `./modules/` Used as the directory for generic javascript module files
  - `./commands/` Used as the default directory for command modules
  - `./events/` Used as the default directory for command modules

- Several npm packages
  - [`discord.js`](https://www.npmjs.com/package/discord.js) The [discord library](https://discord.com/developers/docs/topics/community-resources#libraries) of choice for sandplate
  - [`bufferutil`](https://www.npmjs.com/package/bufferutil), [`utf-8-validate`](https://www.npmjs.com/package/utf-8-validate) Optional packages for discord.js to increase websocket speed
  - [`chalk`](https://www.npmjs.com/package/chalk) For terminal colors
  - [`fs-extra`](https://www.npmjs.com/package/fs-extra), [`slash`](https://www.npmjs.com/package/slash), [`filehound`](https://www.npmjs.com/package/filehound) For working with files
  - [`lodash`](https://www.npmjs.com/package/lodash) Common javascript utility library
  - [`lowdb`](https://www.npmjs.com/package/lowdb) Small local JSON database done right.
  - [`moment`](https://www.npmjs.com/package/moment) For dealing with time
  - [`node-fetch`](https://www.npmjs.com/package/node-fetch) Light weight module that brings window.fetch to node.js
