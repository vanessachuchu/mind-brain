
import { Link } from "react-router-dom";
import { useState } from "react";
import { Edit, Trash2, Plus, Calendar, Clock, ArrowLeft } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimePicker } from "@/components/ui/time-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function TodoPage() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  
  console.log('TodoPage render - todos:', todos);
  const [newTodoContent, setNewTodoContent] = useState("");
  const [newStartDate, setNewStartDate] = useState<Date>();
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndDate, setNewEndDate] = useState<Date>();
  const [newEndTime, setNewEndTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editStartDate, setEditStartDate] = useState<Date>();
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndDate, setEditEndDate] = useState<Date>();
  const [editEndTime, setEditEndTime] = useState("");

  const handleAddTodo = () => {
    if (!newTodoContent.trim()) return;
    addTodo({
      content: newTodoContent.trim(),
      done: false,
      startDate: newStartDate?.toISOString().split('T')[0],
      startTime: newStartTime,
      endDate: newEndDate?.toISOString().split('T')[0],
      endTime: newEndTime
    });
    setNewTodoContent("");
    setNewStartDate(undefined);
    setNewStartTime("");
    setNewEndDate(undefined);
    setNewEndTime("");
  };

  const handleStartEdit = (todo: any) => {
    setEditingId(todo.id);
    setEditContent(todo.content);
    setEditStartDate(todo.startDate ? new Date(todo.startDate) : undefined);
    setEditStartTime(todo.startTime || "");
    setEditEndDate(todo.endDate ? new Date(todo.endDate) : undefined);
    setEditEndTime(todo.endTime || "");
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateTodo(editingId, { 
      content: editContent.trim(),
      startDate: editStartDate?.toISOString().split('T')[0],
      startTime: editStartTime,
      endDate: editEndDate?.toISOString().split('T')[0],
      endTime: editEndTime
    });
    setEditingId(null);
    setEditContent("");
    setEditStartDate(undefined);
    setEditStartTime("");
    setEditEndDate(undefined);
    setEditEndTime("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditStartDate(undefined);
    setEditStartTime("");
    setEditEndDate(undefined);
    setEditEndTime("");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("確定要刪除這個待辦事項嗎？")) {
      deleteTodo(id);
    }
  };

  // 分類待辦事項：已排程和未排程
  const scheduledTodos = todos.filter(todo => todo.startDate && todo.startTime);
  const unscheduledTodos = todos.filter(todo => !todo.startDate || !todo.startTime);

  // 按日期分組已排程的待辦事項
  const groupedScheduledTodos = scheduledTodos.reduce((groups, todo) => {
    const date = todo.startDate!;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(todo);
    return groups;
  }, {} as Record<string, typeof todos>);

  // 對每個日期的待辦事項按時間排序
  Object.keys(groupedScheduledTodos).forEach(date => {
    groupedScheduledTodos[date].sort((a, b) => {
      const timeA = a.startTime || "00:00";
      const timeB = b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回首頁</span>
          </Link>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">我的行動清單</h1>
            <p className="text-sm text-muted-foreground">AI 整理的具體行動方案</p>
          </div>
          
          <div className="w-16"></div>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-6 py-6 pb-20">
        

        <div className="space-y-6">
          {todos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg mb-2">還沒有行動計劃</p>
              <p className="text-sm mt-2">透過思緒探索讓 AI 為你制定具體行動</p>
              <Link 
                to="/"
                className="inline-block mt-4 bg-gradient-accent text-white px-6 py-2 rounded-lg font-medium transition-smooth hover:shadow-soft"
              >
                ✨ 開始記錄想法
              </Link>
            </div>
          ) : (
            <>
              {/* 已排程的待辦事項 */}
              {Object.keys(groupedScheduledTodos).length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Calendar size={20} />
                    已排程項目
                  </h2>
                  {Object.entries(groupedScheduledTodos)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, todosForDate]) => (
                      <Card key={date} className="shadow-soft border border-border bg-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar size={20} />
                            {new Date(date).toLocaleDateString('zh-TW', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                            <span className="text-sm font-normal text-muted-foreground">
                              ({todosForDate.length} 項)
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {todosForDate.map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg border border-border group hover:bg-muted/50 transition-colors">
                              <button
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  todo.done
                                    ? "bg-primary border-primary"
                                    : "bg-white border-border"
                                }`}
                                onClick={() => toggleTodo(todo.id)}
                                aria-label="打勾完成"
                              >
                                {todo.done ? (
                                  <span className="text-white text-lg font-bold">✓</span>
                                ) : null}
                              </button>
                              
                              {editingId === todo.id ? (
                                <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">開始日期</label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "justify-start text-left font-normal text-sm w-full",
                                          !editStartDate && "text-muted-foreground"
                                        )}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {editStartDate ? format(editStartDate, "yyyy-MM-dd") : "選擇日期"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={editStartDate}
                                        onSelect={setEditStartDate}
                                        initialFocus
                                        className="p-3 pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">開始時間</label>
                                  <TimePicker
                                    value={editStartTime}
                                    onChange={setEditStartTime}
                                    placeholder="開始時間"
                                    className="text-sm w-full"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">結束日期</label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "justify-start text-left font-normal text-sm w-full",
                                          !editEndDate && "text-muted-foreground"
                                        )}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {editEndDate ? format(editEndDate, "yyyy-MM-dd") : "選擇日期"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={editEndDate}
                                        onSelect={setEditEndDate}
                                        initialFocus
                                        className="p-3 pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">結束時間</label>
                                  <TimePicker
                                    value={editEndTime}
                                    onChange={setEditEndTime}
                                    placeholder="結束時間"
                                    className="text-sm w-full"
                                  />
                                </div>
                              </div>
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="text-sm"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveEdit}>
                                      保存
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {todo.startTime && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                          <Clock size={12} />
                                          {todo.startTime}
                                          {todo.endTime && ` - ${todo.endTime}`}
                                        </div>
                                      )}
                                    </div>
                                    <span className={`text-base ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {todo.content}
                                    </span>
                                  </div>
                                  
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleStartEdit(todo)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit size={16} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDelete(todo.id)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </div>
                                  
                                  {todo.thoughtId && (
                                    <Link
                                      to={`/thought/${todo.thoughtId}`}
                                      className="text-sm underline text-muted-foreground hover:text-primary"
                                    >
                                      原始思緒
                                    </Link>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))
                  }
                </div>
              )}

              {/* 未排程的待辦事項 */}
              {unscheduledTodos.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Plus size={20} />
                    待安排項目
                  </h2>
                  <Card className="shadow-soft border border-border bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus size={20} />
                        未安排日期時間
                        <span className="text-sm font-normal text-muted-foreground">
                          ({unscheduledTodos.length} 項)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {unscheduledTodos.map(todo => (
                        <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg border border-border group hover:bg-muted/50 transition-colors">
                          <button
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              todo.done
                                ? "bg-primary border-primary"
                                : "bg-white border-border"
                            }`}
                            onClick={() => toggleTodo(todo.id)}
                            aria-label="打勾完成"
                          >
                            {todo.done ? (
                              <span className="text-white text-lg font-bold">✓</span>
                            ) : null}
                          </button>
                          
                          {editingId === todo.id ? (
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">開始日期</label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "justify-start text-left font-normal text-sm w-full",
                                          !editStartDate && "text-muted-foreground"
                                        )}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {editStartDate ? format(editStartDate, "yyyy-MM-dd") : "選擇日期"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={editStartDate}
                                        onSelect={setEditStartDate}
                                        initialFocus
                                        className="p-3 pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">開始時間</label>
                                  <TimePicker
                                    value={editStartTime}
                                    onChange={setEditStartTime}
                                    placeholder="開始時間"
                                    className="text-sm w-full"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">結束日期</label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "justify-start text-left font-normal text-sm w-full",
                                          !editEndDate && "text-muted-foreground"
                                        )}
                                      >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {editEndDate ? format(editEndDate, "yyyy-MM-dd") : "選擇日期"}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={editEndDate}
                                        onSelect={setEditEndDate}
                                        initialFocus
                                        className="p-3 pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs text-muted-foreground">結束時間</label>
                                  <TimePicker
                                    value={editEndTime}
                                    onChange={setEditEndTime}
                                    placeholder="結束時間"
                                    className="text-sm w-full"
                                  />
                                </div>
                              </div>
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="text-sm"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  保存
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  取消
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <span className={`text-base ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {todo.content}
                                </span>
                              </div>
                              
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStartEdit(todo)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(todo.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                              
                              {todo.thoughtId && (
                                <Link
                                  to={`/thought/${todo.thoughtId}`}
                                  className="text-sm underline text-muted-foreground hover:text-primary"
                                >
                                  原始思緒
                                </Link>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
