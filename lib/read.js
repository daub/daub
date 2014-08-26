/**
 * Load dependencies
 */

var fs = require('fs');


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

module.exports = function (file, options, done) {
    // if options ommited
    if (typeof options == 'function')
        done = options,
        options = {};

    if (typeof file == 'string')
        file = Manifest(file);

    if (options.cache !== false && cache[file.filename])
        return done(null, cache[file.filename]);

    file.read(function(err, markup){
        if (err) return done(err);

        file.string   = markup;
        file.partials = markup.match(rePart);

        if (options.cache !== false)
            cache[file.filename] = file;

        done(null, file);
    });
};


/**
 * Common interface with component's manifest.
 *
 * @constructor
 * @param {String} filename
 * @param {Object} options
 * @return {Manifest}
 */

function Manifest (filename, options) {
    if (! (this instanceof Manifest))
        return new Manifest(filename, options);

    this.filename = filename;
    this.read = read(this);

    return this;
}

/**
 * Populate `file.string` asynchronously by doing `yield file.read`.
 * If you want to use a caching mechanism here or something
 * for reloads, you can overwrite this method.
 *
 * @param {Object} file
 * @api public
 */

function read (file) {
    var string;

    return function (done) {
        // already read
        if (typeof file.string === 'string')
            return done(null, file.string);

        if (typeof string === 'string')
            return done(null, string);

        fs.readFile(file.filename, 'utf8', function (err, str) {
            if (err) {
                return done(new Error('failed to read "'
                    + file.filename
                    + '"'));
            }
            done(null, string = str);
        });
    };
}
