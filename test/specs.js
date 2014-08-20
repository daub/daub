var fs      = require('fs'),
    path    = require('path'),
    assert  = require('assert');

var read    = fs.readFileSync;

var equal   = assert.equal,
    ok      = assert.ok;

var daub  = require('../index.js');

var render     = daub.render,
    compile    = daub.compile;

var renderFile = daub.renderFile;

describe('Core', function(){
    describe('Compile', function(){
        it('should accept various types of arguments', function(){
            ok(compile());
            ok(compile('3'));
            ok(compile(3));
            ok(compile({ p: 3 }));
        });

        it('should return a function, which will render', function() {
            var template = '{sue} and {sam} and {for x in nums}{x}{/for}';
            var context = {
                    sue: 'bob',
                    sam: 'sal',
                    nums: [1,2,3]
                };

            equal(typeof compile(template), 'function');
            equal(compile(template)(context), 'bob and sal and 123')
        });
    });

    describe('Render', function(){
        it('should render primitives', function() {
            equal(render(), '');
            equal(render('3'), '3');
            equal(render('{foo}'), '');
            equal(render(function(){ return 'foo' }), 'foo');
        });

        it('should handle troubling chars', function(){
            equal(render('\\'), '\\');
            equal(render('\''), '\'');
            equal(render('\\\''), '\\\'');
            equal(render('\\\'{vehicle}', {vehicle: 'truck'}), '\\\'truck');
            equal(render('bob\nsue'), 'bob\nsue');
            equal(render('bob\r\nsue'), 'bob\nsue');
            equal(render('{under_score}', {under_score: 'truck'}), 'truck');
            equal(render('{hyphenated-key}', {'hyphenated-key': 'truck'}), 'truck');
        });

        it('should render strange templates', function(){
            equal(render(), '');
            equal(render('3'), '3');
            equal(render('{foo}'), '');
            equal(render(3), '3');
            equal(render([1,2,3]), '1,2,3');
            equal(render({p:3}), '[object Object]');
            equal(render(function(){return 'foo'}), 'foo');
        });

        it('should handle iife in context', function(){
            var context = {
                add2and2: function() {
                    return 2 + 2;
                }()
            };

            equal(render('{add2and2}', context), '4');
        });

        it('should leave tags escaped with leading \\ as is', function() {
            equal(render('\\{bob}'), '{bob}');
            equal(render('\\{bob.bloss}'), '{bob.bloss}');
            equal(render('\\{for anger in mgmt}'), '{for anger in mgmt}');
            equal(render('\\{/for}'), '{/for}');
            equal(render('\\{if then}'), '{if then}');
            equal(render('\\{if not now}'), '{if not now}');
            equal(render('\\{else}'), '{else}');
            equal(render('\\{/if}'), '{/if}');
        });
    });
});

describe('Comments', function(){
    var template;

    it('should strip commented tags', function() {
        template = '{!this won\'t show up!}';
        equal(render(template, {}), '')

        template = '{!!}';
        equal(render(template, {}), '')

        template = '{!this won\'t show up\neither!}';
        equal(render(template, {}), '')

        template = '{!this won\'t {show} up!}';
        equal(render(template, {}), '')
    });

    it('should not strip escaped comments', function() {
        template = '\\{!this will show up!}';
        equal(render(template, {}), '{!this will show up!}')

        template = '{!this will also show up}';
        equal(render(template, {}), '{!this will also show up}')
    });

    it('should handle nested comments', function() {
        template = '{!this won\'t, but!}this part will show up!}';
        equal(render(template, {}), 'this part will show up!}')

        template = '{also, {!this} part won\'t show up!}';
        equal(render(template, {}), '{also, ')

        template = '{!more than !}just one{!silly!} comment';
        equal(render(template, {}), 'just one comment');
    });
});

