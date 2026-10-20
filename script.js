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

  // 6. 核心渲染函数 render：只负责建元素 + 写标识，不绑监听器
  function render() {
    todoList.innerHTML = ''; // 清空列表重画

    const shown = todos.filter(t =>
      filter === 'all' ? true :
        filter === 'done' ? t.completed : !t.completed);

    shown.forEach(t => {
      const li = document.createElement('li');
      li.dataset.id = t.id; // ① 将唯一 id 写进 DOM 的 data-id 属性
      if (t.completed) {
        li.style.textDecoration = 'line-through';
        li.style.color = '#888';
      }

      const span = document.createElement('span');
      span.textContent = t.text;

      const delBtn = document.createElement('button');
      delBtn.dataset.action = 'delete'; // ② 标记按钮操作类型为 delete
      delBtn.textContent = '删除';
      delBtn.style.marginLeft = '10px';

      li.append(span, delBtn);
      todoList.appendChild(li);
    });
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

  function toggleTodo(id) {
    todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
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
  // 父容器 ul 统一接管列表点击事件（事件委托 + 三道边界防御）
  todoList.addEventListener('click', (e) => {
    // 防御 1：确保事件目标是 Element 元素节点
    if (!(e.target instanceof Element)) return;

    // 防御 2：向上查找最近的 li，且必须属于当前 todoList（点击列表空白处时 item 为 null）
    const item = e.target.closest('li');
    if (!item || !todoList.contains(item)) return;

    // 防御 3：读取 data-id 并确保非空
    const id = item.dataset.id;
    if (!id) return;

    // 操作分流：判断点击的是否为删除按钮
    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn && item.contains(delBtn)) {
      deleteTodo(id);
    } else {
      toggleTodo(id);
    }
  });
  // 初始化首次渲染
  render();
})();