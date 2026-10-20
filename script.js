(function () {
  'use strict';
  const KEY = 'todos';

  // 1. 获取 DOM 元素
  const todoInput = document.getElementById('todoInput');
  const addBtn = document.getElementById('addBtn');
  const todoList = document.getElementById('todoList');
  const statusMsg = document.getElementById('statusMsg');

  // 2. DOM 空值防御：关键元素不存在时，给出提示并停止执行
  if (!todoInput || !addBtn || !todoList) {
    const msg = '页面初始化失败：缺少必要的 DOM 元素。';
    if (statusMsg) {
      statusMsg.textContent = msg;
      statusMsg.dataset.type = 'error';
    } else {
      console.error(msg);
    }
    return;
  }

  // 3. 定义单一数据源与视图状态
  let todos = load();
  let filter = 'all';

  // 4. 持久化函数
  function save() {
    localStorage.setItem(KEY, JSON.stringify(todos));
  }
  function load() {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  // 5. 提示信息工具函数
  function showMessage(message, type) {
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.dataset.type = type || 'info';
  }
  function clearMessage() {
    if (!statusMsg) return;
    statusMsg.textContent = '';
    delete statusMsg.dataset.type;
  }

  // 6. 核心渲染函数 render：只负责建元素与写标识，不绑监听器
  function render() {
    todoList.innerHTML = ''; // 清空列表重画

    const shown = todos.filter(t =>
      filter === 'all' ? true :
        filter === 'done' ? t.completed : !t.completed);

    shown.forEach(t => {
      const li = document.createElement('li');
      li.dataset.id = String(t.id); // ① 将 id 写入 DOM 的 data-id

      const span = document.createElement('span');
      span.textContent = t.text;
      if (t.completed) {
        span.style.textDecoration = 'line-through';
        span.style.color = '#888';
      }

      // 编辑按钮（任务 3 新增）
      const editBtn = document.createElement('button');
      editBtn.dataset.action = 'edit';
      editBtn.textContent = '编辑';

      // 删除按钮（任务 1 改造）
      const delBtn = document.createElement('button');
      delBtn.dataset.action = 'delete';
      delBtn.textContent = '删除';

      li.append(span, editBtn, delBtn);
      todoList.appendChild(li);
    });
  }

  // 7. 核心数据操作函数（改数据 → save() → render()）
  function isDuplicate(text, excludeId) {
    return todos.some(t => t.text === text && String(t.id) !== String(excludeId));
  }

  function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
      showMessage('请输入有效的待办事项！', 'error');
      todoInput.focus();
      return;
    }
    if (isDuplicate(text)) {
      showMessage('该待办事项已存在，请勿重复添加。', 'error');
      todoInput.value = '';
      todoInput.focus();
      return;
    }

    todos = [...todos, { id: Date.now(), text, completed: false }];
    save();
    render();

    todoInput.value = '';
    todoInput.focus();
    clearMessage();
  }

  function deleteTodo(id) {
    console.log('[delete]', id);
    todos = todos.filter(t => String(t.id) !== String(id));
    save();
    render();
  }

  function toggleTodo(id) {
    console.log('[toggle]', id);
    todos = todos.map(t =>
      String(t.id) === String(id) ? { ...t, completed: !t.completed } : t
    );
    save();
    render();
  }

  function updateTodo(id, newText) {
    console.log('[edit]', id, newText);
    if (isDuplicate(newText, id)) {
      showMessage('修改后的待办事项已存在！', 'error');
      return;
    }
    todos = todos.map(t =>
      String(t.id) === String(id) ? { ...t, text: newText } : t
    );
    save();
    render();
    clearMessage();
  }

  // 8. 清除所有已完成事项
  window.clearCompleted = function () {
    todos = todos.filter(t => !t.completed);
    save();
    render();
  };

  // 9. 事件监听绑定
  addBtn.addEventListener('click', addTodo);
  todoInput.addEventListener('keydown', function (e) {
    if (e.isComposing) return;
    if (e.key === 'Enter') addTodo();
  });
  todoInput.addEventListener('input', clearMessage);

  // 父容器统一接管列表点击事件（三道防御 + 互斥分流）
  todoList.addEventListener('click', (e) => {
    // 第一道防御：target 必须是 Element
    if (!(e.target instanceof Element)) return;

    // 第二道防御：向上定位 li，且必须在当前 todoList 内（拦截列表空白处点击）
    const item = e.target.closest('li');
    if (!item || !todoList.contains(item)) return;

    // 第三道防御：读取 dataset.id 并判空
    const id = item.dataset.id;
    if (!id) return;

    const delBtn = e.target.closest('[data-action="delete"]');
    const editBtn = e.target.closest('[data-action="edit"]');

    // 互斥条件分流：删除 / 编辑 / 切换完成状态
    if (delBtn && item.contains(delBtn)) {
      deleteTodo(id);
    } else if (editBtn && item.contains(editBtn)) {
      const current = todos.find(t => String(t.id) === String(id));
      if (!current) return;
      const input = prompt('修改任务', current.text);
      if (input !== null && input.trim() !== '') {
        updateTodo(id, input.trim());
      }
    } else {
      toggleTodo(id);
    }
  });

  // 初始化首次渲染
  render();
})();