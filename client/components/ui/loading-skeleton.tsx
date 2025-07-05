import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "avatar" | "button" | "custom";
  lines?: number;
  showAnimation?: boolean;
}

export function LoadingSkeleton({
  className,
  variant = "custom",
  lines = 1,
  showAnimation = true,
}: LoadingSkeletonProps) {
  const baseClasses = cn(
    "bg-muted rounded",
    showAnimation && "animate-pulse",
    className,
  );

  switch (variant) {
    case "card":
      return (
        <div className={cn("space-y-4 p-4", className)}>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-muted h-10 w-10 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
          </div>
        </div>
      );

    case "text":
      return (
        <div className={cn("space-y-2", className)}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 bg-muted rounded animate-pulse",
                i === lines - 1 && "w-3/4",
              )}
            />
          ))}
        </div>
      );

    case "avatar":
      return (
        <div className={cn("rounded-full bg-muted h-10 w-10", baseClasses)} />
      );

    case "button":
      return (
        <div className={cn("h-10 bg-muted rounded-md w-24", baseClasses)} />
      );

    default:
      return <div className={baseClasses} />;
  }
}

export function StudyModeLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton className="h-8 w-64" />
          <LoadingSkeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <LoadingSkeleton className="h-10 w-32" />
          <LoadingSkeleton variant="button" />
        </div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-32" />
        </div>
        <LoadingSkeleton className="h-2 w-full" />
      </div>

      {/* Controls Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LoadingSkeleton variant="button" />
          <LoadingSkeleton variant="button" />
        </div>
        <div className="flex items-center gap-2">
          <LoadingSkeleton variant="button" />
          <LoadingSkeleton variant="button" />
        </div>
      </div>

      {/* Flashcard Skeleton */}
      <div className="flex items-center justify-center">
        <div className="w-full max-w-lg h-80 bg-muted rounded-xl animate-pulse" />
      </div>

      {/* Navigation Skeleton */}
      <div className="flex items-center justify-between">
        <LoadingSkeleton variant="button" />
        <LoadingSkeleton className="h-4 w-48" />
        <LoadingSkeleton variant="button" />
      </div>
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <div className="text-center py-8 md:py-12 rounded-2xl bg-muted animate-pulse">
        <LoadingSkeleton className="h-8 md:h-12 w-3/4 mx-auto mb-4" />
        <LoadingSkeleton className="h-6 w-2/3 mx-auto mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <LoadingSkeleton className="h-12 w-48" />
          <LoadingSkeleton className="h-12 w-48" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <LoadingSkeleton className="h-4 w-20" />
              <LoadingSkeleton className="h-4 w-4 rounded" />
            </div>
            <LoadingSkeleton className="h-8 w-16" />
            <LoadingSkeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Study Sets Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton variant="button" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    </div>
  );
}
