import { test, expect, describe } from 'vitest';
import { addTodo, toggleTodo, Todo } from './todo';

describe('任务 2：手写基础单测（addTodo & toggleTodo）', () => {
  test('正常添加：文本内容正确', () => {
    const todos: Todo[] = [];
    addTodo(todos, '学习TS');
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('学习TS');
    expect(todos[0].completed).toBe(false);
  });

  test('纯空格：拦截', () => {
    const todos: Todo[] = [];
    addTodo(todos, '   ');
    expect(todos.length).toBe(0);
  });

  test('空字符串：拦截', () => {
    const todos: Todo[] = [];
    addTodo(todos, '');
    expect(todos.length).toBe(0);
  });

  test('切换完成状态：目标翻转，其他用例不受影响', () => {
    const todos: Todo[] = [
      { id: 1, text: '学习TS', completed: false },
      { id: 2, text: '写单测', completed: false },
    ];
    toggleTodo(todos, 1);
    expect(todos[0].completed).toBe(true);
    expect(todos[1].completed).toBe(false);
  });

  test('不存在的 ID 不崩溃', () => {
    const todos: Todo[] = [];
    toggleTodo(todos, 999);
    expect(todos.length).toBe(0);
  });
});

describe('任务 3：AI 审查修补后的多维度边界测试', () => {
  test('维度1（空值）：传入 null 或 undefined 应被拦截', () => {
    const todos: Todo[] = [];
    addTodo(todos, null as unknown as string);
    addTodo(todos, undefined as unknown as string);
    expect(todos.length).toBe(0);
  });

  test('维度2（格式）：前后带空格的合法文本应 trim 后保存', () => {
    const todos: Todo[] = [];
    addTodo(todos, '  重构代码  ');
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('重构代码');
  });

  test('维度4（越界）：输入超过 200 字符的超长文本应被拦截', () => {
    const todos: Todo[] = [];
    const longText = 'A'.repeat(201);
    addTodo(todos, longText);
    expect(todos.length).toBe(0);
  });

  test('维度6（重复）：连续添加相同文本应被拦截', () => {
    const todos: Todo[] = [];
    addTodo(todos, '学习TS');
    addTodo(todos, '学习TS');
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('学习TS');
  });

  test('维度3（类型）：toggleTodo 传入 NaN 或非整数 ID 不改变状态', () => {
    const todos: Todo[] = [{ id: 1, text: '学习TS', completed: false }];
    toggleTodo(todos, NaN);
    toggleTodo(todos, 1.5);
    expect(todos[0].completed).toBe(false);
  });
});