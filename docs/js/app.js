var temp_db = {
  a: {title: 'hello', completed: true},
  b: {title: 'bye', completed: false}
};
!function(window) {

  var $ = window.D, $1 = window.D1,
      _ = window._, lo = {};

  var template = _.t('data', '\
    section.todoapp\
      header.header\
        h1 todos\
        input.new-todo[placeholder="What needs to be done?" autofocus]\
       section.main\
        input.toggle-all[type="checkbox"]\
        label[for="toggle-all"] Mark all as complete\
        ul.todo-list {{_.go(data, _.keys,', lo.list = _.teach("id", "\
          li.{{temp_db[id].completed ? 'completed' : ''}}[data-id={{id}}] \
            input.toggle[type=checkbox {{temp_db[id].completed ? 'checked' : ''}}]\
            label {{temp_db[id].title}}\
            button.delete\
        "),')}}\
      footer.footer\
        span.todo-count\
        .filters\
          input[type="radio" name="filter" value="all" checked] All\
          input[type="radio" name="filter" value="active"] Active\
          input[type="radio" name="filter" value="completed"] Completed\
        button.clear-completed Clear completed\
  ');

  lo.save = function(title, id) {
    if (id) temp_db[id].title = title;
    else {
      id = Date.now();
      temp_db[id] = { title: title, completed: false };
    }
    return id;
  };

  lo.toggle = function(id) {
    temp_db[id].completed = !temp_db[id].completed;
  };

  lo.route = function(state) {
    var data = _.keys(temp_db), predi = function(id) { return temp_db[id].completed; };

    if (state === 'active') data = _.reject(data, predi);
    else if (state === 'completed') data = _.filter(data, predi);

    $1('.todo-list').innerHTML = lo.list(data);
  };

  _.go(temp_db,
    template, $.el,
    $.append_to('body'),

    $.on('keypress', '.new-todo', function(e) {
      var keyCode = e.keyCode, value = $.val(e.$currentTarget);

      if (value && keyCode == 13) {
        $.val(e.$currentTarget, '');
        _.go(value,
          lo.save,
          lo.list,
          $.append_to('.todo-list'));
      }
    }),

    $.on('click', '.toggle', __(
      _.val('$currentTarget'),
      $.closest('li'),
      $.toggle_class('completed'),
      $.attr('data-id'),
      lo.toggle)),

    $.on('change', '.filters input', __(
      _.val('$currentTarget'),
      $.val,
      lo.route))
  );
}(window);


