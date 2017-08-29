!function(window) {
  let $ = window.D, $1 = window.D1, _ = window._, local_db, web_sql;

  web_sql = openDatabase('todoDB', '1', 'todo database', 5 * 1024 * 1024);
  web_sql.transaction(tx => tx.executeSql('CREATE TABLE IF NOT EXISTS todos(id INTEGER, title TEXT, completed INTEGER)', []));

  let template = _.t('', '\
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
        button.clear-completed Clear completed\
    footer.info\
      p Created by \
        a[href=https://www.github.com/joeunha] Joeun Ha\
        | & \
        a[href=https://www.github.com/dev-jip] JIP\
      p Powered by \
        a[href=https://marpple.github.io/partial.js] Partial.js\
        | & \
        a[] Don.js'),

    t_list = _.sum(_.t$('\
      li.{{$.completed ? "completed" : ""}}[data-id={{$.id}}] \
        input.toggle[type=checkbox {{$.completed ? "checked" : ""}}]\
        label {{$.title}}\
        button.delete')),

    filter_active = _.reject(d => d.completed),
    filter_completed = _.negate(filter_active),

    counter = __(
      () => local_db,
      filter_active,
      actives => actives.length,
      _.all(
        _.s$('{{$}} {{$ < 2 ? "item" : "items"}} left'),
        _.c('.todo-count')
      ),
      $.text_to),

    router = _.tap(
      state => {
        if (!localStorage.route) localStorage.route = 'all';
        return typeof state === 'string' ?
          (localStorage.route = state) : localStorage.route;
      },
      state => {
        if (state === 'active') return filter_active(local_db);
        if (state === 'completed') return filter_completed(local_db);
        return local_db;
      },
      _.all(t_list, _.c('.todo-list')),
      $.html_to,
      counter);


  _.each($('body.todo'), __(
    () => new Promise(next =>
      web_sql.transaction(tx =>
        tx.executeSql('select * from todos', [],
          (t, res) => next(local_db = _.to_array(res.rows))))),
    template,
    $.append_to('body'),
    router,

    $.on('keypress', '.new-todo', e => {
      let value = $.val(e.$currentTarget);
      if (value && e.keyCode == 13) {
        $.val(e.$currentTarget, '');
        _.go(value,
          _.cb((text, next) => web_sql.transaction(tx => {
            let id = Date.now();
            tx.executeSql('INSERT INTO todos (id, title, completed) VALUES (?,?,?)', [id, text, 0],
              () => next({ id: id, title: text, completed: 0 }));
          })),
          _.tap(data => (local_db.push(data), local_db), counter),
          _.if(_.l("localStorage.route !== 'completed'"),
            __(_.wrap_arr, t_list, $.append_to('.todo-list'))))
      }
    }),

    $.on('click', '.delete', __(
      _.val('$currentTarget'),
      $.closest('li'),
      $.remove,
      $.attr('data-id'),
      _.cb((id, next) =>
        web_sql.transaction(tx =>
          tx.executeSql('delete from todos where id=?', [id], _(next, id), _.loge))),
      id => { local_db = _.reject(local_db, d => d.id == id) },
      counter)),

    $.on('click', '.toggle', __(
      _.val('$currentTarget'),
      $.closest('li'),
      _.if(_.l("localStorage.route === 'all'"),
        $.toggle_class('completed'))
        .else($.remove),
      $.attr('data-id'),
      _.cb((id, next) => web_sql.transaction(tx =>
        tx.executeSql('select completed from todos where id=?', [id], (t, res) =>
          t.executeSql('UPDATE todos SET completed=? WHERE id=?', [res.rows[0].completed ? 0 : 1, id], _(next, id), _.loge)))),
      id => _.find(local_db, d => (d.id == id && !void (d.completed = d.completed ? 0 : 1))),
      counter)),

    $.on('click', '.toggle-all', __(
      _.c('.todo-list li:not(.completed)'), $,
      _.if(_.l("localStorage.route === 'all'"), $.add_class('completed'))
        .else($.remove),
      _.cb((id, next) =>
        web_sql.transaction(tx =>
          tx.executeSql('UPDATE todos SET completed=1 WHERE completed=0', [], () => next(local_db), _.loge))),
      _.filter(d => (!d.completed && (d.completed = 1))),
      router,
      counter)),

    $.on('click', 'ul.filters li a', __(
      _.val('$currentTarget'),
      _.tap(_.c('a.selected'), $, $.remove_class('selected')),
      $.add_class('selected'),
      $.attr('id'),
      router)),

    $.on('click', '.clear-completed', __(
      _.c('where completed=1'),
      _.cb((where, next) =>
        web_sql.transaction(tx =>
          tx.executeSql('delete from todos ' + where, [], next, _.loge))),
      () => { local_db = filter_active(local_db) },
      counter,
      _.c('ul.todo-list li'), $,
      $.remove('.completed')))

  ));

}(window);