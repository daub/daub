/**
 * Load dependencies.
 */

var fs      = require('fs'),
    path    = require('path');

var htmlmin = require('html-minifier');

/**
 * Load `daub`.
 */

var daub    = require('./lib/daub.js');

var read    = require('./lib/core/read.js');


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

var cache = {};


var production = process.env.NODE_ENV == 'production';

/**
 * Expose `daub` itself.
 */

module.exports = daub;

/**
 * Expose low level `readFile` method.
 */

daub.readFile = read;

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

daub.renderFile =
daub.__express = function(root, options, fn) {
    if (typeof options == 'function')
        fn = options,
        options = {};

    if (typeof fn !== 'function')
        return void 0;

    compile(root, options, function(err, compiled){
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
    if (options.cache != false && compiled)
        return fn(null, compiled);
    // read with partials
    read(path, options, function(err, markup){

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
