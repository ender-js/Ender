Ender.js
--------
a small yet powerful JavaScript library composed of application agnostic opensource submodules wrapped in a slick intuitive interface. At only 7k Ender.js can help you build anything from small prototypes to providing a solid base for large-scale rich applications.
Inside Ender you get

  * a powerful [Class system](https://github.com/ded/klass)
  * a fast light-weight [selector engine](https://github.com/ded/qwery)
  * a dynamic asynchronous [script and dependency loader](https://github.com/ded/script.js)
  * a solid [http request connection manager](https://github.com/ded/Reqwest)
  * a slick [element animator](https://github.com/ded/emile)
  * and a core set of utilities provided by [underscore](http://documentcloud.github.com/underscore)

Examples
--------
<h3>DOM queries</h3>

    $('#boosh p').html('hello').css({
      color: 'red',
      'text-decoration': 'underline'
    }).addClass('blamo');

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

    $('p').animate({
      opacity: 1,
      width: 300,
      color: '#ff0000',
      duration: 300,
      after: function () {
        console.log('done!');
      }
    });

<h3>Utility</h3>

Utility methods provided by [underscore](http://documentcloud.github.com/underscore) are augmented onto the '$' object. Some basics are illustrated:

    $.map(['a', 'b', 'c'], function (letter) {
      return letter.toUpperCase();
    }); // => ['A', 'B', 'C']

    $.uniq(['a', 'b', 'b', 'c', 'a']); // => ['a', 'b', 'c']

    $[65 other methods]()

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

Take special note that building with Ender will more than likely require frequently updating your submodules. Thus if you're unsure how this works, it's best to [read up on how submodules work](http://www.kernel.org/pub/software/scm/git/docs/git-submodule.html). However the simple answer is to get used to doing this:

    git pull
    git submodule update

Why all this?
-------------
Because in the browser - small, loosely coupled modules are the future, and large, tightly-bound monolithic libraries are the past.

License
-------
Ender.js (the wrapper) is licensed under MIT - copyright 2011 Dustin Diaz

For the individual submodules, see their respective licenses.

Current times
-------------
It's obviously early days for Ender.js, and there are still bugs in each of the respective submodules, but they are each actively being worked on and you can be sure that Ender will pull in these changes as often as possible.

Contributors
------------

* [Dustin Diaz](https://github.com/ded/ender.js/commits/master?author=ded)
* [Jacob Thornton](https://github.com/ded/ender.js/commits/master?author=fat)

<h3>@todo</h3>
an event utility is currently in the works. expect multi-event binding, custom (observer) events, delegation, and proper x-browser event workarounds.
