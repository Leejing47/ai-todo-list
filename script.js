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
    return JSON.parse(raw);
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

  // 6. 核心渲染函数render
  function render() {
    todoList.innerHTML = ''; // 清空列表重画

    // 根据filter过滤数据
    const shown = todos.filter(t =>
      filter === 'all' ? true :
        filter === 'done' ? t.completed : !t.completed);

    shown.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t.text;
      li.dataset.id = t.id;
      if (t.completed) {
        li.style.textDecoration = 'line-through';
        li.style.color = '#888';
      }

      // 绑定点击切换完成状态事件
      li.addEventListener('click', () => toggleTodo(t.id));

      // 绑定删除按钮
      const delBtn = document.createElement('button');
      delBtn.textContent = '×';
      delBtn.style.marginLeft = '10px';
      delBtn.addEventListener('click', e => {
        e.stopPropagation(); // 阻止冒泡
        removeTodo(t.id);
      });

      li.appendChild(delBtn);
      todoList.appendChild(li);
    })
  }
  // 7. 三个核心操作函数
  function isDuplicate(text) {
    return todos.some(t => t.text === text); // 基于数据源判断重复
  }

  function addTodo() {
    const text = todoInput.value.trim();
    if (text === '') {
      showMessage('请输入有效的代办事项！', 'error');
      todoInput.focus();
      return;
    }
    if (isDuplicate(text)) {
      showMessage('该待办事项已存在，请勿重复添加。', 'error');
      todoInput.value = '';
      todoInput.focus();
      return;
    }

    // 生成新数组添加
    todos = [...todos, { id: Date.now(), text, completed: false }];
    save();
    render();

    todoInput.value = '';
    todoInput.focus();
    clearMessage();
  }

  function removeTodo(id) {
    todos = todos.filter(t => t.id !== id);
    save();
    render();
  }
  // 8. 独立小改任务，清除所有已完成事项
  window.clearCompleted = function () {
    todos = todos.filter(t => !t.completed);
    save();
    render();
  }
  // 9. 事件监听绑定
  addBtn.addEventListener('click', addTodo);
  todoInput.addEventListener('keydown', function (e) {
    if (e.isComposing) return;
    if (e.key === 'Enter') addTodo();
  });
  todoInput.addEventListener('input', clearMessage);

  // 初始化首次渲染
  render();
})();