import { useState, useRef, useCallback, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, List, Users, Heart, Lightbulb, Sparkles, Edit, Trash2 } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { useAiActionGenerator, ActionItem } from '@/hooks/useAiActionGenerator';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'health' | 'meeting';
  date: string;
  time: string;
  duration?: number;
}

interface DraggedTodo {
  id: string;
  title: string;
  type: 'personal' | 'work' | 'health' | 'meeting';
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

const EVENT_STYLES = {
  personal: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 text-blue-700 dark:text-blue-300 border-l-4 border-l-blue-500 shadow-sm',
  work: 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 text-amber-700 dark:text-amber-300 border-l-4 border-l-amber-500 shadow-sm',
  health: 'bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 text-emerald-700 dark:text-emerald-300 border-l-4 border-l-emerald-500 shadow-sm',
  meeting: 'bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900 text-rose-700 dark:text-rose-300 border-l-4 border-l-rose-500 shadow-sm'
};

const TAG_STYLES = {
  personal: 'bg-gradient-primary text-primary-foreground shadow-sm',
  work: 'bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 text-amber-800 dark:text-amber-200 shadow-sm', 
  health: 'bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-sm',
  meeting: 'bg-gradient-to-r from-rose-100 to-rose-200 dark:from-rose-900 dark:to-rose-800 text-rose-800 dark:text-rose-200 shadow-sm'
};

const CATEGORY_ICONS = {
  personal: List,
  work: Users,
  health: Heart,
  meeting: Calendar
};

interface DragCalendarProps {
  thoughtContent?: string;
  aiMessages?: Array<{role: string; content: string}>;
}

export function DragCalendar({ thoughtContent = "", aiMessages = [] }: DragCalendarProps) {
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  const { generateActionPlan, isGenerating } = useAiActionGenerator();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draggedTodo, setDraggedTodo] = useState<DraggedTodo | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<ActionItem[]>([]);
  const [thoughtInput, setThoughtInput] = useState(thoughtContent);
  const [showThoughtDialog, setShowThoughtDialog] = useState(false);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  // 輔助函數
  const getPriorityType = (priority: string): 'personal' | 'work' | 'health' | 'meeting' => {
    switch (priority) {
      case 'high': return 'meeting';
      case 'medium': return 'work';
      case 'low': return 'personal';
      default: return 'personal';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-50 to-red-100';
      case 'medium': return 'from-amber-50 to-amber-100';
      case 'low': return 'from-green-50 to-green-100';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  // 獲取未完成的待辦事項
  const availableTodos = useMemo(() => {
    return todos.filter(todo => !todo.done && !todo.scheduledDate).map(todo => ({
      id: todo.id,
      title: todo.content,
      type: (todo.category?.toLowerCase() || 'personal') as 'personal' | 'work' | 'health' | 'meeting',
      description: todo.notes || ''
    }));
  }, [todos]);

  // 日期導航
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
    }
  };

