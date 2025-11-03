
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useThoughts } from "@/hooks/useThoughts";
import { useTodos } from "@/hooks/useTodos";
import { CalendarTimeTable } from "@/components/CalendarTimeTable";
import { DragCalendar } from "@/components/DragCalendar";
import { Link } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, Calendar as CalendarIcon, Move } from "lucide-react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { thoughts } = useThoughts();
  const { getTodosByDate } = useTodos();

  // 獲取選定日期的思緒卡片
  const getThoughtsForDate = (date: Date) => {
    return thoughts.filter(thought => {
      const thoughtDate = new Date(parseInt(thought.id));
      return isSameDay(thoughtDate, date);
    });
  };

  // 獲取有卡片記錄的日期
  const getDatesWithThoughts = () => {
    return thoughts.map(thought => new Date(parseInt(thought.id)));
  };

  // 獲取有待辦事項的日期
  const getDatesWithTodos = () => {
    const dates: Date[] = [];
    const dateStrings = new Set();
    
    // 從所有待辦事項中提取日期
    const allTodos = JSON.parse(localStorage.getItem('todos-data') || '[]');
    allTodos.forEach((todo: any) => {
      if (todo.scheduledDate && !dateStrings.has(todo.scheduledDate)) {
        dateStrings.add(todo.scheduledDate);
        dates.push(new Date(todo.scheduledDate));
      }
    });
    
    return dates;
  };

  const selectedDateThoughts = getThoughtsForDate(selectedDate);
  const selectedDateString = format(selectedDate, "yyyy-MM-dd");
  const selectedDateTodos = getTodosByDate(selectedDateString);
  
  const datesWithThoughts = getDatesWithThoughts();
  const datesWithTodos = getDatesWithTodos();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回首頁</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">思緒日曆</h1>
            <p className="text-sm text-muted-foreground">時間軸上的思維軌跡</p>
          </div>
          
          <div className="w-16"></div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        <DragCalendar
          thoughtContent={selectedDateThoughts.length > 0 ? selectedDateThoughts[0].content : ""}
          aiMessages={[]}
        />
      </main>
    </div>
  );
}
