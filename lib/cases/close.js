var report = require('../reporter.js');

/**
 * Closing tags for `for`s and `if`s.
 *
 * @param  {String} str
 * @param  {Array} rest
 * @param  {Array} stack
 * @return {String}
 * @api private
 */

module.exports = function (str, tag) {
    var block, tmp;

    if (!tag)
        return void 0;

    block = this[this.length - 1];

    if (!block || block.statement !== tag) {
        report('extra {/' + tag + '} ignored');
        return '';
    }

    this.pop();

    // revert value of previously "covered" `dang-var` from `__dang__var`
    tmp = block.statement === 'for'
        ? 'c[\''+block.i+'\'] = __' + block.si + ';'
        : '';

    return '\'}'
        + tmp
        + 'b+=\'';
}

/**
 * Pattern for `_close`;
 */

module.exports.pattern = '\\/(for|if)';
