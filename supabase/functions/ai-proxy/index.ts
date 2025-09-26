import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, type = 'chat' } = await req.json()
    
    // 從環境變數獲取 API Key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API Key not configured')
    }

    // 根據請求類型設定不同的系統提示詞
    let systemPrompt = ""
    if (type === 'deep-dive') {
      systemPrompt = "你是脈德小腦瓜的智慧引導者，請用溫和、充滿智慧的語氣引導使用者深入思考與釐清思緒。每次請只問一個深入的問題，語氣親切且富有啟發性，幫助對方更好地理解自己的想法。"
    } else if (type === 'action-plan') {
      systemPrompt = `你是一個專業的行動規劃助手。請仔細分析用戶的思緒內容和AI對話記錄，生成5個具體、可執行的行動計劃。

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
]`
    }

    // 準備請求到 OpenAI
    const requestBody = {
      model: "gpt-4o",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages
      ],
      temperature: 0.7,
      max_tokens: type === 'action-plan' ? 1500 : 800
    }

    // 發送請求到 OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API Error:', error)
      throw new Error(`OpenAI API Error: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('AI Proxy Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'AI服務暫時不可用，請稍後再試',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})