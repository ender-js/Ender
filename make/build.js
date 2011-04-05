require('../build/smoosh').config({
  "JAVASCRIPT": {
    "DIST_DIR": "./",
    "ender": [
      "./src/copyright.js",
      "./build/klass/src/klass.js",
      "./build/qwery/src/qwery.js",
      "./build/moshun/src/moshun.js",
      "./build/reqwest/src/reqwest.js",
      "./build/script/src/script.js",
      "./build/underscore/underscore.js",
      "./src/ender.js"
    ]
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