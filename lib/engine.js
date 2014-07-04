/**
 * Load transformation utilities and module.
 */

var transform = require('./transform.js'),
    cases     = require('./cases.js');

/**
 * Setup shortcuts and shims
 */

var prepare = transform.prepare,
    finish  = transform.finish;


var slice = [].slice;

var isArray = Array.isArray,
    isObject = function(obj) {
        return obj.constructor === Object;
    };

/**
 * Expose `engine`.
 */

module.exports = engine;


/**
 * Declare variable for RegExp pattern.
 * Should get it's value via `initialize`.
 */

var pattern;

/**
 * Initialize.
 */

initialize(cases);

/**
 * Render template, with optional data as context.
 *
 * @param  {String|Function} template
 * @param  {Object} context [optional]
 * @return {String}
 * @api public
 */

function engine (template, context) {
    var compiled = engine.compile(template);
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
 * @param  {String|Function} template
 * @return {Function}
 */

engine.compile = function(template) {
    var stack = [], fn;

    // allow functions as partials
    if (typeof template == 'function')
        return template;

    template = prepare(template);


    // replace tags
    template = template.replace(pattern, function(str){
        var params = slice.call(arguments, 1);
        var res, i = 0;

        while (res === void 0) {
            var fn = cases[i++], captures;

            captures = fn.offset != void 0
                ? params.slice(fn.offset, fn.limit)
                : [];

            captures.unshift(str);

            res = fn.apply(stack, captures);
        }

        return res;
    });

    template = finish(template, stack);


    /* jshint ignore:start */

    // c is context, b is buffer
    fn = new Function('g', 'r', 'return function(c){var b=\'' + template + '\';return b}');

    /* jshint ignore:end */

    return fn(get, engine);
};



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

    if (!obj) return def;

    var keys = key.split('.');

    key = keys.shift();
    while (key && (obj = obj[key]))
        key = keys.shift();

    return missing(obj) ? def : obj;
}


/**
 * Check if given object is a proper output.
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
 * Construct RegExp pattern.
 * Exclude objects on both end, as they're `escape` and `default`.
 *
 * @param  {Array} cases
 * @api private
 */

function initialize(cases){
    var expressions, re,
        offset = 0;

    expressions = cases.reduce(function(o, fn){
        if (fn.pattern){
            o.push(fn.pattern);

            fn.offset = offset;
            fn.limit  = offset + relength(fn.pattern);
        }

        //
        offset = fn.limit || offset;

        return o;
    }, []);

    re = '(\\\\*){(?:' + expressions.join('|') + ')}';

    pattern = new RegExp(re, 'g');
}

function relength(re) {
    re = new RegExp(re + '|').exec('');
    return re.length - 1;
}
