const CommandBlock = require("../../modules/CommandBlock");
const { MessageEmbed } = require("discord.js");
const { DateTime } = require("luxon");
const fetch = require("node-fetch");
const SteamID = require("steamid");
const { countries } = require("../../data/countries-states-cities.min.json");

module.exports = [
    new CommandBlock({
        names: ["steam", "steamid"],
        description: "Gets someones Steam profile information.",
        usage: "[SteamID or custom URL]",
    }, async function(client, message, content, [id]) {
        const apikey = client.config.get(["secrets", "steam_apikey"]);
        if(!apikey) {
            return message.reply(`${client.reactions.negative.emote} No API key provided! Please set one in \`data/config.json\`.`);
        }
        if(!id) return message.reply(`${client.reactions.negative.emote} You must pass in a SteamID to get a users information.`);

        let steamID;
        try {
            steamID = new SteamID(id);
        } catch(e) {
            // check if its a vanity url via another api endpoint
            const resp = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apikey}&vanityurl=${id}`);
            const json = await resp.json();
            if(!json.response || json.response.success !== 1) {
                return message.reply(`${client.reactions.negative.emote} This is not a valid SteamID or custom URL!`);
            }
            steamID = new SteamID(json.response.steamid);
        }

        if(!steamID.isValidIndividual()) return message.reply(`${client.reactions.negative.emote} This SteamID does not correspond to an individuals account!`);

        const resp = await fetch(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apikey}&steamids=${steamID.getSteamID64()}`);
        const json = await resp.json();
        const profile = json.response.players[0];

        const embed = new MessageEmbed()
            .setColor("#1b2838")
            .setTitle(profile.personaname)
            .setURL(`https://steamcommunity.com/profiles/${profile.steamid}`)
            .setThumbnail(profile.avatarfull);

        let description = [
            `\`\`\`yaml`,
            profile.profileurl,
            `Status:      ${profile.personastate == 0 ? "Offline" : profile.personastate == 1 ? "Online" : profile.personastate == 2 ? "Busy" : profile.personastate == 3 ? "Away" : profile.personastate == 4 ? "Snooze" : profile.personastate == 5 ? "Looking to Trade" : profile.personastate == 6 ? "Looking to Play" : "Unknown"}`,
            `---`,
        ];

        // Private profile.
        if(profile.communityvisibilitystate !== 3) {
            embed.setFooter({ text: "This profile is private." });

        // No community profile created.
        } else if(!profile.profilestate) {
            embed.setFooter({ text: "This user has not set up their Steam Community profile." });

        // Public profile!
        } else if(profile.communityvisibilitystate === 3) {
            // Some of these aren't included in the API response...
            if(profile.realname) {
                description.push(`Real Name:   ${profile.realname}`);
            }

            let country;
            if(profile.loccountrycode) {
                country = countries.find((obj) => obj.code == profile.loccountrycode);
                description.push(`Country:     ${country ? country.name : profile.loccountrycode}`);
            }
            let state;
            if(profile.locstatecode) {
                state = country.states.find((obj) => obj.code === profile.locstatecode);
                description.push(`State:       ${state ? state.name : profile.locstatecode}`);
            }
            let city;
            if(profile.loccityid) {
                city = state.cities.find((obj) => obj.id === profile.loccityid);
                description.push(`City:        ${city ? city.name : profile.loccityid}`);
            }
            description.push(`Created:     ${DateTime.fromMillis(profile.timecreated * 1000).toLocaleString(DateTime.DATETIME_MED)}`);

            // For some reason this is *only sometimes* not included in the response.
            if(profile.personastate == 0 && profile.lastlogoff) {
                description.push(`Last online: ${DateTime.fromMillis(profile.lastlogoff * 1000).toLocaleString(DateTime.DATETIME_MED)}`);
            }
            embed.setFooter({ text: "This profile is public." });
        }

        description.push(...[
            `---`,
            `SteamID:     ${steamID.getSteam2RenderedID(true)}`,
            `SteamID3:    ${steamID.getSteam3RenderedID()}`,
            `SteamID64:   ${profile.steamid}`,
        ]);
        description = description.join("\n") + `\`\`\``;
        embed.setDescription(description);

        return message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }),
];
