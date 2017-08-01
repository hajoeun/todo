!function(window) {
  var $ = window.D, $1 = window.D1, _ = window._, lo = {}, db, todo = {};

  var db_size = 5 * 1024 * 1024;
  db = openDatabase('todoDB', '1', 'todo database', db_size);
  db.transaction(function(tx) { tx.executeSql('CREATE TABLE IF NOT EXISTS todos(id INTEGER, title TEXT, completed INTEGER)', []); });

  var template = _.t('data', '\
    section.todoapp\
      header.header\
        h1 todos\
        input.new-todo[placeholder="What needs to be done?" autofocus]\
       section.main\
        input.toggle-all[type="checkbox"]\
        label[for="toggle-all"] Mark all as complete\
        ul.todo-list {{_.go(data, ', lo.list = _.teach("d", "\
          li.{{d.completed ? 'completed' : ''}}[data-id={{d.id}}] \
            input.toggle[type=checkbox {{d.completed ? 'checked' : ''}}]\
            label {{d.title}}\
            button.delete Delete\
        "),')}}\
      footer.footer\
        span.todo-count\
        .filters\
          input[type="radio" name="filter" value="all" checked] All\
          input[type="radio" name="filter" value="active"] Active\
          input[type="radio" name="filter" value="completed"] Completed\
        button.clear-completed Clear completed\
  ');

  lo.route = function(state) {
    _.go(state,
      _.if(
        _.is_equal('active'),
        _.c('where completed=0')
      ).else_if(
        _.is_equal('completed'),
        _.c('where completed=1')
      ).else(
        _.c('')
      ),
      todo.select,
      lo.list,
      $.html_to($1('.todo-list')));
  };

  todo.select = _.cb(function(where, next) {
    db.transaction(function(tx) {
      tx.executeSql('select * from todos ' + where, [], function(t, res) {
        next(_.to_array(res.rows));
      });
    });
  });

  todo.add = _.cb(function(text, next) {
    db.transaction(function(tx) {
      var id = Date.now();
      tx.executeSql('INSERT INTO todos (id, title, completed) VALUES (?,?,?)', [id, text, 0], function() {
          next({ id: id, title: text, completed: 0 });
        });
    });
  });

  todo.update = _.cb(function(id, text, next) {
    db.transaction(function(tx) {
      tx.executeSql('UPDATE todos SET title=? WHERE id=?', [text, id]);
    })
  });

  todo.delete = _.cb(function(where, vals, next) {
    db.transaction(function(tx) {
      tx.executeSql('delete from todos ' + where, vals, next, _.loge);
    })
  });

  todo.toggle = _.cb(function(id, next) {
    db.transaction(function(tx) {
      tx.executeSql('select completed from todos where id=?', [id], function(t, res) {
        t.executeSql('UPDATE todos SET completed=? WHERE id=?', [res.rows[0].completed ? 0 : 1, id]);
      })
    })
  });

  _.go("",
    todo.select,
    template, $.el,
    $.append_to('body'),

    $.on('keypress', '.new-todo', function(e) {
      var value = $.val(e.$currentTarget);
      if (value && e.keyCode == 13) {
        $.val(e.$currentTarget, '');
        _.go(value,
          todo.add,
          lo.list,
          $.append_to('.todo-list'));
      }
    }),

    $.on('click', '.toggle', __(
      _.val('$currentTarget'),
      $.closest('li'),
      $.toggle_class('completed'),
      $.attr('data-id'),
      todo.toggle)),

    $.on('change', '.filters input', __(
      _.val('$currentTarget'),
      $.val,
      lo.route)),

    $.on('click', '.clear-completed', function() {
      _.go(
        _.mr('where completed=?', [1]),
        todo.delete,
        _.c('li'), $,
        $.remove('.completed'))
    }),

    $.on('click', '.delete', function(e) {
      console.log(e)
      _.go(e.$currentTarget,
        $.closest('li'),
        $.remove,
        $.attr('data-id'),
        function(id) { return _.mr('where id=?', [id]) },
        todo.delete)
    })

  );
}(window);


