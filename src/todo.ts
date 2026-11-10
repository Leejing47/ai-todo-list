export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const KEY = 'todos';
export const MAX_TEXT_LENGTH = 200;

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
 * 判断是否存在重复的待办文本（排除指定 ID）
 */
export function isDuplicate(todos: Todo[], text: string, excludeId?: number): boolean {
  return todos.some((t) => t.text === text && t.id !== excludeId);
}

/**
 * 校验输入框待办文本并返回错误提示信息（返回 null 表示校验通过）
 */
export function validateInputText(todos: Todo[], rawValue: string): string | null {
  if (typeof rawValue !== 'string') return '请输入有效的待办事项！';
  const text = rawValue.trim();
  if (text === '') return '请输入有效的待办事项！';
  if (text.length > MAX_TEXT_LENGTH) return `待办事项长度不能超过 ${MAX_TEXT_LENGTH} 个字符！`;
  if (isDuplicate(todos, text)) return '该待办事项已存在，请勿重复添加。';
  return null;
}

/**
 * 核心纯函数：添加待办事项（供单元测试回归与业务校验复用）
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
 * 核心纯函数：切换待办事项完成状态（供单元测试回归与业务校验复用）
 */
export function toggleTodo(todos: Todo[], id: number): boolean {
  if (typeof id !== 'number' || !Number.isSafeInteger(id)) return false;
  const target = todos.find((t) => t.id === id);
  if (!target) return false;
  target.completed = !target.completed;
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