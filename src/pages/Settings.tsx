import { Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首頁
          </Link>
          <h1 className="text-2xl font-semibold">設定</h1>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                關於應用
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                這是一個簡單的思緒記錄應用，所有數據儲存在您的瀏覽器中。
                您可以記錄想法、創建待辦事項，並使用AI功能來深度探索您的想法。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}