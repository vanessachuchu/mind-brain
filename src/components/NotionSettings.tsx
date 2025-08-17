import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useNotionSync } from "@/hooks/useNotionSync";
import { useTodos } from "@/hooks/useTodos";
import { useToast } from "@/hooks/use-toast";
import { Settings, ExternalLink, RefreshCcw, Upload, Download, CheckCircle, AlertCircle } from "lucide-react";

export default function NotionSettings() {
  const { settings, loading, syncing, saveNotionSettings, testNotionConnection, syncTodosToNotion, getTodosFromNotion } = useNotionSync();
  const { todos, addTodo } = useTodos();
  const { toast } = useToast();
  
  const [apiToken, setApiToken] = useState(settings?.notion_api_token || "");
  const [databaseId, setDatabaseId] = useState(settings?.notion_database_id || "");
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionValid, setConnectionValid] = useState(false);

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
      const successCount = result.results.filter((r: any) => r.success).length;
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
        <CardContent className="space-y-4">
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

          {connectionTested && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                {connectionValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-700">連接成功</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">連接失敗</span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {settings?.sync_enabled && (
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