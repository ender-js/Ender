var fs = require('fs'),
    smoosh = require('../build/smoosh'),
    exec = require('child_process').exec;

// the Dragon Army
var defaultLibs = [
  './build/qwery/',
  './build/bonzo/',
  './build/klass/',
  './build/reqwest/',
  './build/emile/',
  './build/script/'
  // './build/bean/', #awaiting release
  // './build/underscore/' #awaiting pull request
];


/*************************** secret build sauce ***************************/

var build = [
  "./src/copyright.js",
  "./src/ender.js"
];

var total = 0;
function done() {
  if (++total == libs.length) {
    make();
  }
}

libs.forEach(function (lib) {
  var config = require(lib);
  var main = config.main instanceof Array ? config.main : [config.main];
  var ender = fs.readFileSync(lib + config.ender, 'utf8');
  var files = main.map(function (file) {
    return fs.readFileSync(lib + file, 'utf8');
  }).join(' ');
  var out = files + ender;
  var file = './tmp/' + config.name + '.js';
  build.push(file);
  console.log('writing file ' + file);
  fs.writeFile(file, out, 'utf8', done);
});

function make(dist) {
  smoosh.config({
    "JAVASCRIPT": {
      "DIST_DIR": (dist || ("./"),
      "ender": build
    }
  }).build();
}


var terminal = function (args) {
  var flags;
  if (args[0][0] == '-') {
    flags = args[0].replace(/^\-/, '').split('');
  } else {
    flags = [args[0]];
  }

  flags.forEach(function(flag) {
    switch (flag) {
      case 'a':
        console.log(args[1]);
        // args[1];
        break;
      case 'b':
      case 'build':
        build(args[1]);
        break;
      default:
        // make(args[0]);
    }
  });
};
module.exports.terminal = terminal;