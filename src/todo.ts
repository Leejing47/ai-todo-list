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
  const hasValidId = typeof record.id === 'number' && Number.isSafeInteger(record.id);
  const hasValidText = typeof record.text === 'string' && record.text.trim().length > 0;
  return hasValidId && hasValidText && typeof record.completed === 'boolean';
}

/**
 * 解析并校验来自 dataset.id 的字符串 ID
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
  return todos.some((t) => t.text === text && t.id !== excludeId);
}

/**
 * 核心纯函数：添加待办事项
 */
export function addTodo(todos: Todo[], text: string): boolean {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed === '' || trimmed.length > MAX_TEXT_LENGTH) return false;
  if (isDuplicate(todos, trimmed)) return false;

  const nextId = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : Date.now();
  todos.push({
    id: nextId,
    text: trimmed,
    completed: false,
  });
  return true;
}

/**
 * 核心纯函数：切换待办事项完成状态
 */
export function toggleTodo(todos: Todo[], id: number): boolean {
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return false;
  const target = todos.find((t) => t.id === id);
  if (!target) return false;
  target.completed = !target.completed;
  return true;
}

/**
 * 核心纯函数：删除待办事项
 */
export function deleteTodo(todos: Todo[], id: number): boolean {
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return false;
  const index = todos.findIndex((t) => t.id === id);
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

  const target = todos.find((t) => t.id === id);
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
 * 辅助渲染单条 Todo DOM 节点（抽离函数以降低 render 复杂度）
 */
function createTodoItemElement(todo: Todo): HTMLLIElement {
  const li = document.createElement('li');
  li.dataset.id = String(todo.id);

  const span = document.createElement('span');
  span.textContent = todo.text;
  if (todo.completed) {
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
  return li;
}

/**
 * 校验输入框待办文本并返回错误提示信息（返回 null 表示校验通过）
 */
function validateInputText(todos: Todo[], rawValue: string): string | null {
  const text = rawValue.trim();
  if (text === '') return '请输入有效的待办事项！';
  if (text.length > MAX_TEXT_LENGTH) return `待办事项长度不能超过 ${MAX_TEXT_LENGTH} 个字符！`;
  if (isDuplicate(todos, text)) return '该待办事项已存在，请勿重复添加。';
  return null;
}

/**
 * 浏览器端 DOM 挂载与交互初始化
 */
export function initTodoApp(): void {
  if (typeof document === 'undefined') return;

  const todoInputEl = document.getElementById('todoInput');
  const addBtnEl = document.getElementById('addBtn');
  const todoListEl = document.getElementById('todoList');
  const statusMsgEl = document.getElementById('statusMsg');

  if (
    !(todoInputEl instanceof HTMLInputElement) ||
    !(addBtnEl instanceof HTMLButtonElement) ||
    !(todoListEl instanceof HTMLUListElement)
  ) {
    return;
  }

  const todoInput: HTMLInputElement = todoInputEl;
  const addBtn: HTMLButtonElement = addBtnEl;
  const todoList: HTMLUListElement = todoListEl;
  const statusMsg: HTMLElement | null = statusMsgEl instanceof HTMLElement ? statusMsgEl : null;

  const todos: Todo[] = loadTodos();

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
    todos.forEach((t) => {
      todoList.appendChild(createTodoItemElement(t));
    });
  }

  function syncAndRender(): void {
    saveTodos(todos);
    render();
  }

  function handleAdd(): void {
    const errorMsg = validateInputText(todos, todoInput.value);
    if (errorMsg !== null) {
      showMessage(errorMsg, 'error');
      if (isDuplicate(todos, todoInput.value.trim())) {
        todoInput.value = '';
      }
      todoInput.focus();
      return;
    }

    addTodo(todos, todoInput.value);
    syncAndRender();
    todoInput.value = '';
    todoInput.focus();
    clearMessage();
  }

  function handleEditAction(id: number): void {
    const current = todos.find((t) => t.id === id);
    if (!current) return;

    const input = window.prompt('修改任务', current.text);
    if (input === null || input.trim() === '') return;

    const trimmed = input.trim();
    if (isDuplicate(todos, trimmed, id)) {
      showMessage('修改后的待办事项已存在！', 'error');
      return;
    }

    updateTodo(todos, id, trimmed);
    syncAndRender();
    clearMessage();
  }

  function handleListClick(e: MouseEvent): void {
    if (!(e.target instanceof Element)) return;

    const item = e.target.closest('li');
    if (!(item instanceof HTMLLIElement) || !todoList.contains(item)) return;

    const id = parseSafeId(item.dataset.id);
    if (id === null) return;

    const delBtn = e.target.closest('[data-action="delete"]');
    const editBtn = e.target.closest('[data-action="edit"]');

    if (delBtn && item.contains(delBtn)) {
      deleteTodo(todos, id);
      syncAndRender();
      return;
    }
    if (editBtn && item.contains(editBtn)) {
      handleEditAction(id);
      return;
    }
    toggleTodo(todos, id);
    syncAndRender();
  }

  addBtn.addEventListener('click', handleAdd);
  todoInput.addEventListener('keydown', (e: KeyboardEvent): void => {
    if (!e.isComposing && e.key === 'Enter') handleAdd();
  });
  todoInput.addEventListener('input', clearMessage);
  todoList.addEventListener('click', handleListClick);

  render();
}

if (typeof document !== 'undefined') {
  initTodoApp();
}