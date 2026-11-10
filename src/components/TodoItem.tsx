import React from 'react';
import { Todo } from '../todo';

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps): React.JSX.Element {
  return (
    <li>
      <span
        onClick={() => onToggle(todo.id)}
        style={{
          textDecoration: todo.completed ? 'line-through' : 'none',
          color: todo.completed ? '#888' : '#000',
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