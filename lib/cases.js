/**
 * Ordered collection of conditional processors.
 */

module.exports = [
    require('./cases/escape.js'),
    require('./cases/key.js'),
    require('./cases/for.js'),
    require('./cases/if.js'),
    require('./cases/else.js'),
    require('./cases/close.js'),
    require('./cases/partial.js'),
    require('./cases/default.js')
];
