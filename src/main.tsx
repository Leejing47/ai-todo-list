import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { TodoApp } from './components/TodoApp';

const rootElement = document.body.firstElementChild;
if (rootElement instanceof HTMLElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <TodoApp />
      </ThemeProvider>
    </React.StrictMode>
  );
}