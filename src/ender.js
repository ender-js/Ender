!function (context) {

  var Q = qwery.noConflict(),
      U = _.noConflict(),
      K = klass.noConflict(),
      A = emile;

  function aug(o, o2) {
    for (var k in o2) {
      Object.prototype.hasOwnProperty.call(o2, k) && (o[k] = o2[k]);
    }
  }

  function trim(s) {
    return s.replace(/(^\s*|\s*$)/g, '');
  }
  function camelToDash(s) {
    if (s.toUpperCase() === s) {
      return s;
    }
    return s.replace(/([a-zA-Z0-9])([A-Z])/g, function(m, m1, m2) {
      return (m1 + "-" + m2);
    }).toLowerCase();
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

  var animationProperties = {};
  U(['borderWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
      'borderTopWidth', 'bottom', 'borderRadius', 'fontSize', 'height', 'left', 'letterSpacing',
      'marginBottom', 'marginLeft', 'marginRight', 'marginTop',
      'maxHeight', 'maxWidth ', 'minHeight', 'minWidth', 'outlineOffset',
      'outlineWidth', 'paddingBottom', 'paddingLeft', 'paddingRight',
      'paddingTop', 'right', 'textIndent', 'top', 'width', 'wordSpacing'])
    .each(function (prop) {
      animationProperties[prop] = 1;
    });

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

      serialize: function (o, modify) {
        return U(o).map(function (v, k) {
          var kv = modify ? modify(k, v) : [k, v];
          return kv[0] + ':' + kv[1] + ';';
        }).join('');
      },

      animate: function (o, after) {
        var opts = {
          duration: o.duration,
          easing: o.easing
        };
        delete o.duration;
        delete o.easing;
        var serial = this.serialize(o, function (k, v) {
          return (k in animationProperties) && /\d+$/.test(v) ?
            [camelToDash(k), v + 'px'] :
            [k, v];
        });
        this.each(function (el) {
          A(el, serial, opts, after);
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
          this.hasClass(el, c) || (el.className = trim(el.className + ' ' + c));
        });
        return this;
      },

      removeClass: function (c) {
        this.each(function (el) {
          this.hasClass(el, c) && (el.className = trim(el.className.replace(classReg(c), ' ')));
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

  var old = context.$;
  $.noConflict = function () {
    context.$ = old;
    return this;
  };
  context.$ = $;

}(this);