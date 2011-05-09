
<div class="hr" id="integrate"></div>

INTEGRATING
-----------
The front end API provided by [ender-js](http://github.com/ender-js/ender-js) is what glues together and ultimately offers cohesion and a sense of familiarity to the different packages built into your library by Ender. It's simple, elegant, and super flexible. Let's take a look how you can leverage it, if you're interested in packaging your own stuff!

<h3>Top level methods</h3>

To create top level methods on the ender-js object ($) you can hook into it by calling the <code>ender</code> method:

    $.ender({
      myUtility: myLibFn
    });

The above code would provide <code>$.myUtility()</code>

<h3>The Internal chain</h3>

Another common desire for developers is to be able hook into the internal collection chain. To do this, simply call the same <code>ender</code> method above, but pass <code>true</code> as the second argument:

    $.ender(myExtensions, true);

Within the scope of your extension methods, the internal prototype will be exposed to the developer using the <code>this</code> context representing the node collection. This looks something like this in practice:

    $.ender({
      rand: function () {
        return this[Math.floor(Math.random() * this.length)];
      }
    }, true);

    $('p').rand();

You might consider having a look at how the [Bonzo DOM utility](https://github.com/ded/bonzo/blob/master/src/ender.js) utilizes this feature.

<h3>Selector Engine API</h3>

Ender-js also exposes a unique privileged variable called <code>$._select</code>, which allows you to set the ender-js selector engine. Setting the selector engine provides ender-js with the $ method, like this:

    $('#foo .bar')

Setting the selector engine is done like so:

    $._select = mySelectorEngine;

You can see it in practice in [Qwery](https://github.com/ded/qwery/blob/master/src/ender.js)

This is great news if you're building a Mobile Webkit or Android application, simply set it to <code>querySelectorAll</code>:

    $._select = function (selector, root) {
      return (root || document).querySelectorAll(selector);
    });