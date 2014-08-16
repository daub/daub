/**
 * Load dependencies.
 */

var fs      = require('fs'),
    path    = require('path');

var htmlmin = require('html-minifier');

/**
 * Load `engine`.
 */

var engine = require('./lib/daub.js');

var report = require('daub-reporter');

/**
 * Shortcuts and shims.
 */

var resolve = path.resolve,
    dirname = path.dirname,
    extname = path.extname;

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


/**
 * Expose `engine` itself.
 */

module.exports = engine;


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
    if (options.cache && compiled) return fn(null, compiled);
    // read with partials
    fetch(path, options, function(err, markup){
        if (err) return fn(err);

        // minify on demand
        if (options.htmlmin !== false && process.env.NODE_ENV == 'production')
            markup = htmlmin.minify(markup, minOpts);

        var compiled = engine.compile(markup, path);

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

function fetch(path, options, fn) {
    var repart = /(?:{>([\w_.\-\/]+)})/g;

    read(path, options, function (err, markup) {
        if (err)
            return fail(err);

        var partials = markup.match(repart),
            pending;

        if (!partials)
            return fn(null, markup);

        pending = partials.length;

        partials.forEach(function(partial){
            var resolved = lookup(dirname(path), partial.slice(2, -1));

            if (resolved == null)
                return append();

            fetch(resolved, options, append);

            function append(err, tpl) {
                markup = markup.replace(partial, tpl);
                --pending || fn(null, markup);
            }
        });
    });

    function fail(err, markup) {
        report('Can not parse template.', {
            file: path
        });

        // fail silently in production
        if (process.env.NODE_ENV == 'production')
            err = null, markup = '';

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


/**
 * Lookup for file at provided path to exist,
 * tries with appended '.html', if it doesn't exist already.
 *
 * @param  {String} path
 * @param  {String} partial
 * @return {String}
 * @api private
 */

function lookup(path, partial) {
    var resolved = resolve(path, partial);

    if (!fs.existsSync(resolved)) {
        if (extname(resolved) !== '.html')
            return lookup(path, partial +'.html');
        return null;
    }

    return resolved;
}
