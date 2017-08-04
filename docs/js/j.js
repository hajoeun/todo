(function(){
  var slice = Array.prototype.slice;

  var ___ = {};
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

  window._ = _;

  _.go = function(v, fs) {
    var fss = Array.isArray(fs) ? fs : slice.call(arguments, 1);
    return go_async(v, fss)
  };

  function go_async(res, fs) {

    if (res && res.then) {
      return res.then(function(re) {
        return go_async(re, fs);
      })
    } else {
      return fs.length ? go_async(res && res._mr ? fs[0].apply(null, res) : fs[0](res), fs.slice(1)) : res;
    }
  }

  _.pipe = function() {
    var args = slice.call(arguments, 0);
    return function() {
      return go_async(arguments[0], args);
    }
  };

  _.reduce = function f(arr, iter, memo) {
    if (typeof arr === "function" && arguments.length == 2) return _(f, _, arr, iter);
    if (typeof arr === "function" && arguments.length == 1) return _(f, _, arr);
    var i = 0;
    var keys = arr.constructor == Object ? Object.keys(arr) : null;
    var res = memo ? memo : keys ? arr[keys[i++]] : arr[i++] ;
    return _reduce(keys || arr, iter, res, i, keys);
  };

  function _reduce(map, iter, res, i, keys) {
    for (var len = map.length, key ; i < len; i++ ) {
      key = keys ? keys[i] : i;
      res = iter(res, map[key], key, map);
    }
    return res;
  }

  _.mr = function() { return arguments._mr = true, arguments; }
  _.wrap_arr = function(v) { return Array.isArray(v) ? v : [v]; };
  _.constant = _.c = function (v) { return function() { return v }};
  _.val = function f(obj, key) {
    if (arguments.length == 1) return _(f, _, obj);
    return obj && obj[key];
  };

  _.cb = function(f) {
    return function() {
      var args = arguments[0]._mr ? slice.call(arguments[0], 0) : slice.call(arguments, 0);
      return new Promise(function(next) {
        return f.apply(null, args.concat(next));
      })
    }
  };

  _.idtt = function(v) { return v };

  _.loge = window.console && window.console.error ? console.error.bind ? console.error.bind(console) : function() { console.error.apply(console, arguments); } : _.idtt;

  _.tap = function() {
    var fs  = slice.call(arguments, 0);
    return function(re) {
      var ree = arguments.length == 1 ? re : _.mr(arguments);
        return _.go(ree, fs.concat(_.c(re)));
    };
  };

  _.each = function f(data, iter) {
    if (arguments.length == 1) return _(f, _, data);
    var i = -1, key, keys = data.constructor == Object ? Object.keys(data) : null, len = (keys || data).length;
    while (++i < len && !void (key = keys ? keys[i] : i)) iter(data[key], key, data);
    return data;
  };

  _.map = function f(data, iter) {
    if (arguments.length == 1) return _(f, _, data);
    var i = -1, res = [], key, keys = data.constructor == Object ? Object.keys(data) : null, len = (keys || data).length;
    while (++i < len && !void (key = keys ? keys[i] : i)) res[i] = iter(data[key], key, data);
    return res;
  };

  _.to_array = _.map(_.idtt);

  _.filter = function f(arr, iter) {
    if (arguments.length ==1) return _(f, _, arr);

    var res = _.reduce(arr, function(m, v, i, li) {
      if (iter(v, i, li)) return m.concat(v);
      return m
    }, []);
    return res || [];
  };

  _.reject = function f(arr, iter) {
    if (arguments.length ==1) _(f, _, arr);

    var res = _.reduce(arr, function(m, v, i, li) {
      if (!iter(v, i, li)) return m.concat(v);
      return m;
    }, []);
    return res || [];
  };

  _.find = function f(arr, iter) {
    if (arguments.length ==1) _(f, _, arr);
    var keys = arr.constructor == Object ? Object.keys(arr) : null;

    for (var i=0, len=keys ? keys.length : arr.length ; i < len ; i++ ) {
      var val = arr[keys ? keys[i] : i];
      if (iter(val, i, arr)) return val;
    }
  };

  _.is_equal = function f(left, right) {
    if (arguments.length == 1) return _(f, _, left);
    return left == right;
  }

})();
