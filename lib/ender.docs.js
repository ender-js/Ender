module.exports = {

  overview: '\nMethods\n'.red +
    '-------\n' +
    '- build:\n'.yellow +
    '  + accepts multiple npm packages to build into ender library\n' +
    '  + example: $ ender build domready qwery bean\n' +
    '  + note: alternatively you can specify the -b flag\n' +
    '- just:\n'.yellow +
    '  + accepts multiple npm packages to build into ender library + cleans up node_modules folder after its finished\n' +
    '  + example: $ ender just domready qwery bean\n' +
    '  + note: alternatively you can specify the -j flag\n' +
    '- refresh:\n'.yellow +
    '  + refreshes the current build (reinstalls all packages)\n' +
    '  + example: $ ender refresh or $ ender .\n' +
    '- add:\n'.yellow +
    '  + adds a package to the current ender build\n' +
    '  + example: $ ender add underscore backbone\n' +
    '  + note: alternatively you can specify the + flag ($ ender + underscore backbone)\n' +
    '- remove:\n'.yellow +
    '  + removes a package from the current ender build\n' +
    '  + example: $ ender remove underscore backbone\n' +
    '  + note: alternatively you can specify the -d flag ($ ender -d underscore backbone)\n' +
    '- info:\n'.yellow +
    '  + gives you the status of the current ender build (including files size and package list)\n' +
    '  + example: $ ender info\n' +
    '  + note: alternatively you can specify the -i flag ($ ender -i underscore backbone)\n\n' +

    'General Help\n'.red +
    '------------\n' +
    'If you get stuck please visit ' + 'http://github.com/ender-js/Ender'.yellow + ' and file an issue.\n\n' +
    'You may also want to consider @messaging ' + '@fat'.yellow + ' or ' + '@ded'.yellow + ' on twitter directly\n'

}
