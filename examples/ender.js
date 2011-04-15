/*!
  * Ender.js: next-level JavaScript
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

}(this);/*!
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
    var r = [], ret = [], i, l,
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
    for (j = 0, l = r.length, k = 0; j < l; j++) {
      node = r[j];
      p = node;
      // loop through each token
      for (i = tokens.length; i--;) {
        z: // loop through parent nodes
        while (p !== html && (p = p.parentNode)) {
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

  function boilerPlate(selector, _root, fn) {
    var root = (typeof _root == 'string') ? fn(_root)[0] : (_root || doc);
    if (isNode(selector)) {
      return !_root || (isNode(root) && isAncestor(selector, root)) ? [selector] : [];
    }
    if (m = selector.match(idOnly)) {
      return (el = doc.getElementById(m[1])) ? [el] : [];
    }
    if (m = selector.match(tagOnly)) {
      return array(root.getElementsByTagName(m[1]));
    }
    return false;
  }

  function isNode(el) {
    return (el === window || el && el.nodeType && el.nodeType.toString().match(/[19]/));
  }

  function qsa(selector, _root) {
    var root = (typeof _root == 'string') ? qsa(_root)[0] : (_root || doc);
    if (!root) {
      return [];
    }
    if (m = boilerPlate(selector, _root, qsa)) {
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
    return function (selector, _root) {
      var root = (typeof _root == 'string') ? qwery(_root)[0] : (_root || doc);
      if (!root) {
        return [];
      }
      var i, l, result = [], collections = [], element;
      if (m = boilerPlate(selector, _root, qwery)) {
        return m;
      }
      if (m = selector.match(tagAndOrClass)) {
        items = root.getElementsByTagName(m[1] || '*');
        r = classCache.g(m[2]) || classCache.s(m[2], new RegExp('(^|\\s+)' + m[2] + '(\\s+|$)'));
        for (i = 0, l = items.length, j = 0; i < l; i++) {
          r.test(items[i].className) && (result[j++] = items[i]);
        }
        return result;
      }
      for (i = 0, items = selector.split(','), l = items.length; i < l; i++) {
        collections[i] = _qwery(items[i]);
      }
      for (i = 0, l = collections.length; i < l && (collection = collections[i]); i++) {
        var ret = collection;
        if (root !== doc) {
          ret = [];
          for (j = 0, m = collection.length; j < m && (element = collection[j]); j++) {
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
    this.elements = [];
    if (elements) {
      this.elements = Object.prototype.hasOwnProperty.call(elements, 'length') ? elements : [elements];
      this.length = this.elements.length;
      for (var i = 0; i < this.length; i++) {
        this[i] = this.elements[i];
      }
    }
  }

  _bonzo.prototype = {

    each: function (fn) {
      for (var i = 0; i  < this.elements.length; i++) {
        fn.call(this, this.elements[i]);
      }
      return this;
    },

    map: function (fn, include) {
      var m = [], n;
      for (var i = 0; i < this.elements.length; i++) {
        n = fn.call(this, this.elements[i]);
        include ? (include(n) && m.push(n)) : m.push(n);
      }
      return m;
    },

    first: function () {
      this.elements = [this.elements[0]];
      return this;
    },

    last: function () {
      this.elements = [this.elements[this.elements.length - 1]];
      return this;
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

    append: function (node) {
      return this.each(function (el) {
        each(bonzo.create(node), function (i) {
          el.appendChild(i);
        });
      });
    },

    prepend: function (node) {
      return this.each(function (el) {
        var first = el.firstChild;
        each(bonzo.create(node), function (i) {
          el.insertBefore(i, first);
        });
      });
    },

    appendTo: function (target) {
      return this.each(function (el) {
        target.appendChild(el);
      });
    },

    next: function () {
      return this.related('nextSibling');
    },

    previous: function () {
      return this.related('previousSibling');
    },

    related: function (method) {
      this.elements = this.map(
        function (el) {
          el = el[method];
          while (el && el.nodeType !== 1) {
            el = el[method];
          }
          return el || 0;
        },
        function (el) {
          return el;
        }
      );
      return this;
    },

    prependTo: function (target) {
      return this.each(function (el) {
        target.insertBefore(el, bonzo.firstChild(target));
      });
    },

    before: function (node) {
      return this.each(function (el) {
        each(bonzo.create(node), function (i) {
          el.parentNode.insertBefore(i, el);
        });
      });
    },

    after: function (node) {
      return this.each(function (el) {
        each(bonzo.create(node), function (i) {
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
      return this.each(function (el) {
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
    },

    scrollTop: function (y) {
      return scroll.call(this, null, y, 'y');
    },

    scrollLeft: function (x) {
      return scroll.call(this, x, null, 'x');
    }

  };

  function scroll(x, y, type) {
    var el = this.elements[0];
    if (x == null && y == null) {
      return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type];
    }
    if (isBody(el)) {
      window.scrollTo(x, y);
    } else {
      x != null && (el.scrollLeft = x);
      y != null && (el.scrollTop = y);
    }
    return this;
  }

  function isBody(element) {
    return element === window || (/^(?:body|html)$/i).test(element.tagName);
  }

  function getWindowScroll() {
    return { x: window.pageXOffset || html.scrollLeft, y: window.pageYOffset || html.scrollTop };
  }

  function bonzo(els) {
    return new _bonzo(els);
  }

  bonzo.aug = function (o, target) {
    for (var k in o) {
      o.hasOwnProperty(k) && ((target || _bonzo.prototype)[k] = o[k]);
    }
  };

  bonzo.create = function (node) {
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

  bonzo.firstChild = function (el) {
    for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
      if (c[i].nodeType === 1) {
        e = c[j = i];
      }
    }
    return e;
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

}(this);/*!
  * bean.js - copyright @dedfat
  * https://github.com/fat/bean
  * Follow our software http://twitter.com/dedfat
  * MIT License
  * special thanks to:
  * dean edwards: http://dean.edwards.name/
  * dperini: https://github.com/dperini/nwevents
  * the entire mootools team: github.com/mootools/mootools-core
  */
