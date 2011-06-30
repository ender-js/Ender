# JavaScript Style Coding Conventions for Ender
Borrowed heavily from Alexis: https://raw.github.com/cloudhead/styleguide/master/JavaScript.md


## Identifiers

- **RULE**: Identifiers bound to constructors **must** start with a capital.

```javascript
  // GOOD

  var User = function (name, age) {
      this.name = name
      this.age = age
  }
  var user = new User('bob', 32)

```


```javascript
  // BAD

  var user = function (name, age) {
      this.name = name
      this.age = age
  }
  var u = new user('bob', 32)

```

- **RULE**: Identifiers bound to a variable **must** be CamelCased, and start with a lowercase letter.


```javascript
  // GOOD

  var someKindOfProcess = function () {}

```


```javascript
  // BAD

  var some_kind_of_process = function () {}

```

## Variable declarations

- **RULE**: Always declare variables at the *top* of functions.
- **REASON**: Variable declarations are moved up to the top of the function scope anyway,
so that's where they belong.


```javascript
  // GOOD

  function (a, b) {
      var k

      if (a == b) {
          k = true
      }
      ...
  }

```


```javascript
  // BAD

  function (a, b) {
      if (a == b) {
          var k = true
      }
      ...
  }

```

- **RULE**: Comma first
- **REASON**: @issacs can't sleep at night without it... https://gist.github.com/357981


```javascript
  // GOOD

  var a = "ape"
    , b = "bat"
    , c = "cat"

```


```javascript
  // BAD

  var a = "ape",
    b = "bat",
    c = "cat"

```

## Control-flow

- **RULE**: Control-flow statements, such as `if`, `while` and `for` **must** have a space between the keyword and the left parenthesis.
- **REASON**: To differentiate them with function calls.

```javascript
  // GOOD

  if (a) {
      return true
  }

```
```javascript
  // BAD

  if(a) {
      return true
  }

```

- **RULE**: Avoid crazy nested anonymous async function nesting.
- **REASON**: It's hard to read and figure out what's going on.

```javascript
  // GOOD

  var async = require('async')

  async.waterfall([
    foo
  , bar
  , baz
  ])

```
```javascript
  // BAD

  foo(function () {
    bar(function () {
      baz(function () {
        ...
      })
    })
  })

```


## Functions

- **RULE**: Anonymous functions **should** have a space between the `function` keyword and the left parenthesis.
- **REASON**: To emphasise the lack of identifier and differentiate them with named functions.


```javascript
  // GOOD

  function (a, b) {}

```


```javascript
  // BAD

  function(a, b) {}

```

- **RULE**: Named functions **should not** have a space between the function name and the left parenthesis.
- **REASON**: See above.


```javascript
  // GOOD

  function add(a, b) {}

```


```javascript
  // BAD

  function add (a, b) {}

```

## Semicolons

- **RULE**: Semicolons `;` **must not** be used ever.
- **REASON**: They look funny. Look at those guys.


```javascript
  // GOOD

  var f = function add(a, b) {
      if (a == b) { return a * 2 }   // No `;` here.
      return a + b // No `;` here too!
  }

```


```javascript
  // BAD

  var f = function add (a, b) {
      if (a == b) { return a * 2; }
      return a + b;
  }

```

## Braces

- **RULE**: Braces **must** be used in all circumstances.
- **REASON**: JavaScript uses braces to structure code.


```javascript
  // GOOD

  if (x) { return true }

```


```javascript
  // BAD

  if (x) return true

```
```javascript
  // REALLY BAD

  if (x)
      return true

```
- **RULE**: Braces **must never** be on a line of their own.
- **REASON**: It wastes screen space.


```javascript
  // GOOD

  if (x) {
      return true
  }

```


```javascript
  // BAD

  if (x)
  {
      return true
  }

```
```javascript
  // REALLY BAD

  if (x) {
      return true }

```

## Naming Conventions

- **RULE**: Packages/modules/microlibs must always be referred to as packages.
- **REASON**: Good to be consistent.


```javascript
  // GOOD

  var packages

```


```javascript
  // BAD

  var modules //boo

```

- **RULE**: Only use // when commenting
- **REASON**: simple


```javascript
  // GOOD

  // ENDER OBJECTS
  // =============

```


```javascript
  // BAD

  /* ENDER OBJECTS
   * ============= */

```

- **RULE**: Be super explicit with variable names
- **REASON**: Code should be as self documenting as possible


```javascript
  // GOOD
  var activePackages = [...]
    , queuedPackages = [...]
    , rejectedPackages = [...]

  function installPackages() { ... } //installs packages

```


```javascript
  // BAD

  var packages = [...]
    , _packages_ = [...]
    , __packages = [...]
  function callback () { ... } //installs packages

```
