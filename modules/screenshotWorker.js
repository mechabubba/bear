// Doing this because I do not want a stale browser process hanging open in the background.
// Sounds like a bad idea. I would rather put this in the same file as the screenshot command, but it seems cleaner here...
const path = require("path");
const { parentPort, workerData, isMainThread } = require("worker_threads");
const fetch = require("node-fetch");
const { Builder } = require("selenium-webdriver");
const { Options, ServiceBuilder } = require("selenium-webdriver/firefox");
const { useragents } = require("./miscellaneous")

if (isMainThread) process.exit(1);

(async () => {
    const webdriver_path = path.resolve(path.dirname(require.main.filename), "..", "bin", "geckodriver");
    const service = new ServiceBuilder(webdriver_path);
    const opts = new Options()
        .addArguments("--headless")
        .setAcceptInsecureCerts(true) // sure, whatever

    // Ignore non-html/pdf filetypes. Best way to determine if we should even try...
    // If no response, probably keep on barrelling through. Some websites do not appreciate the `HEAD` request. :(
    // This is in an effort to save some bandwidth. If this starts blocking my bot, will have to work around it and check the header type after the `.get()` below.
    const head = await fetch(workerData.url, {
        method: "HEAD",
        headers: {
            "User-Agent": useragents.bear
        }
    });
    if (head.ok && !head.headers.get("content-type")?.includes("text/html")) {
        throw new Error("Non-HTML response type detected, bailing.");
    }

    let driver;
    try {
        driver = await new Builder()
            .forBrowser("firefox")
            .setFirefoxService(service)
            .setFirefoxOptions(opts)
            .build();

        await driver.manage().window().setRect({ width: 1920, height: 1080 });
        await driver.get(workerData.url);
        const screenshot = await driver.takeScreenshot();

        parentPort.postMessage({ success: true, screenshot });
    } catch (err) {
        parentPort.postMessage({ success: false, error: err.message });
    } finally {
        if (driver) await driver.quit(); // driver doesn't always exist.
    }
})();
