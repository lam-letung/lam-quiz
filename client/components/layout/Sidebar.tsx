import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  PenTool,
  Target,
  Gamepad2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Study", href: "/study", icon: BookOpen },
  { name: "Test", href: "/test", icon: PenTool },
  { name: "Match", href: "/match", icon: Target },
  { name: "Games", href: "/games", icon: Gamepad2 },
  { name: "Progress", href: "/progress", icon: BarChart3 },
];

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Toggle Button */}
      <div className="flex h-16 items-center justify-end px-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-9 w-9 focus-ring"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-sidebar-foreground">
              Quick Actions
            </h4>
            <Link to="/create">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Set
              </Button>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
