window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange

if (!window.indexedDB) {
  window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

var temp_db = [
  {id: Date.now(), title: 'hello', completed: true},
  {id: Date.now(), title: 'bye', completed: false}
];

var db;
var request = window.indexedDB.open('todoDB', 1);

request.onerror = function(e) {
  console.error("error: " + e);
};

request.onsuccess = function(e) {
  db = request.result;
  console.log("success:", db);
};

request.onupgradeneeded = function(e) {
  var db = e.target.result;
  var store = db.createObjectStore('todos', { keyPath: 'id' });

  for (var i in temp_db) store.add(temp_db[i]);
};

function read(id) {
  var transaction = db.transaction('todos');
  var store = transaction.objectStore('todos');
  var request = store.get(id);

  request.onerror = function(e) {
    console.error("error: " + e);
  };

  request.onsuccess = function() {
    if (request.result)
      console.log("title: " + request.title);
    else
      console.log("no date");
  };
}


!function(window) {

  var $ = window.D, $1 = window.D1, _ = window._, lo = {};

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

  lo.save = function(title, id) {
    var li;
    if (id) {
      li = _.find(temp_db, function(d) { return d.id == id; });
      li.title = title;
    }
    else {
      li = { id: id = Date.now(), title: title, completed: false };
      temp_db.push(li);
    }
    return li;
  };

  lo.toggle = function(id) {
    var li = _.find(temp_db, function(d) { return d.id == id; });
    li.completed = !li.completed;
    return li;
  };

  lo.route = function(state) {
    var show_db = temp_db, predi = function(d) { return d.completed; };

    if (state === 'active')
      show_db = _.reject(show_db, predi);
    else if (state === 'completed')
      show_db = _.filter(show_db, predi);

    $1('.todo-list').innerHTML = lo.list(show_db);
  };

  _.go(temp_db,
    template, $.el,
    $.append_to('body'),

    $.on('keypress', '.new-todo', function(e) {
      var value = $.val(e.$currentTarget);
      if (value && e.keyCode == 13) {
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


