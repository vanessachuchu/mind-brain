
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThoughtCard from "@/components/ThoughtCard";
import NewThoughtDialog from "@/components/NewThoughtDialog";
import { CarouselThoughts } from "@/components/ui/carousel-thoughts";
import { CalendarTimeTable } from "@/components/CalendarTimeTable";
import { useThoughts } from "@/hooks/useThoughts";
import { useTodos } from "@/hooks/useTodos";
import { useAuth } from "@/contexts/AuthContext";
import { format, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function Index() {
  const {
    user,
    loading
  } = useAuth();
  const {
    thoughts
  } = useThoughts();
  const {
    todos
  } = useTodos();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isNewThoughtDialogOpen, setIsNewThoughtDialogOpen] = useState(false);

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

        {/* 主要內容 */}
        {!loading && (
          <>
            {/* 日曆和思緒並排區域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 左側：思緒日曆 */}
              <Card className="shadow-soft border border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 font-medium">
                    <CalendarIcon className="w-6 h-6" />
                    思緒日曆
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar 
                    mode="single" 
                    selected={selectedDate} 
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setCurrentCardIndex(0); // 重置卡片索引
                      }
                    }} 
                    locale={zhTW} 
                    modifiers={{
                      hasThoughts: getDatesWithThoughts(),
                      hasTodos: getDatesWithTodos()
                    }} 
                    modifiersClassNames={{
                      hasThoughts: "bg-primary/20 text-primary font-bold border border-primary/40",
                      hasTodos: "bg-accent/20 text-accent-foreground font-bold border border-accent/40"
                    }} 
                    className="w-full rounded-lg" 
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

              {/* 右側：選定日期的思緒 */}
              <Card className="shadow-soft border border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2 font-medium">
                    <CalendarIcon className="w-6 h-6" />
                    {format(selectedDate, 'yyyy年MM月dd日', { locale: zhTW })} 的思緒
                    {getThoughtsForDate(selectedDate).length > 0 && (
                      <Badge variant="secondary">
                        {getThoughtsForDate(selectedDate).length} 條記錄
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getThoughtsForDate(selectedDate).length > 0 ? (
                    <CarouselThoughts 
                      currentIndex={currentCardIndex} 
                      onIndexChange={setCurrentCardIndex}
                    >
                      {getThoughtsForDate(selectedDate).map(thought => (
                        <ThoughtCard key={thought.id} id={thought.id} content={thought.content} />
                      ))}
                    </CarouselThoughts>
                  ) : (
                    <div className="flex items-center justify-center text-center text-muted-foreground min-h-[200px]">
                      <div>
                        <div className="text-4xl mb-4">📅</div>
                        <p className="text-lg mb-2">
                          {format(selectedDate, 'MM月dd日', { locale: zhTW })}沒有思緒記錄
                        </p>
                        <p className="text-sm">在這天記錄一些想法吧</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 時間表 - 顯示選定日期的待辦事項 */}
            <Card className="mb-6 shadow-soft border border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 font-medium">
                  <CalendarIcon className="w-6 h-6" />
                  {isSameDay(selectedDate, new Date()) ? '今日行程安排' : `${format(selectedDate, 'MM月dd日', { locale: zhTW })}行程安排`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CalendarTimeTable selectedDate={selectedDate} />
              </CardContent>
            </Card>
            
            {/* 浮動新思緒按鈕 */}
            <button 
              onClick={() => setIsNewThoughtDialogOpen(true)} 
              className="fab"
            >
              ✨
            </button>

            {/* 新思緒對話框 */}
            <NewThoughtDialog 
              isOpen={isNewThoughtDialogOpen} 
              onClose={() => setIsNewThoughtDialogOpen(false)}
              onThoughtAdded={() => {
                // 強制重新計算今日思緒
                setSelectedDate(new Date());
                setCurrentCardIndex(0);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
