/**
 * Conditions.
 *
 *      {if variable}
 *          <p> {variable} </p>
 *      {/if}
 *
 *      {if not variable}
 *          <p> No variable </p>
 *      {/if}
 *
 * @param  {String} str   [description]
 * @param  {Array} rest  [description]
 * @param  {Array} stack [description]
 * @return {String}       [description]
 * @api private
 */

module.exports = function (str, rest, stack) {
    var key, not;

    if (! (key = rest[6]))
        return void 0;

    stack.push({ statement: 'if' });

    // prepend '!' to negative statements
    not = rest[5] ? '!' : '';

    return '\';'
        +'if (' + not + 'g(c,\'' + key + '\')) {'
            + 'b+=\'';
};

/**
 * Pattern for `_if`.
 */

module.exports.pattern = 'if +(not +|)([\\w_.\\-]+)';
