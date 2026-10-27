export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export type FilterType = 'all' | 'done' | 'undone';

const KEY = 'todos';
const MAX_TEXT_LENGTH = 200;

/**
 * 校验并过滤单条 Todo 数据，防止 localStorage 等外部脏数据进入运行时
 */
export function isValidTodo(item: unknown): item is Todo {
  if (typeof item !== 'object' || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    Number.isSafeInteger(record.id) &&
    typeof record.text === 'string' &&
    record.text.trim().length > 0 &&
    typeof record.completed === 'boolean'
  );
}

/**
 * 解析并校验来自 dataset.id 的字符串 ID
 * 拦截 undefined、空字符串 ''、浮点数 '1.5'、非数字 '123abc' 等脏数据
 */
export function parseSafeId(raw: string | undefined): number | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

/**
 * 判断是否存在重复的待办文本（排除指定 ID）
 */
export function isDuplicate(todos: Todo[], text: string, excludeId?: number): boolean {
  return todos.some(t => t.text === text && t.id !== excludeId);
}

/**
 * 核心纯函数：添加待办事项
 * 契约：
 * 1. 输入合法文本，向 todos 数组添加新事项（id 为安全整数，completed 为 false）
 * 2. 输入非字符串、空字符串、纯空格、重复文本或超长文本（>200字符），静默拦截不改变原数组
 */
export function addTodo(todos: Todo[], text: string): boolean {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed === '' || trimmed.length > MAX_TEXT_LENGTH) return false;
  if (isDuplicate(todos, trimmed)) return false;

  const nextId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : Date.now();
  todos.push({
    id: nextId,
    text: trimmed,
    completed: false,
  });
  return true;
}

/**
 * 核心纯函数：切换待办事项完成状态
 * 契约：
 * 1. 找到匹配的安全整数 ID，翻转其 completed 状态，其余项不受影响
 * 2. ID 不存在或非安全整数时，安静返回不崩溃，原数组保持不变
 */
export function toggleTodo(todos: Todo[], id: number): boolean {
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return false;
  const target = todos.find(t => t.id === id);
  if (!target) return false;
  target.completed = !target.completed;
  return true;
}

/**
 * 核心纯函数：删除待办事项
 */
export function deleteTodo(todos: Todo[], id: number): boolean {
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return false;
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}

/**
 * 核心纯函数：更新待办事项文本
 */
export function updateTodo(todos: Todo[], id: number, newText: string): boolean {
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return false;
  if (typeof newText !== 'string') return false;
  const trimmed = newText.trim();
  if (trimmed === '' || trimmed.length > MAX_TEXT_LENGTH) return false;
  if (isDuplicate(todos, trimmed, id)) return false;

  const target = todos.find(t => t.id === id);
  if (!target) return false;
  target.text = trimmed;
  return true;
}

/**
 * 持久化读取：防御 localStorage 解析异常与脏数据
 */
export function loadTodos(): Todo[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidTodo);
  } catch {
    return [];
  }
}

/**
 * 持久化保存
 */
export function saveTodos(todos: Todo[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(todos));
}

/**
 * 浏览器端 DOM 挂载与交互初始化（仅在浏览器 DOM 环境下执行，不影响 Node.js / Vitest 单元测试）
 */
