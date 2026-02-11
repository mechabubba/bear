const path = require("node:path");
const { URL } = require("node:url");
const { Worker } = require("worker_threads");
const CommandBlock = require("../../modules/CommandBlock");
const rgx = require("../../modules/regexes");
const { MessageAttachment } = require("discord.js");

module.exports = [
    new CommandBlock({
        names: ["screenshot", "sc"],
        description: "Screenshots a webpage. See the sent filename for information about the capture, such as the time captured and the URL encoded in base64.",
        usage: "[URL]",
        clientChannelPermissions: ["ATTACH_FILES"],
        dependencies: ["firefox", "/bin/geckodriver"]
    }, async (client, message, contents, [url, ...args]) => {
        if (!/^http[s]?:\/\//g.test(url)) {
            url = "http://" + url;
        }
        if (!rgx.URL.test(url)) {
            return message.reply(`${client.reactions.negative.emote} The supplied text was not a URL!`);
        }

        // Format screenshotted URL in attachment name in base64.
        let b64;
        if (4 * (Math.ceil(url.length / 3)) > 200) {
            // If the encoded string is longer than 200 (slightly lower than real limit due to filesystem constraints), truncate it.
            b64 = Buffer.from(url.slice(0, 150) + "...").toString("base64");
        } else {
            b64 = Buffer.from(url).toString("base64");
        }

        // get ready to get thready
        const worker = new Worker(
            path.resolve(path.dirname(require.main.filename), "modules", "screenshotWorker.js"),
            { workerData: { url } }
        );

        worker.once("message", async (res) => {
            if (!res.success) {
                if (/(about:neterror.*)\./.test(res.error)) {
                    let ps = new URL(res.error.match(/(about:neterror.*)\./)[0]);
                    res.error = `${ps.searchParams.get("d")} (${ps.searchParams.get("e")})`;
                }
                return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${res.error}\`\`\``);
            }

            const date_reached = Date.now();
            const attachment = new MessageAttachment(
                Buffer.from(res.screenshot, "base64"),
                `sc_${date_reached}_${b64}.png`
            );

            return message.reply({
                files: [attachment],
                allowedMentions: { repliedUser: false }
            });
        });

        worker.once("error", (e) => {
            return message.reply(`${client.reactions.negative.emote} A worker error occured;\`\`\`\n${e.message}\`\`\``);
        });
    })
];
