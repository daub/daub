/**
 * Loops.
 *
 *      {for variable in array}
 *          <p> {variable} </p>
 *      {/for}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @param  {Array} stack
 * @return {String}
 * @api private
 */

module.exports = function (str, rest, stack) {
    var key, i, si;

    if (! (key = rest[4]))
        return void 0;

    i = rest[3];

    // convert `dang-var` to eval-(s)afe `__dang__var`;
    si = i.replace('-', '__');

    stack.push({
        statement:'for',
        key: key,
        i: i,
        si: si
    });

    //
    return '\';'
        + 'var __' + si + '= g(c,\''+i+'\');'
        + 'var ' + si + 'A = g(c,\'' + key + '\');'
        + 'for (var ' + si + 'I=0; ' + si + 'I < ' + si + 'A.length; ' + si + 'I++){'
            + 'c[\'' + i + '\'] = ' + si + 'A[' + si + 'I];'
            + 'b+=\'';
}

/**
 * Pattern for `_for`.
 */

module.exports.pattern = 'for +([\\w_\\-]+) +in +([\\w_.\\-]+)';
