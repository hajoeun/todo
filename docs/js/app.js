!function(local_db) {
  let web_sql = openDatabase('todoDB', '1', 'todo database', 5 * 1024 * 1024);
  web_sql.transaction(tx => tx.executeSql('CREATE TABLE IF NOT EXISTS todos(id INTEGER, title TEXT, completed INTEGER)', []));

  _.$ = sel => () => $(sel);

  let section_template = () => pug`
    section.todoapp
      header.header
        h1 todos
        input.new-todo[placeholder='What needs to be done?' autofocus]
       section.main
        input.toggle-all[type=checkbox]
        label[for='toggle-all'] Mark all as complete
        ul.todo-list
      footer.footer
        span.todo-count
        ul.filters
          li
            a#all.${(!localStorage.route || localStorage.route == 'all') ? 'selected' : ''} All
          li
            a#active.${localStorage.route == 'active' ? 'selected' : ''}] Active
          li
            a#completed.${localStorage.route == 'completed' ? 'selected' : ''}] Completed
        button.clear-completed Clear completed
    footer.info
      p Host on 
        a[href=https://github.com/joeunha/todo] Github
      p Created by 
        a[href=https://www.github.com/joeunha] Joeun Ha
        | & 
        a[href=https://www.github.com/dev-jip] JIP
      p Powered by 
        a[href=https://github.com/marpple] MARPPLE`;

  let todo_list_template = _.sum(item => pug`
    li.${item.completed ? 'completed' : ''}[data-id=${item.id}]
      input.toggle[type=checkbox ${item.completed ? 'checked' : ''}]
      label ${item.title}
      button.delete`);

  let filter_active = _.reject(d => d.completed);
  let filter_completed = _.filter(d => d.completed);

  let left_item_counter = __(
    () => local_db,
    filter_active,
    _.v('length'),
    l => `${l} ${l < 2 ? 'item' : 'items'} left`,
    $.text_to('.todo-count'));

  let list_router = _.tap(
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
    todo_list_template,
    $.html_to('.todo-list'),
    left_item_counter);

  let change_toggle_all = sel => __(
    _.v('currentTarget'),
    $.toggle_class('checked'),
    _.$(sel),
    $.toggle_class('completed'),
  );

  _.go($1('body.todo'), __(
    _.tap(
      () => new Promise(next =>
        web_sql.transaction(tx =>
          tx.executeSql('select * from todos', [],
            (t, res) => next(local_db = _.to_array(res.rows))))),
      section_template,
      $.append_to('body'),
      list_router),

    $.on('keypress', '.new-todo', e => {
      let value = $.val(e.currentTarget);
      if (value && e.keyCode == 13) {
        $.val(e.currentTarget, '');
        _.go(value,
          _.cb((text, next) => web_sql.transaction(tx => {
            let id = Date.now();
            tx.executeSql('INSERT INTO todos (id, title, completed) VALUES (?,?,?)', [id, text, 0],
              () => next({ id: id, title: text, completed: 0 }));
          })),
          _.tap(data => (local_db.push(data), local_db), left_item_counter),
          _.if(_.l("localStorage.route !== 'completed'")) (
            _.wrap_arr,
            todo_list_template,
            $.append_to('.todo-list')))
      }
    }),

    $.on('click', '.delete', __(
      _.v('currentTarget'),
      $.closest('li'),
      $.remove,
      $.attr('data-id'),
      _.cb((id, next) =>
        web_sql.transaction(tx =>
          tx.executeSql('delete from todos where id=?', [id], _(next, id), _.loge))),
      id => (local_db = _.reject(local_db, item => item.id == id)),
      left_item_counter)),

    $.on('click', '.toggle', __(
      _.v('currentTarget'),
      $.closest('li'),
      _.if(_.l("localStorage.route === 'all'")) (
        $.toggle_class('completed')
      ).else($.remove),
      $.attr('data-id'),
      _.cb((id, next) => web_sql.transaction(tx =>
        tx.executeSql('select completed from todos where id=?', [id], (t, res) =>
          t.executeSql('UPDATE todos SET completed=? WHERE id=?', [res.rows[0].completed ? 0 : 1, id], _(next, id), _.loge)))),
      id => _.find(local_db, item => (item.id == id && !void (item.completed = item.completed ? 0 : 1))),
      left_item_counter)),

    $.on('click', '.toggle-all:not(.checked)', __(
      change_toggle_all('.todo-list li:not(.completed)'),
      _.cb((e, next) =>
        web_sql.transaction(tx =>
          tx.executeSql('UPDATE todos SET completed=1 WHERE completed=0', [], () => next(local_db), _.loge))),
      _.each(item => (!item.completed && (item.completed = 1))),
      list_router)),

    $.on('click', '.toggle-all.checked', __(
      change_toggle_all('.todo-list li.completed'),
      _.cb((e, next) =>
        web_sql.transaction(tx =>
          tx.executeSql('UPDATE todos SET completed=0 WHERE completed=1', [], () => next(local_db), _.loge))),
      _.each(item => (item.completed && (item.completed = 0))),
      list_router)),

    $.on('click', 'ul.filters li a', __(
      _.v('currentTarget'),
      _.tap(_.$('a.selected'), $.remove_class('selected')),
      $.add_class('selected'),
      $.attr('id'),
      list_router)),

    $.on('click', '.clear-completed', __(
      _.c('where completed=1'),
      _.cb((where, next) =>
        web_sql.transaction(tx =>
          tx.executeSql(`delete from todos ${where}`, [], next, _.loge))),
      () => { local_db = filter_active(local_db) },
      left_item_counter,
      _.$('ul.todo-list li'),
      $.remove('.completed')))
  ));

}(null);