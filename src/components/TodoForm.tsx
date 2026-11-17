import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export interface TodoFormProps {
  onAdd: (text: string) => boolean;
  onClearMessage: () => void;
}

export function TodoForm({ onAdd, onClearMessage }: TodoFormProps): React.JSX.Element {
  // 消费 ThemeContext（第 2 个消费组件）
  const { theme } = useTheme();
  const [text, setText] = useState<string>('');

  function handleSubmit(): void {
    const success = onAdd(text);
    if (success) {
      setText('');
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setText(e.target.value);
    onClearMessage();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (!e.nativeEvent.isComposing && e.key === 'Enter') {
      handleSubmit();
    }
  }

  return (
    <div className="input-container">
      <input
        type="text"
        className={`todo-input todo-input-${theme}`}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="请输入待办事项..."
      />
      <button type="button" onClick={handleSubmit}>
        添加
      </button>
    </div>
  );
}