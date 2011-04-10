var fs = require('fs'),
    smoosh = require('smoosh');

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