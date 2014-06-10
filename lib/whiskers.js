// whiskers.js templating library

;(function(whiskers) {
    var regex, reStr;

    reStr = '(\\\\*){(?:' + [

            '>([\\w_.\\-]+)',
        //   | \_________/
        //   >   partials

            'for +([\\w_\\-]+) +in +([\\w_.\\-]+)',
        //  |___|  \_________/ |__| \___________/
        //   for     comment    in     comments

            'if +(not +|)([\\w_.\\-]+)',
        //  |__|  \____/  \_________/
        //   if    [not]

            '(else)',
        //   |____|
        //    else

            '\\/(for|if)',
        //    | |______|
        //    \  for|if

            '(?:([\\w_.\\-]+)(?:\\|(.*?))?)'
        //       \_________/  \__________/
        //        post.name    [Untitled]
    ].join('|') + ')}';

    // /(\\*){(?:>([\w_.\-]+)|for +([\w_\-]+) +in +([\w_.\-]+)|if +(not +|)([\w_.\-]+)|(else)|\/(for|if))|(?:([\w_.\-]+)(?:\|(.*?))?)}/g
    regex = new RegExp(reStr, 'g');

    // for compiled templates
    whiskers.cache = {};

    // main function
    whiskers.render = function(template, context) {
        var cache = whiskers.cache
        // compile if not cached
        if (!cache[template])
            cache[template] = whiskers.compile(template);

        return cache[template](context);
    };

    // compile template to function
    whiskers.compile = function(template) {
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
        template = template.replace(/(\\*){![\s\S]*?!}/g, function(str, escapeChar) {
            if (escapeChar) return str.replace('\\\\', '');
            return '';
        });

        // replace tags
        template = template.replace(regex, function(str) {
            var args, sc,
                order = [
                    null,
                    'escapeChar',
                    'partial',
                    'iVar', 'forKey',
                    'ifNot', 'ifKey',
                    'elseKey',
                    'closeStatement',
                    'key', 'defValue'
                ];

            // arrange input arguments by fields in `args`
            [].reduce.call(arguments, function(o, value, i){
                // omit leading/trailing
                (sc = order[i])
                    // any falsey is ok, just replacing with '' for `defValue`
                    && (o[sc] = value || '');
                return o;
            }, args = {});

            if (args.escapeChar)
                return str.replace('\\\\', '');

            // {>foo}
            if (args.partial)
                return '\'+r(g(c,\'' + args.partial + '\'),c)+\'';

            // {for foo in bar}
            if (args.forKey) {
                var forKey = args.forKey,
                    iVar = args.iVar;

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
            if (args.ifKey) {
                stack.push({ statement: 'if' });

                // prepend '!' to negative statements
                var sc = ( args.ifNot ? '!' : '' );

                return '\';'
                    +'if (' + sc + 'g(c,\'' + args.ifKey + '\')) {'
                        + 'b+=\'';
            }

            // {else}
            if (args.elseKey) {
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
            if (args.closeStatement) {
                block = stack[stack.length-1];

                if (!block || block.statement !== args.closeStatement) {
                    console.warn('extra {/' + args.closeStatement + '} ignored');
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
            if (args.key)
                return '\'+g(c,\'' + args.key + '\',\'' + args.defValue + '\')+\'';

            // not a valid tag, don't replace
            return str;
        });

        // close extra fors and ifs
        i = stack.length;
        while (block = stack[--i]) {
            console.warn('extra {' + block.statement + '} closed at end of template');
            template += '\'}b+=\'';
        }

        // c is context, b is buffer
        fn = new Function('g', 'r', 'return function(c){var b=\'' + template + '\';return b}');

        return fn(get, whiskers.render);
    };

    // get value with dot notation, with optional default value if lookup fails
    // e.g. get(obj, 'key.for.something')
    function get(obj, key, def) {
        // default "nothing" for empty/falsey values, but not `0`
        (def == null) && (def = '');

        if (!obj) return def;

        var keys = key.split('.'),
            empty = true;

        key = keys.shift();

        while (key && (obj = obj[key]))
            key = keys.shift();

        // empty string for every falsy value except 0
        if (!obj && obj !== 0) return def;

        // treat [] and {} as falsy also
        if (obj instanceof Array && !obj.length) return def;

        if (obj.constructor === Object) {
            keys = Object.keys(obj);
            if (!keys.length) return def;
            // { a: 5, b: 6 } => (a,b)
            // obj = '('+keys+')';
        }

        return obj;
    }

    // for Express
    whiskers.__express = function() {try {return require('./__express')} catch (e) {}}();
}(typeof module == 'object' ? module.exports : window.whiskers = {}));
