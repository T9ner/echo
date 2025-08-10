import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface NotificationProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  closable?: boolean;
}

const notificationVariants = {
  default: {
    container: "bg-card border-border",
    icon: Info,
    iconColor: "text-primary"
  },
  success: {
    container: "bg-success/5 border-success/20",
    icon: CheckCircle,
    iconColor: "text-success"
  },
  warning: {
    container: "bg-warning/5 border-warning/20",
    icon: AlertTriangle,
    iconColor: "text-warning"
  },
  error: {
    container: "bg-destructive/5 border-destructive/20",
    icon: AlertCircle,
    iconColor: "text-destructive"
  },
  info: {
    container: "bg-primary/5 border-primary/20",
    icon: Info,
    iconColor: "text-primary"
  }
};

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ 
    className, 
    variant = "default", 
    title, 
    description, 
    action, 
    onClose, 
    closable = true,
    children,
    ...props 
  }, ref) => {
    const config = notificationVariants[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex gap-4 p-4 rounded-2xl border shadow-sm transition-smooth animate-slide-down",
          config.container,
          className
        )}
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-medium text-foreground mb-1">
              {title}
            </h4>
          )}
          
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
          
          {children}
          
          {action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="h-8 px-3 text-xs"
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>

        {/* Close Button */}
        {closable && onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-smooth"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
Notification.displayName = "Notification";

export { Notification };