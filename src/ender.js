!function (context) {

  function aug(o, o2) {
    for (var k in o2) {
      o[k] = o2[k];
    }
  }

  window._$ = function(s, r) {
    this.elements = $.select(s, r);
  };

  function $(s, r) {
    return new _$(s, r);
  }

  aug($, {
    augment: function (o, proto) {
      aug(proto ? _$.prototype : $, o);
    },
    select: function () {
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