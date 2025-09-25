import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotionOAuth } from '@/hooks/useNotionOAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function NotionCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useNotionOAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('正在處理授權...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`授權失敗: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('缺少授權代碼');
      return;
    }

    // 處理 OAuth 回調
    handleCallback(code, state || '')
      .then((result) => {
        setStatus('success');
        setMessage(`成功連接到 ${result.workspace?.name || 'Notion'}！`);
        
        // 3秒後跳轉到設定頁面
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message || '授權處理失敗');
      });
  }, [searchParams, handleCallback, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className={`text-xl ${getStatusColor()}`}>
            Notion 授權處理
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            {message}
          </p>
          
          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              3秒後自動跳轉到設定頁面...
            </p>
          )}
          
          {status === 'error' && (
            <button 
              onClick={() => navigate('/settings')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              返回設定頁面
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}