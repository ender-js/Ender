!function (context) {

  function aug(o, o2) {
    for (var k in o2) {
      o[k] = o2[k];
    }
  }

  function _$(s, r) {
    this.elements = $._select(s, r);
  };

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
  context.$ = $;

}(this);