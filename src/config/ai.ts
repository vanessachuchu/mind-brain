// AI API 統一配置
// 用戶可以在這裡設定自己的 API Key，讓所有用戶免費使用

export const AI_CONFIG = {
  // OpenAI API Key - 由開發者提供，讓用戶免費使用
  OPENAI_API_KEY: "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",
  
  // OpenAI API 設定
  OPENAI_BASE_URL: "https://api.openai.com/v1",
  MODEL: "gpt-4o",
  
  // 系統提示詞
  DEEP_DIVE_SYSTEM_PROMPT: "你是脈德小腦瓜的智慧引導者，請用溫和、充滿智慧的語氣引導使用者深入思考與釐清思緒。每次請只問一個深入的問題，語氣親切且富有啟發性，幫助對方更好地理解自己的想法。",
  
  ACTION_PLAN_SYSTEM_PROMPT: `你是一個專業的行動規劃助手。請仔細分析用戶的思緒內容和AI對話記錄，生成5個具體、可執行的行動計劃。

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
};

// 檢查 API Key 是否已設定
export const isApiKeyConfigured = () => {
  return AI_CONFIG.OPENAI_API_KEY && AI_CONFIG.OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY_HERE";
};

// Notion OAuth 配置
export const NOTION_OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_NOTION_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_NOTION_CLIENT_SECRET || '',
  authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
  tokenUrl: 'https://api.notion.com/v1/oauth/token',
  scopes: ['read_content', 'update_content', 'insert_content'],
};

// 動態獲取 redirect URI 的函數
export const getNotionRedirectUri = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/notion/callback`;
  }
  // 在 SSR 環境中返回相對路徑
  return '/auth/notion/callback';
};