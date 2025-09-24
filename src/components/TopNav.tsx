import { Link } from "react-router-dom";
import { Search, Settings } from "lucide-react";

export default function TopNav() {
  return (
    <nav className="w-full bg-white border-b border-border mb-6 shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-xl font-bold tracking-tight text-primary select-none">🧠 脈德小腦瓜</div>
        
        {/* 右側按鈕 */}
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </Link>
          
          <Link
            to="/settings"
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
