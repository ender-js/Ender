/*COMMAND METHODS*/
var ENDER = {
  util: require('./ender.util')
}

module.exports = {

    process: function (cmd, callback) {
      var cmdOptions = typeof cmd == 'string' ? cmd.split(' ').slice(1) : cmd.slice(2)
        , type = cmdOptions.shift()
        , options = {}
        , context = ''
        , option
        , value
        , size
        , opts
        , i
        , j
        , l

      for (i = cmdOptions.length; i--;) {
        option = cmdOptions[i]
        size = 0
        if (option == '-o' || option == '--output') {
          option = 'output'
          value = cmdOptions[i + 1] && cmdOptions[i + 1].replace(/\.js$/, '')
          size = 2
        } else if (option == '--use' || option == '-u') {
          option = 'use'
          value = cmdOptions[i + 1] && cmdOptions[i + 1].replace(/\.js$/, '')
          size = 2
        } else if (option == '--max') {
          option = 'max'
          value = cmdOptions[i + 1]
          size = 2
        } else if (option == '--sandbox') {
          option = 'sandbox'
          opts = cmdOptions.slice(i + 1)
          for (j = 0, l = opts.length; j < l; j++) {
             if (!opts[j].indexOf('-')) break
          }
          value = opts.splice(0, j)
          size = 1 + value.length
        } else if (option == '--noop' || option == '-x'){
          option = 'noop'
          value = true
          size = 1
        } else if (option == '--silent' || option == '-s') {
          option = 'silent'
          value = true
          size = 1
        } else if (option == '--help') {
          option = 'help'
          value = true
          size = 1
        } else if (option == '--sans') {
          option = 'sans'
          value = true
          size = 1
        } else if (option == '--debug') {
          option = 'debug'
          value = true
          size = 1
        }

        if (size) {
          options[option] = value
          cmdOptions.splice(i, size)
        }
      }

      for (i in options) {
        context += ' --' + i + (typeof options[i] == 'string' ? ' ' + options[i] : '')
      }

      if (context) {
        options.context = context
      }

      type = type ? type.toLowerCase() : 'help'

      if (/\-v/.test(type)) {
        type = 'version'
      }

      cmdOptions = cmdOptions.join(',').replace(/\,(?=\,)/g,'').split(',').filter(function(x){ return x !== '' })

      callback(null, type, cmdOptions, options)
    }

  , normalize: function (packages) {
      return ENDER.util.reject(packages, ['ender-js'])
    }

  , getContext: function (type, packages, options) {
      packages = this.normalize(packages)
      return [type].concat(packages).join(' ') + (options || '')
    }

}