export function initTodoApp(): void {
  if (typeof document === 'undefined') return;

  const todoInputEl = document.getElementById('todoInput');
  const addBtnEl = document.getElementById('addBtn');
  const todoListEl = document.getElementById('todoList');
  const statusMsgEl = document.getElementById('statusMsg');

  // DOM 空值与类型防御：使用 instanceof 收窄类型，绝不使用 ! 非空断言
  if (
    !(todoInputEl instanceof HTMLInputElement) ||
    !(addBtnEl instanceof HTMLButtonElement) ||
    !(todoListEl instanceof HTMLUListElement)
  ) {
    const msg = '页面初始化失败：缺少必要的 DOM 元素。';
    if (statusMsgEl instanceof HTMLElement) {
      statusMsgEl.textContent = msg;
      statusMsgEl.dataset.type = 'error';
    } else if (typeof console !== 'undefined') {
      console.error(msg);
    }
    return;
  }

  const todoInput: HTMLInputElement = todoInputEl;
  const addBtn: HTMLButtonElement = addBtnEl;
  const todoList: HTMLUListElement = todoListEl;
  const statusMsg: HTMLElement | null = statusMsgEl instanceof HTMLElement ? statusMsgEl : null;

  let todos: Todo[] = loadTodos();
  const filter: FilterType = 'all';

  function showMessage(message: string, type: 'info' | 'error' = 'info'): void {
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.dataset.type = type;
  }

  function clearMessage(): void {
    if (!statusMsg) return;
    statusMsg.textContent = '';
    delete statusMsg.dataset.type;
  }

  function render(): void {
    todoList.innerHTML = '';

    const shown = todos.filter(t =>
      filter === 'all' ? true : filter === 'done' ? t.completed : !t.completed
    );

    shown.forEach(t => {
      const li = document.createElement('li');
      li.dataset.id = String(t.id);

      const span = document.createElement('span');
      span.textContent = t.text;
      if (t.completed) {
        span.style.textDecoration = 'line-through';
        span.style.color = '#888';
      }

      const editBtn = document.createElement('button');
      editBtn.dataset.action = 'edit';
      editBtn.textContent = '编辑';

      const delBtn = document.createElement('button');
      delBtn.dataset.action = 'delete';
      delBtn.textContent = '删除';

      li.append(span, editBtn, delBtn);
      todoList.appendChild(li);
    });
  }

  function handleAdd(): void {
    const text = todoInput.value.trim();
    if (text === '') {
      showMessage('请输入有效的待办事项！', 'error');
      todoInput.focus();
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      showMessage(`待办事项长度不能超过 ${MAX_TEXT_LENGTH} 个字符！`, 'error');
      todoInput.focus();
      return;
    }
    if (isDuplicate(todos, text)) {
      showMessage('该待办事项已存在，请勿重复添加。', 'error');
      todoInput.value = '';
      todoInput.focus();
      return;
    }

    addTodo(todos, text);
    saveTodos(todos);
    render();

    todoInput.value = '';
    todoInput.focus();
    clearMessage();
  }

  addBtn.addEventListener('click', handleAdd);
  todoInput.addEventListener('keydown', (e: KeyboardEvent): void => {
    if (e.isComposing) return;
    if (e.key === 'Enter') handleAdd();
  });
  todoInput.addEventListener('input', clearMessage);

  // 父容器事件委托（严格遵循：instanceof 收窄 -> 读取 dataset.id -> Number() + isSafeInteger 校验）
  todoList.addEventListener('click', (e: MouseEvent): void => {
    // 第一道防御：target 必须是 Element
    if (!(e.target instanceof Element)) return;

    // 第二道防御：向上定位 HTMLLIElement，且必须在当前 todoList 内
    const item = e.target.closest('li');
    if (!(item instanceof HTMLLIElement) || !todoList.contains(item)) return;

    // 第三道防御：读取 dataset.id，用 Number() 转换并用 Number.isSafeInteger 校验，拒绝空串/小数/NaN
    const rawId = item.dataset.id;
    if (!rawId || rawId.trim() === '') return;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id)) return;

    const delBtn = e.target.closest('[data-action="delete"]');
    const editBtn = e.target.closest('[data-action="edit"]');

    if (delBtn && item.contains(delBtn)) {
      deleteTodo(todos, id);
      saveTodos(todos);
      render();
    } else if (editBtn && item.contains(editBtn)) {
      const current = todos.find(t => t.id === id);
      if (!current) return;
      const input = window.prompt('修改任务', current.text);
      if (input !== null && input.trim() !== '') {
        const trimmed = input.trim();
        if (isDuplicate(todos, trimmed, id)) {
          showMessage('修改后的待办事项已存在！', 'error');
          return;
        }
        updateTodo(todos, id, trimmed);
        saveTodos(todos);
        render();
        clearMessage();
      }
    } else {
      toggleTodo(todos, id);
      saveTodos(todos);
      render();
    }
  });

  render();
}

// 浏览器环境下自动挂载
if (typeof document !== 'undefined') {
  initTodoApp();
}