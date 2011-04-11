!function (context) {

  function aug(o, o2) {
    for (var k in o2) {
      o[k] = o2[k];
    }
  }

  function _$(s, r) {
    this.elements = $._select(s, r);
    this.length = this.elements.length;
    for (var i = 0; i < this.length; i++) {
      this[i] = this.elements[i];
    }
  }

  function $(s, r) {
    return new _$(s, r);
  }

  aug($, {
    ender: function (o, proto) {
      aug(proto ? _$.prototype : $, o);
    },
    _select: function () {
      return [];
    }
  });

  var old = context.$;
  $.noConflict = function () {
    context.$ = old;
    return this;
  };

  (typeof module !== 'undefined') && module.exports ?
    (module.exports = $) :
    (context.$ = $);

}(this);