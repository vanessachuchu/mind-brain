
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useThoughts } from "@/hooks/useThoughts";
import { useTodos } from "@/hooks/useTodos";
import { CalendarTimeTable } from "@/components/CalendarTimeTable";
import { Link } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

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
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          {/* 日曆區域 */}
          <Card className="bg-white/80 border-stone-200/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-light text-stone-700">選擇日期</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={zhTW}
                className="w-full"
                modifiers={{
                  hasThoughts: datesWithThoughts,
                  hasTodos: datesWithTodos
                }}
                modifiersClassNames={{
                  hasThoughts: "bg-primary/20 text-primary font-bold border border-primary/40",
                  hasTodos: "bg-accent/20 text-accent-foreground font-bold border border-accent/40"
                }}
              />
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  <span className="inline-block w-3 h-3 bg-primary/20 rounded border border-primary/40"></span>
                  <span>有思緒記錄</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg">
                  <span className="inline-block w-3 h-3 bg-accent/20 rounded border border-accent/40"></span>
                  <span>有待辦行程</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 右側區域：思緒卡片和時間表 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 思緒卡片區域 */}
            {selectedDateThoughts.length > 0 && (
              <Card className="bg-white/80 border-stone-200/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-light text-stone-700">
                    {format(selectedDate, "yyyy年MM月dd日", { locale: zhTW })} 的思緒
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {selectedDateThoughts.map(thought => (
                      <div
                        key={thought.id}
                        className="border border-stone-200 rounded-lg p-4 hover:border-stone-300 transition-colors bg-white/50"
                      >
                        <div className="text-sm text-stone-400 mb-2 font-light">
                          {format(new Date(parseInt(thought.id)), "HH:mm")}
                        </div>
                        <div className="mb-3 text-stone-700 font-light">{thought.content}</div>
                        <div className="flex justify-end">
                          <Link
                            to={`/thought/${thought.id}`}
                            className="text-sm underline text-stone-600 hover:text-stone-500 font-light"
                          >
                            查看詳情
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 時間表 */}
            <CalendarTimeTable selectedDate={selectedDate} />
          </div>
        </div>

      </main>
    </div>
  );
}
