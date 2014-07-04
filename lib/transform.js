
/**
 * Ordered collection of conditional processors.
 */

var cases = [
        _escape,
        _for,
        _if,
        _key,
        _close,
        _partial,
        _default
    ];

/**
 * Expose cases.
 */

exports = module.exports = {
    cases: cases
};


/**
 * Prepare replacing unnecessary parts
 * and strange characters.
 *
 * @param  {String} str
 * @return {String}
 * @api private
 */

exports.prepare = function (str){
    // convert to string, empty if false
    str = (str || '') + '';

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
};

/**
 * Add closing tags for extra `for`s and `if`s.
 *
 * @param  {Array} stack
 * @return {String}
 */

exports.finish = function (stack) {
    var block, res = '';

    while (block = stack.pop()) {
        warn('extra {' + block.statement + '} closed at end of template');
        res += '\'}b+=\'';
    }

    return res;
};


/**
 * Escaped.
 *
 *      \{escaped.variable}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

function _escape(str, rest) {
    var escape;

    if (! (escape = rest[0]))
        return void 0;

    return str.replace('\\\\', '');
}


/**
 * Variables.
 *
 *      {a.variable}
 *      {a.delusional.variable|And Default}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

function _key(str, rest, stack) {
    var key, tmp;

    if (!(key = rest[5]))
        return void 0;

    if (key == 'else')
        return _else(stack);

    // default or empty
    tmp = rest[6] || '';

    return '\' + g(c,\'' + key + '\',\'' + tmp + '\') + \'';
}

_key.pattern = '(?:([\\w_\\.\\-]+)(?:\\|(.*?))?)';

/**
 * Loops.
 *
 *      {for variable in array}
 *          <p> {variable} </p>
 *      {/for}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @param  {Array} stack
 * @return {String}
 * @api private
 */

function _for(str, rest, stack) {
    var key, i, si;

    if (! (key = rest[2]))
        return void 0;

    i = rest[1];

    // convert `dang-var` to eval-(s)afe `__dang__var`;
    si = i.replace('-', '__');

    stack.push({
        statement:'for',
        key: key,
        i: i,
        si: si
    });

    //
    return '\';'
        + 'var __' + si + '= g(c,\''+i+'\');'
        + 'var ' + si + 'A = g(c,\'' + key + '\');'
        + 'for (var ' + si + 'I=0; ' + si + 'I < ' + si + 'A.length; ' + si + 'I++){'
            + 'c[\'' + i + '\'] = ' + si + 'A[' + si + 'I];'
            + 'b+=\'';
}

_for.pattern = 'for +([\\w_\\-]+) +in +([\\w_.\\-]+)';

/**
 * Conditions.
 *
 *      {if variable}
 *          <p> {variable} </p>
 *      {/if}
 *
 *      {if not variable}
 *          <p> No variable </p>
 *      {/if}
 *
 * @param  {String} str   [description]
 * @param  {Array} rest  [description]
 * @param  {Array} stack [description]
 * @return {String}       [description]
 * @api private
 */

function _if (str, rest, stack) {
    var key, not;

    if (! (key = rest[4]))
        return void 0;

    stack.push({ statement: 'if' });

    // prepend '!' to negative statements
    not = rest[3] ? '!' : '';

    return '\';'
        +'if (' + not + 'g(c,\'' + key + '\')) {'
            + 'b+=\'';
}

_if.pattern = 'if +(not +|)([\\w_.\\-]+)';

/**
 * Negative conditions.
 *
 *     {if variable}
 *         <p>{variable}</p>
 *     {else}
 *         <p>No variable!</p>
 *     {/if}
 *
 *     {for variable in array}
 *         <p>{variable}</p>
 *     {else}
 *         <p>Nothing in the array!</p>
 *     {/for}
 *
 * @param  {String} str
 * @param  {Array} rest
 * @param  {Array} stack
 * @return {String}
 * @api private
 */

function _else (stack) {
    var block = stack[stack.length - 1];

    if (!block || block.elsed) {
        warn('extra {else} ignored');
        return '';
    }

    block.elsed = true;

    if (block.statement === 'if')
        return '\''
            + '} else {'
                + 'b+=\'';

    if (block.statement === 'for')
        return '\''
            + '}'
            + 'if (!g(c,\'' + block.key + '\')) {'
                + 'b+=\'';
}


/**
 * Closing tags for `for`s and `if`s.
 *
 * @param  {String} str
 * @param  {Array} rest
 * @param  {Array} stack
 * @return {String}
 * @api private
 */

function _close(str, rest, stack) {
    var tag, block, tmp;

    if (! (tag = rest[7]))
        return void 0;

    block = stack[stack.length - 1];

    if (!block || block.statement !== tag) {
        warn('extra {/' + tag + '} ignored');
        return '';
    }

    stack.pop();

    // revert value of previously "covered" `dang-var` from `__dang__var`
    tmp = block.statement === 'for'
        ? 'c[\''+block.i+'\'] = __' + block.si + ';'
        : '';

    return '\'}'
        + tmp
        + 'b+=\'';
}

_close.pattern = '\\/(for|if)';


/**
 * Partials.
 *
 *     <div> {>partial} </div>
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

function _partial(str, rest) {
    var partial;

    if (! (partial = rest[8]))
        return void 0;

    return '\'+r(g(c,\'' + partial + '\'),c)+\'';
}

_partial.pattern = '>([\\w_.\\-]+)';

/**
 * Default block.
 * Returns supplied string.
 *
 * @param  {String} str
 * @return {String}
 * @api private
 */

function _default(str) {
    return str;
}


/**
 * Wrapper for `console.warn`,
 * could be replaced with a custom logger.
 *
 * @param  {Mixed..} msg
 * @api private
 */

function warn(msg) {
    if (msg == void 0)
        return msg;

    console.warn.apply(console, arguments);
}

