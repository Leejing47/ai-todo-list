import React from 'react';
import { Todo } from '../todo';
import { useTheme } from '../context/ThemeContext';

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps): React.JSX.Element {
  // 消费 ThemeContext（第 3 个消费组件）
  const { theme } = useTheme();

  function getTextColor(): string {
    if (todo.completed) return '#888888';
    return theme === 'dark' ? '#f1f5f9' : '#1e293b';
  }

  return (
    <li className={`todo-item todo-item-${theme}`}>
      <span
        onClick={() => onToggle(todo.id)}
        style={{
          textDecoration: todo.completed ? 'line-through' : 'none',
          color: getTextColor(),
        }}
      >
        {todo.text}
      </span>
      <button type="button" className="complete-btn" onClick={() => onToggle(todo.id)}>
        {todo.completed ? '撤销' : '完成'}
      </button>
      <button type="button" className="edit-btn" onClick={() => onEdit(todo.id)}>
        编辑
      </button>
      <button type="button" className="delete-btn" onClick={() => onDelete(todo.id)}>
        删除
      </button>
    </li>
  );
}