var warn = require('./reporter.js');

/**
 * Prepare replacing unnecessary parts
 * and strange characters.
 *
 * @param  {String} str
 * @return {String}
 * @api private
 */

module.exports.prepare = function (str) {
    // convert to string, empty if false
    str = (str || '') + '';

    return str
        // backslashes
        .replace(/\\/g, '\\\\')
        // single quotes
        .replace(/\'/g, '\\\'')
        // newlines
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        // replace comments (like {!foo!})
        .replace(/(\\*){![\s\S]*?!}/g, function(str, escape) {
            //but not when escaped
            if (!escape) return '';

            return str.replace('\\\\', '');
        });
};


/**
 * Add closing tags for extra `for`s and `if`s.
 *
 * @param  {Array} stack
 * @return {String}
 */

module.exports.finish = function (template, stack) {
    var block;

    while (block = stack.pop()) {
        warn('extra {' + block.statement + '} closed at end of template');
        template += '\'}b+=\'';
    }

    return template;
};
