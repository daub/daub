var fs      = require('fs'),
    path    = require('path');

var resolve = path.resolve,
    dirname = path.dirname;

var vibrissae = require('./lib/vibrissae.js');

var cache = {},
    readCache = {};


module.exports = vibrissae;

module.exports.__express = function(path, options, fn) {
    path = resolve(__dirname, path);

    if (typeof options === 'function')
        fn = options, options = {};

    fn || (fn = function(){});

    compile(path, options, function(err, compiled){
        if (err) return fn(err);
        fn(null, compiled(options));
    });
};


function fetch(path, options, fn) {
    var repart = /(?:{>([\w_.\-\/]+)})/g;

    read(path, options, function (err, template) {
        if (err) return fn(err);

        var partials = template.match(repart);

        if (!partials) return fn(null, template);

        var pending = partials.length;

        partials.forEach(function(partial){
            var resolved = resolve(dirname(path), partial.slice(2, -1));

            fetch(resolved, options, function(err, tpl){
                template = template.replace(partial, tpl);
                --pending || fn(null, template);
            });
        });
    });
}


function read(path, options, fn) {
    var template = readCache[path];

    if (options.cache && template)
        return fn(null, template);

    fs.readFile(path, 'utf8', function(err, template){
        if (err) return fn(err);

        if (options.cache)
            readCache[path] = template;

        fn(null, template);
    });
}


function compile(path, options, fn) {

    var compiled = cache[path];
    // cached
    if (options.cache && compiled) return fn(null, compiled);
    // read with partials
    fetch(path, options, function(err, template){
        if (err) return fn(err);

        var compiled = vibrissae.compile(template);

        if (options.cache)
            cache[path] = compiled;

        fn(null, compiled);
    });
}