!function (context) {
  var __uid = 1, registry = {}, collected = {},
      overOut = /over|out/,
      namespace = /[^\.]*(?=\..*)\.|.*/,
      stripName = /\..*/,
      addEvent = 'addEventListener',
      attachEvent = 'attachEvent',
      removeEvent = 'removeEventListener',
      detachEvent = 'detachEvent';

  function isDescendant(parent, child) {
    var node = child.parentNode;
    while (node != null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
  }

  function retrieveEvents(element) {
    var uid = retrieveUid(element);
    return (registry[uid] = registry[uid] || {});
  }

  function retrieveUid(obj, uid) {
    return (obj.__uid = uid || obj.__uid || __uid++);
  }

  function listener(element, type, fn, add, custom) {
    if (element[addEvent]) {
      element[add ? addEvent : removeEvent](type, fn, false);
    } else if (element[attachEvent]) {
      custom && add && (element['_on' + custom] = element['_on' + custom] || 0);
      element[add ? attachEvent : detachEvent]('on' + type, fn);
    }
  }

  function nativeHandler(element, fn, args) {
    return function (event) {
      event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || context).event);
      return fn.apply(element, [event].concat(args));
    };
  }

  function customHandler(element, fn, type, condition, args) {
    return function (event) {
      if (condition ? condition.call(this, event) : event && event.propertyName == '_on' + type || !event) {
        fn.apply(element, [event].concat(args));
      }
    };
  }

  function addListener(element, orgType, fn, args) {
    var type = orgType.replace(stripName, ''), events = retrieveEvents(element),
        handlers = events[type] || (events[type] = {}),
        uid = retrieveUid(fn, orgType.replace(namespace, ''));
    if (handlers[uid]) {
      return element;
    }
    var custom = customEvents[type];
    fn = custom && custom.condition ? customHandler(element, fn, type, custom.condition) : fn;
    type = custom && custom.base || type;
    var isNative = context[addEvent] || nativeEvents.indexOf(type) > -1;
    fn = isNative ? nativeHandler(element, fn, args) : customHandler(element, fn, type, false, args);
    if (type == 'unload') {
      var org = fn;
      fn = function () {
        removeListener(element, type, fn) && org();
      };
    }
    listener(element, isNative ? type : 'propertychange', fn, true, !isNative && true);
    handlers[uid] = fn;
    fn.__uid = uid;
    return type == 'unload' ? element : (collected[retrieveUid(element)] = element);
  }

  function removeListener(element, orgType, handler) {
    var uid, names, uids, i, events = retrieveEvents(element), type = orgType.replace(stripName, '');
    if (!events || !events[type]) {
      return element;
    }
    names = orgType.replace(namespace, '');
    uids = names ? names.split('.') : [handler.__uid];
    for (i = uids.length; i--;) {
      uid = uids[i];
      handler = events[type][uid];
      delete events[type][uid];
      type = customEvents[type] ? customEvents[type].base : type;
      var isNative = element[addEvent] || nativeEvents.indexOf(type) > -1;
      listener(element, isNative ? type : 'propertychange', handler, false, !isNative && type);
    }
    return element;
  }

  function del(selector, fn, $) {
    return function (e) {
      var array = typeof selector == 'string' ? $(selector, this) : selector;
      for (var target = e.target; target && target != this; target = target.parentNode) {
        for (var i = array.length; i--;) {
          if (array[i] == target) {
            return fn.apply(target, arguments);
          }
        }
      }
    };
  }

  function add(element, events, fn, delfn, $) {
    if (typeof events == 'object' && !fn) {
      for (var type in events) {
        events.hasOwnProperty(type) && add(element, type, events[type]);
      }
    } else {
      var isDel = typeof fn == 'string', types = (isDel ? fn : events).split(' ');
      fn = isDel ? del(events, delfn, $) : fn;
      for (var i = types.length; i--;) {
        addListener(element, types[i], fn, Array.prototype.slice.call(arguments, isDel ? 4 : 3));
      }
    }
    return element;
  }

  function remove(element, orgEvents, fn) {
    var k, type, events,
        isString = typeof(orgEvents) == 'string',
        names = isString && orgEvents.replace(namespace, ''),
        rm = removeListener,
        attached = retrieveEvents(element);
    if (isString && /\s/.test(orgEvents)) {
      orgEvents = orgEvents.split(' ');
      var i = orgEvents.length - 1;
      while (remove(element, orgEvents[i]) && i--) {}
      return element;
    }
    events = isString ? orgEvents.replace(stripName, '') : orgEvents;
    if (!attached || (isString && !attached[events])) {
      return element;
    }
    if (typeof fn == 'function') {
      rm(element, events, fn);
    } else if (names) {
      rm(element, orgEvents);
    } else {
      rm = events ? rm : remove;
      type = isString && events;
      events = events ? (fn || attached[events] || events) : attached;
      for (k in events) {
        events.hasOwnProperty(k) && rm(element, type || k, events[k]);
      }
    }
    return element;
  }

  function fire(element, type) {
    var evt, k, i, types = type.split(' ');
    for (i = types.length; i--;) {
      type = types[i].replace(stripName, '');
      var isNative = nativeEvents.indexOf(type) > -1,
          isNamespace = types[i].replace(namespace, ''),
          handlers = retrieveEvents(element)[type];
      if (isNamespace) {
        isNamespace = isNamespace.split('.');
        for (k = isNamespace.length; k--;) {
          handlers[isNamespace[k]] && handlers[isNamespace[k]]();
        }
      } else if (element[addEvent]) {
        evt = document.createEvent(isNative ? "HTMLEvents" : "UIEvents");
        evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, context, 1);
        element.dispatchEvent(evt);
      } else if (element[attachEvent]) {
        isNative ? element.fireEvent('on' + type, document.createEventObject()) : element['_on' + type]++;
      } else {
        for (k in handlers) {
          handlers.hasOwnProperty(k) && handlers[k]();
        }
      }
    }
    return element;
  }

  function clone(element, from, type) {
    var events = retrieveEvents(from), obj, k;
    obj = type ? events[type] : events;
    for (k in obj) {
      obj.hasOwnProperty(k) && (type ? add : clone)(element, type || from, type ? obj[k] : k);
    }
    return element;
  }

  function fixEvent(e) {
    var result = {};
    if (!e) {
      return result;
    }
    var type = e.type, target = e.target || e.srcElement;
    result.preventDefault = e.preventDefault || fixEvent.preventDefault;
    result.stopPropagation = e.stopPropagation || fixEvent.stopPropagation;
    result.target = target && target.nodeType == 3 ? target.parentNode : target;
    if (type.indexOf('key') != -1) {
      result.keyCode = e.which || e.keyCode;
    } else if ((/click|mouse|menu/i).test(type)) {
      result.rightClick = e.which == 3 || e.button == 2;
      result.pos = { x: 0, y: 0 };
      if (e.pageX || e.pageY) {
        result.pos.x = e.pageX;
        result.pos.y = e.pageY;
      } else if (e.clientX || e.clientY) {
        result.pos.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        result.pos.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      overOut.test(type) && (result.relatedTarget = e.relatedTarget || e[(type == 'mouseover' ? 'from' : 'to') + 'Element']);
    }
    for (var k in e) {
      if (!(k in result)) {
        result[k] = e[k];
      }
    }
    return result;
  }
  fixEvent.preventDefault = function () {
    this.returnValue = false;
  };
  fixEvent.stopPropagation = function () {
    this.cancelBubble = true;
  };

  var nativeEvents = 'click,dblclick,mouseup,mousedown,contextmenu,' + //mouse buttons
    'mousewheel,DOMMouseScroll,' + //mouse wheel
    'mouseover,mouseout,mousemove,selectstart,selectend,' + //mouse movement
    'keydown,keypress,keyup,' + //keyboard
    'orientationchange,' + // mobile
    'touchstart,touchmove,touchend,touchcancel,' + // touch
    'gesturestart,gesturechange,gestureend,' + // gesture
    'focus,blur,change,reset,select,submit,' + //form elements
    'load,unload,beforeunload,resize,move,DOMContentLoaded,readystatechange,' + //window
    'error,abort,scroll'.split(','); //misc

  function check(event) {
    var related = event.relatedTarget;
    if (!related) {
      return related == null;
    }
    return (related != this && related.prefix != 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related));
  }

  var customEvents = {
    mouseenter: { base: 'mouseover', condition: check },
    mouseleave: { base: 'mouseout', condition: check },
    mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
  };

  var bean = { add: add, remove: remove, clone: clone, fire: fire };

  var clean = function (el) {
    var uid = remove(el).__uid;
    if (uid) {
      delete collected[uid];
      delete registry[uid];
    }
  };

  if (context[attachEvent]) {
    add(context, 'unload', function () {
      for (var k in collected) {
        collected.hasOwnProperty(k) && clean(collected[k]);
      }
      context.CollectGarbage && CollectGarbage();
    });
  }

  var oldBean = context.bean;
  bean.noConflict = function () {
    context.bean = oldBean;
    return this;
  };

  (typeof module !== 'undefined' && module.exports) ?
    (module.exports = bean) :
    (context.bean = bean);

}(this);!function () { var module = { exports: {} }; //     Underscore.js 1.1.5
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.1.5';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects implementing `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (_.isNumber(obj.length)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial && index === 0) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result = iterator.call(context, value, index, list)) return breaker;
    });
    return result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method ? value[method] : value).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return iterable;
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    var values = slice.call(arguments, 1);
    return _.filter(array, function(value){ return !_.include(values, value); });
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i=funcs.length-1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    return _.filter(_.keys(obj), function(key){ return _.isFunction(obj[key]); }).sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) obj[prop] = source[prop];
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) if (obj[prop] == null) obj[prop] = source[prop];
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();
 $.ender(module.exports); }();/**
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

}(this, 'function');/*!
  * $script.js v1.3
  * https://github.com/ded/script.js
  * Copyright: @ded & @fat - Dustin Diaz, Jacob Thornton 2011
  * Follow our software http://twitter.com/dedfat
  * License: MIT
  */

