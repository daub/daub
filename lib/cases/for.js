/**
 * Handle loops.
 *
 *      {for variable in array}
 *          <p> {variable} </p>
 *      {/for}
 *
 * @param  {String} str
 * @param  {String} i
 * @param  {String} key
 * @return {String}
 * @api private
 */

module.exports = function (str, i, key) {
    if (!key) return void 0;

    // convert `dang-var` to eval-(s)afe `__dang__var`;
    var si = i.replace('-', '__');

    this.push({
        statement : 'for',
        key       : key,
        i         : i,
        si        : si
    });

    //
    return '\';'
        + 'var __' + si + '= g(c,\''+i+'\');'
        + 'var ' + si + 'A = g(c,\'' + key + '\');'
        + 'for (var ' + si + 'I=0;' + si + 'I < ' + si + 'A.length;' + si + 'I++){'
            + 'c[\'' + i + '\']=' + si + 'A[' + si + 'I];'
            + 'b+=\'';
};

/**
 * Pattern.
 */

module.exports.pattern = 'for +([\\w_\\-]+) +in +([\\w_.\\-]+)';
