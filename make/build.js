var fs = require('fs'),
    exec = require('child_process').exec;
require('colors');

var build = [
  "./src/copyright.js",
  "./src/ender.js"
];

!function () {
  exec('rm ./tmp/*');
  var libs = [
    './build/klass/',
    './build/qwery/',
    './build/bonzo/',
    './build/reqwest/',
    './build/emile/',
    './build/script/',
    './build/underscore'
  ];
  libs.forEach(function (lib) {
    console.log('building the battle station'.rainbow);
    var config = JSON.parse(fs.readFileSync(lib + 'package.json', 'utf8'));
    var main = config.main instanceof Array ? config.main : [config.main];
    var ender = fs.readFileSync(lib + config.ender, 'utf8');
    var files = main.map(function (file) {
      return fs.readFileSync(lib + file, 'utf8');
    }).join(' ');
    var out = files + ender;
    var file = './tmp/' + config.name + '.js';
    build.push(file);
    fs.writeFileSync(file, out, 'utf8');
  });
}();

require('../build/smoosh').config({
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