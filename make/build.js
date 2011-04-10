var fs = require('fs'),
    smoosh = require('smoosh'),
    exec = require('child_process').exec;
    require('colors');

var libs = JSON.parse(fs.readFileSync('./make/platoon.json', 'utf8')).platoon;


/*************************** secret build sauce below ***************************/




exec('rm -f ./tmp/*');

var out = '';
libs.forEach(function (lib) {
  var config = JSON.parse(fs.readFileSync('./build/' + lib + '/package.json', 'utf8'));
  var main = config.main instanceof Array ? config.main : [config.main];
  var ender = fs.readFileSync('./build/' + lib + '/' + config.ender, 'utf8');
  var files = main.map(function (file) {
    return fs.readFileSync('./build/' + lib + '/' + file, 'utf8');
  }).join(' ');
  out += files + ender;
});

console.log(('Building the Dragon Army with '.cyan) + ((libs.length).toString().red) + (' modules'.green));

fs.writeFile('./tmp/ender.js', out, 'utf8', function () {
  smoosh.config({
    "quiet": true,
    "JAVASCRIPT": {
      "DIST_DIR": "./",
      "ender": [
        "./src/copyright.js",
        "./src/ender.js",
        "./tmp/ender.js"
      ]
    }
  }).build();
});
