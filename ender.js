/*!
  * Ender.js: a small, powerful JavaScript library composed of application agnostic submodules
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * https://github.com/ded/Ender.js
  * License MIT
  */
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
/**
  * Klass.js - copyright @dedfat
  * version 1.0
  * https://github.com/ded/klass
  * Follow our software http://twitter.com/dedfat :)
  * MIT License
  */
!function (context, f) {
  var fnTest = /xyz/.test(function () {
    xyz;
    }) ? /\bsupr\b/ : /.*/,
      noop = function (){},
      proto = 'prototype',
      isFn = function (o) {
        return typeof o === f;
      };

  function klass(o) {
    return extend.call(typeof o == f ? o : noop, o, 1);
  }

  function wrap(k, fn, supr) {
    return function () {
      var tmp = this.supr;
      this.supr = supr[proto][k];
      var ret = fn.apply(this, arguments);
      this.supr = tmp;
      return ret;
    };
  }

  function process(what, o, supr) {
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        what[k] = typeof o[k] == f
          && typeof supr[proto][k] == f
          && fnTest.test(o[k])
          ? wrap(k, o[k], supr) : o[k];
      }
    }
  }

  function extend(o, fromSub) {
    noop[proto] = this[proto];
    var supr = this,
        prototype = new noop(),
        isFunction = typeof o == f,
        _constructor = isFunction ? o : this,
        _methods = isFunction ? {} : o,
        fn = function () {
          fromSub || isFn(o) && supr.apply(this, arguments);
          _constructor.apply(this, arguments);
          if (this.initialize) {
            this.initialize.apply(this, arguments);
          }
        };

    fn.methods = function (o) {
      process(prototype, o, supr);
      fn[proto] = prototype;
      return this;
    };

    fn.methods.call(fn, _methods).prototype.constructor = fn;

    fn.extend = arguments.callee;
    fn[proto].implement = fn.statics = function (o, optFn) {
      o = typeof o == 'string' ? (function () {
        var obj = {};
        obj[o] = optFn;
        return obj;
      }()) : o;
      process(this, o, supr);
      return this;
    };

    return fn;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = klass;
  } else {
    var old = context.klass;
    klass.noConflict = function () {
      context.klass = old;
      return this;
    };
    context.klass = klass;
  }

}(this, 'function');$.augment({
  klass: klass.noConflict()
});
/*!
  * qwery.js - copyright @dedfat
  * https://github.com/ded/qwery
  * Follow our software http://twitter.com/dedfat
  * MIT License
  */
