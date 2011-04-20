module.exports = {

  overview: '\nMethods\n'.red +
    '-------\n' +
    '- build:\n'.yellow +
    '  + accepts multiple npm packages to build into ender library\n' +
    '  + example: $ ender build domready,qwery,bean\n' +
    '  + note: alternatively you can specify the -b flag\n' +
    '\n' +
    '- just:\n'.yellow +
    '  + accepts multiple npm packages to build into ender library + cleans up node_modules folder after its finished\n' +
    '  + example: $ ender build domready,qwery,bean\n' +
    '  + note: alternatively you can specify the -b flag\n' +
    '\n' +
    '- async:\n'.yellow +
    '  + creates an asyncronously loaded ender library (automatically includes scriptjs for loading)\n' +
    '  + example: $ ender async domready,qwery,bean\n' +
    '  + note: alternatively you can specify the -a flag\n\n' +
    'General Help\n'.red +
    '------------\n' +
    'If you get stuck please visit ' + 'http://github.com/ender-js/Ender'.yellow + ' and file an issue.\n\n' +
    'You may also want to consider @messaging ' + '@fat'.yellow + ' or ' + '@ded'.yellow + ' on twitter directly\n'

}