!function (context) {

  var Q = qwery.noConflict(),
      K = klass.noConflict(),
      U = _.noConflict(),
      A = animate.noConflict();

  function aug(o, o2) {
    for (var k in o2) {
      o2.hasOwnProperty(k) && (o[k] = o2[k]);
    }
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

  function classReg(c) {
    return new RegExp("(^|\\s)" + c + "(\\s|$)");
  }

  var _$ = K(function (s, r) {
    this.elements = Q(s, r);
  })
    .methods({
      each: function (fn) {
        U.each(this.elements, fn, this);
        return this;
      },

      map: function (fn) {
        return U.map(this.elements, fn, this);
      },

      animate: function (prop, opts) {
        this.each(function (el) {
          A(el, prop, opts);
        });
        return this;
      },

      html: function (html) {
        this.each(function (el) {
          el.innerHTML = html;
        });
        return this;
      },

      addClass: function (c) {
        this.each(function (el) {
          this.hasClass(el, c) || (el.className = U.trim(el.className + ' ' + c));
        });
        return this;
      },

      removeClass: function (c) {
        this.each(function (el) {
          this.hasClass(el, c) && (el.className = U.trim(el.className.replace(classReg(c), ' ')));
        });
        return this;
      },

      hasClass: function (el, c) {
        return classReg(c).test(el.className);
      },

      show: function (elements) {
        this.each(function (el) {
          el.style.display = '';
        });
        return this;
      },

      hide: function (elements) {
        this.each(function (el) {
          el.style.display = 'none';
        });
        return this;
      },

      appendTo: function (node) {
        this.each(function (el) {
          node.appendChild(el);
        });
        return this;
      },

      append: function (node) {
        this.each(function (el) {
          el.appendChild(node);
        });
        return this;
      },

      after: function (node) {
        this.each(function (el) {
          node.parentNode.insertBefore(el, node.nextSibling);
        });
        return this;
      },

      css: function (o, v) {
        var fn = U.isString(o) ?
          function (el) {
            el.style[o] = v;
          } :
          function (el) {
            for (var k in o) {
              o.hasOwnProperty(k) && (el.style[k] = o[k]);
            }
          };
        this.each(fn);
        return this;
      },

      offset: function () {
        return this.map(function (el) {
          var width = el.offsetWidth;
          var height = el.offsetHeight;
          var top = el.offsetTop;
          var left = el.offsetLeft;
          while (el = el.offsetParent) {
            top = top + el.offsetTop;
            left = left + el.offsetLeft;
          }
          return {
            top: top,
            left: left,
            height: height,
            width: width
          };
        });
      }
    });

  var old = $;
  $.noConflict = function () {
    context.$ = $;
    return this;
  };
  context.$ = $;

}(this);