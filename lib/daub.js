/**
 * Dependencies.
 */

var report = require('daub-reporter');

/**
 * Ordered collection of conditional processors.
 */

var cases = [
        require('./cases/escape.js'),
        require('./cases/for.js'),
        require('./cases/if.js'),
        require('./cases/else.js'),
        require('./cases/close.js'),
        require('./cases/variable.js')
    ];

/**
 * Setup shortcuts and shims.
 */

var slice = [].slice;

var isArray = Array.isArray,
    isObject = function(obj) {
        return obj.constructor === Object;
    };

/**
 * Expose `engine`.
 */

module.exports.render = render;
module.exports.compile = compile;


/**
 * Define variable for RegExp pattern.
 * Should get it's value via `initialize`.
 */

var pattern = (function (mxs) {
        var expressions = [], re;

        var offset = 0;

        mxs.reduce(function(o, fn){
            if (fn.pattern) {
                o.push(fn.pattern);

                // where last one ended
                fn.offset = offset;
                fn.limit  = offset + relength(fn.pattern);
            }

            offset = fn.limit || offset;
            return o;
        }, expressions);

        // last one, no-op
        mxs.push(function(arg){
            return arg;
        });

        re = '(\\\\*){(?:' + expressions.join('|') + ')}';

        return new RegExp(re, 'g');
    })(cases);


/**
 * Render template, with optional data as context.
 *
 * @param  {String|Function} template
 * @param  {Object} context [optional]
 * @return {String}
 * @api public
 */

function render (template, context) {
    var compiled = compile(template);
    try {
        return compiled(context);
    }
    catch (err) {
        err.name = 'Templating Error';
        throw err;
    }
}


/**
 * Compile given string to function expression,
 * which renders final markup/text.
 *
 *      compile('Hi, {name}'); // function(ctx){ return 'Hi, ' + ctx.name; }
 *
 * @param {String|Function} template
 * @param {String} path [optional]
 * @return {Function}
 */

function compile (template, path) {
    var stack = [], fn;

    stack.path = path;

    // allow functions as partials
    if (typeof template == 'function')
        return template;

    template = prepare(template);

    template = make(template, stack);

    template = finish(template, stack);

/* jshint ignore:start */
    // c is context, b is buffer
    fn = new Function('g', 'return function(c){var b=\'' + template + '\';return b}');
/* jshint ignore:end */

    return fn(get);
}


/**
 * Get value with dot notation,
 * with optional default value, if lookup fails.
 *
 *     var obj = { key: { for: { something: 'hello' } } };
 *
 *     get(obj, 'key.for.something');       // 'hello'
 *     get(obj, 'key.for.anything');        // ''
 *     get(obj, 'key.for.anything', 'hey'); // 'hey'
 *
 * @param  {Object} obj
 * @param  {String} key
 * @param  {String} def [optional]
 * @return {String}
 * @api private
 */

function get(obj, key, def) {
    // default "nothing" for `null` and `undefined`
    if (def == null) def = '';

    if (!obj)
        return def;

    var keys = key.split('.');

    key = keys.shift();
    while (key && (obj = obj[key]))
        key = keys.shift();

    return missing(obj) ? def : obj;
}


/**
 * Check if given object is a proper output.
 *
 *      missing([]);   // true
 *      missing({});   // true
 *      missing(null); // true
 *      missing('');   // false
 *      missing(0);    // false
 *
 * @param  {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function missing(obj) {
    return (obj == void 0 || obj === false)
        // empty array
        || (isArray(obj) && !obj.length)
        // empty object
        || (isObject(obj) && !Object.keys(obj).length);
}


/**
 * Prepare replacing unnecessary parts
 * and strange characters.
 *
 * @param {String} template
 * @return {String}
 * @api private
 */

function prepare (template) {
    // convert to string, empty if false
    template = String(template || '');

    return template
        // backslashes, single quotes
        .replace(/(\\|\')/g, '\\$1')
        // newlines
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        // replace comments (like {!foo!})
        .replace(/(\\*){![\s\S]*?!}/g, function(str, escape) {
            //but not when escaped
            return escape ? str.replace('\\\\', '') : '';
        });
}

/**
 * Replace tags with "executable" code.
 *
 *      make('Hi, {name}', []); // "'Hi, ' + ctx.name"
 *
 * @param  {String} template
 * @param  {Array} stack
 * @return {String}
 * @api private
 */

function make (template, stack) {
    return template.replace(pattern, function(str){
        var params = slice.call(arguments, 1),
            rest   = params.slice(-2);

        var res, i = 0;

        while (res === void 0) {
            var fn = cases[i++], captures;

            captures = fn.offset != void 0
                ? params.slice(fn.offset, fn.limit)
                : [];

            captures.unshift(str);
            captures.concat(rest);

            res = fn.apply(stack, captures);
        }

        return res;
    });
}


/**
 * Add closing tags for extra `for`s and `if`s.
 *
 * @param {Strin} template
 * @param {Array} stack
 * @return {String}
 * @api private
 */

function finish (template, stack) {
    var block;

    while (block = stack.pop()) {
        report('extra {' + block.statement + '} closed', {
            path: stack.path
        });
        template += '\'}b+=\'';
    }

    return template;
}

/**
 * Get capture groups count.
 *
 * @param  {RegExp|String} re
 * @return {[type]}
 * @api private
 */

function relength(re) {
    if (typeof re == 'string')
        re = new RegExp(re + '|');

    return re.exec('').length - 1;
}
