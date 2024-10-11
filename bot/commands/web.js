const path = require("path");
const CommandBlock = require("../../modules/CommandBlock");
const { URL } = require("../../modules/regexes");
const { MessageAttachment } = require("discord.js");
const { Builder, Browser } = require("selenium-webdriver");
const { ServiceBuilder, Options } = require("selenium-webdriver/firefox");

const webdriver_path = path.resolve(path.dirname(require.main.filename), "bin/geckodriver");

// to point to local bin
const serviceBuilder = new ServiceBuilder();
const opts = new Options()
    .addArguments("--headless")
    .addArguments("--driver-configuration", `webdriver-path=${webdriver_path}`)
    .setAcceptInsecureCerts(true);

module.exports = [
    new CommandBlock({
        names: ["screenshot", "sc"],
        description: "Screenshots a webpage.",
        usage: "[URL]",
        clientChannelPermissions: ["ATTACH_FILES"],
        dependencies: "/bin/geckodriver"
    }, async (client, message, contents, [url, ...args]) => {
        if (!/^http[s]?:\/\//g.test(url)) {
            url = "https://" + url;
        }
        if (!URL.test(url)) {
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

        const driver = await new Builder()
            .forBrowser(Browser.FIREFOX)
            .setFirefoxService(serviceBuilder)
            .setFirefoxOptions(opts)
            .build();

        await driver.manage().window().setRect({ width: 1920, height: 1080 });
        try {
            const date_reached = Date.now();
            await driver.get(url)
            const sc = await driver.takeScreenshot();

            const attachment = new MessageAttachment(Buffer.from(sc, "base64"), `sc_${date_reached}_${b64}.png`);
            return message.reply({ files: [attachment], allowedMentions: { repliedUser: false } });
        } catch(e) {
            return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``)  
        } finally {
            await driver.quit();
        }
    })
];
