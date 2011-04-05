Ender.js
--------
a small yet powerful JavaScript library composed of application agnostic opensource submodules wrapped in a slick intuitive interface. At only 6k Ender.js can help you build anything from small prototypes to providing a solid base for large-scale rich applications.
Inside Ender you get

  * a powerful [Class system](https://github.com/ded/klass)
  * a fast light-weight [selector engine](https://github.com/ded/qwery)
  * a dynamic [script and dependency loader](https://github.com/ded/script.js)
  * a solid [http request connection manager](https://github.com/ded/Reqwest)
  * an [element animator](https://github.com/ded/moshun)
  * and a core set of utilities provided by [underscore](http://documentcloud.github.com/underscore)

Examples
--------
<h3>DOM queries</h3>
    $('#boosh p').html('hello').css({
      color: 'red'
    });

<h3>Extending</h3>
    $.fn({
      color: function (c) {
        this.css({
          color: c
        });
        return this;
      }
    });

    $('#boosh a[rel~="bookmark"]').color('orange');

<h3>Classes</h3>
    var Person = $.klass(function (name) {
      this.name = name;
    })
      .methods({{
        walk: function () {}
      });
    var SuperHuman = Person.extend({
      walk: function () {
        this.supr();
        this.fly();
      },
      fly: function () {}
    });
    (new SuperHuman('bob')).walk();

<h3>AJAX</h3>
    $.ajax('path/to/html', function (resp) {
      $('#content').html(resp);
    });
    $.ajax({
      url: 'path/to/json',
      type: 'json',
      method: 'post',
      success: function (resp) {
        $('#content').html(resp.content);
      },
      failure: function () {}
    });

<h3>script loading</h3>
    $.script(['mod1.js', 'mod2.js'], 'base', function () {
      // script is ready
    });

    // event driven. listen for 'base' files to load
    $.script.ready('base', function () {

    });

<h3>Animation</h3>
    $('p').animate('opacity', {
      from: 0,
      to: 1,
      time: 300
    });

<h3>Utility</h3>
Utility methods provided by [underscore](http://documentcloud.github.com/underscore) are augmented onto the '$' object. Some basics are illustrated:

    $.map(['a', 'b', 'c'], function (letter) {
      return letter.toUpperCase();
    }); // => ['A', 'B', 'C']

    $.uniq(['a', 'b', 'b', 'c', 'a']); // => ['a', 'b', 'c']

<h3>No Conflict</h3>
    var ender = $.noConflict(); // return '$' back to its original owner
    ender('#boosh a.foo').each(fn);

The haps
--------
Ender.js pulls together the beauty of well-designed modular software and proves that git submodules can actually work. Thus if one part of the system goes bad or unmaintained, it can be replaced with another with minimal to zero changes to the wrapper (Ender). Furthermore if you want remove a feature out entirely (like for example, the animation utility), you can fork this repo and remove the appropriate submodule.

Building
--------
For those interested in contributing on the core wrapper itself. Here's the process. Assuming you have git already — *install [NodeJS](http://nodejs.org)* — then run the following commands in your workspace:

    git clone https://github.com/ded/Ender.js.git
    cd !$
    git submodule update --init
    make

License
-------
Ender.js (the wrapper) is licensed under MIT - copyright 2011 Dustin Diaz

For the individual submodules, see their respective individual licenses.