!function (context, doc) {

  var c, i, j, k, l, m, o, p, r, v,
      el, node, len, found, classes, item, items, token, collection,
      id = /#([\w\-]+)/,
      clas = /\.[\w\-]+/g,
      idOnly = /^#([\w\-]+$)/,
      classOnly = /^\.([\w\-]+)$/,
      tagOnly = /^([\w\-]+)$/,
      tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/,
      html = doc.documentElement,
      tokenizr = /\s(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\])/,
      simple = /^([a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/,
      attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/,
      chunker = new RegExp(simple.source + '(' + attr.source + ')?');

  function array(ar) {
    r = [];
    for (i = 0, len = ar.length; i < len; i++) {
      r[i] = ar[i];
    }
    return r;
  }

  var cache = function () {
    this.c = {};
  };
  cache.prototype = {
    g: function (k) {
      return this.c[k] || undefined;
    },
    s: function (k, v) {
      this.c[k] = v;
      return v;
    }
  };

  var classCache = new cache(),
      cleanCache = new cache(),
      attrCache = new cache(),
      tokenCache = new cache();

  function q(query) {
    return query.match(chunker);
  }

  function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value) {
    var m, c, k;
    if (tag && this.tagName.toLowerCase() !== tag) {
      return false;
    }
    if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) {
      return false;
    }
    if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
      for (i = classes.length; i--;) {
        c = classes[i].slice(1);
        if (!(classCache.g(c) || classCache.s(c, new RegExp('(^|\\s+)' + c + '(\\s+|$)'))).test(this.className)) {
          return false;
        }
      }
    }
    if (wholeAttribute && !value) {
      o = this.attributes;
      for (k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
          return this;
        }
      }
    }
    if (wholeAttribute && !checkAttr(qualifier, this.getAttribute(attribute) || '', value)) {
      return false;
    }
    return this;
  }

  function loopAll(tokens) {
    var r = [], token = tokens.pop(), intr = q(token), tag = intr[1] || '*', i, l, els,
        root = tokens.length && (m = tokens[0].match(idOnly)) ? doc.getElementById(m[1]) : doc;
    if (!root) {
      return r;
    }
    els = root.getElementsByTagName(tag);
    for (i = 0, l = els.length; i < l; i++) {
      el = els[i];
      if (item = interpret.apply(el, intr)) {
        r.push(item);
      }
    }
    return r;
  }

  function clean(s) {
    return cleanCache.g(s) || cleanCache.s(s, s.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, '\\$1'));
  }

  function checkAttr(qualify, actual, val) {
    switch (qualify) {
    case '=':
      return actual == val;
    case '^=':
      return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, new RegExp('^' + clean(val))));
    case '$=':
      return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, new RegExp(clean(val) + '$')));
    case '*=':
      return actual.match(attrCache.g(val) || attrCache.s(val, new RegExp(clean(val))));
    case '~=':
      return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, new RegExp('(?:^|\\s+)' + clean(val) + '(?:\\s+|$)')));
    case '|=':
      return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, new RegExp('^' + clean(val) + '(-|$)')));
    }
    return false;
  }

  function _qwery(selector) {
    var r = [], ret = [], i,
        tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr));
    tokens = tokens.slice(0);
    if (!tokens.length) {
      return r;
    }
    r = loopAll(tokens);
    if (!tokens.length) {
      return r;
    }
    // loop through all descendent tokens
    for (j = r.length, k = 0; j--;) {
      node = r[j];
      p = node;
      // loop through each token
      for (i = tokens.length; i--;) {
        z:
        while (p !== html && (p = p.parentNode)) { // loop through parent nodes
          if (found = interpret.apply(p, q(tokens[i]))) {
            break z;
          }
        }
      }
      found && (ret[k++] = node);
    }
    return ret;
  }

  var isAncestor = 'compareDocumentPosition' in html ?
    function (element, container) {
      return (container.compareDocumentPosition(element) & 16) == 16;
    } : 'contains' in html ?
    function (element, container) {
      return container !== element && container.contains(element);
    } :
    function (element, container) {
      while (element = element.parentNode) {
        if (element === container) {
          return 1;
        }
      }
      return 0;
    };

  function boilerPlate(selector, root) {
    if (m = selector.match(idOnly)) {
      return (el = doc.getElementById(m[1])) ? [el] : [];
    }
    if (m = selector.match(tagOnly)) {
      return array(root.getElementsByTagName(m[1]));
    }
    return false;
  }

  function qsa(selector, root) {
    root = (typeof root == 'string') ? qsa(root)[0] : (root || doc);
    if (!root) {
      return [];
    }
    if (m = boilerPlate(selector, root)) {
      return m;
    }
    if (doc.getElementsByClassName && (m = selector.match(classOnly))) {
      return array((root).getElementsByClassName(m[1]));
    }
    return array((root).querySelectorAll(selector));
  }

  function uniq(ar) {
    var a = [], i, j;
    label:
    for (i = 0; i < ar.length; i++) {
      for (j = 0; j < a.length; j++) {
        if (a[j] == ar[i]) {
          continue label;
        }
      }
      a[a.length] = ar[i];
    }
    return a;
  }

  var qwery = function () {
    // return fast. boosh.
    if (doc.querySelector && doc.querySelectorAll) {
      return qsa;
    }
    return function (selector, root) {
      root = (typeof root == 'string') ? qwery(root)[0] : (root || doc);
      if (!root) {
        return [];
      }
      var i, result = [], collections = [], element;
      if (m = boilerPlate(selector, root)) {
        return m;
      }
      if (m = selector.match(tagAndOrClass)) {
        items = root.getElementsByTagName(m[1] || '*');
        r = classCache.g(m[2]) || classCache.s(m[2], new RegExp('(^|\\s+)' + m[2] + '(\\s+|$)'));
        for (i = items.length, j = 0; i--;) {
          r.test(items[i].className) && (result[j++] = items[i]);
        }
        return result;
      }
      for (items = selector.split(','), i = items.length; i--;) {
        collections[i] = _qwery(items[i]);
      }
      for (i = collections.length; collection = collections[--i];) {
        var ret = collection;
        if (root !== doc) {
          ret = [];
          for (j = collection.length; element = collection[--j];) {
            // make sure element is a descendent of root
            isAncestor(element, root) && ret.push(element);
          }
        }
        result = result.concat(ret);
      }
      return uniq(result);
    };
  }();

  // being nice
  var oldQwery = context.qwery;
  qwery.noConflict = function () {
    context.qwery = oldQwery;
    return this;
  };
  context.qwery = qwery;

}(this, document);
$.select = qwery;
/*!
  * bonzo.js - copyright @dedfat 2011
  * https://github.com/ded/bonzo
  * Follow our software http://twitter.com/dedfat
  * MIT License
  */