describe('Values', function(){
    var context;

    it('should insert strings', function(){
        context = {
            foo: 'hey',
            baz: { blah: 'hello' },
            bar: 100
        };

        equal(render('{foo}', context), 'hey');
        equal(render('{baz.blah}', context), 'hello');
    });

    it('should insert string representations of values', function(){
        context = {
            foo: [1, 2, 3],
            baz: { blah: 'hello', dah: 'hi' },
            bar: 100,
            saz: new Date
        };

        equal(render('{foo}', context), '1,2,3');
        equal(render('{baz}', context), '[object Object]');
        equal(render('{bar}', context), '100');
        equal(render('{saz}', context), context.saz.toString());
    });

    it('should insert empty string on falsey values but number 0', function() {
        context = {
            'false'     : false,
            'empty'     : '',
            'null'      : null,
            'emptyArray': [],
            'emptyObj'  : {},
        };
        equal(render('{false}', context), '');
        equal(render('{empty}', context), '');
        equal(render('{null}', context), '');
        equal(render('{undefined}', context), '');
        equal(render('{undefined.undefined}', context), '');
        equal(render('{emptyArray}', context), '');
        equal(render('{emptyObj}', context), '');
    });

    it('should insert default value when needed and provided', function () {
        context = {
            foo: false,
            baz: { blah: null },
            bar: 'hey'
        };

        equal(render('{doo|blah:(}'), 'blah:(')
        equal(render('{bar|blah:(}', context), 'hey')
        equal(render('{foo|foo blah:(}', context), 'foo blah:(')
        equal(render('{foo.baz|baz blah:(}', context), 'baz blah:(')
    });

    it('should keep 0 as is', function () {
        context = {
            'zero'      : 0,
            'zeroArray' : [{ value: 0 }]
        };

        equal(render('{zero}', context), '0');
        equal(render('{zero|blah}', context), '0');
        equal(render('{zeroArray.0.value}', context), '0');
    });
});

