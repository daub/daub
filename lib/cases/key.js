/**
 * Variables.
 *
 *      {a.variable}
 *      {a.delusional.variable|And Default}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

module.exports = function (str, key, def) {
    if (!key || key == 'else')
        return void 0;

    // default or empty
    def = def || '';

    return '\' + g(c,\'' + key + '\',\'' + def + '\') + \'';
};

/**
 * Pattern for `_key`, excluding `else` and `>partial` cases.
 */

module.exports.pattern = '(?:([\\w_\\.\\-]+)(?:\\|(.*?))?)';
