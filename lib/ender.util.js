/* UTILITY METHODS */
module.exports = {

    unique: function (arr) {
      var hash = {}, result = [];
      for (var i = 0, l = arr.length; i <l; i++) {
        if (!hash[arr[i]]) {
          hash[arr[i]] = true;
          result.push(arr[i]);
        }
      }
      return result;
    }

  , reject: function (a, b) {
      return a.filter(function (item) {
        return (b.indexOf(item) == -1);
      });
    }

  , keep: function (a, b) {
      return a.filter(function (item) {
        return (b.indexOf(item) != -1);
      });
    }

  , containsAll: function (a, b) {
      for(var i = b.length; i--;) {
        if (a.indexOf(b[i]) == -1) return false
      }
      return true;
    }

};