describe('Blocks', function(){
    describe('Statements', function () {
        it('should handle conditions', function() {
          var context = { foo: 'bar' };

          equal(render('{if foo}{foo}{/if}', context), 'bar');
          equal(render('{if biz}{foo}{/if}', context), '');

          equal(render('{if not foo}{foo}{/if}', context), '');
          equal(render('{if not biz}{foo}{/if}', context), 'bar');

          equal(render('{if biz}blah{else}{foo}{/if}', context), 'bar');
          equal(render('{if foo-bar}{foo-bar}{/if}', {'foo-bar':'x'}), 'x');
        });

        it('should execute "negative" blocks on falseys', function(){
            var context = {
                    'false'     : false,
                    'empty'     : '',
                    'null'      : null,
                    'zero'      : 0,
                    'emptyArray': [],
                    'emptyObj'  : {},
                    'zeroArray' : [{ value: 0 }]
                };

            equal(render('{if false}x{/if}', context), '');
            equal(render('{if empty}x{/if}', context), '');
            equal(render('{if null}x{/if}', context), '');
            equal(render('{if undefined}x{/if}', context), '');
            equal(render('{if undefined.undefined}x{/if}', context), '');
            equal(render('{if zero}x{/if}', context), '');

            equal(render('{if not false}x{/if}', context), 'x');
            equal(render('{if not empty}x{/if}', context), 'x');
            equal(render('{if not null}x{/if}', context), 'x');
            equal(render('{if not undefined}x{/if}', context), 'x');
            equal(render('{if not undefined.undefined}x{/if}', context), 'x');
            equal(render('{if not zero}x{/if}', context), 'x');

            equal(render('{for x in emptyArray}blah{else}x{/for}', context), 'x');
            equal(render('{for x in zeroArray}{x.value}{else}blah{/for}', context), '0');
        });
    });

    describe('Loops', function () {
        var context = {}, template;

        it('should iterate over arrays and strings', function(){
            template = '{for x in arr}{x}{/for}',

            equal(render(template, {}), '');

            context.arr = [1, 2, 3];
            equal(render(template, context), '123');

            context.arr = 'string';
            equal(render(template, context), 'string');

            context.arr = { b: 'orange' };
            equal(render(template, context), '');
        });

        it('should iterate over collections', function () {
            template = '{for x in arr}{x.y}{/for}';

            context.arr = [{ y: 1 }, { y: 2 }, { y: 3 }];
            equal(render(template, context), '123');

            context.arr = [1,2,3];
            equal(render(template, context), '');

            context.arr = 'string';
            equal(render(template, context), '');

            context.arr = { b: 'orange' };
            equal(render(template, context), '');
        });

        it('should iterate over nested arrays', function(){
            template = '{for x in arr}{for y in x}{y.z}{/for}{/for}';

            equal(render(template, {}), '');

            context.arr =[
                [{ z: 1 }, { z: 2 }],
                [{ z: 3}]
            ];
            equal(render(template, context), '123');
        });

        it('should actuate negative block on empty arrays', function () {
            template = '{for x in arr}{x}{else}blah{/for}';

            equal(render(template, {}), 'blah');

            context.arr = [1, 2, 3];
            equal(render(template, context), '123');
        });

        it('should handle unsafe `x-y` style naming', function(){
            template = '{for x-y in foo-bar.arr-var}{x-y}{else}blah{/for}';

            equal(render(template, {}), 'blah');

            context = {'foo-bar': {'arr-var': [1,2,3]}};
            equal(render(template, context), '123');

            // loop var used above shouldn't populate the general context #22
            equal(context['x-y'], '');
        });
    });

    describe('Mixed', function(){
        var context = {
                foo:'bar',
                biz: ['bot', 'bit']
            };

        it('should handle mixed statements and loops', function(){
            equal(render('{if foo}{for x in biz}{foo}{x}{/for}{/if}', context), 'barbotbarbit');
            equal(render('{if biz}{for x in foo}{foo}{x}{/for}{/if}', context), 'barbbarabarr');
            equal(render('{if biz}{for x in foo}{foo}{x}{/for}{/if}', context), 'barbbarabarr');
            equal(render('{if foo}{foo}{else}blah{/if}', context), 'bar');
            equal(render('{if not foo}blah{else}{foo}{/if}', context), 'bar');
            equal(render('{for x in biz}{foo}{x}{else}blah{/for}', context), 'barbotbarbit');
        });

        it('should (try to) sanitize simple mess on mixed cases', function () {
            // stub `console.warn`
            var temp = console.warn,
                warnings = [];

            console.warn = function(message) {
                warnings.push(message);
            };

            equal(render('{for x in biz}{x}{if foo}{/for}{foo}{/if}', context), 'botbarbitbar');
            equal(warnings.shift(), "extra {/for} ignored");
            equal(warnings.shift(), "extra {for} closed");

            equal(render('{if foo}{for x in biz}{x}{/if}{foo}{/for}', context), 'botbarbitbar');
            equal(warnings.shift(), "extra {/if} ignored");
            equal(warnings.shift(), "extra {if} closed");

            equal(render('{if foo}{for x in biz}{x}{else}blah{/if}', context), 'botbit');
            equal(warnings.shift(), "extra {/if} ignored");
            equal(warnings.shift(), "extra {for} closed");
            equal(warnings.shift(), "extra {if} closed");

            equal(render('{else}{for x in biz}{x}{else}blah{else}bleh{/for}', context), 'botbit');
            equal(warnings.shift(), "extra {else} ignored");
            equal(warnings.shift(), "extra {else} ignored");

            // return to normal
            console.warn = temp;
        });
    });

});


// ----------------------



describe('Render files', function(){
    var root = __dirname + '/fixtures/',
        data = require(root + 'profile.json');

    it('should have Express compatible interface', function(){
        ok(daub['__express']);
        equal(typeof daub['__express'], 'function');
        equal(daub['__express'].length, 3);
    });

    it('should resolve nested partials over multiple directories', function(done){
        var output = read(root + 'full.html', 'utf8');

        // remove indentation
        output = output.replace(/(\n\s+)/g, '\n');

        renderFile(root + 'index.html', data, check);

            // html = html.replace(/\s+/g, ' ');
        function check(err, html){
            // remove indentation and multi-breaks
            html = html
                .replace(/(\n\s+)/g, '\n')
                .replace(/(\n+)/g, '\n');
            equal(html, output);
            done();
        }
    });

    it('should minify output on demand', function(done){
        var output = read(root + 'min.html', 'utf8');

        // remove trailing break
        output = output.slice(0, -1);

        data.compress = true;
        renderFile(root + 'index.html', data, check);

        function check(err, html){
            process.env.NODE_ENV = 'development';
            equal(html, output);
            done();
        }
    });

    it('should warn on delusional files', function(done){
        // stub `console.warn`
        var temp = console.warn,
            warnings = [];

        renderFile('./delusional', function(err, html){
            ok(err)
            ok(!html);

            done();
        });
    });
});
