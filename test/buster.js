var config = module.exports

config['unit'] = {
    environment: 'node'
  , tests: [ 'unit/*-test.js' ]
  , libs: [ './common.js' ]
}

config['integration'] = {
    environment: 'node'
  , tests: [ 'integration/*-test.js' ]
}
