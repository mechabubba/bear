<img align="right" src="assets/icon_static_small.png">

# <a href="https://mechabubba.github.io/bear/">bear</a>
<a href="https://discord.gg/9gdMpBR6bK">![Join the dev server!](https://img.shields.io/discord/525773944351883304?label=discord)</a> ![thanks mom](https://img.shields.io/badge/shoutouts%20to-my%20mom-ff69b4)

*"the best discord bot"* — @everyone

bear [stylized accordingly] is my personal Discord bot. While it doesn't currently have a main focus or utility, it includes many features that I find useful and use regularly. You can invite the official bot [here](https://discord.com/oauth2/authorize?client_id=435224030459723776&scope=bot&permissions=8); do note that this link will automatically give it the "`ADMINISTRATOR`" permission.

bear is a modified fork of [sandplate](https://github.com/06000208/sandplate) 0.0.7, a powerful template bot. See its readme for more information.

## Installing
1. `git clone https://github.com/mechabubba/bear.git`.
2. Enter the folder and `npm i`.
3. Install a bunch of shit;
```sh
# for debian/raspbian users;
$ sudo apt-get install fortune-mod cowsay latex
```
4. Compile [`mathtex`](https://github.com/mechabubba/mathtex) (name the binary `mathtex`) and throw that in the bin folder.

## Launching
Running `node index.js` initially will create a config.json file in the data folder. Throw a bot token in there under `client.token` and now you're cooking with gas.

Eventually, there will be a proper docker or systemd configuration to allow it to be persistent. For now, if it for some reason shuts down, perhaps check out [my script?](https://gist.github.com/mechabubba/e17397e487951358681103321f499bde) (ﾉ´• ω •`)ノ

## Contributing
This is my bot, so every contribution is under heavy scrutiny because bear is my *little scrunkly.* But if you feel the need to add something or fix something, then please create a PR. Might get closed flat out, might not. Shits a gamble, man.

Feel free to join the Discord server up by the header to share your thoughts if you feel particularly strong about something.

## License
This is licensed under the Unlicense.
