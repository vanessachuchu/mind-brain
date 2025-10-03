import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Calendar, Clock, Plus, List, Users, Heart, Calendar as CalendarIcon, Lightbulb, Sparkles, Edit, Trash2 } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { useThoughts } from '@/hooks/useThoughts';
import ThoughtCard from '@/components/ThoughtCard';

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
  meeting: CalendarIcon
};

interface SimpleDragCalendarProps {
  thoughtContent?: string;
  aiMessages?: Array<{role: string; content: string}>;
}

export function SimpleDragCalendar({ thoughtContent = "", aiMessages = [] }: SimpleDragCalendarProps) {
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  const { thoughts, addThought } = useThoughts();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('calendar-events');
    return saved ? JSON.parse(saved) : [];
  });
  const [draggedTodo, setDraggedTodo] = useState<DraggedTodo | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{todo: any; date: string; time: string} | null>(null);
  const [currentThoughtIndex, setCurrentThoughtIndex] = useState(0);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('09:00');
  const [thoughtInput, setThoughtInput] = useState('');
  const [showThoughtDialog, setShowThoughtDialog] = useState(false);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  // 獲取今天的思緒
  const todayThoughts = useMemo(() => {
    const today = new Date();
    if (!Array.isArray(thoughts)) return [];
    return thoughts.filter(thought => {
      if (!thought || !thought.createdAt) return false;
      const thoughtDate = new Date(thought.createdAt);
      return isSameDay(thoughtDate, today);
    });
  }, [thoughts]);

  // 保存 events 到 localStorage
  useEffect(() => {
    localStorage.setItem('calendar-events', JSON.stringify(events));
  }, [events]);

  // 當 thoughts 更新時，確保 currentThoughtIndex 不會超出範圍
  useEffect(() => {
    if (currentThoughtIndex >= todayThoughts.length && todayThoughts.length > 0) {
      setCurrentThoughtIndex(0);
    }
  }, [todayThoughts, currentThoughtIndex]);

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

  // 獲取我的行動清單（從深度挖掘產生的待辦事項）
  const actionList = useMemo(() => {
    if (!Array.isArray(todos)) return [];
    return todos.filter(todo =>
      todo &&
      !todo.done &&
      !todo.scheduledDate &&
      !todo.startDate &&
      todo.thoughtId
    ).map(todo => ({
      id: todo.id,
      title: todo.content,
      type: 'personal' as const,
      description: todo.notes || ''
    }));
  }, [todos]);

  // 獲取未完成的待辦事項（不包含行動清單）
  const availableTodos = useMemo(() => {
    return todos.filter(todo =>
      !todo.done &&
      !todo.scheduledDate &&
      !todo.startDate &&
      !todo.thoughtId
    ).map(todo => ({
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
  const handleSaveThought = () => {
    if (!thoughtInput.trim()) return;

    // 保存想法到思緒列表
    addThought(thoughtInput);
    setThoughtInput('');
    setShowThoughtDialog(false);

    // 將 currentThoughtIndex 設為 0，顯示最新的思緒
    setCurrentThoughtIndex(0);
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

    // 更新待辦事項的排程時間
    updateTodo(draggedTodo.id, {
      scheduledDate: dateString,
      scheduledTime: timeString,
      startDate: dateString,
      startTime: timeString
    });

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
    const isEditing = editingTodoId === todo.id;

    return (
      <div
        key={todo.id}
        className="bg-gradient-secondary border border-border/50 rounded-xl p-4 mb-3 transition-smooth"
      >
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(todo, e)}
          onDragEnd={handleDragEnd}
          className={!isEditing ? "cursor-grab hover:shadow-elegant hover:-translate-y-1 transition-smooth active:cursor-grabbing" : ""}
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

          {!isEditing ? (
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className={`text-xs px-3 py-1 rounded-full ${TAG_STYLES[todo.type]}`}>
                {todo.type === 'personal' ? '📝 個人' :
                 todo.type === 'work' ? '💼 工作' :
                 todo.type === 'health' ? '💚 健康' : '🤝 會議'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingTodoId(todo.id);
                  setEditDate(format(new Date(), 'yyyy-MM-dd'));
                  setEditTime('09:00');
                }}
                className="text-xs px-2 py-1 h-7"
              >
                📅 安排時間
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">日期</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">時間</label>
                  <select
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full text-xs p-2 border rounded focus:ring-1 focus:ring-primary"
                  >
                    {TIME_SLOTS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    updateTodo(todo.id, {
                      scheduledDate: editDate,
                      scheduledTime: editTime,
                      startDate: editDate,
                      startTime: editTime
                    });

                    // 創建日曆事件
                    const newEvent: CalendarEvent = {
                      id: `event-${Date.now()}`,
                      title: todo.title,
                      type: todo.type,
                      date: editDate,
                      time: editTime,
                      duration: 60
                    };
                    setEvents(prev => [...prev, newEvent]);

                    setEditingTodoId(null);
                  }}
                  className="flex-1 text-xs h-7"
                >
                  確認安排
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTodoId(null)}
                  className="text-xs h-7"
                >
                  取消
                </Button>
              </div>
            </div>
          )}
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
            {/* 我的行動清單 */}
            {actionList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    我的行動清單 ({actionList.length} 項)
                  </div>
                </div>
                <div className="space-y-2">
                  {actionList.map(renderTodoItem)}
                </div>
              </div>
            )}

            {/* 未安排的待辦事項 */}
            {availableTodos.length > 0 && (
              <div className={actionList.length > 0 ? "border-t pt-4" : ""}>
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  未安排事項 ({availableTodos.length} 項)
                </div>
                <div className="space-y-2">
                  {availableTodos.map(renderTodoItem)}
                </div>
              </div>
            )}

            {/* 空狀態 */}
            {actionList.length === 0 && availableTodos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-4">📋</div>
                <div className="text-sm mb-1">還沒有待辦事項</div>
                <div className="text-xs opacity-75">點擊右下角「記錄想法」開始</div>
              </div>
            )}

            {/* 今日思緒 */}
            {todayThoughts.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    今日思緒 ({todayThoughts.length} 條)
                  </div>
                  {todayThoughts.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentThoughtIndex(prev =>
                          prev > 0 ? prev - 1 : todayThoughts.length - 1
                        )}
                        className="p-1 h-6 w-6"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-1">
                        {currentThoughtIndex + 1}/{todayThoughts.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentThoughtIndex(prev =>
                          prev < todayThoughts.length - 1 ? prev + 1 : 0
                        )}
                        className="p-1 h-6 w-6"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {currentThoughtIndex < todayThoughts.length && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <ThoughtCard
                      id={todayThoughts[currentThoughtIndex].id}
                      content={todayThoughts[currentThoughtIndex].content}
                    />
                  </div>
                )}
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
                記錄您的想法：
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
                onClick={handleSaveThought}
                disabled={!thoughtInput.trim()}
                className="flex-1"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                保存想法
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