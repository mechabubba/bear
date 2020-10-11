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
