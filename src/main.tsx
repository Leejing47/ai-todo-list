import React from 'react';
import ReactDOM from 'react-dom/client';
import { TodoApp } from './components/TodoApp';

const rootElement = document.body.firstElementChild;
if (rootElement instanceof HTMLElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TodoApp />
    </React.StrictMode>
  );
}