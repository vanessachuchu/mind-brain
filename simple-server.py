#!/usr/bin/env python3
"""
簡易 HTTP 伺服器 - 用於測試 Mind-Brain 應用
當 Vite 遇到問題時的備用方案
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# 先建構專案
print("🔨 正在建構專案...")
os.system("npm run build")

# 檢查 dist 目錄是否存在
dist_path = Path("dist")
if not dist_path.exists():
    print("❌ 建構失敗，dist 目錄不存在")
    print("請確認專案設定正確或使用其他方式啟動")
    exit(1)

# 切換到 dist 目錄
os.chdir("dist")

PORT = 3000
Handler = http.server.SimpleHTTPRequestHandler

print(f"🚀 啟動簡易 HTTP 伺服器...")
print(f"📍 本地測試網址: http://localhost:{PORT}")
print(f"⏹️  按 Ctrl+C 停止伺服器")

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"✅ 伺服器已啟動在端口 {PORT}")
        
        # 嘗試自動開啟瀏覽器
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass
            
        httpd.serve_forever()
        
except KeyboardInterrupt:
    print("\n🛑 收到停止信號，正在關閉伺服器...")
except OSError as e:
    if e.errno == 48:  # Address already in use
        print(f"❌ 端口 {PORT} 已被佔用，請先關閉其他應用或選擇其他端口")
    else:
        print(f"❌ 伺服器啟動失敗: {e}")