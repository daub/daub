/**
 * Wrapper for `console.warn`,
 * could be replaced with a custom logger.
 *
 * @param  {Mixed..} msg
 * @api private
 */

module.exports = function (msg) {
    if (msg == void 0)
        return msg;

    console.warn.apply(console, arguments);
};
