import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface ResponsiveButtonProps extends ButtonProps {
  mobileVariant?: ButtonProps["variant"];
  mobileSize?: ButtonProps["size"];
  hideTextOnMobile?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  mobileVariant,
  mobileSize,
  hideTextOnMobile = false,
  icon,
  children,
  variant,
  size,
  className,
  ...props
}) => {
  const isMobile = useIsMobile();

  const finalVariant = isMobile && mobileVariant ? mobileVariant : variant;
  const finalSize = isMobile && mobileSize ? mobileSize : size;

  return (
    <Button
      variant={finalVariant}
      size={finalSize}
      className={cn(
        "flex items-center gap-2",
        isMobile && hideTextOnMobile && "px-3",
        className,
      )}
      {...props}
    >
      {icon}
      {!(isMobile && hideTextOnMobile) && children}
    </Button>
  );
};

export default ResponsiveButton;
