
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NewThoughtDialog from "@/components/NewThoughtDialog";
import { DragCalendar } from "@/components/DragCalendar";
import { useThoughts } from "@/hooks/useThoughts";
import { Calendar as CalendarIcon, Move } from "lucide-react";

export default function Index() {
  const { thoughts } = useThoughts();
  const [isNewThoughtDialogOpen, setIsNewThoughtDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'traditional' | 'drag'>('drag');

  // 獲取最新的思緒內容用於AI建議
  const getLatestThoughtContent = () => {
    if (thoughts.length === 0) return "";
    const latestThought = thoughts.sort((a, b) => {
      const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0;
      const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
      return bTime - aTime;
    })[0];
    return latestThought.content;
  };

  // 獲取最近的AI對話記錄（如果有的話）
  const getRecentAiMessages = () => {
    // 這裡可以從思緒的AI對話記錄中提取，暫時返回空數組
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 歡迎區塊 */}
        <Card className="mb-6 shadow-soft border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="text-center py-6">
            <div className="text-3xl mb-3">🧘‍♀️</div>
            <h2 className="text-xl font-light mb-3">歡迎來到智慧日曆空間</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              記錄想法、獲取 AI 建議、將思緒轉化為具體行動。拖拽式日曆讓你輕鬆安排時間。
            </p>
          </CardContent>
        </Card>

        {/* 檢視模式切換 */}
        <div className="mb-6 flex justify-center">
          <div className="flex bg-gradient-secondary border border-border/30 rounded-xl p-1 shadow-sm">
            <Button
              variant={viewMode === 'drag' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('drag')}
              className={`px-6 py-2 text-sm font-medium transition-smooth ${
                viewMode === 'drag' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Move className="w-4 h-4 mr-2" />
              🎯 智慧拖拽日曆
            </Button>
            <Button
              variant={viewMode === 'traditional' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('traditional')}
              className={`px-6 py-2 text-sm font-medium transition-smooth ${
                viewMode === 'traditional' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              📅 傳統檢視
            </Button>
          </div>
        </div>

        {/* 主要內容 */}
        {viewMode === 'drag' ? (
          /* 拖拽式日曆視圖 */
          <DragCalendar 
            thoughtContent={getLatestThoughtContent()}
            aiMessages={getRecentAiMessages()}
          />
        ) : (
          /* 傳統檢視 - 保留原有功能 */
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">🔧</div>
            <p className="text-lg mb-2">傳統檢視正在建構中</p>
            <p className="text-sm">請使用智慧拖拽日曆享受完整功能</p>
            <Button 
              onClick={() => setViewMode('drag')}
              className="mt-4"
            >
              切換到智慧拖拽日曆
            </Button>
          </div>
        )}
        
        {/* 浮動新思緒按鈕 */}
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
            // 當新思緒添加後，組件會自動重新渲染
          }}
        />
      </main>
    </div>
  );
}
