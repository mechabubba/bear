`0.0.5` / `2020-07-XX`
----------------------

*The changelog for this version is incomplete/w.i.p and presently being written*

- New `Response` class as a way for functions to return more data to their caller than they could by returning booleans or strings alone

- Overhauled the handler framework and all classes related to modules!
  
  This regards everything in [issue #10](https://github.com/06000208/sandplate/issues/10):
  
  - Loading modules is now noticeably faster
  - A new handler function, `resolvePath()`, which is essentially a wrapper for `require.resolve()` that takes care of try/catching and returns data using the Response class.
  - The four other handler functions now make use of the Response class as what they return, and they have gone through numerous changes and improvements to their logic
  - `fs-extra` is no longer used to check that files exist, as `resolvePath()` handles that far better and with identical behavior to `require()`
  - Handling of paths in general has been improved, and paths mapped in collections as well as the `.filePath` property on block instances are the same paths resolved to by the require internals, such as [`require.cache`](https://nodejs.org/api/modules.html#modules_require_cache) or `require.resolve()` This means that everything is far more consistent internally, and that any number of different dynamic paths will work so long as they all resolve to the same path. 
  
    You won't need to use `resolvePath()` externally to resolve a path before use, though,, because `unloadModule()` and `requireModule()` already use it themselves internally.
  - The `setup()` handler function has been renamed to `loadDirectory()`
  
  And [issue #11](https://github.com/06000208/sandplate/issues/11):

  - Use of the term "Module" for the classes exported by modules has been ditched in favor of "Block", with `BaseModule` becoming  `BaseBlock`, `CommandModule` becoming `CommandBlock`, and so on! This way, the term module only refers to [actual modules](https://nodejs.org/docs/latest-v12.x/api/modules.html#modules_modules), and the terminology of "blocks" for the classes exported by modules works quite well.
  - Construct instances now have ids and names, as described in the above linked issue
  - `BaseBlock`, `BaseConstruct`, `CommandConstruct`, and `EventConstruct` have all been entirely reworked.
  
    `BaseBlock` and `BaseConstruct` both extend a new class, `Base`, in order to easily share some features such as having snowflake ids, and before, they were mostly incomplete blank slates, with most of the code and logic being in the classes that extended them.
    
    This is no longer the case, with all non-unique code being moved to them and improved upon, with `CommandConstruct` and `EventConstruct` being altered and reworked accordingly.

    As an example, BaseConstruct now has `load` and `unload` methods itself, which the two construct classes call in their own `load` and `unload` methods using `super`.

    For more detail, I would recommend viewing the classes themselves and how `CommandConstruct`, `EventConstruct`, `CommandBlock`, and `ListenerBlock` now extend them.

- `firstPrefix` getter for `CommandConstruct` and command name related getters for `CommandBlock` (Issues [#8](https://github.com/06000208/sandplate/issues/8) and [#9](https://github.com/06000208/sandplate/issues/9), respectively)

- All modules under `./bot/` have been switched to using `CommandBlock` and `ListenerBlock` accordingly

- Fixed config properties `commands.directory` and `events.directory` not being used

- Improved `./bot/commands/eval.js`'s check for promises and abandoned code block syntax highlighting in favor of the error resilience gained from always using `util.inspect()`

- Issue [#6](https://github.com/06000208/sandplate/issues/6) changes for `run.bat` (a new check for when npm modules aren't installed alongside bringing back the check for the configuration file now fixed and with with a better response)

`0.0.4` / `2020-06-18`
----------------------

- Changed `log.js` to use a wrapper function, included the alternative approach commented out, and simplified the default export to be the same as `log.info()`
  - This fixes [issue #7](https://github.com/06000208/sandplate/issues/7)

- Removed a broken check from `run.bat` as a temporary fix

`0.0.3` / `2020-06-16`
----------------------

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

  This is obviously leaving out a lot, so check the code itself for jsdoc documentation. They can all be found in `./modules/`, such as `./modules/CommandModule.js` or  `./modules/ListenerModule.js`

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
    - Sandplate can be configured with any number of string prefixes, including none, and has support for @mention prefixes. Refer to `./modules/defaultConfig.js` for documentation about this
  - `startup.js` Listener for the [`ready`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-ready) event, runs after the bot is online and workable, but will only run once, so it's safe for things like cron jobs or startup code. Currently just adds the bot owner's account id to the hosts user group if the hosts group is null.
  - `guildAccess.js` Implementation of guild access control using the [`ready`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-ready) and [`guildCreate`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildCreate) events, which demonstrates exporting multiple event listeners from one module. refer to `./modules/defaultConfig.js` for some information regarding guild groups and this, allow and block lists are both disabled (null) by default.
  - `logging.js` Logging and log messages for the [`debug`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-debug), [`warn`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-warn), [`error`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-error), [`ready`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-ready), [`shardError`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardError), [`shardReady`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardReady), [`shardDisconnect`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardDisconnect), [`shardReconnecting`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardReconnecting), [`shardResume`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-shardResume), [`rateLimit`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-rateLimit), and [`guildUnavailable`](https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-guildUnavailable) events

- `Client` class, an extension of discord.js's [Client](https://discord.js.org/#/docs/main/stable/class/Client) class with:
  - `client.config`, Bot configuration via lowdb. Stored at `./data/config.json` and generated with default values from `./modules/defaultConfig.js` which also contains comprehensive documentation for the config file
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
  - `isPermissionResolvable` Checks if a value is resolvable as a permission, but does *not* include circular array checking logic
  - `collectionArrayPush` Logic for easier appending to arrays stored in collections
  - `collectionArrayFilter` Logic for easier removal of elements from arrays stored in collections
  - `forAny` Logic for handling both one or multiple of something with the same callback function

- Config for jsdoc to ignore `./node_modules` (may need to be improved)


`0.0.2` / `2020-05-22`
----------------------

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

`0.0.1` / `2020-05-08`
----------------------

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