  // 獲取顯示的日期範圍
  const getDisplayDates = () => {
    if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      return [currentDate];
    }
  };

  // AI 建議生成
  const handleGenerateAiSuggestions = async () => {
    if (!thoughtInput.trim()) {
      setShowThoughtDialog(true);
      return;
    }
    
    try {
      const suggestions = await generateActionPlan(thoughtInput, aiMessages);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('生成 AI 建議失敗:', error);
    }
  };

  // 拖拽處理
  const handleDragStart = (todo: any, e: React.DragEvent) => {
    const dragData: DraggedTodo = {
      id: todo.id,
      title: todo.title || todo.content,
      type: todo.type || 'personal'
    };
    
    setDraggedTodo(dragData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverCell(cellId);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date, time?: string) => {
    e.preventDefault();
    setDragOverCell(null);

    if (!draggedTodo) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const timeString = time || '09:00';

    // 檢查是否為 AI 建議
    const isAiSuggestion = aiSuggestions.some(s => s.id === draggedTodo.id);
    
    if (isAiSuggestion) {
      // 將 AI 建議轉換為待辦事項
      const suggestion = aiSuggestions.find(s => s.id === draggedTodo.id);
      if (suggestion) {
        addTodo({
          content: suggestion.content,
          done: false,
          scheduledDate: dateString,
          scheduledTime: timeString,
          startDate: dateString,
          startTime: timeString,
          category: suggestion.category
        });
        
        // 從 AI 建議中移除
        setAiSuggestions(prev => prev.filter(s => s.id !== draggedTodo.id));
      }
    } else {
      // 更新現有待辦事項
      updateTodo(draggedTodo.id, {
        scheduledDate: dateString,
        scheduledTime: timeString,
        startDate: dateString,
        startTime: timeString
      });
    }

    // 創建新的日曆事件
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: draggedTodo.title,
      type: draggedTodo.type,
      date: dateString,
      time: timeString,
      duration: 60
    };

    setEvents(prev => [...prev, newEvent]);
    setDraggedTodo(null);
  };

  const handleDragEnd = () => {
    setDraggedTodo(null);
    setDragOverCell(null);
  };

  // 渲染待辦事項
  const renderTodoItem = (todo: any) => {
    const IconComponent = CATEGORY_ICONS[todo.type];
    return (
      <div
        key={todo.id}
        draggable
        onDragStart={(e) => handleDragStart(todo, e)}
        onDragEnd={handleDragEnd}
        className="bg-gradient-secondary border border-border/50 rounded-xl p-4 mb-3 cursor-grab hover:shadow-elegant hover:-translate-y-1 transition-smooth active:cursor-grabbing group"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg ${TAG_STYLES[todo.type]} flex items-center justify-center`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground mb-1 leading-snug">{todo.title}</div>
            {todo.description && (
              <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{todo.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={`text-xs px-3 py-1 rounded-full ${TAG_STYLES[todo.type]}`}>
            {todo.type === 'personal' ? '📝 個人' : 
             todo.type === 'work' ? '💼 工作' :
             todo.type === 'health' ? '💚 健康' : '🤝 會議'}
          </Badge>
          <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth">
            拖拽到日曆
          </div>
        </div>
      </div>
    );
  };

  // 渲染日曆格子
  const renderCalendarCell = (date: Date, time?: string) => {
    const cellId = time ? `${format(date, 'yyyy-MM-dd')}-${time}` : format(date, 'yyyy-MM-dd');
    const isToday = isSameDay(date, new Date());
    const isDragOver = dragOverCell === cellId;
    
    // 查找該時間段的事件
    const cellEvents = events.filter(event => 
      event.date === format(date, 'yyyy-MM-dd') && 
      (!time || event.time === time)
    );

    return (
      <div
        key={cellId}
        className={`
          relative min-h-[60px] p-2 border-r border-b border-border/30 transition-smooth cursor-pointer group
          ${isToday ? 'bg-gradient-to-br from-primary/10 to-primary/5 shadow-soft' : 'bg-background'}
          ${isDragOver ? 'bg-gradient-accent border-2 border-primary border-dashed shadow-glow transform scale-[1.02]' : 'hover:bg-gradient-to-br hover:from-accent/20 hover:to-accent/10'}
        `}
        onDragOver={(e) => handleDragOver(e, cellId)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, date, time)}
      >
        {viewMode === 'month' && !time && (
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
            {format(date, 'd')}
          </div>
        )}
        
        {cellEvents.length === 0 && isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center text-primary/60 text-xs font-medium">
            拖拽至此
          </div>
        )}
        
        <div className="space-y-1">
          {cellEvents.map(event => (
            <div
              key={event.id}
              className={`
                text-xs p-2 rounded-lg ${EVENT_STYLES[event.type]}
                overflow-hidden cursor-pointer hover:shadow-md transition-smooth
                group/event hover:scale-[1.02]
              `}
              title={`${event.title} - ${event.time}`}
            >
              {viewMode !== 'month' && time && (
                <div className="flex items-center gap-1 mb-1 opacity-75">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono text-[10px]">{event.time}</span>
                </div>
              )}
              <div className="font-medium truncate">{event.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染月視圖
  const renderMonthView = () => {
    const dates = getDisplayDates();
    const startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const endDate = addDays(startDate, 41); // 6 weeks
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 border border-border/30 rounded-xl overflow-hidden shadow-soft">
        {WEEKDAYS.map(day => (
          <div key={day} className="p-4 text-center font-semibold text-muted-foreground border-r border-b border-border/30 bg-gradient-secondary last:border-r-0">
            {day}
          </div>
        ))}
        {allDates.map(date => (
          <div key={date.toISOString()} className={`${isSameMonth(date, currentDate) ? '' : 'opacity-40 bg-muted/20'} min-h-[100px]`}>
            {renderCalendarCell(date)}
          </div>
        ))}
      </div>
    );
  };

  // 渲染週視圖
  const renderWeekView = () => {
    const dates = getDisplayDates();

    return (
      <div className="flex flex-col border border-border/30 rounded-xl overflow-hidden shadow-soft">
        <div className="grid grid-cols-8 border-b border-border/30 bg-gradient-secondary">
          <div className="p-4 flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          {dates.map(date => (
            <div key={date.toISOString()} className="p-4 text-center border-r border-border/30 last:border-r-0">
              <div className="text-sm font-medium text-muted-foreground">{format(date, 'E', { locale: zhTW })}</div>
              <div className={`text-xl font-bold ${isSameDay(date, new Date()) ? 'text-primary' : 'text-foreground'}`}>
                {format(date, 'd')}
              </div>
              {isSameDay(date, new Date()) && (
                <div className="w-2 h-2 bg-primary rounded-full mx-auto mt-1"></div>
              )}
            </div>
          ))}
        </div>
        
        {TIME_SLOTS.map(time => (
          <div key={time} className="grid grid-cols-8 border-b border-border/30 last:border-b-0 min-h-[80px]">
            <div className="p-4 text-sm font-mono font-medium text-muted-foreground bg-gradient-to-r from-muted/20 to-muted/10 border-r border-border/30 flex items-center justify-center">
              {time}
            </div>
            {dates.map(date => renderCalendarCell(date, time))}
          </div>
        ))}
      </div>
    );
  };

  // 渲染日視圖
  const renderDayView = () => {
    return (
      <div className="flex flex-col border border-border/30 rounded-xl overflow-hidden shadow-soft">
        <div className="p-6 bg-gradient-secondary border-b border-border/30 text-center">
          <div className={`text-2xl font-bold ${isSameDay(currentDate, new Date()) ? 'text-primary' : 'text-foreground'}`}>
            {format(currentDate, 'yyyy年MM月dd日 EEEE', { locale: zhTW })}
          </div>
          {isSameDay(currentDate, new Date()) && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              今天
            </div>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {TIME_SLOTS.map(time => (
            <div key={time} className="flex border-b border-border/30 last:border-b-0 min-h-[100px]">
              <div className="w-24 p-4 text-sm font-mono font-medium text-muted-foreground bg-gradient-to-r from-muted/20 to-muted/10 border-r border-border/30 flex flex-col items-center justify-center">
                <div>{time}</div>
                <div className="w-px h-4 bg-border/50 mt-2"></div>
              </div>
              <div className="flex-1">
                {renderCalendarCell(currentDate, time)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
      {/* 左側待辦區域 */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-elegant border border-border/30 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4 bg-gradient-primary text-primary-foreground rounded-t-xl">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-white/20 rounded-lg">
                <List className="w-5 h-5" />
              </div>
              📋 待辦事項
            </CardTitle>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              將項目拖拽到右側日曆安排時間
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {/* AI 建議區域 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  AI 智慧建議 ({aiSuggestions.length} 項)
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateAiSuggestions}
                  disabled={isGenerating}
                  className="text-xs px-3 py-1 h-7"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {isGenerating ? '生成中...' : '生成建議'}
                </Button>
              </div>
              
              {aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      draggable
                      onDragStart={(e) => handleDragStart({
                        id: suggestion.id,
                        title: suggestion.content,
                        content: suggestion.content,
                        type: getPriorityType(suggestion.priority)
                      }, e)}
                      onDragEnd={handleDragEnd}
                      className={`bg-gradient-to-r border border-border/50 rounded-xl p-3 cursor-grab hover:shadow-elegant hover:-translate-y-1 transition-smooth active:cursor-grabbing group ${getPriorityBg(suggestion.priority)}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg flex items-center justify-center ${getPriorityColor(suggestion.priority)}`}>
                          <Lightbulb className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground text-sm leading-snug">{suggestion.content}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-2">
                          <Badge variant="secondary" className={`px-2 py-0.5 rounded-full ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority === 'high' ? '🔥 高' : 
                             suggestion.priority === 'medium' ? '⚡ 中' : '🌱 低'}
                          </Badge>
                          <span className="text-muted-foreground">{suggestion.timeEstimate}</span>
                        </div>
                        <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth">
                          拖拽到日曆
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {aiSuggestions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lightbulb className="w-6 h-6 opacity-50" />
                  </div>
                  <div className="text-sm mb-1">還沒有 AI 建議</div>
                  <div className="text-xs opacity-75">點擊「生成建議」開始</div>
                </div>
              )}
            </div>

            {/* 未安排的待辦事項 */}
            {availableTodos.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  未安排事項 ({availableTodos.length} 項)
                </div>
                <div className="space-y-2">
                  {availableTodos.map(renderTodoItem)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 右側日曆區域 */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="shadow-elegant border border-border/30 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                  <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')} className="hover:bg-primary/10">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigateDate('next')} className="hover:bg-primary/10">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground leading-none">
                    {viewMode === 'month' && format(currentDate, 'yyyy年MM月', { locale: zhTW })}
                    {viewMode === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MM月dd日', { locale: zhTW })} - ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 6), 'MM月dd日', { locale: zhTW })}`}
                    {viewMode === 'day' && format(currentDate, 'yyyy年MM月dd日', { locale: zhTW })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {viewMode === 'month' && '月視圖'}
                    {viewMode === 'week' && '週視圖'}  
                    {viewMode === 'day' && '日視圖'}
                  </div>
                </div>
              </div>
              
              <div className="flex bg-gradient-secondary border border-border/30 rounded-xl p-1 shadow-sm">
                {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 text-sm font-medium transition-smooth ${
                      viewMode === mode 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    {mode === 'month' ? '📅 月' : mode === 'week' ? '📊 週' : '📋 日'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="overflow-auto p-6">
            <div className="min-h-[400px]">
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 思緒輸入對話框 */}
      <Dialog open={showThoughtDialog} onOpenChange={setShowThoughtDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              輸入您的想法
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                分享您的想法，AI 將為您生成個性化的行動建議：
              </label>
              <Textarea
                value={thoughtInput}
                onChange={(e) => setThoughtInput(e.target.value)}
                placeholder="例如：我想提升工作效率、學習新技能、改善生活習慣..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowThoughtDialog(false);
                  if (thoughtInput.trim()) {
                    handleGenerateAiSuggestions();
                  }
                }}
                disabled={!thoughtInput.trim() || isGenerating}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? '生成中...' : '生成 AI 建議'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowThoughtDialog(false)}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}