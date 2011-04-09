var fs = require('fs'),
    smoosh = require('../build/smoosh'),
    exec = require('child_process').exec;

var libs = [
  './build/qwery/',
  './build/bonzo/',
  './build/klass/',
  './build/reqwest/',
  './build/emile/',
  './build/script/',
  './build/underscore/'
];



/*************************** secret build sauce ***************************/

var build = [
  "./src/copyright.js",
  "./src/ender.js"
];

exec('rm -f ./tmp/*');
var total = 0;
function done() {
  if (++total == libs.length) {
    make();
  }
}
libs.forEach(function (lib) {
  var config = JSON.parse(fs.readFileSync(lib + 'package.json', 'utf8'));
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

function make() {
  smoosh.config({
    "JAVASCRIPT": {
      "DIST_DIR": "./",
      "ender": build
    },
    "JSHINT_OPTS": {
      "boss": true,
      "forin": true,
      "curly": true,
      "debug": false,
      "devel": false,
      "evil": false,
      "regexp": false,
      "undef": false,
      "sub": false,
      "asi": false
    }
  }).run().build().analyze();
}