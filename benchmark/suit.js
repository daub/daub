var fs   = require('fs'),
    path = require('path');

var Benchmark = require('benchmark');

var Mustache    = require('mustache'),
    Handlebars  = require('handlebars'),
    Lodash      = require('lodash'),
    Underscore  = require('underscore'),
    Whiskers    = require('whiskers'),
    Decanat     = require('..');

var readdir  = fs.readdirSync,
    readfile = fs.readFileSync,
    joinpath = path.join;

// var fixtures = tests(joinpath(__dirname, './fixtures/'));


var options = {
        onStart: function(){
            console.log(this.name);
        },
        onCycle: function(e) {
            console.log(String(e.target));
            if (e.target.error)
                console.log(e.target.error);
        },
        onComplete: function(){
            console.log('Fastest is ' + this.filter('fastest').pluck('name'));
        }
    };


var suits = ['complete'];

suits.forEach(function(name){
    var dir  = joinpath(__dirname, './fixtures/', name),
        ctx  = require(dir),
        tpls = fixtures(dir);

    var suite = new Benchmark.Suite(name, options);

    suite
        .add('mustache', function(){
            Mustache.to_html(tpls.mustache, ctx);
        })
        .add('decanat', function(){
            Decanat(tpls.decanat, ctx);
        })
        .add('whiskers', function(){
            Whiskers.render(tpls.decanat, ctx);
        })
        .add('lodash', function(){
            Whiskers.render(tpls.decanat, ctx);
        })
        .add('underscore', function(){
            Underscore.template(tpls.micro, ctx)
        });

    suite.run();
});





// suite
//     .add('mustache', function() {
//         var view = { "foo": "Hello, World" };
//         var template = '<div id="foo">{{foo}}</div><div class="foo">';

//         Mustache.to_html(template, view);

//     })
//     .add('decanat', function() {

//         var view = { "foo": "Hello, World" };
//         var template = '<div id="foo">{foo}</div><div class="foo">';

//         Decanat(template, view);

//     })

//     .add('mustache complete', function(){
//         console.log(fixtures);
//         var data = fixtures.complete.data,
//             template = fixtures.complete.templates.mustache;


//         Mustache.to_html(template, data);
//     })

//     .add('mustache iterations', function() {

//         var view = {
//             "stooges": [
//                 "Moe",
//                 "Larry",
//                 "Curly"
//             ]
//         };
//         var template = '{{#stooges}}<b>{{name}}</b>{{/stooges}}';

//         Mustache.to_html(template, view);

//     })
//     .add('decanat iterations', function() {

//         var view = {
//             "stooges": [
//                 "Moe",
//                 "Larry",
//                 "Curly"
//             ]
//         };
//         var template = '{for stooge in stooges}<b class="stooges">{stooge}</b>{/for}';

//         Plates.bind(template, view);

//     })
//     .run(true);


// function tests(dir) {
//     return readdir(dir).reduce(function(store, test){
//         dir = joinpath(dir, test);

//         store.push({
//             title    : test,
//             data     : require(dir),
//             fixtures : fixtures(dir)
//         });

//         return store;
//     }, []);
// }

function fixtures(dir) {
    return readdir(dir).reduce(function(store, filename){
        if (filename == 'index.js')
            return store;
        store[filename] = readfile(path.join(dir, filename), 'utf8');
        return store;
    }, {});
}

