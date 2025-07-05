// src/components/auth/AuthForm.tsx
import { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AuthFormProps {
  title: string;
  children: ReactNode;
}

export function AuthForm({ title, children }: AuthFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors">
        
        {/* Header: Title + Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <ThemeToggle />
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
}
