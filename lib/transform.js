var warn = require('./reporter.js');

/**
 * Ordered collection of conditional processors.
 */

var cases = [
        _escape,
        _key,
        require('./cases/for.js'),
        require('./cases/if.js'),
        require('./cases/close.js'),
        _default
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


/**
 * Escaped.
 *
 *      \{escaped.variable}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

function _escape(str, rest) {
    var escape;

    if (! (escape = rest[0]))
        return void 0;

    return str.replace('\\\\', '');
}


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

function _key(str, rest, stack) {
    var key, tmp;

    if (!(key = rest[1]))
        return void 0;

    if (key == 'else')
        return _else(stack);
    else if (key.charAt(0) == '>')
        return _partial(key.slice(1));

    // default or empty
    tmp = rest[2] || '';

    return '\' + g(c,\'' + key + '\',\'' + tmp + '\') + \'';
}

/**
 * Pattern for `_key`, including `else` and `>partial` cases.
 */

_key.pattern = '(?:(>?[\\w_\\.\\-]+)(?:\\|(.*?))?)';


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

function _else (stack) {
    var block = stack[stack.length - 1];

    if (!block || block.elsed) {
        warn('extra {else} ignored');
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
 * Partials.
 *
 *     <div> {>partial} </div>
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

function _partial(partial) {
    return '\'+r(g(c,\'' + partial + '\'),c)+\'';
}

/**
 * Default block.
 * Returns supplied string.
 *
 * @param  {String} str
 * @return {String}
 * @api private
 */

function _default(str) {
    return str;
}



