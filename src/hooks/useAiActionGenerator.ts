import { useState } from 'react';
import { AI_CONFIG, isApiKeyConfigured } from '@/config/ai';

export interface ActionItem {
  id: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate: string;
  category: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export function useAiActionGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateActionPlan = async (thoughtContent: string, aiMessages?: Array<{role: string; content: string}>): Promise<ActionItem[]> => {
    setIsGenerating(true);
    
    try {
      if (!isApiKeyConfigured()) {
        console.error('AI API Key 未配置');
        throw new Error('AI 服務暫時無法使用，請聯繫管理員');
      }

      // 構建對話上下文
      const conversationContext = (aiMessages || [])
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const userPrompt = `思緒內容：
${thoughtContent}

AI對話記錄：
${conversationContext}

請基於以上內容生成5個個性化的行動計劃。`;

      const response = await fetch(AI_CONFIG.AI_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'action-plan',
          messages: [{ role: 'user', content: userPrompt }]
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API錯誤: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const generatedContent = data.choices?.[0]?.message?.content?.trim();
      
      if (!generatedContent) {
        throw new Error('AI 未返回有效回應');
      }

      // 嘗試解析JSON回應
      let actionPlan;
      try {
        actionPlan = JSON.parse(generatedContent);
      } catch (parseError) {
        // 如果解析失敗，嘗試提取JSON部分
        const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          actionPlan = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('無法解析AI回應為有效的JSON格式');
        }
      }

      // 驗證和標準化數據
      const validatedActions = actionPlan
        .filter((action: {content?: string; priority?: string; timeEstimate?: string; category?: string}) => 
          action.content && action.priority && action.timeEstimate && action.category)
        .slice(0, 5)
        .map((action: {id?: string; content: string; priority: string; timeEstimate: string; category: string}, index: number) => ({
          id: action.id || `ai-${Date.now()}-${index}`,
          content: action.content,
          priority: ['high', 'medium', 'low'].includes(action.priority) ? action.priority : 'medium',
          timeEstimate: action.timeEstimate,
          category: action.category
        }));

      return validatedActions;
    } catch (error) {
      console.error('生成行動計劃時發生錯誤:', error);
      // 返回空數組而不是拋出錯誤，以保持應用穩定性
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateActionPlan,
    isGenerating
  };
}
