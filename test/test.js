//NOTE -- to run spec you must: $ npm install sink-test
var spec = require('sink-test')
  , sink = spec.sink
  , ender = require('../lib/ender')
  , O_O = require('./O_O')
  , path = require('path')
  , fs = require('fs');

// don't allow timeouts!
sink.timeout = false;

// only output sink log statements
spec.setLogKey('$__sink::');

sink('ENDER - DEPENDENCIES', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender build jeesh', 5, function () {
    var cmd = 'ender build jeesh';
    ender.exec(cmd, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp(cmd).test(data), 'includes correct build command in comment');
        ok(/bean =/.test(data), 'bean was built into ender');
        ok(/bonzo =/.test(data), 'bonzo was built into ender');
      });
    });
  });

  test('exec: ender build backbone underscore', 5, function () {
    var cmd = 'ender build backbone underscore';
    ender.exec(cmd, function () {
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

  test('exec: ender build ender-json', 4, function () {
    var cmd = 'ender build ender-json';
    ender.exec(cmd, function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(new RegExp(cmd).test(data), 'includes correct build command in comment');
        ok(data.match(/Ender:[\s\S]*http:\/\/www\.JSON\.org\/json2\.js/g), 'ender-js was included before ender-json');
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
    ender.exec(cmd, function () {
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
        ok(/'domReady/.test(data), 'domready was built into ender');
      });
    });
  });

  test('exec: ender build domready', 2, function () {
    O_O(ender, 'build').andCallFake(function (packages) {
      ok(true, 'build was called');
      ok(packages.length == 1 && packages[0] == 'domready', 'correct packages passed');
    });
    ender.exec('ender build domready');
  });

});


sink('ENDER - ADD', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender add qwery', 4, function () {
    ender.exec('ender add qwery', function () {
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
    ender.exec('ender remove qwery', function () {
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
    ender.exec('ender build qwery@1.1.1', function () {
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
      ender.exec('ender set qwery@1.1.0', function () {
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

sink('ENDER - OUTPUT', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender build bean --output ./js/bean', 3, function () {
    fs.mkdir('./js', 0777, function () { //make js dir (swallow error if exists)
      ender.exec('ender build bean -o ./js/bean', function () {
        path.exists('./js/bean.js', function (exists) {
          ok(exists, 'ender.js was created');
        });
        path.exists('./js/bean.min.js', function (exists) {
          ok(exists, 'ender.min.js was created');
        });
        fs.readFile('./js/bean.js', 'utf-8', function (err, data) {
          if (err) ok(false, 'error reading ender.js');
          ok(new RegExp('--output ./js/bean').test(data), 'does not include ender-js');
        });
      });
    });
  });
});

sink('ENDER - NOOP', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  test('exec: ender build bean --noop', 3, function () {
    ender.exec('ender build bean --noop', function () {
      path.exists('./ender.js', function (exists) {
        ok(exists, 'ender.js was created');
      });
      path.exists('./ender.min.js', function (exists) {
        ok(exists, 'ender.min.js was created');
      });
      fs.readFile('./ender.js', 'utf-8', function (err, data) {
        if (err) ok(false, 'error reading ender.js');
        ok(!new RegExp('function ender').test(data), 'does not include ender-js');
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

    O_O(console, 'log').andCallFake(function (str) {
      if (/\$\_\_sink\:\:/.test(str)) return;
      i++;
      if (i === 1)      ok ('├── ' + 'foo'.yellow == str, str);
      else if (i === 2) ok ('└── ' + 'bar'.yellow == str, str);
    });

    var tree = {
      foo: 0,
      bar: 0
    }

    NPM.recurseOverDependencies(tree);

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

      O_O(console, 'log').andCallFake(function (str) {
        if (/\$\_\_sink\:\:/.test(str)) return;
        i++;
        if (i === 1)      ok ('├── ' + 'foo'.yellow == str, str + ' was output');
        else if (i === 2) ok ('└─┬ ' + 'bar'.yellow == str, str + ' was output');
        else if (i === 3) ok ('  ├── ' + 'baz'.yellow == str, str + ' was output');
        else if (i === 4) ok ('  └── ' + 'bang'.yellow == str, str + ' was output');
      });

      NPM.recurseOverDependencies(tree);

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

      O_O(console, 'log').andCallFake(function (str) {
        if (/\$\_\_sink\:\:/.test(str)) return;
        i++;
        if (i === 1)      ok ('├── ' + 'foo'.yellow == str, '├── foo was output');
        else if (i === 2) ok ('├─┬ ' + 'bar'.yellow == str, '├─┬ bar was output');
        else if (i === 3) ok ('| ├── ' + 'baz'.yellow == str, '| ├── baz was output');
        else if (i === 4) ok ('| └── ' + 'bang'.yellow == str, '| └── bang was output');
        else if (i === 5) ok ('└── ' + 'fat'.yellow == str, '└── fat was output');
      });

      NPM.recurseOverDependencies(tree);

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

      O_O(console, 'log').andCallFake(function (str) {
        if (/\$\_\_sink\:\:/.test(str)) return;
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

      NPM.recurseOverDependencies(tree);

    });
});

sink('ENDER - ORDERING & DEPENDENCY MANAGEMENT', function (test, ok, before, after) {

  after(function () {
    O_O.removeAll(); //clear all spies after each test
  });

  // the main purpose of this is to check ordering of modules & dependencies
  // with a secondary purpose to confirm that the build command in the context
  // stays correct through a build/add/remove/refresh cycle
  test('exec: ender build sel bonzo && ender add qwery && ender remove qwery && ender refresh'
    , 4 * 2 +   // verify files
      4 * 1 +   // build command check
      4     +   // checks for qwery
      4 * 5     // basic index checks
    , function () {

    var cmd = 'ender build sel bonzo'
      , indexes
      , findIndexes = function (data) {
          // look in the file for the modules, the first 3 should always exist
          indexes = {
              'es5': data.indexOf('provide("es5-basic", module.exports);')
            , 'sel': data.indexOf('provide("sel", module.exports);')
            , 'bonzo': data.indexOf('provide("bonzo", module.exports);')
            , 'underscore': data.indexOf('provide("underscore", module.exports);')
            , 'backbone': data.indexOf('provide("backbone", module.exports);')
          }
        }
      , verifyBasicIndexes = function () {
          // checking es4-basic, sel & bonzo get included after every exec
          ok(indexes.es5 > 0, 'es5-basic was built into ender')
          ok(indexes.sel > 0, 'sel was built into ender')
          ok(indexes.bonzo > 0, 'bonzo was built into ender')
          ok(indexes.es5 < indexes.sel, 'es5-basic was included before sel')
          ok(indexes.sel < indexes.bonzo, 'sel was included before bonzo')
        }
      , verifyBasicBuild = function (cmd, data) {
          // run after every exec, check the build command and very basic modules are included
          ok(new RegExp(cmd).test(data), 'includes correct build command in comment')
          findIndexes(data)
          verifyBasicIndexes()
        }
      , verifyFiles = function () {
          // verify that the files are there after each exec
          path.exists('./ender.js', function (exists) {
            ok(exists, 'ender.js was created')
          })
          path.exists('./ender.min.js', function (exists) {
            ok(exists, 'ender.min.js was created')
          })
        }

        //-----------------
        // EXEC 1: ender build sel bonzo
        // - should include es5-basic as a dependency before sel, then bonzo
        //-----------------
      , execBuild = function() {
          ender.exec(cmd, function () {
            verifyFiles()
            fs.readFile('./ender.js', 'utf-8', function (err, data) {
              if (err) ok(false, 'error reading ender.js')
              verifyBasicBuild(cmd, data)

              execAdd()
            })
          })
        }

        //-----------------
        // EXEC 2: ender add backbone
        // - should leave es5-basic, sel & bonzo and then add underscore
        //   before backbone at the end
        //-----------------
      , execAdd = function() {
          ender.exec('ender add backbone', function () {
            verifyFiles()

            fs.readFile('./ender.js', 'utf-8', function (err, data) {
              if (err) ok(false, 'error reading ender.js')
              verifyBasicBuild(cmd + ' backbone', data)
              // were did underscore & backbone added?
              ok(indexes.underscore > 0, 'underscore was built into ender')
              ok(indexes.backbone > 0, 'backbone was built into ender')
              ok(indexes.bonzo < indexes.underscore, 'underscore was included after bonzo')
              ok(indexes.underscore < indexes.backbone, 'backbone was included after underscore')

              execRemove()
            })
          })
        }

        //-----------------
        // EXEC 3: ender add backbone
        // - should remove both underscore and backbone and leave us where
        //   we began
        //-----------------
      , execRemove = function() {
          ender.exec('ender remove underscore', function () {
            verifyFiles()

            fs.readFile('./ender.js', 'utf-8', function (err, data) {
              if (err) ok(false, 'error reading ender.js')
              verifyBasicBuild(cmd, data)

              execRefresh()
            })
          })
        }

        //-----------------
        // EXEC 4: ender refresh
        // - should give us exactly the same output as in exec 1 & 3
        //-----------------
      , execRefresh = function () {
          ender.exec('ender refresh', function () {
            verifyFiles()

            fs.readFile('./ender.js', 'utf-8', function (err, data) {
              if (err) ok(false, 'error reading ender.js')
              verifyBasicBuild(cmd, data)
            })
          })
        }

     // run
     execBuild()
  })

})

spec.start();
