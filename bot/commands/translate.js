const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");
const log = require("../../modules/log");
const { useragents } = require("../../modules/miscellaneous");

const debug = false; // Set to true to send the JSON output over the regular output.

module.exports = new CommandBlock({
    names: ["translate", "trans"],
    description: "Translates text using the Google Translate API.\n\n**Language settings:** By default, the command takes given text and translates it to english. The `source` parameter can override this in one of two ways;\n• Set it to an (optional) ISO-639 language code to translate the text to a different language. Note that some supported languages differ from this standard.\n• Force it to translate between different languages by placing an underscore `_` in between the source and the destination language; for example, `zh-cn_es` would attempt to translate from simplified chinese to spanish.\n\nView all supported languages [here!](https://cloud.google.com/translate/docs/languages)",
    usage: `(source) [foreign text]`,
}, async function(client, message, content, args) {
    if(!content) return message.reply(`${client.reactions.negative.emote} You must input a piece of text to translate.`);

    const langs = getlang(args[0]);
    if(langs !== undefined) args.shift();

    const api = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${langs ? langs.sl : "auto"}&tl=${langs ? langs.tl : "en"}&q=${encodeURIComponent(args.join(" "))}`;
    try {
        const resp = await fetch(api, {
            headers: {
                "User-Agent": useragents.random[Math.floor(Math.random() * useragents.random.length)],
            },
        });
        if(!resp.ok) throw new Error(resp.statusText);

        const json = await resp.json();

        let translation = "";
        for(let i = 0; i < json[0].length; i++) {
            translation += json[0][i][0];
        }

        const sjson = JSON.stringify(json, null, 4);
        if(debug) log.debug(sjson);

        return message.reply({
            content: debug ? `\`\`\`\n${sjson.length > 1993 ? sjson.substring(1990) + "..." : sjson}\`\`\`` : translation,
            allowedMentions: { parse: [], repliedUser: false },
        });
    } catch(e) {
        return message.reply(`${client.reactions.negative.emote} An error occured;\`\`\`\n${e.message}\`\`\``);
    }
});

const getlang = (lang) => {
    lang = lang.toLowerCase();
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

// Data taken from https://cloud.google.com/translate/docs/languages. Last updated: 2024-04-04
const languages = {
    "af": "Afrikaans",
    "sq": "Albanian",
    "am": "Amharic",
    "ar": "Arabic",
    "hy": "Armenian",
    "as": "Assamese",
    "ay": "Aymara",
    "az": "Azerbaijani",
    "bm": "Bambara",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bho": "Bhojpuri",
    "bs": "Bosnian",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "ceb": "Cebuano",
    "zh": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "co": "Corsican",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "dv": "Dhivehi",
    "doi": "Dogri",
    "nl": "Dutch",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "ee": "Ewe",
    "fil": "Filipino (Tagalog)",
    "fi": "Finnish",
    "fr": "French",
    "fy": "Frisian",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gn": "Guarani",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "ha": "Hausa",
    "haw": "Hawaiian",
    "iw": "Hebrew",
    "hi": "Hindi",
    "hmn": "Hmong",
    "hu": "Hungarian",
    "is": "Icelandic",
    "ig": "Igbo",
    "ilo": "Ilocano",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "jw": "Javanese",
    "kn": "Kannada",
    "kk": "Kazakh",
    "km": "Khmer",
    "rw": "Kinyarwanda",
    "gom": "Konkani",
    "ko": "Korean",
    "kri": "Krio",
    "ku": "Kurdish",
    "ckb": "Kurdish (Sorani)",
    "ky": "Kyrgyz",
    "lo": "Lao",
    "la": "Latin",
    "lv": "Latvian",
    "ln": "Lingala",
    "lt": "Lithuanian",
    "lg": "Luganda",
    "lb": "Luxembourgish",
    "mk": "Macedonian",
    "mai": "Maithili",
    "mg": "Malagasy",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "mni-Mtei": "Meiteilon (Manipuri)",
    "lus": "Mizo",
    "mn": "Mongolian",
    "my": "Myanmar (Burmese)",
    "ne": "Nepali",
    "no": "Norwegian",
    "ny": "Nyanja (Chichewa)",
    "or": "Odia (Oriya)",
    "om": "Oromo",
    "ps": "Pashto",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese (Portugal, Brazil)",
    "pa": "Punjabi",
    "qu": "Quechua",
    "ro": "Romanian",
    "ru": "Russian",
    "sm": "Samoan",
    "sa": "Sanskrit",
    "gd": "Scots Gaelic",
    "nso": "Sepedi",
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
    "ti": "Tigrinya",
    "ts": "Tsonga",
    "tr": "Turkish",
    "tk": "Turkmen",
    "ak": "Twi (Akan)",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "ug": "Uyghur",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "xh": "Xhosa",
    "yi": "Yiddish",
    "yo": "Yoruba",
    "zu": "Zulu"
};
