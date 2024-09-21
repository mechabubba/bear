// This file to eventually hold a bunch of other system stuff.
// Debug commands, system status, etc.
const os = require("os");
const { execSync } = require("child_process");
const package = require("../../package.json");
const CommandBlock = require("../../modules/CommandBlock");
const { humanizeDuration, humanizeSize, gitinfo, isAvailable } = require("../../modules/miscellaneous");
const { MessageEmbed } = require("discord.js");
const { DateTime } = require("luxon");
const { accessSync, constants } = require("fs");

module.exports = [
    new CommandBlock({
        names: ["debug"],
        description: "Returns some information that may be helpful in installing or debugging.\n\nGenerally, if its not entirely green, something is wrong.",
        locked: ["hosts"]
    }, function(client, message, content, args) {
        // this command could be more elegant
        // perhaps command blocks could have a "depends" property... and could loop through all blocks and test this way
        const msgs = [];

        msgs.push("Checking available packages...");
        const pkgs = [
            { name: "fortune", is: isAvailable("fortune"), for: ["fortune"] },
            { name: "cowsay",  is: isAvailable("cowsay"),  for: ["fortune"] },
            { name: "latex",   is: isAvailable("latex"),   for: ["latex"]   },
            { name: "dvipng",  is: isAvailable("dvipng"),  for: ["latex"]   }
        ]

        for (const pkg of pkgs) {
            msgs.push(`${(pkg.is ? "🟢" : "🔴")} ${pkg.name} is${!pkg.is ? " NOT" : ""} installed (required by: ${pkg.for.join(", ")}).`);
        }

        msgs.push("\nChecking for local binaries...");
        const bins = [
            { name: "mathtex", is: isAvailable("/bin/mathtex"), for: ["latex"] }
        ];

        for (const bin of bins) {
            msgs.push(`${(bin.is ? "🟢" : "🔴")} ${bin.name} is${!bin.is ? " NOT" : ""} installed (required by: ${bin.for.join(", ")}).`);
        }

        return message.reply({ content: `\`\`\`\n${msgs.join("\n")}\`\`\``, allowedMentions: { repliedUser: false }});
    }),
    new CommandBlock({
        names: ["system", "sys"],
        description: "Gets information about the system the bot is running on.",
        locked: ["hosts"],
    }, function(client, message, content, args) {
        if (os.platform() === "win32") {
            return message.reply(`${client.reactions.negative.emote} This command is only supported on Unix-based operating systems.`);
        }
        
        const embed = new MessageEmbed();

        // this is kind of a shit way of doing things
        const title = execSync(". /etc/os-release && echo $PRETTY_NAME").toString();
        const loads = os.loadavg();
        const memusage = os.totalmem() - os.freemem();
        const sys_uptime = parseInt(execSync("awk '{print int($1) * 1000}' /proc/uptime").toString());
        const nvm_version = execSync(". $NVM_DIR/nvm.sh && nvm --version || true").toString().trim();
        const djs_version = require("discord.js").version;
        const repo = package.repository.url.split(".git")[0];
        const branch = execSync("git rev-parse --abbrev-ref HEAD").toString();

        embed.setTitle(title);
        embed.setColor(client.config.get("metadata.color"));
        embed.addFields(
            {
                name: "CPU Loads",
                value: [
                    "(past 1 min / 5 min / 15 min)",
                    `${loads[0]}% / ${loads[1]}% / ${loads[2]}%`
                ].join("\n"),
                inline: true,
            },
            {
                name: "Uptime",
                value: [
                    `**System:** ${humanizeDuration(sys_uptime)}`,
                    `**Client:** ${humanizeDuration(client.uptime)}`
                ].join("\n"),
                inline: true,
            },
            {
                name: "Memory Usage",
                value: `${humanizeSize(memusage)} / ${humanizeSize(os.totalmem)}`,
                inline: true,
            },
            {
                name: "Runtimes and Libraries",
                value: [
                    `node ${process.versions["node"]}${nvm_version ? ` (within nvm ${nvm_version})` : ""}`,
                    `discord.js ${djs_version}`,
                    `${package.name} ${package.version}`,
                ].join("\n"),
                inline: true,
            },
            {
                name: "Latest Commit",
                value: [
                    `Commit [\`${gitinfo("%h")}\`](${repo}/commit/${gitinfo("%H")}) on branch [\`${branch}\`](${repo}/tree/${branch})\`\`\``,
                    `${execSync("git show -s HEAD").toString()}\`\`\``
                ].join("\n")
            },
        );
        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false }});
    }),
    new CommandBlock({
        names: ["cmdlog"],
        description: "Gets data from the command log.",
        usage: "[id]",
        locked: ["hosts"],
    }, function(client, message, content, [id, ...args]) {
        const clogging = client.config.get("commands.channellogging");
        if(!clogging.enabled) {
            return message.reply(`${client.reactions.alert.emote} Command logging is not enabled.`);
        }
        if(!id) {
            return message.reply(`${client.reactions.negative.emote} You must provide a command ID to look up!`);
        }

        id = id.toLowerCase();
        if (!client.cmdlog.has(id)) {
            return message.reply(`${client.reactions.negative.emote} The command was not found.`);
        } else {
		    const data = client.cmdlog.get(id);
            const tout = client.cmdlog.getTimeout(id);

            const tdate = DateTime.fromMillis(tout);
            const embed = new MessageEmbed()
                .setColor(clogging.color)
                .setTitle(`Command \`${id.toUpperCase()}\``)
                .setFooter({ text: `Expires ${tdate.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)} (in ${humanizeDuration(tout - Date.now())})` });

            embed.addFields([
                { name: "User", value: `\`${data.message.author.id}\``, inline: true },
                { name: "Message", value: `\`${data.message.id}\``, inline: true },
                { name: "Channel", value: `\`${data.message.channel.id}\``, inline: true },
                { name: "Guild", value: `\`${data.message.guild.id}\``, inline: true },
                { name: "Command", value: `**Executed at:** ${DateTime.fromMillis(data.message.createdTimestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}\`\`\`\n${data.parsedContent}\`\`\`` }
            ])
            return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        }
    }),
];
