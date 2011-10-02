var ENDER = {

      util: require('./ender.util')

    , docs: {

        build: '- build:\n'.yellow +
          '  + accepts multiple npm packages to build into ender library\n' +
          '  + example: $ ' + 'ender build domready qwery bean\n'.cyan +
          '  + note: alternatively you can specify the -b flag\n' +
          '  + options:\n'.red +
          '  - ' + '--sandbox'.yellow + ' (--sandbox) Prevents global leakage of ender lib variables. Passing additional arguments will define the specified packages directly on the window.\n' +
          '    + example: ' + '$ ender build jeesh backbone --sandbox backbone\n'.cyan +
          '  - ' + '--noop'.yellow + ' (--noop, -x) build without the ender-js client library\n' +
          '    + example: ' + '$ ender build mootools-class --noop\n'.cyan +
          '  - ' + '--output'.yellow + ' (--output, -o) out ender library to path with custom name\n' +
          '    + example: ' + '$ ender build mootools-class --output ../public/js/mootools.js\n'.cyan +
          '    + (above example would generate a mootools.js file as well as a mootools.min.js file in the ../public/js/ dir.)\n\n'

      , refresh: '- refresh:\n'.yellow +
          '  + refreshes the current build (reinstalls all packages)\n' +
          '  + example: $ ender refresh\n' +
          '  + options:\n'.red +
          '  - ' + '--use'.yellow + ' (--use, -u) target a specific ender package (without use, ender defaults to local ender.js || ender.min.js)\n' +
          '    + example: ' + '$ ender refresh -u ../public/js/mootools.js\n\n'.cyan

      , add: '- add:\n'.yellow +
          '  + adds a package to the current ender build\n' +
          '  + example: $ ender add underscore backbone\n' +
          '  + options:\n'.red +
          '  - ' + '--use'.yellow + ' (--use, -u) target a specific ender package (without use, ender defaults to local ender.js || ender.min.js)\n' +
          '    + example: ' + '$ ender add -u ../public/js/mootools.js\n\n'.cyan

      , remove: '- remove:\n'.yellow +
          '  + removes a package from the current ender build\n' +
          '  + example: $ ender remove underscore backbone\n' +
          '  + note: alternatively you can specify the -d flag ($ ender -d underscore backbone)\n' +
          '  + options:\n'.red +
          '  - ' + '--use'.yellow + ' (--use, -u) target a specific ender package (without use, ender defaults to local ender.js || ender.min.js)\n' +
          '    + example: ' + '$ ender remove -u ../public/js/mootools.js\n\n'.cyan

      , info: '- info:\n'.yellow +
          '  + gives you the status of the current ender build (including files size and package list)\n' +
          '  + example: $ ender info\n' +
          '  + note: alternatively you can specify the -i flag ($ ender -i underscore backbone)\n' +
          '  + options:\n'.red +
          '  - ' + '--use'.yellow + ' (--use, -u) target a specific ender package (without use, ender defaults to local ender.js || ender.min.js)\n' +
          '    + example: ' + '$ ender info -u ../public/js/mootools.js\n\n'.cyan

      , search: '- search:\n'.yellow +
          '  + searches NPM registry for provided keywords -- bubbles up ender compatible modules' +
          '  + example: ' + '$ ender search bean\n'.cyan +
          '  + options:\n'.red +
          '  - ' + '--max'.yellow + ' (--max) set a max number of search results to return (defaults to 8)\n' +
          '    + example: ' + '$ ender search selector engine --max 20\n\n'.cyan

      , compile: '- compile:\n'.yellow +
          '  + Allows you to compile your application along-side your ender installation using the Google Closure Compiler\n' +
          '  + example: ' + '$ ender compile header.js footer.js app.js\n\n'.cyan

      , overview: '\nMethods'.red + ' - for more info on any one method run ' + '$ ender method --help\n'.cyan +
          '----------------------------------------------------------------------\n' +

          '- build:\n'.yellow +
          '  + accepts multiple npm packages to build into ender library\n' +
          '  + example: ' + '$ ender build domready qwery bean\n'.cyan +

          '- refresh:\n'.yellow +
          '  + refreshes the current build (reinstalls all packages)\n' +
          '  + example: ' + '$ ender refresh\n'.cyan +

          '- add:\n'.yellow +
          '  + adds a package to the current ender build\n' +
          '  + example: ' + '$ ender add underscore backbone\n'.cyan +

          '- remove:\n'.yellow +
          '  + removes a package from the current ender build\n' +
          '  + example: '+ '$ ender remove underscore backbone\n'.cyan +

          '- info:\n'.yellow +
          '  + gives you the status of the current ender build (including files size and package list)\n' +
          '  + example: ' + '$ ender info\n'.cyan +

          '- search:\n'.yellow +
          '  + searches NPM registry for provided keywords -- bubbles up ender compatible modules\n' +
          '  + example: ' + '$ ender search selector engine\n'.cyan +

          '- compile:\n'.yellow +
          '  + Allows you to compile your application along-side your ender installation using the Google Closure Compiler\n' +
          '  + example: ' + '$ ender compile header.js footer.js app.js\n\n'.cyan +


          'General Help\n'.red +
          '------------\n' +
          'If you get stuck please visit ' + 'http://github.com/ender-js/Ender'.yellow + ' and file an issue.\n\n' +
          'You may also want to consider @messaging ' + '@fat'.yellow + ' or ' + '@ded'.yellow + ' on twitter directly\n'

        }
    }

module.exports = ENDER.util.merge(ENDER.docs, {

    'rm': ENDER.docs.remove

  , 'ls': ENDER.docs.info

  , 'list': ENDER.docs.info

});