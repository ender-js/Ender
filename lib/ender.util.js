/* UTILITY METHODS */
var version = /(@.*)|\*/;

module.exports = {

    accumulate: function (arr1, arr2) {
      var result = {};
      for (var i = 0, l = arr1.length; i < l; i++) {
        if (!result[arr1[i]]) result[arr1[i]] = [];
        result[arr1[i]].push(arr2[i]);
      }
      return result;
    },

    unique: function (arr) {
      var hash = {}, result = [];
      for (var i = 0, l = arr.length; i < l; i++) {
        var key = arr[i].replace(version, '');
        hash[key] = arr[i];
      }
      for (var i in hash) {
        if (hash.hasOwnProperty(i)) {
          result.push(hash[i]);
        }
      }
      return result;
    }

  , reject: function (a, b, ignoreVer) {
      if (ignoreVer) {
        return a.filter(function (item) {
          for (var i = b.length; i--;) {
            if (b[i].replace(version, '') == item.replace(version, '')) {
              return false;
            }
          }
          return true;
        });
      } else {
        return a.filter(function (item) {
          return (b.indexOf(item) == -1);
        });
      }
    }

  , keep: function (a, b) {
      return a.filter(function (item) {
        return (b.indexOf(item) != -1);
      });
    }

  , merge: function (a, b) {
      for (var k in b) {
        a[k] = b[k];
      }
      return a;
    }

  , containsAll: function (a, b) {
      for (var i = b.length; i--;) {
        if (a.indexOf(b[i]) == -1) return false
      }
      return true;
    }

};