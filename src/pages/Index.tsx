
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThoughtCard from "@/components/ThoughtCard";
import NewThoughtDialog from "@/components/NewThoughtDialog";
import { CarouselThoughts } from "@/components/ui/carousel-thoughts";
import { DragCalendar } from "@/components/DragCalendar";
import { useThoughts } from "@/hooks/useThoughts";
import { Calendar as CalendarIcon, Move, Lightbulb } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function Index() {
  const { thoughts } = useThoughts();
  const [isNewThoughtDialogOpen, setIsNewThoughtDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'traditional' | 'drag'>('drag');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // 緩存當前日期的思緒（最新的在前面）
  const currentDayThoughts = useMemo(() => {
    const filtered = thoughts.filter(thought => {
      // 如果有 createdAt 則使用，否則從 id 中解析時間戳（對於舊數據）
      let thoughtDate: Date;
      if (thought.createdAt) {
        thoughtDate = new Date(thought.createdAt);
      } else {
        // 從 ID 中提取時間戳（ID 格式為 timestamp + random）
        const timestamp = parseInt(thought.id);
        thoughtDate = isNaN(timestamp) ? new Date() : new Date(timestamp);
      }
      return isSameDay(thoughtDate, selectedDate);
    });

    // 按創建時間降序排序，最新的在前面
    return filtered.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : parseInt(a.id);
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : parseInt(b.id);
      return bTime - aTime;
    });
  }, [thoughts, selectedDate, refreshKey]);

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

        {/* 思緒探索區域 */}
        <Card className="mb-6 shadow-soft border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 font-medium">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  {format(selectedDate, 'yyyy年MM月dd日', { locale: zhTW })} 的思緒探索
                  {currentDayThoughts.length > 0 && (
                    <Badge variant="secondary">
                      {currentDayThoughts.length} 條思緒
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  探索你的想法，與 AI 深度對話，生成個性化的行動方案
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  disabled={isSameDay(selectedDate, new Date())}
                  className="text-xs"
                >
                  今天
                </Button>
                <div className="flex bg-muted/20 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000))}
                    className="text-xs px-2"
                  >
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000))}
                    className="text-xs px-2"
                  >
                    →
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentDayThoughts.length > 0 ? (
              <CarouselThoughts 
                currentIndex={currentCardIndex} 
                onIndexChange={setCurrentCardIndex}
              >
                {currentDayThoughts.map(thought => (
                  <ThoughtCard key={thought.id} id={thought.id} content={thought.content} />
                ))}
              </CarouselThoughts>
            ) : (
              <div className="flex items-center justify-center text-center text-muted-foreground min-h-[200px]">
                <div>
                  <div className="text-4xl mb-4">💭</div>
                  <p className="text-lg mb-2">
                    {isSameDay(selectedDate, new Date()) ? '今天還沒有思緒記錄' : `${format(selectedDate, 'MM月dd日', { locale: zhTW })}沒有思緒記錄`}
                  </p>
                  <p className="text-sm mb-4">記錄想法，讓 AI 幫你生成行動方案</p>
                  <Button 
                    onClick={() => setIsNewThoughtDialogOpen(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    記錄想法
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
            console.log('onThoughtAdded triggered, current thoughts count:', thoughts.length);

            // 如果當前不是今天，先切換到今天
            const today = new Date();
            if (!isSameDay(selectedDate, today)) {
              console.log('Switching to today to show new thought');
              setSelectedDate(today);
            }

            // 重置卡片索引到第一張（最新的思緒）
            setCurrentCardIndex(0);

            // 強制重新渲染思緒區域（作為備用機制）
            setTimeout(() => {
              setRefreshKey(prev => prev + 1);
              console.log('Refresh key updated');
            }, 100);
          }}
        />
      </main>
    </div>
  );
}
