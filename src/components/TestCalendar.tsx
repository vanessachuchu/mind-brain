import { useState, useMemo } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { useThoughts } from '@/hooks/useThoughts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { isSameDay } from 'date-fns';

export function TestCalendar() {
  try {
    const { todos, addTodo, updateTodo } = useTodos();
    const { thoughts, addThought } = useThoughts();

    // 測試 actionList 過濾
    const actionList = useMemo(() => {
      if (!Array.isArray(todos)) return [];
      return todos.filter(todo =>
        todo && !todo.done && !todo.scheduledDate && !todo.startDate && todo.thoughtId
      );
    }, [todos]);

    // 測試 availableTodos 過濾
    const availableTodos = useMemo(() => {
      if (!Array.isArray(todos)) return [];
      return todos.filter(todo =>
        todo && !todo.done && !todo.scheduledDate && !todo.startDate && !todo.thoughtId
      );
    }, [todos]);

    // 測試 todayThoughts 過濾
    const todayThoughts = useMemo(() => {
      const today = new Date();
      if (!Array.isArray(thoughts)) return [];
      return thoughts.filter(thought => {
        if (!thought || !thought.createdAt) return false;
        const thoughtDate = new Date(thought.createdAt);
        return isSameDay(thoughtDate, today);
      });
    }, [thoughts]);

    return (
      <div className="p-4 space-y-4">
        <Card className="bg-green-200">
          <CardHeader>
            <h2 className="text-xl font-bold">測試結果</h2>
          </CardHeader>
          <CardContent>
            <p>Total Todos: {todos?.length || 0}</p>
            <p>Action List (有 thoughtId): {actionList.length}</p>
            <p>Available Todos (無 thoughtId): {availableTodos.length}</p>
            <p>Total Thoughts: {thoughts?.length || 0}</p>
            <p>Today Thoughts: {todayThoughts.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-200">
          <CardHeader>
            <h3 className="font-bold">我的行動清單</h3>
          </CardHeader>
          <CardContent>
            {actionList.map(todo => (
              <div key={todo.id} className="p-2 bg-white mb-2 rounded">
                {todo.content}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-purple-200">
          <CardHeader>
            <h3 className="font-bold">未安排事項</h3>
          </CardHeader>
          <CardContent>
            {availableTodos.map(todo => (
              <div key={todo.id} className="p-2 bg-white mb-2 rounded">
                {todo.content}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-red-200 border-4 border-red-800">
        <h1 className="text-2xl font-bold">錯誤</h1>
        <p>{String(error)}</p>
      </div>
    );
  }
}
