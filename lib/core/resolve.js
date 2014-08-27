/**
 * Load dependencies.
 */

var fs   = require('fs'),
    path = require('path');

/**
 * Expose `resolve` function.
 *
 *      resolve('./template.html', '/var/www/index.html');
 *      // '/var/www/template.html'
 *
 *      resolve('component/tip', branch.dependencies);
 *      // '/var/www/components/component/tip/1.2.2/template.html'
 *
 * @param  {String}   root   [optional]
 * @param  {String}   target
 * @return {String}
 */

module.exports = function(target, options) {
    if (target[0] == '/')
        return target;

    if (target[0] == '.') {
        var root = typeof options == 'string'
                ? options
                : options.root || process.cwd();
        return resolve(target, root);
    }

    var node  = options.node,
        index = node.template;

    if (!index && ~node.templates['template.html'])
        index = 'template.html';

    if (!index)
        return null;

    return resolve(index, options.path);
};


/**
 * Resolve requested file path
 * relative to the provided root.
 *
 * @param  {String}   target
 * @param  {String}   root
 * @return {String}
 */

function resolve (target, root) {
    root   = getDirectory(root);
    target = path.resolve(root, target);

    if (!fs.existsSync(target))
        return null;

    if (isDirectory(target))
        return resolve('index.html', target);

    return target;
}

function getDirectory(directory) {
    return isDirectory(directory)
        ? directory
        : path.dirname(directory);
}

function isDirectory(directory) {
    return fs.lstatSync(directory).isDirectory();
}
