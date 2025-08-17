import { Link } from "react-router-dom";
import { Search, Settings, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopNav() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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

          {/* 用戶狀態 */}
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {user.user_metadata?.display_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">
                  登入
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
