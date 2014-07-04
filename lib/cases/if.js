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

module.exports = function (str, not, key) {
    if (!key)
        return void 0;

    this.push({ statement: 'if' });

    // prepend '!' to negative statements
    not = not ? '!' : '';

    return '\';'
        +'if (' + not + 'g(c,\'' + key + '\')) {'
            + 'b+=\'';
};

/**
 * Pattern for `_if`.
 */

module.exports.pattern = 'if +(not +|)([\\w_.\\-]+)';
