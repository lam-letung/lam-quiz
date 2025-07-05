import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const gapClasses = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4 md:gap-6",
  lg: "gap-4 sm:gap-6 md:gap-8",
};

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = "md",
  className,
}) => {
  const gridClasses = cn(
    "grid",
    `grid-cols-${columns.mobile || 1}`,
    columns.tablet && `sm:grid-cols-${columns.tablet}`,
    columns.desktop && `md:grid-cols-${columns.desktop}`,
    columns.large && `lg:grid-cols-${columns.large}`,
    gapClasses[gap],
    className,
  );

  return <div className={gridClasses}>{children}</div>;
};

interface ResponsiveGridItemProps {
  children: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    large?: number;
  };
  className?: string;
}

export const ResponsiveGridItem: React.FC<ResponsiveGridItemProps> = ({
  children,
  span,
  className,
}) => {
  const spanClasses = cn(
    span?.mobile && `col-span-${span.mobile}`,
    span?.tablet && `sm:col-span-${span.tablet}`,
    span?.desktop && `md:col-span-${span.desktop}`,
    span?.large && `lg:col-span-${span.large}`,
    className,
  );

  return <div className={spanClasses}>{children}</div>;
};

export default ResponsiveGrid;
