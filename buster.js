var config = module.exports

config['unit'] = {
    environment: 'node'
  , tests: [ 'test/unit/*-test.js' ]
  , libs: [ 'test/common.js' ]
}

config['integration'] = {
    environment: 'node'
  , tests: [ 'test/integration/*-test.js' ]
  , libs: [ 'test/common.js' ]
}

config['functional'] = {
    environment: 'node'
  , tests: [ 'test/functional/*-test.js' ]
  , libs: [ 'test/common.js' ]
}