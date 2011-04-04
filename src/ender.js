!function (context) {

  var Q = qwery.noConflict();

  function _$(s, r) {
    this.elements = Q(s, r);
  }

  function reg(c) {
    return new RegExp("(^|\\s)" + c + "(\\s|$)");
  }

  _$.prototype = {
    each: function (fn) {
      this.elements.forEach(fn, this);
      return this;
    },

    map: function (fn) {
      return this.elements.map(fn, this);
    },

    addClass: function (c) {
      this.each(function (el) {
        this.hasClass(el, c) || (el.className = $.trim(el.className + ' ' + c));
      });
      return this;
    },

    removeClass: function (c) {
      this.each(function (el) {
        this.hasClass(el, c) && (el.className = $.trim(el.className.replace(reg(c), ' ')));
      });
      return this;
    },

    hasClass: function (el, c) {
      return reg(c).test(el.className);
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
    }

  };

  function $(s, r) {
    return new _$(s, r);
  }

  $.trim = function (s) {
    return String.prototype.trim ? String.prototype.trim.call(s) : s.replace(/^\s+|\s+$/g, '');
  };

  $.ajax = reqwest.noConflict();
  $.klass = klass.noConflict();
  $.script = $script.noConflict();
  $.domReady = $.script.domReady;
  var old = $;
  $.noConflict = function () {
    context.$ = $;
    return this;
  };
  context.$ = $;

}(this);