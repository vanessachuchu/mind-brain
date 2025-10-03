
import { useState, useMemo } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThoughtCard from "@/components/ThoughtCard";
import NewThoughtDialog from "@/components/NewThoughtDialog";
import { CarouselThoughts } from "@/components/ui/carousel-thoughts";
import { CalendarTimeTable } from "@/components/CalendarTimeTable";
import { SimpleDragCalendar } from "@/components/SimpleDragCalendar";
import { TestCalendar } from "@/components/TestCalendar";
import { useThoughts } from "@/hooks/useThoughts";
import { useTodos } from "@/hooks/useTodos";
import { format, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function Index() {
  const {
    thoughts
  } = useThoughts();
  const {
    todos
  } = useTodos();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isNewThoughtDialogOpen, setIsNewThoughtDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 獲取指定日期的思緒
  const getThoughtsForDate = (date: Date) => {
    return thoughts.filter(thought => {
      const thoughtDate = new Date(thought.createdAt || Date.now());
      return isSameDay(thoughtDate, date);
    });
  };

  // 獲取有思緒記錄的日期
  const getDatesWithThoughts = () => {
    return thoughts.map(thought => new Date(thought.createdAt || Date.now()));
  };

  // 緩存當前日期的思緒
  const currentDayThoughts = useMemo(() => 
    getThoughtsForDate(selectedDate), 
    [thoughts, selectedDate, refreshKey]
  );

  // 獲取最新思緒內容用於 AI 分析
  const getLatestThoughtContent = () => {
    const latestThought = thoughts[thoughts.length - 1];
    return latestThought?.content || "";
  };

  // 獲取最近的 AI 消息
  const getRecentAiMessages = () => {
    return []; // 這裡可以從本地存儲或狀態中獲取 AI 對話記錄
  };

  // 生成日期範圍的輔助函數
  const generateDateRange = (startDate: string, endDate?: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // 獲取有待辦事項的日期（支援多日範圍）
  const getDatesWithTodos = () => {
    const dates: Date[] = [];
    const dateStrings = new Set();
    
    todos.forEach(todo => {
      let rangeDates: string[] = [];
      
      // 處理新的日期範圍格式
      if (todo.startDate) {
        rangeDates = generateDateRange(todo.startDate, todo.endDate);
      }
      // 向後兼容舊的 scheduledDate 格式
      else if (todo.scheduledDate) {
        rangeDates = [todo.scheduledDate];
      }
      
      rangeDates.forEach(dateStr => {
        if (!dateStrings.has(dateStr)) {
          dateStrings.add(dateStr);
          dates.push(new Date(dateStr));
        }
      });
    });
    
    return dates;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 歡迎區塊 */}
        <Card className="mb-6 shadow-soft border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="text-center py-6">
            <div className="text-3xl mb-3">🧘‍♀️</div>
            <h2 className="text-xl font-light mb-3">歡迎來到思緒探索空間</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              這是一個專為冥想和正念設計的數位空間。記錄日常想法、與 AI 進行深度對話、將思緒轉化為具體行動。
            </p>
            
          </CardContent>
        </Card>

        {/* 智慧拖拽日曆 */}
        <SimpleDragCalendar
          thoughtContent={getLatestThoughtContent()}
          aiMessages={getRecentAiMessages()}
        />
        
        {/* 浮動新思緒按鈕 - 兩種模式都顯示 */}
        <button 
          onClick={() => setIsNewThoughtDialogOpen(true)} 
          className="fixed bottom-20 right-6 px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white rounded-full shadow-2xl flex items-center gap-3 text-base font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 z-50 animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          <span className="text-xl">✨</span>
          <span className="hidden sm:inline">記錄想法</span>
        </button>

        {/* 新思緒對話框 */}
        <NewThoughtDialog 
          isOpen={isNewThoughtDialogOpen} 
          onClose={() => setIsNewThoughtDialogOpen(false)}
          onThoughtAdded={() => {
            // 強制重新渲染
            setRefreshKey(prev => prev + 1);
            setCurrentCardIndex(0);
            
            // 如果當前不是今天，切換到今天以顯示新添加的思緒
            const today = new Date();
            if (!isSameDay(selectedDate, today)) {
              setSelectedDate(today);
            }
          }}
        />
      </main>
    </div>
  );
}
