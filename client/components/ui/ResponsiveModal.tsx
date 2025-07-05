import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  full: "sm:max-w-full sm:h-full",
};

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  open,
  onOpenChange,
  title,
  description,
  footer,
  className,
  size = "md",
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(sizeClasses[size], className)}>
          {title && (
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          <div className="max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={className}>
        {title && (
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
        )}
        <div className="flex-1 overflow-y-auto px-4">{children}</div>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
};

export default ResponsiveModal;
