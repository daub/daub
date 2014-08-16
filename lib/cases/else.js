/**
 * Load reporter.
 */

var report = require('daub-reporter');

/**
 * Negative conditions.
 *
 *     {if variable}
 *         {variable}
 *     {else}
 *         No variable!
 *     {/if}
 *
 *     {for variable in array}
 *         {variable}
 *     {else}
 *         Nothing in the array!
 *     {/for}
 *
 * @param {String} str
 * @param {String} key
 * @param {Number} index
 * @param {String} source
 * @return {String}
 * @api private
 */

module.exports = function(str, key, index, source) {
    // re-check the string itself
    // in case of collision with {variable}
    if (!key && str != '{else}')
        return void 0;

    var block = this[this.length - 1];

    if (!block || block.elsed) {
        report('extra {else} ignored', {
            index  : index,
            source : source,
            path   : this.path
        });
        // ignore
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
            + 'if (!g(c,\'' + block.key + '\')){'
                + 'b+=\'';
};

/**
 * Pattern to match exactly `'else'`
 */

module.exports.pattern = '(else)';
