/**
 * Setup shortcuts and shims
 */

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
 * RegExp for replacement, constructed via IIFE.
 */

var re = (function(str) {
        str = '(\\\\*){(?:' + [
            //  \___/
            //  escaped
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


/**
 * Compile given string to function expression,
 * which renders final markup/text.
 *
 * @param  {String|Function} template
 * @return {Function}
 */

engine.compile = function(template) {
    var stack = [], block, fn;

    // allow functions as partials
    if (typeof template == 'function')
        return template;

    template = prepare(template);

    // replace tags
    template = template.replace(re, function(str) {
        var args = slice.call(arguments),
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
            return '\' + g(c,\'' + key + '\',\'' + defValue + '\') + \'';
        }

        // not a valid tag, don't replace
        return str;
    });

    // close extra fors and ifs
    while (block = stack.pop()) {
        console.warn('extra {' + block.statement + '} closed at end of template');
        template += '\'}b+=\'';
    }

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
 * Sanitize input string, transform to acceptable format.
 *
 * @param  {String} str
 * @return {String}
 * @api private
 */

function prepare(str){
    // convert to string, empty if false
    str = (str || '') + '';

    // escape
    return str
        // backslashes
        .replace(/\\/g, '\\\\')
        // single quotes
        .replace(/\'/g, '\\\'')
        // newlines
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        // replace comments (like {!foo!})
        .replace(/(\\*){![\s\S]*?!}/g, function(str, escape) {
            //but not when escaped
            if (!escape) return '';

            return str.replace('\\\\', '');
        });
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
