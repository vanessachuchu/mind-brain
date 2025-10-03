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

請基於以上內容生成5個個性化的行動計劃。請嚴格按照以下JSON格式回應，不要包含任何其他文字或說明：

[
  {
    "id": "action-1",
    "content": "具體的行動描述",
    "priority": "high",
    "timeEstimate": "30分鐘",
    "category": "個人發展"
  },
  {
    "id": "action-2", 
    "content": "另一個行動描述",
    "priority": "medium",
    "timeEstimate": "1小時",
    "category": "工作"
  }
]

注意事項：
- priority 只能是 "high", "medium", "low" 之一
- timeEstimate 格式如 "30分鐘", "1小時", "2-3小時" 等
- category 可以是 "個人發展", "工作", "健康", "學習", "生活" 等
- content 要具體可執行，不超過50字
- 請直接返回JSON數組，不要包含其他文字`;

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

      console.log('AI 原始回應:', generatedContent);

      // 嘗試解析JSON回應
      let actionPlan;
      try {
        // 直接嘗試解析
        actionPlan = JSON.parse(generatedContent);
      } catch (parseError) {
        console.log('直接解析失敗，嘗試提取JSON部分');
        // 如果解析失敗，嘗試提取JSON部分
        const jsonMatch = generatedContent.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          try {
            actionPlan = JSON.parse(jsonMatch[0]);
            console.log('從文本中提取JSON成功:', actionPlan);
          } catch (secondParseError) {
            console.error('提取的JSON也無法解析:', secondParseError);
            console.log('提取的內容:', jsonMatch[0]);
            
            // 提供回退方案：生成預設的行動計劃
            actionPlan = [
              {
                id: `fallback-${Date.now()}-1`,
                content: "反思並整理當前想法",
                priority: "high",
                timeEstimate: "15分鐘",
                category: "個人發展"
              },
              {
                id: `fallback-${Date.now()}-2`, 
                content: "制定下一步具體行動",
                priority: "medium",
                timeEstimate: "30分鐘",
                category: "規劃"
              }
            ];
          }
        } else {
          console.error('無法在回應中找到JSON格式');
          // 提供回退方案
          actionPlan = [
            {
              id: `fallback-${Date.now()}-1`,
              content: "深入思考當前議題",
              priority: "high", 
              timeEstimate: "20分鐘",
              category: "個人發展"
            }
          ];
        }
      }

      // 確保 actionPlan 是數組
      if (!Array.isArray(actionPlan)) {
        console.log('actionPlan 不是數組，轉換為數組');
        actionPlan = [];
      }

      console.log('準備驗證的 actionPlan:', actionPlan);

      // 驗證和標準化數據
      const validatedActions = actionPlan
        .filter((action: any) => {
          // 更寬鬆的驗證條件
          const isValid = action && typeof action === 'object' && action.content;
          if (!isValid) {
            console.log('過濾掉無效項目:', action);
          }
          return isValid;
        })
        .slice(0, 5)
        .map((action: any, index: number) => {
          const validatedAction = {
            id: action.id || `ai-${Date.now()}-${index}`,
            content: action.content || '未定義的行動',
            priority: (['high', 'medium', 'low'].includes(action.priority) ? action.priority : 'medium') as 'high' | 'medium' | 'low',
            timeEstimate: action.timeEstimate || '預估時間未定',
            category: action.category || '一般'
          };
          console.log('驗證後的行動項目:', validatedAction);
          return validatedAction;
        });

      console.log('最終驗證的行動計劃:', validatedActions);
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
