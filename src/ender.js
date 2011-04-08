!function (context) {

  var D = bonzo.noConflict(),
      U = _.noConflict(),
      K = klass.noConflict(),
      A = emile.noConflict(),
      Q = qwery.noConflict(),
      R = reqwest.noConflict(),
      S = $script.noConflict();


  function aug(o, o2) {
    for (var k in o2) {
      Object.prototype.hasOwnProperty.call(o2, k) && (o[k] = o2[k]);
    }
  }

  function trim(s) {
    return s.replace(/(^\s*|\s*$)/g, '');
  }

  function $(s, r) {
    return D(Q(s, r));
  }

  aug($, U);
  aug($, D);
  aug($, {
    trim: function (s) {
      return trim(s);
    },
    klass: K,
    ajax: R,
    script: S,
    fn: D.augment
  });

  $.fn({
    animate: function (o, after) {
      this.each(function (el) {
        A(el, o, after);
      });
      return this;
    }
  });

  var old = context.$;
  $.noConflict = function () {
    context.$ = old;
    return this;
  };
  context.$ = $;

}(this);