!function (context) {

  var doc = document,
      html = (doc.compatMode == 'CSS1Compat') ?
        doc.documentElement :
        doc.body,
      specialAttributes = /^checked|value|selected$/,
      stateAttributes = /^checked|selected$/,
      ie = /msie/.test(navigator.userAgent);

  function classReg(c) {
    return new RegExp("(^|\\s+)" + c + "(\\s+|$)");
  }

  function each(ar, fn) {
    for (i = 0, len = ar.length; i < len; i++) {
      fn(ar[i]);
    }
  }

  function trim(s) {
    return s.replace(/(^\s*|\s*$)/g, '');
  }

  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase();
    });
  }

  function is(node) {
    return node && node.nodeName && node.nodeType == 1;
  }

  function some(ar, fn, scope) {
    for (var i = 0, j = ar.length; i < j; ++i) {
      if (fn.call(scope, ar[i], i, ar)) {
        return true;
      }
    }
    return false;
  }

  function _bonzo(elements) {
    this.elements = Object.prototype.hasOwnProperty.call(elements, 'length') ? elements : [elements];
  }

  _bonzo.prototype = {

    each: function (fn) {
      for (var i = 0; i  < this.elements.length; i++) {
        fn.call(this, this.elements[i]);
      }
      return this;
    },

    map: function (fn) {
      var m = [];
      for (var i = 0; i  < this.elements.length; i++) {
        m.push(fn.call(this, this.elements[i]));
      }
      return m;
    },

    html: function (html) {
      return typeof html == 'string' ?
        this.each(function (el) {
          el.innerHTML = html;
        }) :
        this.elements[0].innerHTML;
    },

    addClass: function (c) {
      return this.each(function (el) {
        this.hasClass(el, c) || (el.className = trim(el.className + ' ' + c));
      });
    },

    removeClass: function (c) {
      return this.each(function (el) {
        this.hasClass(el, c) && (el.className = trim(el.className.replace(classReg(c), ' ')));
      });
    },

    hasClass: function (el, c) {
      return typeof c == 'undefined' ?
        some(this.elements, function (i) {
          return classReg(el).test(i.className);
        }) :
        classReg(c).test(el.className);
    },

    show: function (elements) {
      return this.each(function (el) {
        el.style.display = '';
      });
    },

    hide: function (elements) {
      return this.each(function (el) {
        el.style.display = 'none';
      });
    },

    create: function (node) {
      return typeof node == 'string' ?
        function () {
          var el = doc.createElement('div'), els = [];
          el.innerHTML = node;
          var nodes = el.childNodes;
          el = el.firstChild;
          els.push(el);
          while (el = el.nextSibling) {
            (el.nodeType == 1) && els.push(el);
          }
          return els;

        }() : is(node) ? [node.cloneNode(true)] : [];
    },

    append: function (node) {
      return this.each(function (el) {
        each(this.create(node), function (i) {
          el.appendChild(i);
        });
      });
    },

    prepend: function (node) {
      return this.each(function (el) {
        var first = el.firstChild;
        each(this.create(node), function (i) {
          el.insertBefore(i, first);
        });
      });
    },

    before: function (node) {
      return this.each(function (el) {
        each(this.create(node), function (i) {
          el.parentNode.insertBefore(i, el);
        });
      });
    },

    after: function (node) {
      return this.each(function (el) {
        each(this.create(node), function (i) {
          el.parentNode.insertBefore(i, el.nextSibling);
        });
      });
    },

    css: function (o, v) {
      var fn = typeof o == 'string' ?
        function (el) {
          el.style[camelize(o)] = v;
        } :
        function (el) {
          for (var k in o) {
            o.hasOwnProperty(k) && (el.style[camelize(k)] = o[k]);
          }
        };
      return this.each(fn);
    },

    offset: function () {
      var el = this.elements[0];
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
    },

    attr: function (k, v) {
      var el = this.elements[0];
      return typeof v == 'undefined' ?
        specialAttributes.test(k) ?
          stateAttributes.test(k) && typeof el[k] == 'string' ?
            true : el[k] : el.getAttribute(k) :
        this.each(function (el) {
          el.setAttribute(k, v);
        });
    },

    remove: function () {
      this.each(function (el) {
        el.parentNode.removeChild(el);
      });
    },

    empty: function () {
      return this.each(function (el) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      });
    },

    detach: function () {
      return this.map(function (el) {
        return el.parentNode.removeChild(el);
      });
    }

  };

  function bonzo(els) {
    return new _bonzo(els);
  }

  bonzo.aug = function (o, target) {
    for (var k in o) {
      o.hasOwnProperty(k) && ((target || _bonzo.prototype)[k] = o[k]);
    }
  };

  bonzo.doc = function () {
    var w = html.scrollWidth,
        h = html.scrollHeight,
        vp = this.viewport();
    return {
      width: Math.max(w, vp.width),
      height: Math.max(h, vp.height)
    };
  };

  bonzo.viewport = function () {
    var h = self.innerHeight,
        w = self.innerWidth;
    ie && (h = html.clientHeight) && (w = html.clientWidth);
    return {
      width: w,
      height: h
    };
  };

  bonzo.contains = 'compareDocumentPosition' in html ?
    function (container, element) {
      return (container.compareDocumentPosition(element) & 16) == 16;
    } : 'contains' in html ?
    function (container, element) {
      return container !== element && container.contains(element);
    } :
    function (container, element) {
      while (element = element.parentNode) {
        if (element === container) {
          return true;
        }
      }
      return false;
    };

  var old = context.bonzo;
  bonzo.noConflict = function () {
    context.bonzo = old;
    return this;
  };
  context.bonzo = bonzo;

}(this);$.augment(bonzo);
$.augment(bonzo(), true);
bonzo.noConflict();
/*!
  * Boom. Ajax! Ever heard of it!?
  * copyright 2011 @dedfat
  * https://github.com/ded/reqwest
  * license MIT
  */
