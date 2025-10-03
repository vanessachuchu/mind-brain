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

請基於以上內容生成5個簡潔的行動計劃。請直接返回JSON格式的數組，每個項目包含以下字段：
- content: 行動內容描述（20字以內）
- priority: 優先級（high/medium/low）
- timeEstimate: 預估時間（如：30分鐘、1小時）
- category: 分類（工作/生活/學習/健康/其他）

範例格式：
[
  {
    "content": "整理桌面工作環境",
    "priority": "medium",
    "timeEstimate": "15分鐘",
    "category": "工作"
  }
]

請直接返回JSON數組，不要包含其他文字：`;

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
        // 清理回應內容，移除可能的格式化符號
        const cleanContent = generatedContent
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        actionPlan = JSON.parse(cleanContent);
        console.log('解析成功的行動計劃:', actionPlan);
      } catch (parseError) {
        console.warn('JSON解析失敗，嘗試提取JSON部分:', parseError);
        // 如果解析失敗，嘗試提取JSON部分
        const jsonMatch = generatedContent.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          try {
            actionPlan = JSON.parse(jsonMatch[0]);
            console.log('提取JSON成功:', actionPlan);
          } catch (extractError) {
            console.error('提取JSON也失敗:', extractError);
            // 返回fallback數據以保持應用穩定
            return [
              {
                id: `fallback-${Date.now()}-1`,
                content: '整理當前想法',
                priority: 'medium',
                timeEstimate: '15分鐘',
                category: '思考'
              },
              {
                id: `fallback-${Date.now()}-2`,
                content: '制定下一步計劃',
                priority: 'high',
                timeEstimate: '30分鐘',
                category: '規劃'
              }
            ];
          }
        } else {
          console.error('無法找到JSON格式內容');
          // 返回fallback數據
          return [
            {
              id: `fallback-${Date.now()}-1`,
              content: '思考解決方案',
              priority: 'medium',
              timeEstimate: '20分鐘',
              category: '思考'
            }
          ];
        }
      }

      // 驗證和標準化數據
      if (!Array.isArray(actionPlan)) {
        console.error('AI回應不是數組格式:', actionPlan);
        return [];
      }

      const validatedActions = actionPlan
        .filter((action: any) => 
          action && typeof action === 'object' && action.content)
        .slice(0, 5)
        .map((action: any, index: number) => ({
          id: action.id || `ai-${Date.now()}-${index}`,
          content: action.content || '未命名任務',
          priority: ['high', 'medium', 'low'].includes(action.priority) ? action.priority : 'medium',
          timeEstimate: action.timeEstimate || '30分鐘',
          category: action.category || '其他'
        }));

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
