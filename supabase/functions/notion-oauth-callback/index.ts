import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const NOTION_OAUTH_CONFIG = {
  clientId: Deno.env.get('NOTION_CLIENT_ID') || '',
  clientSecret: Deno.env.get('NOTION_CLIENT_SECRET') || '',
  tokenUrl: 'https://api.notion.com/v1/oauth/token',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, state, redirect_uri } = await req.json()

    if (!code) {
      return Response.json(
        { success: false, error: '缺少授權代碼' },
        { status: 400, headers: corsHeaders }
      )
    }

    // 驗證必要的配置
    if (!NOTION_OAUTH_CONFIG.clientId || !NOTION_OAUTH_CONFIG.clientSecret) {
      return Response.json(
        { success: false, error: '缺少 Notion OAuth 配置' },
        { status: 500, headers: corsHeaders }
      )
    }

    // 與 Notion 交換授權代碼換取訪問令牌
    const tokenResponse = await fetch(NOTION_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${NOTION_OAUTH_CONFIG.clientId}:${NOTION_OAUTH_CONFIG.clientSecret}`)}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Notion token exchange failed:', errorData)
      return Response.json(
        { success: false, error: '授權令牌交換失敗' },
        { status: 400, headers: corsHeaders }
      )
    }

    const tokenData = await tokenResponse.json()

    // 驗證返回的數據
    if (!tokenData.access_token) {
      return Response.json(
        { success: false, error: '未收到有效的訪問令牌' },
        { status: 400, headers: corsHeaders }
      )
    }

    // 獲取授權信息
    const { access_token, token_type, bot_id, workspace_id, workspace_name, workspace_icon, owner } = tokenData

    // 測試 API 連接並獲取用戶可訪問的資料庫
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: {
          value: 'database',
          property: 'object'
        }
      })
    })

    let databases = []
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      databases = searchData.results || []
    }

    // 初始化 Supabase 客戶端
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 獲取當前用戶（從授權 header 中解析 JWT）
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return Response.json(
        { success: false, error: '未提供授權信息' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return Response.json(
        { success: false, error: '用戶身份驗證失敗' },
        { status: 401, headers: corsHeaders }
      )
    }

    // 保存 Notion 設定到資料庫
    const { error: saveError } = await supabase
      .from('notion_settings')
      .upsert({
        user_id: user.id,
        notion_api_token: access_token,
        notion_database_id: databases.length > 0 ? databases[0].id : null, // 預設使用第一個資料庫
        sync_enabled: true,
        workspace_id: workspace_id,
        workspace_name: workspace_name,
        bot_id: bot_id,
        last_sync_at: null
      }, {
        onConflict: 'user_id'
      })

    if (saveError) {
      console.error('Failed to save notion settings:', saveError)
      return Response.json(
        { success: false, error: '保存設定失敗' },
        { status: 500, headers: corsHeaders }
      )
    }

    // 返回成功響應
    return Response.json({
      success: true,
      workspace: {
        id: workspace_id,
        name: workspace_name,
        icon: workspace_icon
      },
      databases: databases.map(db => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || '未命名資料庫',
        url: db.url
      })),
      owner: owner
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return Response.json(
      { success: false, error: '服務器內部錯誤' },
      { status: 500, headers: corsHeaders }
    )
  }
})