const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");
const { MessageEmbed, Util } = require("discord.js");
const { isArray } = require("lodash");

// A list of pod ID's to ignore in our query.
const ignoredPodIDs = [
    // Plots (obviously cant be displayed in plaintext)
    "PlotsOfTheSolution",
];
const ip = "69.178.108.164"; // Spoofed IP passed to Wolfram to be our reference IP (so to not leak the bots IP).

module.exports = new CommandBlock({
    names: ["wolfram", "wmath"],
    description: "Queries Wolfram Alpha.",
    usage: "[query]"
}, async function(client, message, content, args) {
    const appid = client.config.get(["keys", "wolfram_appid"]);
    if(!appid) return message.reply(`${client.reactions.negative.emote} The bot does not have a configured Wolfram Alpha AppID, which is necessary to make calls to its API!`);
    if(!content) return message.reply(`${client.reactions.negative.emote} You need to query *something!*`);

    let query;
    try {
        const resp = await fetch(`http://api.wolframalpha.com/v2/query?appid=${appid}&ip=${ip}&input=${encodeURIComponent(content)}&format=plaintext&output=json`);
        if(!resp.ok) throw new Error(`Recieved HTTP error response ${resp.status}.`);
        
        const json = await resp.json();
        if(!json.queryresult) throw new Error("No query result provided.");

        query = json.queryresult;
        if(query.error) throw new Error("Query resulted in an error, and did not include any pods of data.");
        if(query.parsetimedout) throw new Error("Timed out during the parsing stage. (perhaps try a more simple query?)");
    } catch(e) {
        return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
    }

    // Handle "Did you mean?" functionality. This is independent of the embed.
    let msg_content;
    if(query.didyoumeans) {
        msg_content = `${client.reactions.inquiry.emote} `;
        if(!query.success) {
            msg_content += "Could not query any data. ";
        }
        msg_content += `Did you mean...\n`;
        if(!isArray(query.didyoumeans)) query.didyoumeans = [query.didyoumeans]; // bandaid fix. sometimes it only returns an object
        for(let i = 0; i < query.didyoumeans.length; i++) {
            const dym = query.didyoumeans[i];
            msg_content += `• **\`${dym.val}\`?** (confidence: ${dym.level}, ${(dym.score * 100).toFixed(2)}%)\n`;
        }
    }
    if(!query.success) return message.reply(`${msg_content}`);
    
    const embed = new MessageEmbed();

    // Handle assumptions. These will just be placed in the embed description.
    // @todo it might be worthy to analyze the complexity of this. probably easier to do this than is implemented
    if(query.assumptions) {
        // Assumptions include placeholders in them, so we need to handle formatting that correctly.
        // In some very specific cases they don't; this covers *some* of the related cases (and makes it so nothing goes awry otherwise). 
        const formatAssumption = (asmp) => {
            require("../../modules/log").debug(asmp);
            if(!asmp.template) { // Sometimes assumption templates aren't provided.
                switch(asmp.type) {
                    case "FormulaVariable": return `Query was not provided with a ${asmp.desc}; using ${asmp.values.desc}.`; // Tested with "derivative", "integral", and "eigenvalue"; can't find any other cases.
                }
                return;
            } else {
                let result = asmp.template;
                result = result.replace("Use", "Consider using");

                // matchedTemplateNames matches "${template}" to "template". It includes an infinite negative lookbehind which removes duplicate matched groups. This is slow, but the strings are small so I think its worthy.
                // We must do this because the `values` object in the assumption does not include names to which template equals the other; however, it seems to be sequential. Therefore we're gonna run with that fact and hope it works.
                const matchedTemplateNames = result.matchAll(/\${([A-Za-z0-9]*)(?<!^.*\b\1\b.*\b\1\b)}/g);
                
                let i = 0;
                for(const match of matchedTemplateNames) {
                    const word = match[1];
                    // We replace text via regex, so all values in string get replaced. Triple escape there so the RegExp understands the original escape on the "$" sign.
                    if(word == "word") {
                        // Special case. "word" utilizes another passed in property of the same name, not anything in the `values` list.
                        // Replace it and continue.
                        result = result.replace(new RegExp(`\\\${${word}}`, "g"), asmp.word);
                        continue;
                    } // @todo handle assumptions properly | If the template ends with a number, we assume its referring to the specific value index provided.
                    result = result.replace(new RegExp(`\\\${${word}}`, "g"), asmp.values[i].desc);
                    i++;
                }

                result += "."; // For some reason, these assumptions don't end with a period. Add one for easier reading.
                return result;
            }
        }

        if(!isArray(query.assumptions)) query.assumptions = [query.assumptions]; // This API is stupid.
        const assumptions = [];
        for(let i = 0; i < query.assumptions.length; i++) {
            const asmp = formatAssumption(query.assumptions[i]);
            if(asmp) {
                assumptions.push(`:warning: *${formatAssumption(query.assumptions[i])}*`);
            }
        }
        embed.setDescription(assumptions.join("\n"));
    }

    // Handle pods. Each pod normally is its own field in the embed.
    // Subpods are the data inside the fields; if multiple subpods are available, then they will be formatted as such.
    for(const pod of query.pods) {
        if(pod.error) continue;
        if(pod.id == "Input") { // Input gets automatically set to the title of the embed.
            embed.setTitle(pod.subpods[0].plaintext); // @todo is it a good idea to assume the `Input` pod has a subpod?
            continue;
        }

        // Don't add ignored subpods, and ignore nonexistant subpods.
        if(ignoredPodIDs.includes(pod.id)) continue;
        if(pod.numsubpods == 0) continue;

        const subpods = [];
        if(pod.numsubpods == 1) {
            const subpod = pod.subpods[0];
            if(!subpod.plaintext) continue;
            subpods.push(Util.escapeMarkdown(subpod.plaintext));
        } else {
            // Handle the formatting of subpods.
            // If a plaintext format is unavailable, then it is not displayed.
            for(const subpod of pod.subpods) {
                if(!subpod.plaintext) continue;
                if(!subpod.title) {
                  subpods.push(Util.escapeMarkdown(subpod.plaintext).trim()); // If theres no title, just list them and split them via newlines.
                } else {
                  subpods.push(`**${subpod.title}**\n${Util.escapeMarkdown(subpod.plaintext).trim()}`);
                }
            }
        }

        if(subpods.length > 0) {
            let desc = subpods.join("\n");
            if(desc.length > 1024) {
                desc = desc.substring(0, 1021) + "...";
            }
            embed.addField(pod.title, desc);
        }
    }

    if(!embed.title) { // `Input` pod not always included in response, so backup.
        embed.setTitle(content);
    }
    embed.setURL(`https://www.wolframalpha.com/input?i=${encodeURIComponent(content)}`);
    embed.setColor("#FF7E00");
    embed.setFooter({ text: `Generated in ${query.timing} seconds.` });

    return message.reply({
        content: msg_content,
        embeds: [embed],
        allowedMentions: { repliedUser: false }
    });
})

// @todo somewhere in here should be a function that "untables" the plaintext of subpods
// some of the results are cluttered with vertical bars; example response below. 99% sure these are supposed to be formatted as tables, but discord obviously cant do that so we gotta get around it.
// "\n  | | | \nlow: -93 °F\nTue, Sep 6, 2:00am | average high: | -56 °F\naverage low: | -62 °F | high: -29 °F\nSun, Sep 11, 1:45pm\n | |   " (query: temperature in antarctica; pod "History & Forecast")
