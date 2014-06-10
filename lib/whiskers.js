// whiskers.js templating library

;(function(whiskers) {
    var regex, reStr;

    reStr = '(\\\\*){(?:' + [

        //           else -------------------------------------x
        //       /¯¯¯¯¯¯¯¯¯\                                    \
            '(?:([\\w_.\\-]+)(?:\\|(.*?))?)',               //   \ 
        //       \_________/  \__________/                  //    \ 
        //        post.name    [Untitled]                   //     x
                                                            //     |
            '>([\\w_.\\-]+)',                               //     |
        //   | \_________/                                  //     |
        //   >   partials                                   //     |
                                                            //     |
            'for +([\\w_\\-]+) +in +([\\w_.\\-]+)',         //     |
        //  |___|  \_________/ |__| \___________/           //     |
        //   for     comment    in     comments             //     x
                                                            //    /
            'if +(not +|)([\\w_.\\-]+)',                    //   / 
        //  |__|  \____/  \_________/                           / 
        //   if    [not]                                       x

            '\\/(for|if)'
        //    | |______|
        //    \  for|if

    ].join('|') + ')}';
    
    // /(\\*){(?:(?:([\w_.\-]+)(?:\|(.*?))?)|>([\w_.\-]+)|for +([\w_\-]+) +in +([\w_.\-]+)|if +(not +|)([\w_.\-]+)|\/(for|if))}/g

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
        var stack = [], block, i, fn, safeIterVar;

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
        template = template.replace(regex, function(str, escapeChar, key, defValue, partial, iterVar, forKey, ifNot, ifKey, closeStatement, offset, s) {
            var chunk, chunkPt;

            if (escapeChar) return str.replace('\\\\', '');
            // {>foo}
            if (partial) return '\'+r(g(c,\''+partial+'\'),c)+\'';
            // {for foo in bar}
            if (forKey) {
                // convert `dang-var` to eval-safe `__dang__var`;
                safeIterVar = iterVar.replace('-', '__');

                stack.push({
                    statement:'for', 
                    forKey: forKey,
                    iterVar: iterVar,
                    safeIterVar: safeIterVar
                });

                // 
                return '\';'
                    + 'var __' + safeIterVar + '= g(c,\''+iterVar+'\');'
                    + 'var ' + safeIterVar + 'A = g(c,\'' + forKey + '\');'
                    + 'for (var ' + safeIterVar + 'I=0; ' + safeIterVar + 'I < ' + safeIterVar + 'A.length; ' + safeIterVar + 'I++){'
                        + 'c[\'' + iterVar + '\'] = ' + safeIterVar + 'A[' + safeIterVar + 'I];'
                        + 'b+=\'';
            }

            // {if foo} or {if not foo}
            if (ifKey) {
                stack.push({
                    statement: 'if'
                });

                // prepend '!' to negative statements
                var chunk = ( ifNot ? '!' : '' );

                return '\';'
                    +'if (' + chunk + 'g(c,\'' + ifKey + '\')) {'
                        + 'b+=\'';
            }

            // {else}
            if (key == 'else') {
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
            if (closeStatement) {
                block = stack[stack.length-1];
                
                if (!block || block.statement !== closeStatement) {
                    console.warn('extra {/'+closeStatement+'} ignored');
                    return '';
                }

                stack.pop();

                // revert value of previously "covered" `dang-var` from `__dang__var`
                chunk = block.statement === 'for' 
                    ? 'c[\''+block.iterVar+'\'] = __' + block.safeIterVar + ';'
                    : '';

                return '\'}'
                    + chunk
                    + 'b+=\'';
            }

            // {foo|default blah}
            if (key) {
                // if no default provided, put empty string
                chunk = defValue || '';

                return '\'+g(c,\'' + key + '\',\'' + chunk + '\')+\'';
            }

            // not a valid tag, don't replace
            return str;
        });

        // close extra fors and ifs
        i = stack.length;
        while (block = stack[--i]) {
            console.warn('extra {'+block.statement+'} closed at end of template');
            template += '\'}b+=\'';
        }

        // c is context, b is buffer
        fn = new Function('g', 'r', 'return function(c){var b=\''+template+'\';return b}');

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
