# Contributing

Welcome! Firstly, sandplate uses it's [issue section](https://github.com/06000208/sandplate/issues) for collaboration and project planning, and everything from bug reports to feature requests can be found and discussed there. 

Aside from sandplate's issue tracker, for real time communication, the preferred way is through [this discord server](https://discord.gg/xErQY6M), in the `#discord` channel.

<a href="https://discord.gg/xErQY6M"><img src="https://discordapp.com/api/guilds/273550655673860106/embed.png" alt="Discord Server" /></a>

If you're interested, at the [bottom of this page](#labels), you can see a list of all our issue labels and how they're used.

## Contributing Code

if you want to contribute code and help out directly, that's great! All contributions are appreciated.

If you have something specific you want to do, the first step is to find the appropriate issue or open one if it doesn't exist, followed by sharing your intentions to work on it so that others know.

However, If it's an enhancement or new feature that hasn't had any prior discussion, i.e. you opened the issue, it would be best to wait for a response before starting on it.

For everything else, you can generally tell from context when something has been approved and needs doing, but doesn't have anyone working on it at the moment, such as having no one assigned.

When someone's already assigned to the issue, that generally means that they're working on it already, but if you have something to say or want to help, leave a comment!

If you don't have something to specific in mind, but want to help out, these labels are a good place to start:

- [`good first issue`](https://github.com/06000208/sandplate/labels/good%20first%20issue) Issues that are aren't too complex and could be taken care of relatively easily.

- [`help wanted`](https://github.com/06000208/sandplate/labels/help%20wanted) Highlights an issue as needing attention from other developers, such as a bug we can't figure out or something that needs worked on more urgently than other stuff. Usually more complex than the issues that you would find in the former label.

After you've found something to do and communicated with the rest of us, feel free to fork the repository and make a pull request.

<<<<<<< HEAD
=======
### [Branches](https://github.com/06000208/sandplate/branches)

The `master` branch is treated as the latest stable version. Future versions have their own "in development" branches, awaiting their completion and merge into `master`.

While sandplate is undergoing initial development, [releases](https://github.com/06000208/sandplate/releases/) for each version aren't being published, but they will be in the future.

>>>>>>> initial-development
### ESLint

We make use of [ESLint](https://www.npmjs.com/package/eslint) to keep code consistent, so having it alongside the appropriate plugin(s) for your editor of choice will help your workflow.

```bash
# locally
npm install eslint

# globally
npm install --global eslint
```

- [ESLint for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Linter-ESLint for Atom](https://atom.io/packages/linter-eslint) (requires [Linter for Atom](https://atom.io/packages/linter))
- [ESLint for Sublime Text](https://packagecontrol.io/packages/ESLint)

### Code Of Conduct

This project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating, you're expected to abide by its terms. Please report unacceptable behavior to [`a0600208@protonmail.com`](mailto:a0600208@protonmail.com).

## Issue Labels <a id="labels"></a>

| Color | Label | Description |
|-------|-------|-------------|
| ![Red](https://satyr.io/64x16/e36875?text=+)        | `bug`                | Something is producing errors or isn't working right                            |
| ![Mint Green](https://satyr.io/64x16/97e6c6?text=+) | `enhancement`        | This introduces a new feature or improves sandplate                             |
| ![Blue](https://satyr.io/64x16/90cff5?text=+)       | `documentation`      | Anything regarding documentation, including jsdoc and code comments             |
| ![Pink](https://satyr.io/64x16/e6a9e8?text=+)       | `support`            | Questions, support, and assistance regarding sandplate                          |
| ![Brown](https://satyr.io/64x16/cfb6a3?text=+)      | `maintenance`        | Anything regarding minor tasks, clean up, or code style/quality such as eslint  |
| ![Purple](https://satyr.io/64x16/bfb0e8?text=+)     | `good first issue`   | Good for newcomers                                                              |
| ![Green](https://satyr.io/64x16/a5db88?text=+)      | `help wanted`        | Extra attention is needed for this issue or pull request                        |
| ![Yellow](https://satyr.io/64x16/f5d56e?text=+)     | `awaiting more info` | This issue or pull request requires more information to be handled              |
| ![Orange](https://satyr.io/64x16/edb468?text=+)     | `won't fix/add`      | This will not be worked on (a reason is always posted)                          |
| ![Gray](https://satyr.io/64x16/9e9e9e?text=+)       | `meta`               | Anything regarding the repository, project, workflow, or other such meta topics |
| ![Light Gray](https://satyr.io/64x16/d4d4d4?text=+) | `x.x.+`              | This is part of a new patch (backwards compatible bug fixes or maintenance)     |
| ![Light Gray](https://satyr.io/64x16/d4d4d4?text=+) | `x.+.x`              | This is part of a new minor version (new backwards compatible functionality)    |
| ![Light Gray](https://satyr.io/64x16/d4d4d4?text=+) | `+.x.x`              | This is part of a new major version (breaking changes)                          |
| ![White](https://satyr.io/64x16/ffffff?text=+)      | `invalid`            | This doesn't seem right                                                         |
| ![White](https://satyr.io/64x16/ffffff?text=+)      | `duplicate`          | This issue or pull request already exists     
