import React from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  disabled?: boolean;
}

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  orientation?: "horizontal" | "vertical";
  variant?: "tabs" | "pills" | "buttons";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  orientation = "horizontal",
  variant = "tabs",
  size = "md",
  className,
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const getButtonSize = () => {
    if (isMobile) return "sm";
    if (isTablet && size === "lg") return "md";
    return size;
  };

  const getItemContent = (item: NavigationItem) => {
    const showIcon = !!item.icon;
    const showLabel = !isMobile || variant !== "tabs";

    return (
      <>
        {showIcon && (
          <span className={cn("flex-shrink-0", showLabel && "mr-2")}>
            {item.icon}
          </span>
        )}
        {showLabel && (
          <span
            className={cn(
              "truncate",
              isMobile && variant === "pills" && "text-xs",
            )}
          >
            {item.label}
          </span>
        )}
      </>
    );
  };

  const getButtonVariant = (item: NavigationItem) => {
    if (item.active) {
      return variant === "tabs" ? "default" : "default";
    }
    return variant === "tabs" ? "ghost" : "ghost";
  };

  const baseClasses = cn(
    "flex gap-1 sm:gap-2",
    orientation === "horizontal"
      ? "flex-row overflow-x-auto scrollbar-hide"
      : "flex-col",
    isMobile && orientation === "horizontal" && "pb-1",
    className,
  );

  if (orientation === "horizontal" && isMobile) {
    return (
      <div className={baseClasses}>
        {items.map((item) => (
          <Button
            key={item.id}
            variant={getButtonVariant(item)}
            size={getButtonSize()}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              "flex-shrink-0 min-w-0",
              variant === "tabs" && "rounded-lg",
              item.active &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {getItemContent(item)}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant={getButtonVariant(item)}
          size={getButtonSize()}
          onClick={item.onClick}
          disabled={item.disabled}
          className={cn(
            "justify-start",
            orientation === "horizontal" && "flex-1 min-w-0",
            variant === "pills" && "rounded-full",
            item.active &&
              "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {getItemContent(item)}
        </Button>
      ))}
    </div>
  );
};

export default ResponsiveNavigation;
