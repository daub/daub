/**
 * Require the module at `name`.
 *
 * @param {String} name
 * @return {Object} exports
 * @api public
 */

function require(name) {
  var module = require.modules[name];
  if (!module) throw new Error('failed to require "' + name + '"');

  if (!('exports' in module) && typeof module.definition === 'function') {
    module.client = module.component = true;
    module.definition.call(this, module.exports = {}, module);
    delete module.definition;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Register module at `name` with callback `definition`.
 *
 * @param {String} name
 * @param {Function} definition
 * @api private
 */

require.register = function (name, definition) {
  require.modules[name] = {
    definition: definition
  };
};

/**
 * Define a module's exports immediately with `exports`.
 *
 * @param {String} name
 * @param {Generic} exports
 * @api private
 */

require.define = function (name, exports) {
  require.modules[name] = {
    exports: exports
  };
};
require.register("vibrissae", function (exports, module) {
// vibrissae.js templating library

var vibrissae = {};

var re = (function(str) {
        str = '(\\\\*){(?:' + [
            //    \___/
            //   escaped
            //  ---------------------------------------
                '>([\\w_.\\-]+)',
            //   | \_________/
            //   >   partials
            //  ---------------------------------------
                'for +([\\w_\\-]+) +in +([\\w_.\\-]+)',
            //  |___|  \_________/ |__| \___________/
            //   for     comment    in     comments
            //  ---------------------------------------
                'if +(not +|)([\\w_.\\-]+)',
            //  |__|  \____/  \_________/
            //   if    [not]
            //  ---------------------------------------
                '(else)',
            //   |____|
            //    else
            //  ---------------------------------------
                '\\/(for|if)',
            //    | |______|
            //    \  for|if
            //  ---------------------------------------
                '(?:([\\w_.\\-]+)(?:\\|(.*?))?)'
            //       \_________/  \__________/
            //        post.name    [Untitled]
        ].join('|') + ')}';

        return new RegExp(str, 'g');
    })();

// for compiled templates
vibrissae.cache = {};

// main function
vibrissae.render = function(template, context) {
    var cache = vibrissae.cache;
    // compile if not cached
    if (!cache[template])
        cache[template] = vibrissae.compile(template);

    return cache[template](context);
};

// compile template to function
vibrissae.compile = function(template) {
    var stack = [], block, i, fn;

    // allow functions as partials
    if (typeof template === 'function')
        return template;

    // convert to string, empty if false
    template = (template || '') + '';

    // escape
    template = template
        // backslashes
        .replace(/\\/g, '\\\\')
        // single quotes
        .replace(/\'/g, '\\\'')
        // newlines
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');

    // replace comments (like {!foo!})
    template = template.replace(/(\\*){![\s\S]*?!}/g, function(str, escape) {
        if (escape) return str.replace('\\\\', '');
        return '';
    });

    // replace tags
    template = template.replace(re, function(str) {
        var args = [].slice.call(arguments),
            sc;

        var escape   = args[1],
            partial  = args[2],
            iVar     = args[3],
            forKey   = args[4],
            ifNot    = args[5],
            ifKey    = args[6],
            elseKey  = args[7],
            closeTag = args[8],
            key      = args[9],
            defValue = args[10];


        if (escape)
            return str.replace('\\\\', '');

        // {>foo}
        if (partial)
            return '\'+r(g(c,\'' + partial + '\'),c)+\'';

        // {for foo in bar}
        if (forKey) {
            // convert `dang-var` to eval-(s)afe `__dang__var`;
            sc = iVar.replace('-', '__');

            stack.push({
                statement:'for',
                forKey: forKey,
                iVar: iVar,
                siVar: sc
            });

            //
            return '\';'
                + 'var __' + sc + '= g(c,\''+iVar+'\');'
                + 'var ' + sc + 'A = g(c,\'' + forKey + '\');'
                + 'for (var ' + sc + 'I=0; ' + sc + 'I < ' + sc + 'A.length; ' + sc + 'I++){'
                    + 'c[\'' + iVar + '\'] = ' + sc + 'A[' + sc + 'I];'
                    + 'b+=\'';
        }

        // {if foo} or {if not foo}
        if (ifKey) {
            stack.push({ statement: 'if' });

            // prepend '!' to negative statements
            sc = ifNot ? '!' : '';

            return '\';'
                +'if (' + sc + 'g(c,\'' + ifKey + '\')) {'
                    + 'b+=\'';
        }

        // {else}
        if (elseKey) {
            block = stack[stack.length-1];

            if (!block || block.elsed) {
                console.warn('extra {else} ignored');
                return '';
            }

            block.elsed = true;

            if (block.statement === 'if') {
                return '\''
                    + '} else {'
                        + 'b+=\'';
            }
            else if (block.statement === 'for') {
                //
                return '\''
                    + '}'
                    + 'if (!g(c,\'' + block.forKey + '\')) {'
                        + 'b+=\'';
            }
        }

        // {/for} or {/if}
        if (closeTag) {
            block = stack[stack.length-1];

            if (!block || block.statement !== closeTag) {
                console.warn('extra {/' + closeTag + '} ignored');
                return '';
            }

            stack.pop();

            // revert value of previously "covered" `dang-var` from `__dang__var`
            sc = block.statement === 'for'
                ? 'c[\''+block.iVar+'\'] = __' + block.siVar + ';'
                : '';

            return '\'}'
                + sc
                + 'b+=\'';
        }

        // {foo|default blah}
        if (key) {
            defValue || (defValue = '');
            return '\'+g(c,\'' + key + '\',\'' + defValue + '\')+\'';
        }

        // not a valid tag, don't replace
        return str;
    });

    // close extra fors and ifs
    i = stack.length;
    while (block = stack[--i]) {
        console.warn('extra {' + block.statement + '} closed at end of template');
        template += '\'}b+=\'';
    }

    /* jshint ignore:start */
    // Code here will be linted with ignored by JSHint.
    // c is context, b is buffer
    fn = new Function('g', 'r', 'return function(c){var b=\'' + template + '\';return b}');
    /* jshint ignore:end */

    return fn(get, vibrissae.render);
};

// get value with dot notation, with optional default value if lookup fails
// e.g. get(obj, 'key.for.something')
function get(obj, key, def) {
    // default "nothing" for empty/falsey values, but not `0`
    if (def == null) def = '';

    if (!obj) return def;

    var keys = key.split('.');

    key = keys.shift();
    while (key && (obj = obj[key]))
        key = keys.shift();

    // empty string for every falsy value except 0
    if (!obj && obj !== 0) return def;

    // treat [] and {} as falsy also
    if (obj instanceof Array && !obj.length) return def;

    if (obj.constructor === Object && !Object.keys(obj).length) return def;

    // if (typeof obj === 'function')
    //     return def;

    return obj;
}

module.exports = vibrissae;

});

require("vibrissae")
