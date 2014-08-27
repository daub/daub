/**
 * Load dependencies
 */

var fs   = require('fs');

var resolve = require('./resolve.js');

/**
 * RegExp to extract partials.
 */

var rePart = /(?:{>([\w_.\-\/]+)})/g;


/**
 * Storage for cache.
 */

var cache = {};

/**
 * Read file and extract partials
 * or serve cached version.
 *
 * @param  {Manifest|String} file
 * @param  {Object}   options [optional]
 * @param  {Function} done
 * @async
 */

module.exports = readFile;


function readFile (filepath, options, done) {
    // if options ommited
    if (typeof options == 'function')
        done = options,
        options = {};

    read(filepath, options, done);
}


/**
 * Populate `file.string` asynchronously by doing `yield file.read`.
 * If you want to use a caching mechanism here or something
 * for reloads, you can overwrite this method.
 *
 * @param {Object} file
 * @api public
 */

function read (filepath, options, done) {

    if (options.cache !== false && cache[filepath])
        return done(null, cache[filepath]);

    fs.readFile(filepath, 'utf8', function (err, markup) {
        if (err) return done(err);

        // extract partials' statements from the template
        var partials = markup.match(rePart),
            pending  = partials && partials.length;

        // get back immediately if no partials found
        if (!pending) {
            // cache on demand
            if (options.cache !== false)
                cache[filepath] = markup;

            return done(null, markup);
        }

        partials.forEach(function(partial){
            // '{>./partial.html}' to 'partial.html'
            var name = partial.slice(2, -1),
                filename;

            // in case of local
            if (name[0] == '.') {
                filename = resolve(name, filepath);
                return read(filename, options, append);
            }

            // in case of component
            var branch = ~name.indexOf('/')
                    ? options.dependencies
                    : options.locals;

            var target  = branch[name];

            filename = resolve(name, target);
            read(filename, target, append);

            function append(err, template) {
                markup = markup.replace(partial, template);
                --pending || done(null, markup);
            }
        });
    });
}
