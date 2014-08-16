/**
 * Handle escaped tags.
 *
 *      \{escaped.variable}
 *      \{if variable}
 *
 * @param {String} str
 * @param {Boolean} escape
 * @return {String}
 * @api private
 */

module.exports = function (str, escape) {
    return escape
        ? str.replace('\\\\', '')
        : void 0;
};


/**
 * Fix for initial offset.
 */

module.exports.offset = 0;
module.exports.limit  = 1;
