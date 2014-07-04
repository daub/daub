/**
 * Partials.
 *
 *     <div> {>partial} </div>
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

module.exports = function (str, partial) {
    return '\'+r(g(c,\'' + partial + '\'),c)+\'';
};

/**
 * Patter for `{>partials}`.
 */

module.exports.pattern = '>([\\w_.\\-]+)';
