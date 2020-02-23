# Sandplate

Sandplate is a boilerplate/template discord.js bot, and can be used as a bot "base" to expand upon or as a sandbox for trying out news ideas, concepts, and testing.

It's purpose is essentially to be the "basics" of your discord.js bot- this includes, but is not limited to:

- Improved console logging (timestamps and logging levels/labels)
- Handlers for Commands and Events
- Live reloadable commands, events, and listeners
- Both handlers support multiple commands/listeners within a single "module"
- Message parser that supports configurable prefix(s) and mention prefix
- Comes with a full set of commands for pinging, shutting down the bot, changing bot username, avatar, etc
- Ability to login either with a persisted token (stored in config.json) or non-persisted (command prompt argument)
- Batch script for running & automatically restarting the bot

This way, you don't need to write these things yourself- they're already made, the wheel already reinvented, and you can pull fixes and improvements from sandplate as they occur.

### Documentation (& a forewarning to aspiring developers)

However, it's purpose is **not** to skip learning how to code these things- In fact, to use sandplate properly, you will need to understand how they're implemented, along with how to use them, and I don't use the word "understand" lightly.

That said, for programmers, the barrier to entry will be very small- The project & this repository will launch when it reaches v1.0.0, which includes fully fledged documentation :)

If you don't know JavaScript, you're in the process of learning the language, or have never programmed before, then please read [this page](https://github.com/06000208/sandplate/wiki/Resources#learning-javascript)!

## Invites

The bot account itself is private for the time being. After the project reaches v1.0.0, the bot will be freely invitable.

| Link | Role? | Permission Bitwise |
| ---- | ----- | ------------------ |
| [Invite](https://discordapp.com/oauth2/authorize?client_id=642469616932880395&amp;scope=bot) | Won't create a role | |
| [Invite](https://discordapp.com/oauth2/authorize?client_id=642469616932880395&amp;scope=bot&amp;permissions=104188992) | Creates a bot managed role with basic non-administrative permissions | `104188992` |
