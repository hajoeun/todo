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
            a#all.{{localStorage.route == "all" ? "selected" : ""}} All\
          li\
            a#active.{{localStorage.route == "active" ? "selected" : ""}}] Active\
          li\
            a#completed.{{localStorage.route == "completed" ? "selected" : ""}}] Completed\
        button.clear-completed Clear completed'),

    t_list = _.teach('d', '\
      li.{{d.completed ? "completed" : ""}}[data-id={{d.id}}] \
        input.toggle[type=checkbox {{d.completed ? "checked" : ""}}]\
        label {{d.title}}\
        button.delete');

  lo.count = function() {
    var len = J.reject(lo.db, function(d) { return d.completed }).length;

    $.text($('.todo-count'),  _.s('l', '{{l}} ' +  (len < 2 ? 'item' : 'items') + ' left')(len));
  };

  lo.route = J.tap(function(state) {
    if (typeof state == 'string') localStorage.route = state;
    J.go(localStorage.route,
     function(state) {
       if (state === 'active')
         return J.filter(lo.db, function(d) { return !d.completed });
       if (state === 'completed')
         return J.filter(lo.db, function(d) { return d.completed });

       return lo.db;
     },
     t_list,
     $.html_to($1('.todo-list')));
  }, lo.count);

  lo.sava_todos = J.tap(function(data) { lo.db = data; });


  lo.add_todo = J.tap(function(data) { lo.db.push(data); }, lo.count);

  lo.del_todo = J.tap(function(id) {
    lo.db = J.reject(lo.db, function(d) { return d.id == id; });
  }, lo.count);

  lo.del_todos = J.tap(function() {
    lo.db = J.reject(lo.db, function(d) { return d.completed });
  }, lo.count);

  lo.toggle_todo = J.tap(function(id) {
    J.find(lo.db, function(d) {
      return d.id == id && !void (d.completed = d.completed ? 0 : 1);
    });
  }, lo.count);

  lo.complete_todos = _.tap(function() {
    
    J.go(lo.db,
      J.filter(function(d) {
        return !d.completed && (d.completed = 1);
      }),
      lo.route);
  }, lo.count);

  db.select = J.cb(function(where, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('select * from todos ' + where, [], function(t, res) {

        next(J.to_array(res.rows));

      });
    });
  });

  db.add = J.cb(function(text, next) {
    web_sql.transaction(function(tx) {
      var id = Date.now();
      tx.executeSql('INSERT INTO todos (id, title, completed) VALUES (?,?,?)', [id, text, 0], function() {
          next({ id: id, title: text, completed: 0 });
        });
    });
  });

  db.update = J.cb(function(id, text, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('UPDATE todos SET title=? WHERE id=?', [text, id]);
    })
  });

  db.delete = J.cb(function(where, vals, next) {

    web_sql.transaction(function(tx) {
      console.log(vals, '===')

      tx.executeSql('delete from todos ' + where, vals, function() {
        next(vals[0]);
      }, J.loge);
    })
  });

  db.toggle = J.cb(function(id, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('select completed from todos where id=?', [id], function(t, res) {
        t.executeSql('UPDATE todos SET completed=? WHERE id=?', [res.rows[0].completed ? 0 : 1, id], function() {
          next(id);
        });
      })
    })
  });

  db.complete_all = J.cb(function(id, next) {
    web_sql.transaction(function(tx) {
      tx.executeSql('UPDATE todos SET completed=1 WHERE completed=0', [], next)
    })
  });


  J.go("",
    db.select,
    lo.sava_todos,
    template, $.el,
    $.append_to('body'),
    lo.route,

    $.on('keypress', '.new-todo', function(e) {
      var value = $.val(e.$currentTarget);
      if (value && e.keyCode == 13) {
        $.val(e.$currentTarget, '');
        J.go(value,
          db.add,
          lo.add_todo,
          function(data) {
            if (localStorage.route !== 'completed')
              J.go(data, t_list, $.append_to('.todo-list'));
          });
      }
    }),

    $.on('click', '.toggle', function(e) {
      var just_li = J.c($.closest(e.$currentTarget, 'li'));
      J.go(localStorage.route,
        _.if(J.is_equal('all'),
          J.pipe(just_li, $.toggle_class('completed'))).
        else(
          J.pipe(just_li, $.remove)),
        $.attr('data-id'),
        db.toggle,
        lo.toggle_todo)
    }),

    $.on('click', '.toggle-all', function() {
      var just_li = J.c($('li:not(.completed)'));
      _.go(localStorage.route,
        _.if(_.is_equal('all'),
          J.pipe(just_li, $.add_class('completed'))).
        else(
          J.pipe(just_li, $.remove)),
        db.complete_all,
        lo.complete_todos)
    }),

    $.on('click', 'ul.filters li a', __(
      J.val('$currentTarget'),
      J.tap(function() {
        $.remove_class($('a.selected'), 'selected');
      }),
      $.add_class('selected'),
      $.attr('id'),
      lo.route)),

    $.on('click', '.clear-completed', function() {
      J.go(
        J.mr('where completed=1', []),
        db.delete,
        lo.del_todos,
        J.c('ul.todo-list li'), $,
        $.remove('.completed'))
    }),

    $.on('click', '.delete', function(e) {
      J.go(e.$currentTarget,
        $.closest('li'),
        $.remove,
        $.attr('data-id'),
        J.wrap_arr,
        J(J.mr, 'where id=?'),
        db.delete,
        lo.del_todo)
    })

  );
}(window);


