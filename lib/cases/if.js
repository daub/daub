/**
 * Handle condition blocks.
 *
 *      {if variable}
 *          <p> {variable} </p>
 *      {/if}
 *
 *      {if not variable}
 *          <p> No variable </p>
 *      {/if}
 *
 * @param  {String} str
 * @param  {Boolean} not
 * @param  {String} key
 * @return {String}
 * @api private
 */

module.exports = function (str, not, key) {
    if (!key) return void 0;

    this.push({ statement: 'if' });

    // prepend '!' to negative statements
    not = not ? '!' : '';

    return '\';'
        +'if (' + not + 'g(c,\'' + key + '\')) {'
            + 'b+=\'';
};

/**
 * Pattern for both `{if ..}` and `{if not ..}`.
 */

module.exports.pattern = 'if +(not +|)([\\w_.\\-]+)';
