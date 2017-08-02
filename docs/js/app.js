!function(window) {
  var $ = window.D, $1 = window.D1, _ = window._, lo = {}, web_sql, db = {};

  web_sql = openDatabase('todoDB', '1', 'todo database', 5 * 1024 * 1024);
  web_sql.transaction(function(tx) { tx.executeSql('CREATE TABLE IF NOT EXISTS todos(id INTEGER, title TEXT, completed INTEGER)', []); });

  var template = _.t('', '\
    section.todoapp\
      header.header\
        h1 todos\
        input.new-todo[placeholder="What needs to be done?" autofocus]\
       section.main\
        input.toggle-all[type="checkbox"]\
        label[for="toggle-all"] Mark all as complete\
        ul.todo-list\
      footer.footer\
        span.todo-count\
        ul.filters\
          li\
            a#all.{{(!localStorage.route || localStorage.route == "all") ? "selected" : ""}} All\
          li\
            a#active.{{localStorage.route == "active" ? "selected" : ""}}] Active\
          li\
            a#completed.{{localStorage.route == "completed" ? "selected" : ""}}] Completed\
        button.clear-completed Clear completed'),

    t_list = _.teach('d', '\
      li.{{d.completed ? "completed" : ""}}[data-id={{d.id}}] \
        input.toggle[type=checkbox {{d.completed ? "checked" : ""}}]\
        label {{d.title}}\
        button.destroy');

  lo.count = function() {
    var len = _.reject(lo.db, function(d) { return d.completed }).length;
    $.text($('.todo-count'),  _.s('l', '{{l}} ' +  (len < 2 ? 'item' : 'items') + ' left')(len));
  };

  lo.route = _.tap(function(state) {
    if (typeof state == 'string') localStorage.route = state;
    _.go(localStorage.route,
     function(state) {
       if (state === 'active')
         return _.filter(lo.db, function(d) { return !d.completed });
       if (state === 'completed')
         return _.filter(lo.db, function(d) { return d.completed });
       return lo.db;
     },
     t_list,
     $.html_to($1('.todo-list')));
  }, lo.count);

  lo.sava_todos = _.tap(function(data) { lo.db = data; });

  lo.add_todo = _.tap(function(data) { lo.db.push(data); }, lo.count);

  lo.del_todo = _.tap(function(id) {
    lo.db = _.reject(lo.db, function(d) { return d.id == id; });
  }, lo.count);

  lo.del_todos = _.tap(function() {
    lo.db = _.reject(lo.db, function(d) { return d.completed });
  }, lo.count);

  lo.toggle_todo = _.tap(function(id) {
    _.find(lo.db, function(d) {
      return d.id == id && !void (d.completed = d.completed ? 0 : 1);
    });
  }, lo.count);

  lo.complete_todos = _.tap(function() {
    _.go(lo.db,
      _.filter(function(d) {
        return !d.completed && (d.completed = 1);
      }),
      lo.route);
  }, lo.count);

  db.select = _.cb(function(where, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('select * from todos ' + where, [], function(t, res) {
        next(_.to_array(res.rows));
      });
    });
  });

  db.add = _.cb(function(text, next) {
    web_sql.transaction(function(tx) {
      var id = Date.now();
      tx.executeSql('INSERT INTO todos (id, title, completed) VALUES (?,?,?)', [id, text, 0], function() {
          next({ id: id, title: text, completed: 0 });
        });
    });
  });

  db.update = _.cb(function(id, text, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('UPDATE todos SET title=? WHERE id=?', [text, id]);
    })
  });

  db.delete = _.cb(function(where, vals, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('delete from todos ' + where, vals, function() {
        next(vals[0]);
      }, _.loge);
    })
  });

  db.toggle = _.cb(function(id, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('select completed from todos where id=?', [id], function(t, res) {
        t.executeSql('UPDATE todos SET completed=? WHERE id=?', [res.rows[0].completed ? 0 : 1, id], function() {
          next(id);
        });
      })
    })
  });

  db.complete_all = _.cb(function(id, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('UPDATE todos SET completed=1 WHERE completed=0', [], next)
    })
  });


  _.go("",
    db.select,
    lo.sava_todos,
    template, $.el,
    $.append_to('body'),
    lo.route,

    $.on('keypress', '.new-todo', function(e) {
      var value = $.val(e.$currentTarget);
      if (value && e.keyCode == 13) {
        $.val(e.$currentTarget, '');
        _.go(value,
          db.add,
          lo.add_todo,
          function(data) {
            if (localStorage.route !== 'completed')
              _.go(data, t_list, $.append_to('.todo-list'));
          });
      }
    }),

    $.on('click', '.toggle', function(e) {
      var just_li = _.c($.closest(e.$currentTarget, 'li'));
      _.go(localStorage.route,
        _.if(_.is_equal('all'),
          __(just_li, $.toggle_class('completed'))).
        else(
          __(just_li, $.remove)),
        $.attr('data-id'),
        db.toggle,
        lo.toggle_todo)
    }),

    $.on('click', '.toggle-all', function() {
      var just_li = _.c($('li:not(.completed)'));
      _.go(localStorage.route,
        _.if(_.is_equal('all'),
          __(just_li, $.add_class('completed'))).
        else(
          __(just_li, $.remove)),
        db.complete_all,
        lo.complete_todos)
    }),

    $.on('click', 'ul.filters li a', __(
      _.val('$currentTarget'),
      _.tap(function() {
        $.remove_class($('a.selected'), 'selected');
      }),
      $.add_class('selected'),
      $.attr('id'),
      lo.route)),

    $.on('click', '.clear-completed', function() {
      _.go(
        _.mr('where completed=1', []),
        db.delete,
        lo.del_todos,
        _.c('ul.todo-list li'), $,
        $.remove('.completed'))
    }),

    $.on('click', '.destroy', function(e) {
      _.go(e.$currentTarget,
        $.closest('li'),
        $.remove,
        $.attr('data-id'),
        _.wrap_arr,
        _(_.mr, 'where id=?'),
        db.delete,
        lo.del_todo)
    })

  );
}(window);


