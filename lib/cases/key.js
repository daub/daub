var report = require('../reporter.js');

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

module.exports = function (str, key, def) {
    if (!key)
        return void 0;

    if (key == 'else')
        return _else(this);
    else if (key.charAt(0) == '>')
        return _partial(key.slice(1));

    // default or empty
    def = def || '';

    return '\' + g(c,\'' + key + '\',\'' + def + '\') + \'';
};

/**
 * Pattern for `_key`, including `else` and `>partial` cases.
 */

module.exports.pattern = '(?:(>?[\\w_\\.\\-]+)(?:\\|(.*?))?)';


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
        report('extra {else} ignored');
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
 * Partials.
 *
 *     <div> {>partial} </div>
 *
 * @param  {String} str
 * @param  {Array} rest
 * @return {String}
 * @api private
 */

function _partial(partial) {
    return '\'+r(g(c,\'' + partial + '\'),c)+\'';
}
