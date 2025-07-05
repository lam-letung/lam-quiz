import { Search, Plus, User, Settings, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import MobileNav from "./MobileNav";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Header({
  searchQuery = "",
  onSearchChange,
}: HeaderProps) {
  const navigate = useNavigate();
  const { userId, userName, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Mobile Navigation & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <MobileNav />
          <Link
            to="/"
            className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-xl text-primary hover:opacity-80 transition-opacity"
          >
            <div className="p-1.5 sm:p-2 rounded-lg gradient-bg">
              <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="hidden sm:inline gradient-bg bg-clip-text text-transparent truncate">
              lam-quiz
            </span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your study sets..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 w-full focus-ring"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            onClick={() => navigate("/create")}
            className="gradient-bg hover:opacity-90 transition-opacity"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full focus-ring"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="gradient-bg text-white">
                    U
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {/* user@example.com */}
                  {loading ? (
                    <span>Checking auth...</span>
                  ) : (
                    <>
                      <span className="text-sm">👋 Hello, {userName}</span>
                    </>

                  )}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive">
                <span  onClick={logout}>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
