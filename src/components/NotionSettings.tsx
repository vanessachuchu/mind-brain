import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNotionSync } from "@/hooks/useNotionSync";
import { useNotionOAuth } from "@/hooks/useNotionOAuth";
import { useTodos } from "@/hooks/useTodos";
import { useToast } from "@/hooks/use-toast";
import { Settings, ExternalLink, RefreshCcw, Upload, Download, CheckCircle, AlertCircle, Zap } from "lucide-react";

export default function NotionSettings() {
  const { settings, loading, syncing, saveNotionSettings, testNotionConnection, syncTodosToNotion, getTodosFromNotion } = useNotionSync();
  const { todos, addTodo } = useTodos();
  const { toast } = useToast();
  const { 
    isConnecting, 
    isConnected, 
    error: oauthError, 
    startAuthorization, 
    checkConnection, 
    disconnect 
  } = useNotionOAuth();
  
  const [apiToken, setApiToken] = useState(settings?.notion_api_token || "");
  const [databaseId, setDatabaseId] = useState(settings?.notion_database_id || "");
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionValid, setConnectionValid] = useState(false);
  const [setupMethod, setSetupMethod] = useState<'oauth' | 'manual'>('oauth');

  // 檢查 OAuth 連接狀態
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // 處理 OAuth 錯誤
  useEffect(() => {
    if (oauthError) {
      toast({
        title: "OAuth 授權失敗",
        description: oauthError,
        variant: "destructive"
      });
    }
  }, [oauthError, toast]);

  const handleOAuthConnect = async () => {
    try {
      await startAuthorization();
    } catch (error) {
      toast({
        title: "無法開始授權",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive"
      });
    }
  };

  const handleOAuthDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "已斷開連接",
        description: "已成功斷開與 Notion 的連接"
      });
    } catch (error) {
      toast({
        title: "斷開失敗",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive"
      });
    }
  };

  const handleTestConnection = async () => {
    if (!apiToken || !databaseId) {
      toast({
        title: "錯誤",
        description: "請輸入 Notion API Token 和資料庫 ID",
        variant: "destructive"
      });
      return;
    }

    const result = await testNotionConnection(apiToken, databaseId);
    setConnectionTested(true);
    setConnectionValid(result.success);

    if (result.success) {
      toast({
        title: "連接成功！",
        description: `已成功連接到 Notion 資料庫：${result.database.title}`,
      });
    } else {
      toast({
        title: "連接失敗",
        description: result.error || "無法連接到 Notion 資料庫",
        variant: "destructive"
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!connectionTested || !connectionValid) {
      toast({
        title: "請先測試連接",
        description: "請先測試 Notion 連接後再保存設定",
        variant: "destructive"
      });
      return;
    }

    const result = await saveNotionSettings({
      notion_api_token: apiToken,
      notion_database_id: databaseId,
      sync_enabled: true
    });

    if (result.success) {
      toast({
        title: "設定已保存",
        description: "Notion 整合設定已成功保存",
      });
    } else {
      toast({
        title: "保存失敗",
        description: result.error || "無法保存設定",
        variant: "destructive"
      });
    }
  };

  const handleSyncToNotion = async () => {
    if (!settings?.sync_enabled) {
      toast({
        title: "請先設定 Notion 整合",
        description: "請先完成 Notion 整合設定",
        variant: "destructive"
      });
      return;
    }

    const result = await syncTodosToNotion(todos);
    
    if (result.success) {
      const successCount = result.results.filter((r: { success: boolean }) => r.success).length;
      toast({
        title: "同步完成",
        description: `已成功同步 ${successCount} 個待辦事項到 Notion`,
      });
    } else {
      toast({
        title: "同步失敗",
        description: result.error || "無法同步到 Notion",
        variant: "destructive"
      });
    }
  };

  const handleSyncFromNotion = async () => {
    if (!settings?.sync_enabled) {
      toast({
        title: "請先設定 Notion 整合",
        description: "請先完成 Notion 整合設定",
        variant: "destructive"
      });
      return;
    }

    const result = await getTodosFromNotion();
    
    if (result.success) {
      // Add new todos from Notion (avoiding duplicates)
      let newCount = 0;
      for (const notionTodo of result.todos) {
        // Check if todo already exists
        const exists = todos.some(todo => todo.content === notionTodo.content);
        if (!exists) {
          addTodo({
            content: notionTodo.content,
            done: notionTodo.done,
            scheduledDate: notionTodo.scheduledDate,
            scheduledTime: notionTodo.scheduledTime
          });
          newCount++;
        }
      }
      
      toast({
        title: "同步完成",
        description: `已從 Notion 同步 ${newCount} 個新的待辦事項`,
      });
    } else {
      toast({
        title: "同步失敗",
        description: result.error || "無法從 Notion 同步",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
            載入中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notion 整合設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 設定方式選擇 */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={setupMethod === 'oauth' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSetupMethod('oauth')}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              一鍵連接（推薦）
            </Button>
            <Button
              variant={setupMethod === 'manual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSetupMethod('manual')}
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              手動設定
            </Button>
          </div>

          {/* OAuth 方式 */}
          {setupMethod === 'oauth' && (
            <div className="space-y-4">
              <div className="text-center space-y-4 py-6">
                <div className="text-sm text-muted-foreground">
                  最簡單的連接方式，只需一鍵授權即可開始使用
                </div>
                
                {!isConnected ? (
                  <Button
                    onClick={handleOAuthConnect}
                    disabled={isConnecting}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                        連接中...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        一鍵連接 Notion
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">已連接到 Notion</span>
                    </div>
                    <Button
                      onClick={handleOAuthDisconnect}
                      variant="outline"
                      size="sm"
                    >
                      斷開連接
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded">
                <strong>OAuth 授權的優勢：</strong><br/>
                • 一鍵連接，無需手動複製 Token<br/>
                • 自動發現可用的資料庫<br/>
                • 更安全的授權管理<br/>
                • 支援自動續期
              </div>
            </div>
          )}

          {/* 手動設定方式 */}
          {setupMethod === 'manual' && (
            <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notion-token">Notion API Token</Label>
                  <Input
                    id="notion-token"
                    type="password"
                    placeholder="secret_..."
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    請到 <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Notion Integration 頁面 <ExternalLink className="w-3 h-3 inline" />
                    </a> 建立新的整合並複製 API Token
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="database-id">資料庫 ID</Label>
                  <Input
                    id="database-id"
                    placeholder="請輸入 Notion 資料庫 ID"
                    value={databaseId}
                    onChange={(e) => setDatabaseId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    從 Notion 資料庫 URL 中複製資料庫 ID (在 .so/ 和 ?v= 之間的字串)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={syncing || !apiToken || !databaseId}
                    variant="outline"
                  >
                    {syncing ? (
                      <RefreshCcw className="w-4 h-4 animate-spin mr-2" />
                    ) : connectionTested ? (
                      connectionValid ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                      )
                    ) : null}
                    測試連接
                  </Button>

                  {connectionTested && connectionValid && (
                    <Button
                      onClick={handleSaveSettings}
                      disabled={syncing}
                    >
                      保存設定
                    </Button>
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {(settings?.sync_enabled || isConnected) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5" />
              同步操作
              <Badge variant="secondary">
                {settings.sync_enabled ? "已啟用" : "未啟用"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleSyncToNotion}
                disabled={syncing}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {syncing ? "同步中..." : "上傳到 Notion"}
              </Button>

              <Button
                onClick={handleSyncFromNotion}
                disabled={syncing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {syncing ? "同步中..." : "從 Notion 下載"}
              </Button>
            </div>

            {settings.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                上次同步：{new Date(settings.last_sync_at).toLocaleString('zh-TW')}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}