!function (context) {
  var twoHundo = /^20\d$/,
      xhr = ('XMLHttpRequest' in window) ?
        function () {
          return new XMLHttpRequest();
        } :
        function () {
          return new ActiveXObject('Microsoft.XMLHTTP');
        };

  function readyState(o, fn) {
    return function () {
      if (o && o.readyState == 4) {
        if (twoHundo.test(o.status)) {
          fn && typeof fn == 'function' ? fn(o) : fn.success(o);
        } else {
          fn && fn.error && fn.error(o);
        }
        fn && fn.complete && fn.complete(o);
      }
    };
  }

  function getRequest(o, fn) {
    var http = xhr();
    http.open(o.method || 'GET', typeof o == 'string' ? o : o.url, true);
    http.onreadystatechange = readyState(http, fn || o);
    http.send(o.data || null);
    return http;
  }

  // would be cool if there was some fancy class system out there...
  function Reqwest(o, fn) {
    var type = o.type || 'js';
    function success(resp) {
      var r = resp.responseText,
          val = /json$/i.test(type) ? JSON.parse(r) : r;
      /^js$/i.test(type) && eval(r);
      fn && typeof fn == 'function' ? fn(o) : o.success(val);
    }
    this.request = getRequest(o, success);
    this.retries = o.retries || 0;
  }

  Reqwest.prototype = {
    abort: function () {
      this.request.abort();
    },

    retry: function () {
      this.request.send(this.o.data || null);
    }
  };

  function reqwest(o, fn) {
    return new Reqwest(o, fn);
  }

  var oldJax = context.reqwest;
  reqwest.noConflict = function () {
    context.reqwest = oldJax;
    return this;
  };
  context.reqwest = reqwest;

}(this);$.augment({
  ajax: reqwest.noConflict()
});
/*!
  * emile.js (c) 2009 - 2011 Thomas Fuchs
  * Licensed under the terms of the MIT license.
  */
