//NOTE -- to run spec you must: $ npm install sink-test
var spec = require('sink-test')
  , sink = spec.sink
  , ender = require('../lib/ender')
  , O_O = require('./O_O')
  , path = require('path')
  , sys = require('sys')
  , fs = require('fs');


sink('ENDER - DEPENDENCIES', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender build jeesh', 5, function () {
    var cmd = 'ender build jeesh';
    ender.exec(cmd, null, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp(cmd).test(data), 'includes correct build command in comment');
        ok(/domReady =/.test(data), 'domready was built into ender');
        ok(/bonzo =/.test(data), 'bonzo was built into ender');
      });
    });
  });

  test('exec: ender build backbone underscore', 5, function () {
    var cmd = 'ender build backbone underscore';
    ender.exec(cmd, null, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp(cmd).test(data), 'includes correct build command in comment');
        ok(data.match(/http:\/\/documentcloud.github.com\/backbone/g).length == 1, 'backbone was built into ender');
        ok(data.match(/http:\/\/documentcloud.github.com\/underscore/g).length == 1, 'undersore was built into ender');
      });
    });
  });

});

sink('ENDER - BUILD', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender build domready', 6, function () {
    var cmd = 'ender build domready';
    ender.exec(cmd, null, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      path.exists('./node_modules/domready', function (exists) {
        ok(exists, 'domready was installed');
      });
      path.exists('./node_modules/ender-js', function (exists) {
        ok(exists, 'ender-js was installed');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp(cmd).test(data), 'includes correct build command in comment');
        ok(/domReady =/.test(data), 'domready was built into ender');
      });
    });
  });

  test('exec: ender -b domready', 2, function () {
    O_O(ender, 'build').andCallFake(function (packages) {
      ok(true, 'build was called');
      ok(packages.length == 1 && packages[0] == 'domready', 'correct packages passed');
    });
    ender.exec('ender -b domready');
  });

});


sink('ENDER - ADD', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender add qwery', 4, function () {
    ender.exec('ender add qwery', null, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      path.exists('./node_modules/qwery', function (exists) {
        ok(exists, 'qwery was installed');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp('ender build domready qwery').test(data), 'includes correct build command in comment');
      });
    });
  });
});


sink('ENDER - REMOVE', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender remove qwery', 3, function () {
    ender.exec('ender remove qwery', null, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp('ender build domready').test(data), 'includes correct build command in comment');
      });
    });
  });
});

sink('ENDER - SET', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender set qwery@1.1.0', 6, function () {
    ender.exec('ender build qwery@1.1.1', null, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp('qwery@1.1.1').test(data), 'includes correct version in comment');
      });
      ender.exec('ender set qwery@1.1.0', null, function () {
        path.exists('./ender.js', function (exists) {
          ok(exists, 'ender.js was created');
        });
        path.exists('./ender.min.js', function (exists) {
          ok(exists, 'ender.min.js was created');
        });
        fs.readFile('./ender.js', 'utf-8', function (err, data) {
          if (err) ok(false, 'error reading ender.js');
          ok(new RegExp('qwery@1.1.0').test(data), 'includes correct version in comment');
        });
      });
    });
  });
});

 sink('ENDER - INFO', function (test, ok, before, after) {
  var NPM;

  before(function () {
    NPM = require('../lib/ender.npm');
    O_O(NPM, 'desc').andCallFake(function (k, o, fn) {
      fn(k, '');
    });
  });

  after(function () {
    O_O.removeAll();
  });

  test('dependency display 1', 2, function () {
    var i = 0;

    O_O(NPM, 'log').andCallFake(function (str) {
      i++;
      if (i === 1)      ok ('├── ' + 'foo'.yellow == str, str);
      else if (i === 2) ok ('└── ' + 'bar'.yellow == str, str);
    });

    var tree = {
      foo: 0,
      bar: 0
    }

    NPM.prettyPrintDependencies(tree);

  });

  test('dependency display 2', 4, function () {
    var i = 0
      , tree = {
          foo: 0,
          bar: {
            baz: 0,
            bang: 0
          }
        }

    O_O(NPM, 'log').andCallFake(function (str) {
      i++;
      if (i === 1)      ok ('├── ' + 'foo'.yellow == str, str + ' was output');
      else if (i === 2) ok ('└─┬ ' + 'bar'.yellow == str, str + ' was output');
      else if (i === 3) ok ('  ├── ' + 'baz'.yellow == str, str + ' was output');
      else if (i === 4) ok ('  └── ' + 'bang'.yellow == str, str + ' was output');
    });

    NPM.prettyPrintDependencies(tree);

  });

  test('dependency display 3', 5, function () {
    var i = 0
      , tree = {
          foo: 0,
          bar: {
            baz: 0,
            bang: 0
          },
          fat: 0
        }

    O_O(NPM, 'log').andCallFake(function (str) {
      i++;
      if (i === 1)      ok ('├── ' + 'foo'.yellow == str, '├── foo was output');
      else if (i === 2) ok ('├─┬ ' + 'bar'.yellow == str, '├─┬ bar was output');
      else if (i === 3) ok ('| ├── ' + 'baz'.yellow == str, '| ├── baz was output');
      else if (i === 4) ok ('| └── ' + 'bang'.yellow == str, '| └── bang was output');
      else if (i === 5) ok ('└── ' + 'fat'.yellow == str, '└── fat was output');
    });

    NPM.prettyPrintDependencies(tree);

  });

  test('dependency display 4', 8, function () {
    var i = 0
      , tree = {
          foo: 0,
          bar: {
            baz: {
              blip: 0
            },
            bang: {
              ded: 0,
              killface: 0
            }
          },
          fat: 0
        }

    O_O(NPM, 'log').andCallFake(function (str) {
      i++;
      if (i === 1)      ok ('├── ' + 'foo'.yellow == str, str + ' was output');
      else if (i === 2) ok ('├─┬ ' + 'bar'.yellow == str, str + ' was output');
      else if (i === 3) ok ('| ├─┬ ' + 'baz'.yellow == str, str + ' was output');
      else if (i === 4) ok ('| | └── ' + 'blip'.yellow == str, str + ' was output');
      else if (i === 5) ok ('| └─┬ ' + 'bang'.yellow == str, str + ' was output');
      else if (i === 6) ok ('|   ├── ' + 'ded'.yellow == str, str + ' was output');
      else if (i === 7) ok ('|   └── ' + 'killface'.yellow == str, str + ' was output');
      else if (i === 8) ok ('└── ' + 'fat'.yellow == str, str + ' was output');
    });

    NPM.prettyPrintDependencies(tree);

  });

});

spec.start();