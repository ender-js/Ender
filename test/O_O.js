/*
 * O_O is a spy library
 * --------------------
 * LIBRARY METHODS: O_O(obj, 'methodName'), O_O.isSpy(fn), O_O.remove(fn), O_O.removeAll();
 * SPY METHODS: andCallThrough(), andReturn(val), andThrow(msg), andCallFake(fn)
 * PROPERTIES: wasCalled, callCount, argsForCall, calls, mostRecentCall.object, mostRecentCall.arguments
 *
 * by fat and ded; inspired by jasmine
 */

var spies = []
  , O_O = {

      init: function (identity) {
        this.identity = identity || 'unknown';
        this.fn = function () {};
        this._reset();
        return this;
      }

    , andCallThrough: function () {
        this.fn = this.originalValue;
        return this;
      }

    , andReturn: function (value) {
        this.fn = function() { return value; };
        return this;
      }

    , andThrow: function (msg) {
        this.fn = function() { throw msg; };
        return this;
      }

    , andCallFake: function (fn) {
        this.fn = fn;
        return this;
      }

    , _reset: function () {
        this.wasCalled = false;
        this.callCount = 0;
        this.argsForCall = [];
        this.calls = [];
        this.mostRecentCall = {};
        return this;
      }

    };

function spyOn(obj, methodName) {
  if (!obj) {
    throw "spyOn could not find an object to spy upon for " + methodName + "()";
  } else if (obj[methodName] === undefined) {
    throw methodName + '() method does not exist';
  } else if (obj[methodName] && isSpy(obj[methodName])) {
    throw new Error(methodName + ' has already been spied upon');
  }
  var o_o = Object.create(O_O);
  o_o.init(methodName);
  spies.push(o_o);
  o_o.baseObj = obj;
  o_o.methodName = methodName;
  o_o.originalValue = obj[methodName];
  obj[methodName] = function () {
    o_o.wasCalled = true;
    o_o.callCount = o_o.callCount++;
    o_o.mostRecentCall.object = this;
    o_o.mostRecentCall.args = arguments;
    o_o.argsForCall.push(arguments);
    o_o.calls.push({object: this, args: arguments});
    return o_o.fn.apply(this, arguments);
  };
  obj[methodName].__spyUID = spies.length - 1;
  return o_o;
};

function isSpy(fn) {
  return fn && fn.__spyUID != null;
}

function remove(fn) {
  var o_o = spies.splice(fn.__spyUID, 1)[0];
  o_o.baseObj[o_o.methodName] = o_o.originalValue;
};

function removeAll() {
  while(spies.length) {
    var o_o = spies.pop();
    o_o.baseObj[o_o.methodName] = o_o.originalValue;
  }
};

module.exports = spyOn;
module.exports.isSpy = isSpy;
module.exports.remove = removeAll;
module.exports.removeAll = removeAll;