
import { useState, useEffect } from 'react';

export interface Todo {
  id: string;
  content: string;
  thoughtId?: string;
  done: boolean;
  createdAt?: string;
  updatedAt?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

const STORAGE_KEY = 'todos-data';

const initialTodos: Todo[] = [];

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialTodos;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('addTodo called with:', todo);
    
    const newTodo = {
      ...todo,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Adding new todo:', newTodo);
    setTodos(prev => {
      const updated = [...prev, newTodo];
      console.log('Updated todos list, total count:', updated.length);
      console.log('All todos:', updated);
      return updated;
    });
  };

  // 新增：批量添加待辦事項
  const addTodos = (todos: Array<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>) => {
    console.log('addTodos called with:', todos.length, 'items');
    
    const newTodos = todos.map(todo => ({
      ...todo,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    console.log('Adding new todos:', newTodos);
    setTodos(prev => {
      const updated = [...prev, ...newTodos];
      console.log('Updated todos list after batch add, total count:', updated.length);
      console.log('All todos:', updated);
      return updated;
    });
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
        : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id: string) => {
    updateTodo(id, { done: !todos.find(t => t.id === id)?.done });
  };

  // 檢查日期是否在範圍內的輔助函數
  const isDateInRange = (date: string, startDate?: string, endDate?: string) => {
    if (!startDate) return false;
    
    const targetDate = new Date(date);
    const start = new Date(startDate);
    
    // 如果沒有結束日期，只檢查開始日期
    if (!endDate) {
      return date === startDate;
    }
    
    const end = new Date(endDate);
    return targetDate >= start && targetDate <= end;
  };

  // 新增：根據日期獲取待辦事項（支援多日範圍和可選結束日期）
  const getTodosByDate = (date: string) => {
    return todos.filter(todo => {
      // 檢查新的日期範圍格式
      if (todo.startDate) {
        return isDateInRange(date, todo.startDate, todo.endDate);
      }
      // 向後兼容舊的 scheduledDate 格式
      if (todo.scheduledDate) {
        return todo.scheduledDate === date;
      }
      return false;
    });
  };

  return {
    todos,
    addTodo,
    addTodos,
    updateTodo,
    deleteTodo,
    toggleTodo,
    getTodosByDate
  };
}
