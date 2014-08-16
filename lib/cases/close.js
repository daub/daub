/**
 * Load reporter.
 */

var report = require('daub-reporter');

/**
 * Closing tags.
 *
 *     {for variable in array}
 *         {if variable}
 *             {variable}
 *         {/if}
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
    var block, tmp;

    if (!key)
        return void 0;

    block = this[this.length - 1];

    if (!block || block.statement != key) {
        report('extra {/' + key + '} ignored', {
            index  : index,
            source : source,
            file   : this.file
        });

        return '';
    }

    this.pop();

    // revert value of previously "covered" `dang-var` from `__dang__var`
    tmp = key == 'for'
        ? 'c[\''+block.i+'\']=__' + block.si + ';'
        : '';

    return '\'}'
        + tmp
        + 'b+=\'';
};

/**
 * Pattern for closing both.
 */

module.exports.pattern = '\\/(for|if)';
