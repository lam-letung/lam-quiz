import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  Home,
  BookOpen,
  PenTool,
  Target,
  Gamepad2,
  BarChart3,
  Folder,
  Plus,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Study", href: "/study", icon: BookOpen },
  { name: "Folders", href: "/folders", icon: Folder },
  { name: "Test", href: "/test", icon: PenTool },
  { name: "Match", href: "/match", icon: Target },
  { name: "Progress", href: "/progress", icon: BarChart3 },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 sm:h-9 sm:w-9 focus-ring"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-left">
            <Link
              to="/"
              onClick={handleNavClick}
              className="flex items-center gap-2 font-bold text-xl text-primary"
            >
              <div className="p-2 rounded-lg gradient-bg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              lam-quiz
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors focus-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          {/* Quick Actions */}
          <div className="px-4 pb-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground px-3">
              Quick Actions
            </h4>
            <Link to="/create" onClick={handleNavClick}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Set
              </Button>
            </Link>
          </div>

          <Separator className="my-4" />

          {/* User Section */}
          <div className="px-4 pb-6 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-3 px-3"
            >
              <User className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">User</div>
                <div className="text-xs text-muted-foreground">
                  user@example.com
                </div>
              </div>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-2 px-3"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
