const { has, isNil } = require("lodash");

/**
 * @typedef {Object} ResponseData
 * @property {?string} [message="No Message Provided"] Human readable description that describes what occurred
 * @property {?boolean} [success=true] Whether or not the code succeeded
 * @property {?Error} [error=null] Used to pass along an error, if one occurred
 * @property {?*} [value=null] Used to return a value alongside the other data
 * @property {?string} [code=null] Label used to identify certain situations if more complexity than the above is required
 */

/**
 * Intended as a simple way for functions to provide their caller with data about their result
 */
class Response {
    /**
     * @param {ResponseData} data
     */
    constructor(data) {
        this.message = has(data, "message") && !isNil(data.message) ? data.message : "No Message Provided";
        this.success = has(data, "success") && !isNil(data.success) ? data.success : true;
        this.error = has(data, "error") && !isNil(data.error) && data.error instanceof Error ? data.error : null;
        this.value = has(data, "value") && !isNil(data.value) ? data.value : null;
        this.code = has(data, "code") && !isNil(data.code) ? data.code : null;
    }
}

module.exports = Response;
