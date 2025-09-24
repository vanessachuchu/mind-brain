import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotionSettings {
  id?: string;
  user_id?: string;
  notion_api_token?: string;
  notion_database_id?: string;
  sync_enabled: boolean;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
}

export function useNotionSync() {
  const [settings, setSettings] = useState<NotionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load Notion settings on mount
  useEffect(() => {
    loadNotionSettings();
  }, []);

  const loadNotionSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notion_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading Notion settings:', error);
      } else {
        setSettings(data || { sync_enabled: false });
      }
    } catch (error) {
      console.error('Error loading Notion settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotionSettings = async (newSettings: Partial<NotionSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const payload = {
        user_id: user.id,
        ...newSettings,
        updated_at: new Date().toISOString()
      };

      let result;
      if (settings?.id) {
        // Update existing settings
        result = await supabase
          .from('notion_settings')
          .update(payload)
          .eq('id', settings.id)
          .select()
          .single();
      } else {
        // Create new settings
        result = await supabase
          .from('notion_settings')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setSettings(result.data);
      return { success: true };
    } catch (error) {
      console.error('Error saving Notion settings:', error);
      return { success: false, error: error.message };
    }
  };

  const testNotionConnection = async (apiToken: string, databaseId: string) => {
    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('notion-sync', {
        body: {
          action: 'test-connection',
          notionApiToken: apiToken,
          notionDatabaseId: databaseId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, database: data.database };
    } catch (error) {
      console.error('Error testing Notion connection:', error);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  const syncTodosToNotion = async (todos: any[]) => {
    if (!settings?.notion_api_token || !settings?.notion_database_id) {
      throw new Error('Notion integration not configured');
    }

    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('notion-sync', {
        body: {
          action: 'sync-todos-to-notion',
          notionApiToken: settings.notion_api_token,
          notionDatabaseId: settings.notion_database_id,
          todos
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update last sync time
      await saveNotionSettings({ last_sync_at: new Date().toISOString() });

      return { success: true, results: data.results };
    } catch (error) {
      console.error('Error syncing todos to Notion:', error);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  const getTodosFromNotion = async () => {
    if (!settings?.notion_api_token || !settings?.notion_database_id) {
      throw new Error('Notion integration not configured');
    }

    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('notion-sync', {
        body: {
          action: 'get-todos-from-notion',
          notionApiToken: settings.notion_api_token,
          notionDatabaseId: settings.notion_database_id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, todos: data.todos };
    } catch (error) {
      console.error('Error getting todos from Notion:', error);
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  return {
    settings,
    loading,
    syncing,
    saveNotionSettings,
    testNotionConnection,
    syncTodosToNotion,
    getTodosFromNotion,
    reloadSettings: loadNotionSettings
  };
}