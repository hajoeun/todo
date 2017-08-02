
(function(){


  var slice = Array.prototype.slice;
  function _(func) {
    var parts1 = [], parts2 = [],
        parts = slice.call(arguments, 1),
        ___idx = parts.length;

    for (var i in parts)
      if (parts[i] == ___) ___idx = i;
      else if (i < ___idx) parts1.push(parts[i]);
      else parts2.push(parts[i]);

    return function() {
      var args1 = parts1.slice(), args2 = parts2.slice(),
          rest = slice.call(arguments);

      for (var i in args1) if (args1[i] == _) args1[i] = rest.shift();
      for (var i in args2) if (args2[i] == _) args2[i] = rest.pop();

      return func.apply(null, args1.concat(rest.concat(args2)));
    }
  }

  window.J = _;

  _.go = function(v, fs) {
    return _.reduce(slice.call(arguments, 1), function(mem, f){
      return mem._mr ? f.apply(null, slice.call(mem, 0)) :f(mem);
    }, v);
  };


  _.reduce = function f(arr, iter, memo) {
    if (typeof arr === "function") return _(f, _, arr, memo);

    var i = 0;

    if (arr.constructor.name == "Object") {
      var keys = Object.keys(arr);
      var res = arguments.length === 2 ? arr[len[i++]] : memo;

      for (var len = keys.length; i < len; i++ ) {
        res = iter(res, arr[keys[i]], keys[i], arr);
      }
    } else {

      var res = arguments.length === 2 ? arr[i++] : memo;

      for (var len = arr.length; i < len; i++ ) {
        if (res && res.then && typeof res.then === "function") {
          return res.then(function(v){
            res = arr[i](v);
            if (arr.slice(i+1).length === 0) return res;
            return f(arr.slice(i+1), iter, res);
          });
        } else {
          res = iter(res, arr[i], i, arr);
        }
      }
    }
    return res
  };

  _.mr = function() { return arguments._mr = true, arguments; }

  _.wrap_arr = function(v) { return Array.isArray(v) ? v : [v]; };

  _.constant = _.c = function (v) { return function() { return v }};

  _.val = function f(obj, key) {
    if (arguments.length == 1) return _(f, _, obj);
    return obj && obj[key];
  }

  _.cb = function(f) {
    return function() {
        var args = slice.call(arguments, 0);
      return new Promise(function(next) {
        args.push(next);
        return f.apply(null, args);
      })
    }
  }

  _.idtt = function(v) { return v };

  _.to_array = function(obj) {
    return _.reduce(obj, function(m,v){
      return m.concat(v)
    }, [])
  };

  _.loge = window.console && window.console.error ? console.error.bind ? console.error.bind(console) : function() { console.error.apply(console, arguments); } : _.idtt;


})();