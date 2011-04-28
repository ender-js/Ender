//NOTE -- to run spec you must: $ npm install sink-test
var spec = require('sink-test')
  , sink = spec.sink
  , ender = require('../lib/ender')
  , O_O = require('./O_O')
  , path = require('path')
  , fs = require('fs');

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

sink('ENDER - JUST', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender just domready', 5, function () {
    var cmd = 'ender just domready';
    ender.exec(cmd, null, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      path.exists('./node_modules', function (exists) {
        ok(!exists, 'node_modules dir was removed');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp(cmd).test(data), 'includes correct build command in comment');
        ok(/domReady =/.test(data), 'domready was built into ender');
      });
    });
  });

  test('exec: ender -j domready', 2, function () {
    O_O(ender, 'just').andCallFake(function (packages) {
      ok(true, 'just was called');
      ok(packages.length == 1 && packages[0] == 'domready', 'correct packages passed');
    });
    ender.exec('ender -j domready');
  });

});


sink('ENDER - ASYNC', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender async domready', 7, function () {
    var cmd = 'ender async domready';
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
        ok(/\$\.require/i.test(data), 'async require was built into ender');
        ok(/\$\.ready/i.test(data), 'async ready was built into ender');
      });
    });
  });

  test('exec: ender -a foo bar baz', 2, function () {
    O_O(ender, 'async').andCallFake(function (packages) {
      ok(true, 'async was called');
      ok(packages.length == 3 && packages[0] == 'foo' && packages[1] == 'bar' && packages[2] == 'baz', 'correct packages passed');
    });
    ender.exec('ender -a foo bar baz');
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
        ok(new RegExp('ender async domready qwery').test(data), 'includes correct build command in comment');
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
        ok(new RegExp('ender async domready').test(data), 'includes correct build command in comment');
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

spec.start();