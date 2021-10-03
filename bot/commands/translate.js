const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");

const debug = false; // Set to true to send the JSON output over the regular output.

module.exports = new CommandBlock({
    identity: ["translate", "trans"],
    summary: "Translates text.",
    description: "Translates text using the Google Translate API.\n\n**Language settings:** By default, the command takes given text and translates it to english. The `source` parameter can override this in one of two ways;\n• Set it to an (optional) ISO 639-1 language code to translate the text to a different language.\n• Force it to translate between different languages by placing an underscore `_` in between the source and the destination language; for example, `zh-cn_es` would attempt to translate from simplified chinese to spanish.\n\nView all supported languages [here!](https://cloud.google.com/translate/docs/languages)",
    usage: `(source) [foreign text]`,
    clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES"],
}, async function(client, message, content, args) {
    const positive = client.config.get("metadata.reactions.positive").value();
    const negative = client.config.get("metadata.reactions.negative").value();

    if(!content) return message.channel.send(`<:_:${negative}> You gave me nothing to translate!`);

    message.channel.startTyping();

    const langs = getlang(args[0]);
    if(langs !== undefined) args.shift();

    const api = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${langs ? langs.sl : "auto"}&tl=${langs ? langs.tl : "en"}&q=${encodeURIComponent(args.join(" "))}`;
    try {
        const resp = await fetch(api, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36",
            },
        });
        if(!resp.ok) throw new Error(resp.statusText);

        const json = await resp.json();

        let translation = "";
        for(let i = 0; i < json[0].length; i++) {
            translation += json[0][i][0];
        }

        message.channel.stopTyping(true);
        return message.channel.send({
            content: debug ? `\`\`\`\n${JSON.stringify(json, null, 4)}\`\`\`` : translation,
            allowedMentions: { parse: [] },
        });
    } catch(e) {
        message.channel.stopTyping(true);
        return message.channel.send(`<:_:${negative}> An error occured;\`\`\`\n${e.message}\`\`\``);
    }
});

const getlang = (lang) => {
    if(lang.includes("_")) {
        lang = lang.split("_");
        if(lang[0] in languages && lang[1] in languages) {
            return { sl: lang[0], tl: lang[1] };
        } else {
            return undefined;
        }
    } else if(lang in languages) {
        return { sl: "auto", tl: lang };
    } else {
        return undefined;
    }
};

// Data taken from https://cloud.google.com/translate/docs/languages. Last updated: 09/03/21
const languages = {
    "af": "Afrikaans",
    "sq": "Albanian",
    "am": "Amharic",
    "ar": "Arabic",
    "hy": "Armenian",
    "az": "Azerbaijani",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bs": "Bosnian",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "ceb": "Cebuano",
    "zh-cn": "Chinese (Simplified)",
    "zh": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)",
    "co": "Corsican",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "fi": "Finnish",
    "fr": "French",
    "fy": "Frisian",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "ha": "Hausa",
    "haw": "Hawaiian",
    "he": "Hebrew",
    "iw": "Hebrew",
    "hi": "Hindi",
    "hmn": "Hmong",
    "hu": "Hungarian",
    "is": "Icelandic",
    "ig": "Igbo",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "jv": "Javanese",
    "kn": "Kannada",
    "kk": "Kazakh",
    "km": "Khmer",
    "rw": "Kinyarwanda",
    "ko": "Korean",
    "ku": "Kurdish",
    "ky": "Kyrgyz",
    "lo": "Lao",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "lb": "Luxembourgish",
    "mk": "Macedonian",
    "mg": "Malagasy",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "mn": "Mongolian",
    "my": "Myanmar (Burmese)",
    "ne": "Nepali",
    "no": "Norwegian",
    "ny": "Nyanja (Chichewa)",
    "or": "Odia (Oriya)",
    "ps": "Pashto",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese (Portugal, Brazil)",
    "pa": "Punjabi",
    "ro": "Romanian",
    "ru": "Russian",
    "sm": "Samoan",
    "gd": "Scots Gaelic",
    "sr": "Serbian",
    "st": "Sesotho",
    "sn": "Shona",
    "sd": "Sindhi",
    "si": "Sinhala (Sinhalese)",
    "sk": "Slovak",
    "sl": "Slovenian",
    "so": "Somali",
    "es": "Spanish",
    "su": "Sundanese",
    "sw": "Swahili",
    "sv": "Swedish",
    "tl": "Tagalog (Filipino)",
    "tg": "Tajik",
    "ta": "Tamil",
    "tt": "Tatar",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "tk": "Turkmen",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "ug": "Uyghur",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "xh": "Xhosa",
    "yi": "Yiddish",
    "yo": "Yoruba",
    "zu": "Zulu",
};
