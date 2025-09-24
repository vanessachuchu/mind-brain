
import { Link, useLocation } from "react-router-dom";
import { Home, CheckSquare } from "lucide-react";

const navItems = [
  { 
    to: "/", 
    label: "首頁", 
    icon: Home,
    key: "home" as const
  },
  { 
    to: "/todo", 
    label: "待辦", 
    icon: CheckSquare,
    key: "todo" as const
  }
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center">
          {navItems.map(({ to, label, icon: Icon, key }) => {
            const isActive = location.pathname === to;
            
            return (
              <Link
                key={key}
                to={to}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