!function (context) {
  var parseEl = document.createElement('div'),
      prefixes = ["webkit", "Moz", "O"],
      j = 3,
      prefix,
      _prefix,
      d = /\d+$/,
      animationProperties = {},
      baseProps = 'backgroundColor borderBottomColor borderLeftColor ' +
        'borderRightColor borderTopColor color fontWeight lineHeight ' +
        'opacity outlineColor zIndex',
      pixelProps = 'top bottom left right ' +
        'borderWidth borderBottomWidth borderLeftWidth borderRightWidth borderTopWidth ' +
        'borderSpacing borderRadius ' +
        'marginBottom marginLeft marginRight marginTop ' +
        'width height ' +
        'maxHeight maxWidth minHeight minWidth ' +
        'paddingBottom paddingLeft paddingRight paddingTop ' +
        'fontSize wordSpacing textIndent letterSpacing ' +
        'outlineWidth outlineOffset',

      props = (baseProps + ' ' + pixelProps).split(' ');

  while (j--) {
    _prefix = prefixes[j];
    parseEl.style.cssText = "-" + _prefix.toLowerCase() + "-transition-property:opacity;";
    if (typeof parseEl.style[_prefix + "TransitionProperty"] != "undefined") {
      prefix = _prefix;
    }
  }
  var transitionEnd = /^w/.test(prefix) ? 'webkitTransitionEnd' : 'transitionend';
  for (var p = pixelProps.split(' '), i = p.length; i--;) {
    animationProperties[p[i]] = 1;
  }

  function map(o, fn, scope) {
    var a = [], i;
    for (i in o) {
      a.push(fn.call(scope, o[i], i, o));
    }
    return a;
  }

  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase();
    });
  }

  function serialize(o, modify) {
    return map(o, function (v, k) {
      var kv = modify ? modify(k, v) : [k, v];
      return kv[0] + ':' + kv[1] + ';';
    }).join('');
  }

  function camelToDash(s) {
    if (s.toUpperCase() === s) {
      return s;
    }
    return s.replace(/([a-zA-Z0-9])([A-Z])/g, function (m, m1, m2) {
      return (m1 + "-" + m2);
    }).toLowerCase();
  }

  function interpolate(source, target, pos) {
    return (source + (target - source) * pos).toFixed(3);
  }

  function s(str, p, c) {
    return str.substr(p, c || 1);
  }

  function color(source, target, pos) {
    var i = 2, j, c, tmp, v = [], r = [];
    while ((j = 3) && (c = arguments[i - 1]) && i--) {
      if (s(c, 0) == 'r') {
        c = c.match(/\d+/g);
        while (j--) {
          v.push(~~c[j]);
        }
      } else {
        if (c.length == 4) {
          c = '#' + s(c, 1) + s(c, 1) + s(c, 2) + s(c, 2) + s(c, 3) + s(c, 3);
        }
        while (j--) {
          v.push(parseInt(s(c, 1 + j * 2, 2), 16));
        }
      }
    }
    while (j--) {
      tmp = ~~(v[j + 3] + (v[j] - v[j + 3]) * pos);
      r.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp);
    }
    return 'rgb(' + r.join(',') + ')';
  }

  function parse(prop) {
    var p = parseFloat(prop), q = prop.replace(/^[\-\d\.]+/, '');
    return isNaN(p) ?
      { v: q,
        f: color,
        u: ''
      } :
      {
        v: p,
        f: interpolate,
        u: q
      };
  }

  function normalize(style) {
    var css, rules = {}, i = props.length, v;
    parseEl.innerHTML = '<div style="' + style + '"></div>';
    css = parseEl.childNodes[0].style;
    while (i--) {
      (v = css[props[i]]) && (rules[props[i]] = parse(v));
    }
    return rules;
  }

  function _emile(el, style, opts, after) {
    opts = opts || {};
    var target = normalize(style),
        comp = el.currentStyle ? el.currentStyle : getComputedStyle(el, null),
        current = {}, start = +new Date(), prop,
        dur = opts.duration || 200, finish = start + dur, interval,
        easing = opts.easing || function (pos) {
          return (-Math.cos(pos * Math.PI) / 2) + 0.5;
        };
    for (prop in target) {
      current[prop] = parse(comp[prop]);
    }
    interval = setInterval(function () {
      var time = +new Date(), p, pos = time > finish ? 1 : (time - start) / dur;
      for (p in target) {
        el.style[p] = target[p].f(current[p].v, target[p].v, easing(pos)) + target[p].u;
      }
      if (time > finish) {
        clearInterval(interval);
        opts.after && opts.after();
        after && setTimeout(after, 1);
      }
    }, 10);
  }

  function nativeAnim(el, o, opts, after) {
    var props = [],
        styles = [],
        duration = opts.duration || 1000,
        easing = opts.easing || 'ease-out';
    duration = duration + 'ms';
    (opts.after || after) && el.addEventListener(transitionEnd, function f() {
      opts.after && opts.after();
      after && after();
      el.removeEventListener(transitionEnd, f, true);
    }, true);

    setTimeout(function () {
      var k;
      for (k in o) {
        o.hasOwnProperty(k) && props.push(camelToDash(k) + ' ' + duration + ' ' + easing);
      }
      props = props.join(',');
      el.style[prefix + 'Transition'] = props;
      for (k in o) {
        var v = (camelize(k) in animationProperties) && d.test(o[k]) ? o[k] + 'px' : o[k];
        o.hasOwnProperty(k) && (el.style[camelize(k)] = v);
      }
    }, 10);

  }

  function emile(el, o, after) {
    el = typeof el == 'string' ? document.getElementById(el) : el;
    var opts = {
      duration: o.duration,
      easing: o.easing,
      after: o.after
    };
    delete o.duration;
    delete o.easing;
    delete o.after;
    if (prefix && (typeof opts.easing !== 'function')) {
      return nativeAnim(el, o, opts, after);
    }
    var serial = serialize(o, function (k, v) {
      k = camelToDash(k);
      return (camelize(k) in animationProperties) && d.test(v) ?
        [k, v + 'px'] :
        [k, v];
    });
    _emile(el, serial, opts, after);
  }

  var old = context.emile;
  emile.noConflict = function () {
    context.emile = old;
    return this;
  };
  context.emile = emile;

}(this);
!function () {
  var e = emile.noConflict();
  $.augment({
    animate: function (o, after) {
      for (var i = 0; i < this.elements.length; i++) {
        e(this.elements[i], o, after);
      }
      return this;
    }
  }, true);
}();