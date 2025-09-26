
import { useCallback, useEffect, useRef, useState } from "react";
import { AI_CONFIG, isApiKeyConfigured } from "@/config/ai";

/**
 * 管理AI自我探索的對話流程 (openai chat API, stream)
 */
export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function useAiDeepDive(initThought: string, initialMessages?: AiMessage[], onConversationUpdate?: (messages: AiMessage[]) => void) {
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    // 如果有初始對話記錄，使用它；否則使用預設的系統訊息
    if (initialMessages && initialMessages.length > 0) {
      console.log("useAiDeepDive: Loading existing conversation with", initialMessages.length, "messages");
      return initialMessages;
    }
    
    return [
      {
        role: "system" as const,
        content: AI_CONFIG.DEEP_DIVE_SYSTEM_PROMPT
      },
      { role: "user" as const, content: initThought }
    ];
  });
  
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 當 messages 更新時，通知父組件保存對話
  useEffect(() => {
    if (onConversationUpdate && messages.length > 2) { // 只有當有實際對話時才保存
      console.log("useAiDeepDive: Conversation updated, saving", messages.length, "messages");
      onConversationUpdate(messages);
    }
  }, [messages, onConversationUpdate]);


  // 發送一則user內容給AI
  const sendMessage = useCallback(
    async (userContent: string) => {
      if (!isApiKeyConfigured()) {
        setError("AI 服務暫時無法使用，請聯繫管理員");
        return;
      }
      setError(null);
      setMessages(prev => [...prev, { role: "user" as const, content: userContent }]);
      setAnswering(true);

      try {
        // 組chat messages (保留最近 6輪)
        const chatMessages = [
          ...messages.filter(msg => msg.role !== "system"),
          { role: "user" as const, content: userContent }
        ].slice(-6);

        // 使用 Supabase Edge Function 代理
        const response = await fetch(AI_CONFIG.AI_PROXY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "deep-dive",
            messages: chatMessages
          })
        });

        if (!response.ok) {
          setError("AI 服務暫時不可用，請稍後再試。");
          setAnswering(false);
          return;
        }

        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setAnswering(false);
          return;
        }

        const aiResponse = data.choices?.[0]?.message?.content;
        if (aiResponse) {
          setMessages(prev => [...prev, { role: "assistant" as const, content: aiResponse }]);
        } else {
          setError("AI 回應格式錯誤，請稍後再試。");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "錯誤，請稍後再試");
      }
      setAnswering(false);
    },
    [messages]
  );

  const reset = useCallback(() => {
    const newMessages: AiMessage[] = [
      {
        role: "system" as const,
        content: AI_CONFIG.DEEP_DIVE_SYSTEM_PROMPT
      },
      { role: "user" as const, content: initThought }
    ];
    setMessages(newMessages);
    setError(null);
    setAnswering(false);
    console.log("useAiDeepDive: Conversation reset");
  }, [initThought]);

  return {
    messages,
    answering,
    error,
    sendMessage,
    reset
  };
}
