
import { useRef, useState, useEffect } from "react";
import { useAiDeepDive } from "@/hooks/useAiDeepDive";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Send } from "lucide-react";
import { MindMapVisualization } from "./MindMapVisualization";
import { ActionPlanGenerator } from "./ActionPlanGenerator";

/**
 * AI 深入自我探索卡片 (用於思緒內容自我提問、反思引導)
 */
export function AiDeepDiveCard({ 
  thoughtContent, 
  thoughtId,
  initialConversation,
  onActionPlanGenerated,
  onConversationUpdate 
}: { 
  thoughtContent: string;
  thoughtId: string;
  initialConversation?: Array<{role: "user" | "assistant" | "system"; content: string}>;
  onActionPlanGenerated?: (plan: string) => void;
  onConversationUpdate?: (messages: Array<{role: "user" | "assistant" | "system"; content: string}>) => void;
}) {
  const {
    messages,
    answering,
    error,
    sendMessage,
    reset
  } = useAiDeepDive(thoughtContent, initialConversation, onConversationUpdate);

  const [input, setInput] = useState("");
  const [showMindMap, setShowMindMap] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 進入頁面後自動開始對話（如果沒有現有對話）
  useEffect(() => {
    if (!hasStartedConversation && !initialConversation && messages.length <= 2) {
      setHasStartedConversation(true);
      // 自動發送第一個問句請求
      sendMessage("請開始引導我探索這個思緒");
    }
  }, [hasStartedConversation, initialConversation, messages.length, sendMessage]);

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    inputRef.current?.focus();
  }

  const handleActionPlanGenerated = (plan: string) => {
    if (onActionPlanGenerated) {
      onActionPlanGenerated(plan);
    }
  };

  // 生成主題摘要
  const generateSummary = () => {
    if (messages.length <= 2) return "AI 深度探索";
    
    const lastAssistantMessage = messages
      .filter(msg => msg.role === "assistant")
      .slice(-1)[0];
    
    if (lastAssistantMessage && lastAssistantMessage.content.length > 0) {
      // 取前50字作為摘要
      const summary = lastAssistantMessage.content.substring(0, 50);
      return summary.length < lastAssistantMessage.content.length ? `${summary}...` : summary;
    }
    
    return "AI 深度探索進行中";
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow flex flex-col gap-3">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">🧠 腦瓜小世界</span>
          <span className="text-sm text-muted-foreground">{generateSummary()}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {isExpanded ? '收合' : '展開'}
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="flex gap-2 text-xs">
            <button
              className="underline text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setShowMindMap(!showMindMap);
              }}
              title="顯示/隱藏思考流程圖"
            >
              {showMindMap ? '隱藏' : '顯示'}流程圖
            </button>
            <button
              className="underline text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              title="重啟對話"
              aria-label="重啟對話"
            >
              <RefreshCcw size={12} className="inline mr-1" />
              重新開始
            </button>
          </div>

      {/* 思考流程圖 */}
      {showMindMap && messages.length > 2 && (
        <div className="mb-4">
          <MindMapVisualization messages={messages} thoughtContent={thoughtContent} />
        </div>
      )}

      {/* 對話內容區塊 */}
          <div className="flex-1 min-h-[150px] overflow-y-auto px-1 py-3 bg-background rounded">
            {messages
              .filter(msg => msg.role !== "system") // system 指令不顯示
              .map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 flex items-start gap-2 ${
                    msg.role === "assistant" ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap text-sm ${
                      msg.role === "assistant"
                        ? "bg-accent text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="mt-1">
                    {msg.role === "assistant" ? (
                      <span className="text-base">🧠</span>
                    ) : (
                      <span className="text-base">🙋</span>
                    )}
                  </div>
                </div>
              ))}
            {answering && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                <span className="animate-pulse">🧠 小腦瓜正在思考...</span>
              </div>
            )}
            {error && (
              <div className="text-xs text-red-500 mb-2">⚠️ {error}</div>
            )}
          </div>
          
          {/* 傳訊息輸入 */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 items-center mt-2"
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="resize-none"
              placeholder="回應智慧探索的提問，或輸入你的想法…"
              disabled={answering}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10"
              disabled={!input.trim() || answering}
              title="送出"
              tabIndex={0}
            >
              <Send size={18} />
            </Button>
          </form>
          
          {/* 行動方案生成器 */}
          {messages.length > 2 && (
            <ActionPlanGenerator 
              messages={messages}
              thoughtContent={thoughtContent}
              onGenerateActionPlan={handleActionPlanGenerated}
            />
          )}
        </>
      )}
    </div>
  );
}

export default AiDeepDiveCard;
