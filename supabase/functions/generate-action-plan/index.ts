import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { thoughtContent, aiMessages = [] } = await req.json();

    if (!thoughtContent) {
      throw new Error('思緒內容不能為空');
    }

    // 構建對話上下文
    const conversationContext = aiMessages
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `你是一個專業的行動規劃助手。請仔細分析用戶的思緒內容和AI對話記錄，生成5個具體、可執行的行動計劃。

要求：
1. 每個行動都要基於用戶的具體情況和需求
2. 行動要具體、可測量、有時間估計
3. 優先級要合理分配
4. 分類要準確反映行動性質
5. 回應必須是純JSON格式，不要包含任何其他文字

回應格式（JSON數組）：
[
  {
    "id": "unique_id",
    "content": "具體的行動描述",
    "priority": "high|medium|low",
    "timeEstimate": "預估時間（如：30分鐘、1小時等）",
    "category": "分類（如：學習、工作、健康、人際、規劃等）"
  }
]`;

    const userPrompt = `思緒內容：
${thoughtContent}

AI對話記錄：
${conversationContext}

請基於以上內容生成5個個性化的行動計劃。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API錯誤: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content.trim();

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
      .filter((action: any) => action.content && action.priority && action.timeEstimate && action.category)
      .slice(0, 5)
      .map((action: any, index: number) => ({
        id: action.id || `ai-${Date.now()}-${index}`,
        content: action.content,
        priority: ['high', 'medium', 'low'].includes(action.priority) ? action.priority : 'medium',
        timeEstimate: action.timeEstimate,
        category: action.category
      }));

    return new Response(JSON.stringify({ actions: validatedActions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('生成行動計劃時發生錯誤:', error);
    return new Response(JSON.stringify({ 
      error: error.message || '生成行動計劃失敗',
      actions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});