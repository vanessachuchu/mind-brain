import { useState, useCallback } from 'react';
import { NOTION_OAUTH_CONFIG, getNotionRedirectUri } from '@/config/ai';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotionOAuthState {
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

export function useNotionOAuth() {
  const { user } = useAuth();
  const [state, setState] = useState<NotionOAuthState>({
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  // 生成 OAuth 授權 URL
  const getAuthorizeUrl = useCallback(() => {
    const params = new URLSearchParams({
      client_id: NOTION_OAUTH_CONFIG.clientId,
      response_type: 'code',
      owner: 'user',
      redirect_uri: getNotionRedirectUri(),
    });

    return `${NOTION_OAUTH_CONFIG.authorizeUrl}?${params.toString()}`;
  }, []);

  // 開始 OAuth 授權流程
  const startAuthorization = useCallback(() => {
    if (!NOTION_OAUTH_CONFIG.clientId) {
      setState(prev => ({
        ...prev,
        error: '缺少 Notion Client ID 配置'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    // 跳轉到 Notion 授權頁面
    const authorizeUrl = getAuthorizeUrl();
    window.location.href = authorizeUrl;
  }, [getAuthorizeUrl]);

  // 處理授權回調
  const handleCallback = useCallback(async (code: string, state: string) => {
    if (!user?.id) {
      throw new Error('用戶未登錄');
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      // 調用 Supabase Edge Function 處理 OAuth token 交換
      const { data, error } = await supabase.functions.invoke('notion-oauth-callback', {
        body: {
          code,
          state,
          redirect_uri: getNotionRedirectUri(),
        }
      });

      if (error) throw error;

      if (data.success) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: true
        }));
        return data;
      } else {
        throw new Error(data.error || '授權失敗');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : '授權過程發生錯誤'
      }));
      throw error;
    }
  }, [user?.id]);

  // 檢查連接狀態
  const checkConnection = useCallback(async () => {
    if (!user?.id) return false;

    try {
      const { data } = await supabase
        .from('notion_settings')
        .select('sync_enabled, notion_api_token')
        .eq('user_id', user.id)
        .single();

      const isConnected = !!(data?.sync_enabled && data?.notion_api_token);
      setState(prev => ({
        ...prev,
        isConnected
      }));

      return isConnected;
    } catch (error) {
      return false;
    }
  }, [user?.id]);

  // 斷開連接
  const disconnect = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notion_settings')
        .update({
          sync_enabled: false,
          notion_api_token: null,
          notion_database_id: null,
          last_sync_at: null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        isConnected: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '斷開連接失敗'
      }));
    }
  }, [user?.id]);

  return {
    ...state,
    startAuthorization,
    handleCallback,
    checkConnection,
    disconnect,
    getAuthorizeUrl,
  };
}