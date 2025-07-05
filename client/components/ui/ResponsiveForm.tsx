import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface ResponsiveFormProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  title,
  description,
  actions,
  className,
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div className="space-y-4">{children}</div>
        {actions && <div className="flex flex-col space-y-2">{actions}</div>}
      </div>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {children}
        {actions && <div className="flex justify-end space-x-2">{actions}</div>}
      </CardContent>
    </Card>
  );
};

interface ResponsiveFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveFormField: React.FC<ResponsiveFormFieldProps> = ({
  label,
  required,
  error,
  description,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface ResponsiveFormActionsProps {
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  children?: React.ReactNode;
}

export const ResponsiveFormActions: React.FC<ResponsiveFormActionsProps> = ({
  primaryAction,
  secondaryAction,
  children,
}) => {
  const isMobile = useIsMobile();

  if (children) {
    return (
      <div
        className={cn(
          "flex gap-2",
          isMobile ? "flex-col" : "flex-row justify-end",
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        isMobile ? "flex-col-reverse" : "flex-row justify-end items-center",
      )}
    >
      {secondaryAction && (
        <Button
          variant="outline"
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.disabled}
          className={isMobile ? "w-full" : ""}
        >
          {secondaryAction.label}
        </Button>
      )}
      {primaryAction && (
        <Button
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled || primaryAction.loading}
          className={isMobile ? "w-full" : ""}
        >
          {primaryAction.loading ? "Loading..." : primaryAction.label}
        </Button>
      )}
    </div>
  );
};

export default ResponsiveForm;