/*!
  * $script.js v1.3
  * https://github.com/ded/script.js
  * Copyright: @ded & @fat - Dustin Diaz, Jacob Thornton 2011
  * Follow our software http://twitter.com/dedfat
  * License: MIT
  */

!function(win, doc, timeout) {
  var script = doc.getElementsByTagName("script")[0],
      list = {}, ids = {}, delay = {}, re = /^i|c/,
      scripts = {}, s = 'string', f = false, i,
      push = 'push', domContentLoaded = 'DOMContentLoaded', readyState = 'readyState',
      addEventListener = 'addEventListener', onreadystatechange = 'onreadystatechange',
      every = function(ar, fn) {
        for (i = 0, j = ar.length; i < j; ++i) {
          if (!fn(ar[i])) {
            return 0;
          }
        }
        return 1;
      };
      function each(ar, fn) {
        every(ar, function(el) {
          return !fn(el);
        });
      }

  if (!doc[readyState] && doc[addEventListener]) {
    doc[addEventListener](domContentLoaded, function fn() {
      doc.removeEventListener(domContentLoaded, fn, f);
      doc[readyState] = "complete";
    }, f);
    doc[readyState] = "loading";
  }

  var $script = function(paths, idOrDone, optDone) {
    paths = paths[push] ? paths : [paths];
    var idOrDoneIsDone = idOrDone && idOrDone.call,
        done = idOrDoneIsDone ? idOrDone : optDone,
        id = idOrDoneIsDone ? paths.join('') : idOrDone,
        queue = paths.length;
        function loopFn(item) {
          return item.call ? item() : list[item];
        }
        function callback() {
          if (!--queue) {
            list[id] = 1;
            done && done();
            for (var dset in delay) {
              every(dset.split('|'), loopFn) && !each(delay[dset], loopFn) && (delay[dset] = []);
            }
          }
        }
    if (id && ids[id]) {
      return;
    }
    timeout(function() {
      each(paths, function(path) {
        if (scripts[path]) {
          return;
        }
        scripts[path] = 1;
        id && (ids[id] = 1);
        var el = doc.createElement("script"),
            loaded = 0;
        el.onload = el[onreadystatechange] = function () {
          if ((el[readyState] && !(!re.test(el[readyState]))) || loaded) {
            return;
          }
          el.onload = el[onreadystatechange] = null;
          loaded = 1;
          callback();
        };
        el.async = 1;
        el.src = path;
        script.parentNode.insertBefore(el, script);
      });
    }, 0);
    return $script;
  };

  $script.ready = function(deps, ready, req) {
    deps = deps[push] ? deps : [deps];
    var missing = [];
    !each(deps, function(dep) {
      list[dep] || missing[push](dep);
    }) && every(deps, function(dep) {
      return list[dep];
    }) ? ready() : !function(key) {
      delay[key] = delay[key] || [];
      delay[key][push](ready);
      req && req(missing);
    }(deps.join('|'));
    return $script;
  };

  var old = win.$script;
  $script.noConflict = function () {
    win.$script = old;
    return this;
  };

  (typeof module !== 'undefined' && module.exports) ?
    (module.exports = $script) :
    (win.$script = $script);

}(this, document, setTimeout);/*!
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

  function readyState(o, success, error) {
    return function () {
      if (o && o.readyState == 4) {
        if (twoHundo.test(o.status)) {
          success(o);
        } else {
          error(o);
        }
      }
    };
  }

  function getRequest(o, fn, err) {
    var http = xhr();
    http.open(o.method || 'GET', typeof o == 'string' ? o : o.url, true);
    http.onreadystatechange = readyState(http, fn, err);
    http.send(o.data || null);
    return http;
  }

  function Reqwest(o, fn) {
    var type = o.type || 'js';
    fn = fn || function () {};

    function complete(resp) {
      o.complete && o.complete(resp);
    }

    function success(resp) {
      var r = resp.responseText,
          val = /json$/i.test(type) ? JSON.parse(r) : r;
      /^js$/i.test(type) && eval(r);
      fn(o);
      o.success && o.success(val);
      complete(val);
    }
    function error(resp) {
      o.error && o.error(resp);
      complete(resp);
    }
    this.request = getRequest(o, success, error);
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

  var old = context.reqwest;
  reqwest.noConflict = function () {
    context.reqwest = old;
    return this;
  };
  context.reqwest = reqwest;

}(this);/*!
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
    var p = parseFloat(prop), q = prop ? prop.replace(/^[\-\d\.]+/, '') : prop;
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
$._select = qwery.noConflict();$.ender(bonzo);
$.ender(bonzo(), true);
bonzo.noConflict();!function () {
  var b = bean.noConflict(),
      integrate = function (method, type, method2) {
        var _args = type ? [type] : [];
        return function () {
          for (var args, i = 0, l = this.elements.length; i < l; i++) {
            args = [this.elements[i]].concat(_args, Array.prototype.slice.call(arguments, 0));
            args.length == 4 && args.push($);
            b[method].apply(this, args);
          }
          return this;
        };
      };

  var add = integrate('add'),
      remove = integrate('remove');

  var methods = {
    bind: add,
    listen: add,
    delegate: add,
    undelegate: remove,
    unbind: remove,
    unlisten: remove,
    trigger: integrate('fire'),
    cloneEvents: integrate('clone'),
    hover: function (enter, leave) {
      for (var i = 0, l = this.elements.length; i < l; i++) {
        b.add.call(this, this.elements[i], 'mouseenter', enter);
        b.add.call(this, this.elements[i], 'mouseleave', leave);
      }
      return this;
    }
  };

  var shortcuts = [
    'blur', 'change', 'click', 'dbltclick', 'error', 'focus', 'focusin',
    'focusout', 'keydown', 'keypress', 'keyup', 'load', 'mousedown',
    'mouseenter', 'mouseleave', 'mouseout', 'mouseover', 'mouseup',
    'resize', 'scroll', 'select', 'submit', 'unload'
  ];

  for (var i = shortcuts.length; i--;) {
    var shortcut = shortcuts[i];
    methods[shortcut] = integrate('add', shortcut);
  }

  $.ender(methods, true);
}();$.ender({
  klass: klass.noConflict()
});!function () {
  $.ender({
    script: $script.noConflict()
  });
}();!function () { var module = { exports: {} }; !function (doc) {
  var loaded = 0, fns = [], ol,
      testEl = doc.createElement('a'),
      domContentLoaded = 'DOMContentLoaded', readyState = 'readyState',
      onreadystatechange = 'onreadystatechange';

  if (!doc[readyState] && doc.addEventListener) {
    doc.addEventListener(domContentLoaded, function fn() {
      doc.removeEventListener(domContentLoaded, fn, false);
      doc[readyState] = "complete";
    }, f);
    doc[readyState] = "loading";
  }
  function again(fn) {
    setTimeout(function() {
      domReady(fn);
    }, 50);
  }

  testEl.doScroll && doc.attachEvent(onreadystatechange, (ol = function ol() {
    /^c/.test(doc[readyState]) &&
    (loaded = 1) &&
    !doc.detachEvent(onreadystatechange, ol) && !function () {
      for (var i = 0, l = fns.length; i < l; i++) {
        fns[i]();
      }
    }();
  }));

  var domReady = testEl.doScroll ?
    function (fn) {
      self != top ?
        !loaded ?
          fns.push(fn) :
          fn() :
        !function () {
          try {
            testEl.doScroll('left');
          } catch (e) {
            return again(fn);
          }
          fn();
        }();
    } :
    function (fn) {
      /^i|c/.test(doc[readyState]) ? fn() : again(fn);
    };

    (typeof module !== 'undefined') && module.exports ?
      (module.exports = {domReady: domReady}) :
      (window.domReady = domReady);

}(document); $.ender(module.exports); }();$.ender({
  ajax: reqwest.noConflict()
});!function () {
  var e = emile.noConflict();
  $.ender({
    animate: function (o, after) {
      for (var i = 0; i < this.elements.length; i++) {
        e(this.elements[i], o, after);
      }
      return this;
    }
  }, true);
}();