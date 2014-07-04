var warn = require('./reporter.js');

/**
 * Ordered collection of conditional processors.
 */

var cases = [
        require('./cases/escape.js'),
        require('./cases/key.js'),
        require('./cases/for.js'),
        require('./cases/if.js'),
        require('./cases/close.js'),
        require('./cases/default.js')
    ];

/**
 * Expose cases.
 */

exports = module.exports = {
    cases: cases
};


/**
 * Prepare replacing unnecessary parts
 * and strange characters.
 *
 * @param  {String} str
 * @return {String}
 * @api private
 */

exports.prepare = function (str){
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

exports.finish = function (stack) {
    var block, res = '';

    while (block = stack.pop()) {
        warn('extra {' + block.statement + '} closed at end of template');
        res += '\'}b+=\'';
    }

    return res;
};
