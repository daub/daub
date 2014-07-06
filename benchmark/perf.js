var fs   = require('fs'),
    path = require('path');

var Benchmark = require('benchmark');

var Hogan       = require('hogan.js'),
    Handlebars  = require('handlebars'),
    Underscore  = require('underscore'),
    Ejs         = require('ejs'),
    Whiskers    = require('whiskers'),
    Decanat     = require('..');

var readdir  = fs.readdirSync,
    readfile = fs.readFileSync;

Benchmark.Suite.options = {
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

var dir  = path.join(__dirname, './fixtures/complete'),
    ctx  = require(dir),
    tpls = fixtures(dir);

var suiteCompile = new Benchmark.Suite('Compile'),
    suiteRender  = new Benchmark.Suite('Render');

var compiledHogan,
    compiledHandlebars,
    compiledWhiskers,
    compiledDecanat,
    compiledUnderscore,
    compiledEjs;

suiteCompile
    .add('Hogan', function(){
        compiledHogan = Hogan.compile(tpls.mustache);
    })
    .add('Handlebars', function(){
        compiledHandlebars = Handlebars.compile(tpls.mustache);
    })
    .add('Whiskers', function(){
        compiledWhiskers = Whiskers.compile(tpls.whiskers);
    })
    .add('Decanat', function(){
        compiledDecanat = Decanat.compile(tpls.whiskers);
    })
    .add('Underscore', function(){
        compiledUnderscore = Underscore.template(tpls.micro);
    })
    .add('Ejs', function(){
        compiledEjs = Ejs.compile(tpls.micro);
    })
    .run();

suiteRender
    .add('Hogan', function(){
        compiledHogan.render(ctx);
    })
    .add('Handlebars', function(){
        compiledHandlebars(ctx);
    })
    .add('Whiskers', function(){
        compiledWhiskers(ctx);
    })
    .add('Decanat', function(){
        compiledDecanat(ctx);
    })
    .add('Underscore', function(){
        compiledUnderscore(ctx);
    })
    .add('Ejs', function(){
        compiledEjs(ctx);
    })
    .run();


function fixtures(dir) {
    return readdir(dir).reduce(function(store, filename){
        if (filename == 'index.js')
            return store;
        store[filename] = readfile(path.join(dir, filename), 'utf8');
        return store;
    }, {});
}

