const _ = require("lodash");

/**
 * @typedef {Object} ResponseData
 * @property {?string} [message="No Message Provided"] - Human readable description that describes what occurred
 * @property {?boolean} [success=true] - Whether or not the code succeeded
 * @property {?Error} [error=null] - Used to pass along an error, if one occurred
 * @property {?*} [value=null] - Used to return a value alongside the other data
 */

/**
 * Intended as a simple way for functions to provide their caller with data about their result
 */
class Response {
  /**
   * @param {ResponseData} data
   */
  constructor(data) {
    this.message = _.has(data, "message") && !_.isNil(data.message) ? data.message : "No Message Provided";
    this.success = _.has(data, "success") && !_.isNil(data.success) ? data.success : true;
    this.error = _.has(data, "error") && !_.isNil(data.error) && data.error instanceof Error ? data.error : null;
    this.value = _.has(data, "value") && !_.isNil(data.value) ? data.value : null;
  }
}

module.exports = Response;
