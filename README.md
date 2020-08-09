# Sandplate (Initial Development)

Sandplate is a boilerplate/template [discord.js](https://discord.js.org) bot, and can be used as a base to expand upon.

It's current goal (and eventual purpose) is to cover all of the "basics" of a discord bot's internals, such as, but not limited to:

- Automatically generating the configuration file
- Logging in with either a persisted token (stored in the config) or non-persisted (command prompt argument)
- Framework for commands and event modules (also known as a command handler)
- Reloadable command and event modules
- Command access control
- Blocking users or guilds from interacting with the bot
- Supports any number of command prefixes alongside @mention prefix support
- A full set of default commands written in the framework
- Improved console logging (timestamps and labels)
- Batch script for running & automatically restarting the bot

This way, you don't need to write these things in full yourself, they'd be available to expand upon and use, whatever your purposes, and you could pull fixes and improvements from this repository as they occur.

However, the idea is *not* to skip learning how to code what sandplate does for you. Rather, to make use of sandplate in any meaningful way, you'll need to know how these things are implemented and familiarize yourself with the internals.

Sandplate is currently in initial development, during which it isn't intended for any real use, and anything may change at any time.

## Contributing

If you'd like to contribute to sandplate or get involved, read our [contributing](CONTRIBUTING.md) file! Reporting issues, bugs, and requesting features are also described there.

## Contact

While sandplate uses it's [issue section](https://github.com/06000208/sandplate/issues) for collaboration and project planning, for real time communication, the preferred method is [this discord server](https://discord.gg/xErQY6M).

<a href="https://discord.gg/xErQY6M"><img src="https://discordapp.com/api/guilds/273550655673860106/embed.png" alt="Discord Server" /></a>

Additionally, you can get in touch with the project lead directly by emailing [`a06000208@protonmail.com`](mailto:a06000208@protonmail.com) if necessary.

## Code Of Conduct

This project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating, you're expected to abide by its terms. Please report unacceptable behavior to [`a0600208@protonmail.com`](mailto:a0600208@protonmail.com).
