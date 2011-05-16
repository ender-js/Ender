var NPM = require('./ender.npm');

module.exports = function (terms) {
  NPM.search(terms, function (data) {
    var results, k, which, primary = [], secondary = [];
    for (var i in data) {
      if (k = data[i].keywords) {
        which = secondary;
        for (var j = k.length; j--;) {
          if (k[j] == 'ender') {
            which = primary;
            break;
          }
        }
        which.push(data[i]);
      }
    }

    console.log(' ');

    if (!primary.length && !secondary.length) {
      return console.log('sorry, we couldn\'t find anything. :('.yellow)
    }

    if (primary.length) {
      console.log('Ender tagged results:'.yellow);
      console.log('---------------------');
      primary = rankRelevance(terms, primary);
      primary.forEach(function (item) {
        processItem(item, terms);
      });
    }

    if (secondary.length) {
      var secLength = 8 - primary.length;
      if (secLength > 0) {
        secondary = rankRelevance(terms, secondary);
        var meta = secondary.length > secLength ? ' (' + secLength + ' of ' + secondary.length  + ')' : '';
        console.log('NPM general results:'.yellow + meta.grey);
        console.log('--------------------\n');
        secondary.slice(0, secLength).forEach(function (item) {
          processItem(item, terms);
        });
      }
    }

  });
}

function rankRelevance(terms, array) {
  var ranked = [], priority = ['name', 'keywords', 'description']; //add authors to this search...

  //Exact query match against name
  var regex = new RegExp('^' + terms.join('\s') + '$');
  matchAgainstReg(regex, array, ranked, ['name']);

  //whole query match against priorities as words
  var regex = new RegExp('\\b' + escapeRegExp(terms.join('\\s')) + '\\b', 'i');
  matchAgainstReg(regex, array, ranked, priority);

  //any one query against priorities as word
  var regex = new RegExp('\\b' + escapeRegExp(terms.join('\b|\b')) + '\\b', 'i');
  matchAgainstReg(regex, array, ranked, priority);

  //we don't really care about relevance at this point :P
  return ranked.concat(array);
}

function matchAgainstReg(regex, array, ranked, priority) {
  for (var i = 0; i < priority.length; i++) {
    var p = priority[i];
    for (var j = 0; j < array.length; j++) {
      if (typeof array[j][p] == 'string' && regex.test(array[j][p])) {
        ranked.push(array.splice(j, 1)[0]);
        j--;
      } else if (typeof array[j][p] != 'string') {
        for (var m = 0; m < array[j][p].length; m++) {
          if (regex.test(array[j][p][m])) {
            ranked.push(array.splice(j, 1)[0]);
            j--;
            break;
          }
        }
      }
    }
  }
}

function processItem(item, terms) {
  var reg = new RegExp('(' + escapeRegExp(terms.join('|')) + ')', 'ig');

  var title = item.name, dots = item.description.length > 80 ? '...' : '';
  if (item.description) title += ' - ' + item.description.substring(0, 80) + dots;
  console.log('+ ' + title.replace(reg, '$1'.cyan));

  var maintainers = '';

  if (item.maintainers && item.maintainers.length) {
    item.maintainers = item.maintainers.map(function (maintainer) {
      return maintainer.replace(/^=/, '@');
    });

    if (item.maintainers.length > 1) {
      var last = item.maintainers.splice(-1)[0];
      maintainers = item.maintainers.join(', ');
      maintainers += ' & ' + last;
    } else {
      maintainers = item.maintainers[0];
    }

  }

  console.log('  by ' + maintainers.replace(reg, '$1'.cyan) + '\n');
}

function escapeRegExp(string){
  // Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function(match){
		return '\\' + match;
	});
}