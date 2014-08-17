/**
 * Load dependencies.
 */

var fs      = require('fs');

var htmlmin = require('html-minifier');

/**
 * Load `daub`.
 */

var daub    = require('./lib/daub.js');

var resolve = require('daub-resolve');

/**
 * Options for minification.
 */

var minOpts = {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true
    };

/**
 * Setup cache, initially empty.
 */

var cache = {},
    readCache = {};


var production = process.env.NODE_ENV == 'production';

/**
 * Expose `daub` itself.
 */

module.exports = daub;


/**
 * Expose `renderFile` method,
 * aliased for Express.
 *
 * @param {String} path
 * @param {Object} options [optional]
 * @param {Function} fn [optional]
 * @async
 * @api public
 */

module.exports.renderFile =
module.exports.__express = function(path, options, fn) {
    path = lookup(__dirname, path);

    if (typeof options === 'function')
        fn = options, options = {};

    fn || (fn = function(){});

    compile(path, options, function(err, compiled){
        if (err) return fn(err);
        fn(null, compiled(options));
    });
};


/**
 * Compile file at given path to templating function expression,
 * optionally serving from `cache` if already compiled before.
 *
 * @param {String} path
 * @param {Object} options
 * @param {Function} fn
 * @async
 * @api private
 */

function compile(path, options, fn) {

    var compiled = cache[path];
    // cached
    if (options.cache && compiled)
        return fn(null, compiled);
    // read with partials
    fetch(path, options, function(err, markup){
        if (err) return fn(err);

        // minify on demand
        if (options.compress || production)
            markup = htmlmin.minify(markup, minOpts);

        compiled = daub.compile(markup, path);

        if (options.cache)
            cache[path] = compiled;

        fn(null, compiled);
    });
}


/**
 * Inline partials in given template.
 *
 * @param {String} path
 * @param {Object} options
 * @param {Function} fn
 * @async
 * @api private
 */

function fetch(root, options, fn) {
    var repart = /(?:{>([\w_.\-\/]+)})/g;

    read(root, options, function (err, markup) {
        if (err)
            return fail(err);

        var partials = markup.match(repart),
            pending  = partials && partials.length;

        if (!pending)
            return fn(null, markup);

        partials.forEach(function(partial){
            // '{>partial.html}' to 'partial.html'
            var path     = partial.slice(2, -1),
                resolved = resolve(root, path, options);

            if (resolved == null)
                return append();

            fetch(resolved, options, append);

            function append(err, template) {
                markup = markup.replace(partial, template);
                --pending || fn(null, markup);
            }
        });
    });

    function fail(err, markup) {
        // fail silently in production
        if (process.env.NODE_ENV == 'production')
            return fn(null, '');

        return fn(err, markup);
    }
}


/**
 * Read file at given path,
 * or serve cached version.
 *
 * @param {String} path
 * @param {Object} options
 * @param {Function} fn
 * @async
 * @api private
 */

function read(path, options, fn) {
    var markup = readCache[path];

    if (options.cache && markup)
        return fn(null, markup);

    if (!path)
        return fn('Not found');

    fs.readFile(path, 'utf8', function(err, markup){
        if (err) return fn(err);

        if (options.cache)
            readCache[path] = markup;

        fn(null, markup);
    });
}
