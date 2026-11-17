import React, { useState, useEffect } from 'react';
import {
  Todo,
  loadTodos,
  saveTodos,
  validateInputText,
  isDuplicate,
  MAX_TEXT_LENGTH,
} from '../todo';
import { useTheme } from '../context/ThemeContext';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';

export function TodoApp(): React.JSX.Element {
  // 1. 消费 ThemeContext（第 1 个消费组件）
  const { theme, toggleTheme } = useTheme();

  // 2. 惰性初始化：仅在组件首次挂载时同步读取一次 localStorage
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 3. 单一 Effect 写入：仅在 todos 变化时同步写入 localStorage，不做双 Effect
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  function handleAdd(rawText: string): boolean {
    const error = validateInputText(todos, rawText);
    if (error !== null) {
      setErrorMsg(error);
      return false;
    }

    const trimmed = rawText.trim();
    const newTodo: Todo = {
      id: Date.now(),
      text: trimmed,
      completed: false,
    };
    setTodos((prev) => [...prev, newTodo]);
    setErrorMsg('');
    return true;
  }

  function handleToggle(id: number): void {
    if (!Number.isSafeInteger(id)) return;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function handleDelete(id: number): void {
    if (!Number.isSafeInteger(id)) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function handleEdit(id: number): void {
    const current = todos.find((t) => t.id === id);
    if (!current) return;

    const input = window.prompt('修改任务', current.text);
    if (input === null || input.trim() === '') return;

    const trimmed = input.trim();
    if (trimmed.length > MAX_TEXT_LENGTH) {
      setErrorMsg(`待办事项长度不能超过 ${MAX_TEXT_LENGTH} 个字符！`);
      return;
    }
    if (isDuplicate(todos, trimmed, id)) {
      setErrorMsg('修改后的待办事项已存在！');
      return;
    }

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t))
    );
    setErrorMsg('');
  }

  return (
    <div className={`app-container theme-${theme}`}>
      <div className="header-bar">
        <h1>My Todo List</h1>
        <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 切换深色 (Dark)' : '☀️ 切换浅色 (Light)'}
        </button>
      </div>
      <TodoForm onAdd={handleAdd} onClearMessage={() => setErrorMsg('')} />
      <p
        className="status-msg"
        data-type={errorMsg ? 'error' : undefined}
        role="alert"
        aria-live="polite"
      >
        {errorMsg}
      </p>
      <TodoList
        todos={todos}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </div>
  );
}