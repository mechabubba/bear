/**
 * This module contains useful regular expressions
 * @module regexes
 */

/**
 * Matches only characters in the ranges A-Z and a-z from the beginning to the end of the string.
 */
module.exports.alphabetic = /^[A-Za-z]+$/;

/**
 * Matches only digit characters (0-9) from the beginning to the end of the string.
 */
module.exports.numeric = /^\d+$/;

/**
 * Matches only characters in the ranges A-Z, a-z, and any digit character (0-9) from the beginning to the end of the string.
 */
module.exports.alphanumeric = /^[A-Za-z\d]+$/;

/**
 * Matches the format for a discord authentication token from the beginning to the end of the string.
 */
module.exports.token = /^[\w]{24}\.[\w-]{6}\.[\w-]{27}$/;

/**
 * Diego Perini's url validation regex
 *
 * Note that TLDs are mandatory, so single names like "localhost" fails, and protocols are restricted to ftp, http and https only
 * @see https://gist.github.com/dperini/729294
 * @see https://mathiasbynens.be/demo/url-regex
 * @license
 * MIT
 * Copyright (c) 2010-2018 Diego Perini (http://www.iport.it)
 */
module.exports.url = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

/**
 * Diego Perini's url validation regex modified to work with [match()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
 *
 * Note that TLDs are mandatory, so single names like "localhost" won't be matched, and protocols are restricted to ftp, http and https only
 * @see https://gist.github.com/dperini/729294
 * @see https://mathiasbynens.be/demo/url-regex
 * @license
 * MIT
 * Copyright (c) 2010-2018 Diego Perini (http://www.iport.it)
 */
module.exports.urlMatch = /(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?/gi;
