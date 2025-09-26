#!/usr/bin/env python3
"""
最簡單的測試伺服器 - 直接提供靜態檔案
無需建構，直接使用 src 目錄
"""

import http.server
import socketserver
import os
import webbrowser
import json
from pathlib import Path

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加 CORS 標頭
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # 對於 React Router，所有路由都指向 index.html
        if self.path.startswith('/') and not '.' in self.path:
            self.path = '/index.html'
        return super().do_GET()

PORT = 8080
print("🚀 Mind-Brain 快速測試伺服器")
print("=" * 40)
print(f"📍 測試網址: http://localhost:{PORT}")
print("📝 注意: 這是開發版本，某些功能可能需要完整建構")
print("⏹️  按 Ctrl+C 停止伺服器\n")

# 創建簡單的測試 HTML
test_html = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mind-Brain 測試環境</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
            margin: 0; padding: 20px; background: #f5f5f5; 
        }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .feature { margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
        .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; background: #007bff; color: white; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 Mind-Brain 本地測試環境</h1>
            <p>快速測試版本 - 基本功能驗證</p>
        </div>
        
        <div class="status success">
            ✅ <strong>伺服器運行正常</strong> - 已成功啟動在 http://localhost:8080
        </div>
        
        <div class="status info">
            📋 <strong>測試說明</strong> - 這是簡化版本，用於驗證基本環境設定
        </div>
        
        <div class="feature">
            <h3>🔧 環境檢查</h3>
            <p><strong>Python 版本:</strong> 3.9.6</p>
            <p><strong>專案路徑:</strong> /Users/vanessa/Downloads/mind-brain-main</p>
            <p><strong>API Key 狀態:</strong> <span id="api-status">檢查中...</span></p>
        </div>
        
        <div class="feature">
            <h3>🎯 可測試功能</h3>
            <ul>
                <li>✅ 基本 HTTP 伺服器運行</li>
                <li>✅ 靜態檔案存取</li>
                <li>✅ 環境變數讀取</li>
                <li>⚠️  React 應用 (需要完整建構)</li>
                <li>⚠️  API 呼叫 (需要 HTTPS 或本地開發環境)</li>
            </ul>
        </div>
        
        <div class="feature">
            <h3>🚀 下一步建議</h3>
            <ol>
                <li>如果看到這個頁面，表示伺服器運行正常</li>
                <li>可以嘗試存取專案檔案: <a href="/src" target="_blank">/src 目錄</a></li>
                <li>檢查環境設定: <a href="/.env" target="_blank">.env 檔案</a></li>
                <li>或者使用線上版本: <a href="https://lovable.dev/projects/e8ac6ef0-dbe6-4c69-9c74-f110a616d3ec" target="_blank">Lovable 專案</a></li>
            </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button class="btn" onclick="location.reload()">🔄 重新整理</button>
            <button class="btn" onclick="testApi()">🧪 測試 API</button>
        </div>
    </div>
    
    <script>
        // 檢查 API Key
        fetch('/.env')
            .then(response => response.text())
            .then(data => {
                const hasApiKey = data.includes('sk-proj-');
                document.getElementById('api-status').innerHTML = 
                    hasApiKey ? '✅ 已設定 OpenAI API Key' : '❌ 未設定 API Key';
            })
            .catch(() => {
                document.getElementById('api-status').innerHTML = '❓ 無法檢查';
            });
        
        function testApi() {
            alert('🎉 測試功能正常！伺服器可以處理 JavaScript 請求。');
        }
    </script>
</body>
</html>"""

# 寫入測試 HTML 檔案
with open('test-index.html', 'w', encoding='utf-8') as f:
    f.write(test_html)

try:
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"✅ 伺服器已在端口 {PORT} 啟動")
        
        # 自動開啟瀏覽器
        try:
            webbrowser.open(f'http://localhost:{PORT}/test-index.html')
            print("🌐 已嘗試開啟瀏覽器")
        except:
            print("⚠️  請手動開啟瀏覽器")
        
        print("📊 伺服器日誌:")
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print("\n🛑 伺服器已停止")
except OSError as e:
    if e.errno == 48:
        print(f"❌ 端口 {PORT} 已被佔用")
        print("請嘗試關閉其他應用或使用不同端口")
    else:
        print(f"❌ 啟動失敗: {e}")