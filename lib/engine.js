/**
 * Load transformation utilities' module.
 */

var transform = require('./transform.js');

/**
 * Setup shortcuts and shims
 */


var prepare = transform.prepare,
    cases   = transform.cases,
    finish  = transform.finish;

var pattern = re(cases);

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

        while (res === void 0)
            res = cases[i++](str, params, stack);

        return res;
    });

    template = template + finish(stack);


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



function re(fns){
    var expressions, pattern;

    expressions = fns.slice(1, -1)
        .map(function(mx){
            return mx.pattern || void 0;
        })
        .filter(function(re){
            return re;
        });

    pattern = '(\\\\*){(?:' + expressions.join('|') + ')}';

    return new RegExp(pattern, 'g');
}
