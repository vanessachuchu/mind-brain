
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTodos, Todo } from "@/hooks/useTodos";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Clock, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Textarea } from "@/components/ui/textarea";

interface CalendarTimeTableProps {
  selectedDate: Date;
}

export function CalendarTimeTable({ selectedDate }: CalendarTimeTableProps) {
  const { updateTodo, deleteTodo, toggleTodo, getTodosByDate } = useTodos();
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedDateString = format(selectedDate, "yyyy-MM-dd");
  const dayTodos = getTodosByDate(selectedDateString);

  // 生成 24 小時的時間表
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const todosAtThisHour = dayTodos.filter(todo => {
        const timeToCheck = todo.startTime || todo.scheduledTime;
        if (!timeToCheck) return false;
        
        // 處理跨日期任務的時間區間顯示
        if (todo.startDate && todo.endDate && todo.startDate !== todo.endDate) {
          // 如果是跨日任務，檢查是否在時間範圍內
          const startHour = parseInt(timeToCheck.split(':')[0]);
          const endHour = todo.endTime ? parseInt(todo.endTime.split(':')[0]) : 23;
          
          // 如果當前查看的日期是開始日期
          if (todo.startDate === selectedDateString) {
            return hour >= startHour;
          }
          // 如果當前查看的日期是結束日期
          else if (todo.endDate === selectedDateString) {
            return hour <= endHour;
          }
          // 如果當前日期在開始和結束之間
          else {
            const currentDate = new Date(selectedDateString);
            const startDate = new Date(todo.startDate);
            const endDate = new Date(todo.endDate);
            return currentDate > startDate && currentDate < endDate;
          }
        } else {
          // 單日任務，只匹配特定時間
          const todoHour = parseInt(timeToCheck.split(':')[0]);
          return todoHour === hour;
        }
      });
      
      slots.push({
        time: timeString,
        displayTime: `${hour.toString().padStart(2, '0')}:00`,
        todos: todosAtThisHour
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 自動滾動到上午6點
  useEffect(() => {
    if (scrollContainerRef.current) {
      // 找到上午6點的位置（索引6）
      const sixAmIndex = 6;
      const itemHeight = 60; // 估計每個時間槽的高度
      const scrollTop = sixAmIndex * itemHeight;
      
      scrollContainerRef.current.scrollTop = scrollTop;
    }
  }, [selectedDate]); // 當選擇的日期改變時重新滾動

  const handleUpdateTodo = (todo: Todo, updates: Partial<Todo>) => {
    updateTodo(todo.id, updates);
    setEditingTodo(null);
  };

  const handleDeleteTodo = (id: string) => {
    if (window.confirm("確定要刪除這個待辦事項嗎？")) {
      deleteTodo(id);
    }
  };

  return (
    <Card className="bg-white/80 border-stone-200/50 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-light text-stone-700">
            {format(selectedDate, "MM月dd日 EEEE", { locale: zhTW })} 的行程
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={scrollContainerRef}
          className="space-y-2 max-h-96 overflow-y-auto"
        >
          {timeSlots.map((slot) => (
            <div key={slot.time} className="border-b border-stone-100 pb-2">
              <div className="flex items-start gap-3">
                <div className="w-16 text-sm text-stone-500 font-mono pt-1">
                  {slot.displayTime}
                </div>
                <div className="flex-1 min-h-[2rem] bg-stone-50/50 rounded p-2">
                  {slot.todos.length === 0 ? (
                    <div className="text-stone-300 text-sm">─</div>
                  ) : (
                    <div className="space-y-2">
                      {slot.todos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-2 bg-white rounded p-2 border border-stone-200 group"
                        >
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center text-xs transition-colors ${
                              todo.done
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-white border-stone-300"
                            }`}
                          >
                            {todo.done ? "✓" : ""}
                          </button>
                          
                           <div className="flex items-center gap-1 text-xs text-stone-500">
                            <Clock size={12} />
                            {todo.startTime || todo.scheduledTime}
                            {todo.endTime && ` - ${todo.endTime}`}
                            {/* 顯示多日標示 */}
                            {todo.startDate && todo.endDate && todo.startDate !== todo.endDate && (
                              <span className="text-xs text-accent-foreground bg-accent/20 px-1 rounded">
                                多日
                              </span>
                            )}
                          </div>
                          
                          <span className={`text-sm flex-1 ${
                            todo.done ? "line-through text-stone-400" : "text-stone-700"
                          }`}>
                            {todo.content}
                          </span>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingTodo(todo)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* 編輯對話框 */}
      {editingTodo && (
        <Dialog open={!!editingTodo} onOpenChange={() => setEditingTodo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>編輯行程</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">日期時間</label>
                <DateTimePicker
                  value={
                    editingTodo.startDate && editingTodo.startTime 
                      ? `${editingTodo.startDate}T${editingTodo.startTime}`
                      : editingTodo.scheduledDate && editingTodo.scheduledTime
                      ? `${editingTodo.scheduledDate}T${editingTodo.scheduledTime}`
                      : `${selectedDateString}T09:00`
                  }
                  onValueChange={(value) => {
                    const [date, time] = value.split('T');
                    setEditingTodo({
                      ...editingTodo, 
                      startDate: date,
                      startTime: time,
                      scheduledDate: date,
                      scheduledTime: time
                    });
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">內容</label>
                <Textarea
                  value={editingTodo.content}
                  onChange={(e) => setEditingTodo({...editingTodo, content: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUpdateTodo(editingTodo, {
                    content: editingTodo.content,
                    startDate: editingTodo.startDate,
                    startTime: editingTodo.startTime,
                    scheduledDate: editingTodo.scheduledDate,
                    scheduledTime: editingTodo.scheduledTime
                  })} 
                  className="flex-1"
                >
                  保存
                </Button>
                <Button variant="outline" onClick={() => setEditingTodo(null)} className="flex-1">
                  取消
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
