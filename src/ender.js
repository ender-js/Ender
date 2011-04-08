!function (context) {

  var Q = qwery.noConflict(),
      U = _.noConflict(),
      K = klass.noConflict(),
      A = emile.noConflict();

  function aug(o, o2) {
    for (var k in o2) {
      Object.prototype.hasOwnProperty.call(o2, k) && (o[k] = o2[k]);
    }
  }

  function trim(s) {
    return (typeof s.trim === "function") ? s.trim() : s.replace(/(^\s*|\s*$)/g, '');
  }

  var $ = function (s, r) {
    return new _$(s, r);
  };

  aug($, {
    trim: function (s) {
      return trim(s);
    },
    klass: K,
    ajax: reqwest.noConflict(),
    script: $script.noConflict(),
    fn: function (o) {
      _$.methods(o);
    }
  });

  aug($, U);

  var _$ = K(function (s, r) {
    this.elements = U.isElement(s) ? [s] : Q(s, r);
  })
    .methods({
      each: function (fn) {
        U.each(this.elements, fn, this);
        return this;
      },

      map: function (fn) {
        return U.map(this.elements, fn, this);
      },

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