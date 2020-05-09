`0.0.1` / `2020-05-08`
------------------

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
