const CommandBlock = require("../../modules/CommandBlock");
const fetch = require("node-fetch");
const { invertBy } = require("lodash");
const log = require("../../modules/log");
const { useragents } = require("../../modules/miscellaneous");
const { MessageAttachment } = require("discord.js");

const debug = false; // Set to true to send the JSON output over the regular output.

module.exports = new CommandBlock({
    names: ["translate", "trans"],
    description: "Translates text using the Google Translate API.\n\n**Language settings:** By default, the command takes given text and translates it to english. The `source` parameter can override this in one of two ways;\n• Set it to an (optional) ISO-639 language code to translate the text to a different language. Note that some supported languages differ from this standard.\n• Force it to translate between different languages by placing an underscore `_` in between the source and the destination language; for example, `zh-cn_es` would attempt to translate from simplified chinese to spanish.\n\nYou can view all of the supported languages by invoking the `--list` flag. Support for these languages are defined in [the Google Cloud docs](https://docs.cloud.google.com/translate/docs/languages#nmt) under *Neural Machine Translation Model*.",
    usage: "[\"--list\"] | [(source) [...text]]",
}, async function(client, message, content, args) {
    if(!content) return message.reply(`${client.reactions.negative.emote} You must input a piece of text to translate.`);

    if (args[0] == "--list") {
        const flipped = invertBy(languages); // need lodash for multivalue (dont feel like writing it myself rn)
        const arr = Object.keys(flipped).map(x => `${x} (${Array.isArray(flipped[x]) ? flipped[x].join(", ") : flipped[x]})`);
        const attach = new MessageAttachment(Buffer.from(arr.join("\n")), "langs.txt");
        message.reply({ content: `Here is a list of all of the currently supported languages. In parenthesis are the aliases you can use to convert text between their respective languages. Perform \`help ${this.firstName}\` for more information.`, files: [attach], allowedMentions: { repliedUser: false }})
    } else {
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

// Data taken from https://cloud.google.com/translate/docs/languages (neural machine translation models). Last updated: 2026-02-11
const languages = {
    "ab": "Abkhaz",
    "ace": "Acehnese",
    "ach": "Acholi",
    "af": "Afrikaans",
    "sq": "Albanian",
    "alz": "Alur",
    "am": "Amharic",
    "ar": "Arabic",
    "hy": "Armenian",
    "as": "Assamese",
    "awa": "Awadhi",
    "ay": "Aymara",
    "az": "Azerbaijani",
    "ban": "Balinese",
    "bm": "Bambara",
    "ba": "Bashkir",
    "eu": "Basque",
    "btx": "Batak Karo",
    "bts": "Batak Simalungun",
    "bbc": "Batak Toba",
    "be": "Belarusian",
    "bem": "Bemba",
    "bn": "Bengali",
    "bew": "Betawi",
    "bho": "Bhojpuri",
    "bik": "Bikol",
    "bs": "Bosnian",
    "br": "Breton",
    "bg": "Bulgarian",
    "bua": "Buryat",
    "yue": "Cantonese",
    "ca": "Catalan",
    "ceb": "Cebuano",
    "ny": "Chichewa (Nyanja)",
    "zh-CN": "Chinese (Simplified)",
    "zh": "Chinese (Simplified)", // BCP-47
    "zh-TW": "Chinese (Traditional)", // BCP-47
    "cv": "Chuvash",
    "co": "Corsican",
    "crh": "Crimean Tatar",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "din": "Dinka",
    "dv": "Divehi",
    "doi": "Dogri",
    "dov": "Dombe",
    "nl": "Dutch",
    "dz": "Dzongkha",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "ee": "Ewe",
    "fj": "Fijian",
    "fil": "Filipino (Tagalog)",
    "tl": "Filipino (Tagalog)",
    "fi": "Finnish",
    "fr": "French",
    "fr-FR": "French (French)",
    "fr-CA": "French (Canadian)",
    "fy": "Frisian",
    "ff": "Fulfulde",
    "gaa": "Ga",
    "gl": "Galician",
    "lg": "Ganda (Luganda)",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gn": "Guarani",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "cnh": "Hakha Chin",
    "ha": "Hausa",
    "haw": "Hawaiian",
    "iw": "Hebrew",
    "he": "Hebrew",
    "hil": "Hiligaynon",
    "hi": "Hindi",
    "hmn": "Hmong",
    "hu": "Hungarian",
    "hrx": "Hunsrik",
    "is": "Icelandic",
    "ig": "Igbo",
    "ilo": "Iloko",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "jp": "Japanese", // non-standard
    "jw or jv": "Javanese",
    "kn": "Kannada",
    "pam": "Kapampangan",
    "kk": "Kazakh",
    "km": "Khmer",
    "cgg": "Kiga",
    "rw": "Kinyarwanda",
    "ktu": "Kituba",
    "gom": "Konkani",
    "ko": "Korean",
    "kri": "Krio",
    "ku": "Kurdish (Kurmanji)",
    "ckb": "Kurdish (Sorani)",
    "ky": "Kyrgyz",
    "lo": "Lao",
    "ltg": "Latgalian",
    "la": "Latin",
    "lv": "Latvian",
    "lij": "Ligurian",
    "li": "Limburgan",
    "ln": "Lingala",
    "lt": "Lithuanian",
    "lmo": "Lombard",
    "luo": "Luo",
    "lb": "Luxembourgish",
    "mk": "Macedonian",
    "mai": "Maithili",
    "mak": "Makassar",
    "mg": "Malagasy",
    "ms": "Malay",
    "ms-Arab": "Malay (Jawi)",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "chm": "Meadow Mari",
    "mni-Mtei": "Meiteilon (Manipuri)",
    "min": "Minang",
    "lus": "Mizo",
    "mn": "Mongolian",
    "my": "Myanmar (Burmese)",
    "nr": "Ndebele (South)",
    "new": "Nepalbhasa (Newari)",
    "ne": "Nepali",
    "nso": "Northern Sotho (Sepedi)",
    "no": "Norwegian",
    "nus": "Nuer",
    "oc": "Occitan",
    "or": "Odia (Oriya)",
    "om": "Oromo",
    "pag": "Pangasinan",
    "pap": "Papiamento",
    "ps": "Pashto",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese",
    "pt-PT": "Portuguese (Portugal)",
    "pt-BR": "Portuguese (Brazil)",
    "pa": "Punjabi",
    "pa-Arab": "Punjabi (Shahmukhi)",
    "qu": "Quechua",
    "rom": "Romani",
    "ro": "Romanian",
    "rn": "Rundi",
    "ru": "Russian",
    "sm": "Samoan",
    "sg": "Sango",
    "sa": "Sanskrit",
    "gd": "Scots Gaelic",
    "sr": "Serbian",
    "st": "Sesotho",
    "crs": "Seychellois Creole",
    "shn": "Shan",
    "sn": "Shona",
    "scn": "Sicilian",
    "szl": "Silesian",
    "sd": "Sindhi",
    "si": "Sinhala (Sinhalese)",
    "sk": "Slovak",
    "sl": "Slovenian",
    "so": "Somali",
    "es": "Spanish",
    "su": "Sundanese",
    "sw": "Swahili",
    "ss": "Swati",
    "sv": "Swedish",
    "tg": "Tajik",
    "ta": "Tamil",
    "tt": "Tatar",
    "te": "Telugu",
    "tet": "Tetum",
    "th": "Thai",
    "ti": "Tigrinya",
    "ts": "Tsonga",
    "tn": "Tswana",
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
    "yua": "Yucatec Maya",
    "zu": "Zulu"
};
