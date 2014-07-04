var report = require('../reporter.js');

/**
 * Negative conditions.
 *
 *     {if variable}
 *         <p>{variable}</p>
 *     {else}
 *         <p>No variable!</p>
 *     {/if}
 *
 *     {for variable in array}
 *         <p>{variable}</p>
 *     {else}
 *         <p>Nothing in the array!</p>
 *     {/for}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @param  {Array} stack
 * @return {String}
 * @api private
 */

module.exports = function(str) {
    if (str != '{else}')
        return void 0;

    var block = this[this.length - 1];

    if (!block || block.elsed) {
        report('extra {else} ignored');
        return '';
    }

    block.elsed = true;

    if (block.statement === 'if')
        return '\''
            + '} else {'
                + 'b+=\'';

    if (block.statement === 'for')
        return '\''
            + '}'
            + 'if (!g(c,\'' + block.key + '\')) {'
                + 'b+=\'';
}

/**
 * Pattern to match exactly `'else'`
 */

module.exports.pattern = '(else)';
