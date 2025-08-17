
import TopNav from "@/components/TopNav";
import { useState, useMemo } from "react";
import { useThoughts } from "@/hooks/useThoughts";
import { useTodos } from "@/hooks/useTodos";
import DraggableThoughtCard from "@/components/DraggableThoughtCard";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Todo } from "@/hooks/useTodos";

export default function SearchPage() {
  const { thoughts } = useThoughts();
  const { todos } = useTodos();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThoughts = useMemo(() => {
    if (!searchQuery.trim()) return thoughts;
    
    const query = searchQuery.toLowerCase();
    return thoughts.filter(thought => 
      thought.content.toLowerCase().includes(query)
    );
  }, [thoughts, searchQuery]);

  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos;
    
    const query = searchQuery.toLowerCase();
    return todos.filter(todo => 
      todo.content.toLowerCase().includes(query)
    );
  }, [todos, searchQuery]);

  const formatTimeRange = (todo: Todo) => {
    if (todo.startDate && todo.startTime) {
      const dateStr = format(new Date(todo.startDate), 'MM/dd')
      let timeStr = todo.startTime
      
      if (todo.endDate && todo.endTime) {
        if (todo.startDate === todo.endDate) {
          timeStr += ` - ${todo.endTime}`
        } else {
          const endDateStr = format(new Date(todo.endDate), 'MM/dd')
          timeStr += ` - ${endDateStr} ${todo.endTime}`
        }
      }
      
      return `${dateStr} ${timeStr}`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-2xl font-bold mb-6 text-primary">🔍 搜尋</div>
        
        {/* 搜尋輸入框 */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋思緒內容或待辦事項..."
            className="w-full px-4 py-3 text-lg border border-border rounded-lg focus:ring-2 focus:ring-primary/30 bg-white"
          />
        </div>

{/* 搜尋結果 */}
        {searchQuery.trim() === "" ? (
          <div className="space-y-8">
            {/* 顯示所有思緒卡片 */}
            {thoughts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  所有思緒卡片 ({thoughts.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {thoughts.map(thought => (
                    <DraggableThoughtCard key={thought.id} {...thought} />
                  ))}
                </div>
              </div>
            )}

            {/* 顯示所有待辦事項 */}
            {todos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  所有待辦事項 ({todos.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {todos.map(todo => (
                    <div key={todo.id} className="bg-card p-4 rounded-xl border border-border shadow">
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                          todo.done
                            ? "bg-primary border-primary"
                            : "bg-white border-border"
                        }`}>
                          {todo.done && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium mb-1 ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {todo.content}
                          </div>
                          {formatTimeRange(todo) && (
                            <div className="text-xs text-muted-foreground mb-2">
                              📅 {formatTimeRange(todo)}
                            </div>
                          )}
                          {todo.thoughtId && (
                            <Link
                              to={`/thought/${todo.thoughtId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              查看原始思緒
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空狀態提示 */}
            {thoughts.length === 0 && todos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-lg mb-2">還沒有任何內容</div>
                <div className="text-sm">開始記錄一些想法吧</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* 思緒卡片區域 */}
            {filteredThoughts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  思緒卡片 ({filteredThoughts.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredThoughts.map(thought => (
                    <DraggableThoughtCard key={thought.id} {...thought} />
                  ))}
                </div>
              </div>
            )}

            {/* 待辦事項區域 */}
            {filteredTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  待辦事項 ({filteredTodos.length})
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredTodos.map(todo => (
                    <div key={todo.id} className="bg-card p-4 rounded-xl border border-border shadow">
                      <div className="flex items-start gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 mt-1 flex-shrink-0 ${
                          todo.done
                            ? "bg-primary border-primary"
                            : "bg-white border-border"
                        }`}>
                          {todo.done && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium mb-1 ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {todo.content}
                          </div>
                          {formatTimeRange(todo) && (
                            <div className="text-xs text-muted-foreground mb-2">
                              📅 {formatTimeRange(todo)}
                            </div>
                          )}
                          {todo.thoughtId && (
                            <Link
                              to={`/thought/${todo.thoughtId}`}
                              className="text-xs text-primary hover:underline"
                            >
                              查看原始思緒
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 無結果提示 */}
            {filteredThoughts.length === 0 && filteredTodos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-lg mb-2">沒有找到符合的內容</div>
                <div className="text-sm">試試使用不同的關鍵字</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
