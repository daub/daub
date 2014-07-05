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
    readfile = fs.readFileSync;

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


(function(name)
    var dir  = path.join(__dirname, './fixtures/', name),
        ctx  = require(dir),
        tpls = fixtures(dir);

    var suite = new Benchmark.Suite(name, options);

    suite
        .add('mustache', function(){
            Mustache.to_html(tpls.mustache, ctx);
        })
        .add('decanat', function(){
            Decanat.render(tpls.decanat, ctx);
        })
        .add('underscore', function(){
            Underscore.template(tpls.micro, ctx)
        });

    suite.run();
})('complete');

function fixtures(dir) {
    return readdir(dir).reduce(function(store, filename){
        if (filename == 'index.js')
            return store;
        store[filename] = readfile(path.join(dir, filename), 'utf8');
        return store;
    }, {});
}

