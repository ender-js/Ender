!function () {
  var HALF_PI = Math.PI / 2;
  $.fn({
    anim: function (o, after) {
      var easing = $.isString(o.easing) ? easings[o.easing] : o.easing;
      o.easing = easing;
      this.animate(o, after);
      return this;
    }
  });
  var easings = {
    easeOutStrong: function (t) {
      return (t == 1) ? 1 : 1 - Math.pow(2, -10 * t);
    },

    easeOut: function (t) {
      return Math.sin(t * HALF_PI);
    },

    easeIn: function (t) {
      return t * t;
    },

    easeInStrong: function (t) {
      return (t == 0) ? 0 : Math.pow(2, 10 * (t - 1));
    },

    bounce: function (t) {
      if (t < (1 / 2.75))
      return 7.5625 * t * t;
      if (t < (2 / 2.75))
      return 7.5625 * (t-= (1.5 / 2.75)) * t + 0.75;
      if (t < (2.5 / 2.75))
      return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
      return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
    }
  };
}();