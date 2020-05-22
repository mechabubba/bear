
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
