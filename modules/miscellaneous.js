/* eslint-disable indent */
/**
 * This module contains a bunch of exported functions. Some are useful in general, others are for convenience and code clarity, as it's often simpler for logic to be a reusable function rather than complicated alternatives or implementing the logic multiple times where needed to achieve the same result.
 * @module miscellaneous
 */

const { promisify } = require("util");
const { isArray, isString, isFinite } = require("lodash");
const { Permissions } = require("discord.js");
const { execSync } = require("child_process");

/**
 * Lets you "pause" for X amount of time, in milliseconds. (This is setTimeout's promise based custom variant)
 *
 * {@link https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args Documentation} & {@link https://github.com/nodejs/node/blob/master/lib/timers.js#L150 Source Code}
 *
 * @param {number} milliseconds
 * @example await sleep(4000); // Pauses for 4 seconds
 */
module.exports.sleep = promisify(setTimeout);

/**
 * Just a small shortcut to JSON.stringify with optional discord code block wrapping on the returned string
 * @param {Object} object
 * @param {number} [whitespace=2]
 * @param {boolean} [codeBlock=false]
 * @example
 * const car = {type:"Fiat", model:"500", color:"white"};
 * lovely(car); // returned string isn't wrapped, whitespace defaults to 2
 * lovely(car, 4, true); // returns string wrapped in discord codeBlock, uses 4 spaces of whitespace
 */
module.exports.lovely = function(object, whitespace = 2, codeBlock = false) {
    const formatted = JSON.stringify(object, null, whitespace);
    return codeBlock ? `\`\`\`json\n${formatted}\n\`\`\`` : formatted;
};

/**
 * Checks if a value is a array that only contains strings, and by default, a non-empty array
 * @param {*} value
 * @param {boolean} [checkLength=true] Whether the array's length is checked
 * @returns {boolean} Returns `true` if value is an array that only contains strings, else `false`
 */
module.exports.isArrayOfStrings = function(value, checkLength = true) {
    if (!isArray(value)) return false;
    if (checkLength) {
        if (!value.length) return false;
    } else if (!value.length) {
        return true;
    }
    return !value.some(element => !isString(element));
};

/**
 * Checks if a value is resolvable as a permission. Does *not* include circular array checking logic. https://discord.js.org/#/docs/main/master/typedef/PermissionResolvable
 * @param {*} value
 * @returns {boolean} Returns `true` if value is resolvable as a permission, else `false`
 */
module.exports.isPermissionResolvable = function(value) {
    if (isString(value) || isArray(value) || isFinite(value) || value instanceof Permissions) {
        return true;
    } else {
        return false;
    }
};

/**
 * Logic for easier appending to arrays stored in collections
 * @param {Collection} collection
 * @param {*} key
 * @param {...*} values
 */
module.exports.collectionArrayPush = function(collection, key, ...values) {
    if (collection.has(key)) {
        collection.set(key, collection.get(key).concat([...values]));
    } else {
        collection.set(key, [...values]);
    }
};

/**
 * Logic for easier removal of elements from arrays stored in collections
 * @param {Collection} collection
 * @param {*} key
 * @param {...*} values
 */
module.exports.collectionArrayFilter = function(collection, key, ...values) {
    if (!values.length) return;
    if (collection.has(key)) {
        const data = collection.get(key);
        if (!isArray(data)) return;
        if (data.length === 1 && values.includes(data[0])) {
            collection.delete(key);
        } else {
            collection.set(key, data.filter(element => !values.includes(element)));
        }
    }
};

/**
 * Logic for handling both one or multiple of something with the same callback function.
 *
 * For example, some data options for modules can be a string, or an array with any number of strings.
 *
 * This takes a callback function and invokes it with value as the first parameter.
 *
 * However, if value is an array, the callback is invoked for each element as the first parameter instead.
 *
 * All parameters beyond value are passed into the callback.
 *
 * @param {function} callback
 * @param {*} value
 * @param {...*} args
 */
module.exports.forAny = function(callback, value, ...params) {
    if (isArray(value)) {
        for (const element of value) {
            callback(element, ...params);
        }
    } else {
        callback(value, ...params);
    }
};

/**
 * Generates a random hexadecimal color - padded with zeroes.
 * @returns {String}
 */
module.exports.randomColor = function(w = 6) {
    const col = Math.floor(Math.random() * ((256 ** 3) - 1)).toString(16);
    return new Array(w + 1 - (col + "").length).join("0") + col;
};

/**
 * Small helper function that gets information from the latest commit via the `git show` command.
 * For more information, see https://git-scm.com/docs/git-show.
 * @param {string} placeholder 
 * @returns {string} The value recieved.
 */
module.exports.gitinfo = (placeholder) => execSync(`git show -s --format=${placeholder} HEAD`).toString().trim();

/**
 * Weighted random generation. Courtesy of https://stackoverflow.com/a/1761646.
 * @param {[*]} arr The values to be randomly chosen from.
 * @param {Object} weight An object of weights; higher values correspond to a higher likelyhood of being returned.
 * @returns {*} The value that was generated.
 */
module.exports.weightedRandom = (arr, weight) => {
    // 1) Sum all the weights.
    // 2) Get a random value; 0 >= x > sum.
    // 3) Subtract until we can no longer.
    if (!arr || !weight) throw new Error("Missing an argument");
    let sum = 0;
    for (const val of arr) {
        sum += weight[val] || 0;
    }
    let rand = Math.floor(Math.random() * sum);
    for (const val of arr) {
        if (rand < weight[val]) return val;
        rand -= weight[val] || 0;
    }
    throw new Error("This should never happen. Prepare to die.");
}

const entities = {
    "amp":    "&",
    "lt":     "<",
    "gt":     ">",
    "nbsp":   "\u00A0",
    "quot":   "\"",
    "apos":   "'",
    "cent":   "¢",
    "pound":  "£",
    "yen":    "¥",
    "euro":   "€",
    "copy":   "©",
    "reg":    "®",
    "trade":  "™",
    "hellip": "…",
    "mdash":  "—",
    "bull":   "•",
    "ldquo":  "“",
    "rdquo":  "”",
    "lsquo":  "‘",
    "rsquo":  "’",
    "larr":   "←",
    "rarr":   "→",
    "darr":   "↓",
    "uarr":   "↑",
}

/**
 * Takes an input, and unescapes the HTML entities inside.
 * Handles certain named entities (only some, see above) and codepoint entities. 
 * @param {string} input 
 * @returns {string}
 */
module.exports.unescapeHTML = (input = "") => {
    const ex = /&[A-Za-z0-9#]+;/;
    while(ex.test(input)) {
        const res = input.match(ex);
        let ent = res[0];
        if(ent[1] == "#") {
            let index = 2;
            if(ent[2] == "x") index++;
            const codepoint = ent.substr(index, ent.length - (index + 1));
            ent = String.fromCharCode(codepoint);
        } else {
            const code = ent.substr(1, ent.length - 2);
            if(code in entities) {
                ent = entities[code];
            } else {
                ent = `&${code};`; // Visually similar but distinct from the above regex.
            }
        }
        input = input.replace(res[0], ent);
    }
    return input;
}

/**
 * "Humanizes" a millisecond duration.
 * Luxons Duration class doesn't format uptimes very well (or at all?) above 24 hours, so this function does that.
 * @param {number} millis - The amount of milliseconds to convert to a string duration.
 * @returns {string}
 */
module.exports.humanizeDuration = (millis) => {
    const periods = [
        ["year",   60 * 60 * 24 * 365 * 1000],
        ["month",  60 * 60 * 24 * 30 * 1000],
        ["day",    60 * 60 * 24 * 1000],
        ["hour",   60 * 60 * 1000],
        ["minute", 60 * 1000],
        ["second", 1000]
    ];
    const strings = []
    for(const period of periods) {
        if(millis > period[1]) {
            let value = Math.floor(millis / period[1])
            strings.push(`${value} ${period[0]}${value >= 1 ? "s" : ""}`);
            millis = millis - (value * period[1])
        }
    }
    return strings.join(", ");
};

/**
 * A collection of user agents.
 * Source: https://techblog.willshouse.com/2012/01/03/most-common-user-agents/ (updated March 26th, 2022)
 */
module.exports.useragents = {
    bear: `bear/${this.gitinfo("%h")} (by mechabubba)`,
    random: [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:98.0) Gecko/20100101 Firefox/98.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.3 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64; rv:98.0) Gecko/20100101 Firefox/98.0"
    ]
};
