import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Zap } from "lucide-react";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "brand" | "minimal";
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6", 
      lg: "w-8 h-8"
    };

    const variantClasses = {
      default: "text-primary",
      brand: "text-primary animate-pulse-glow",
      minimal: "text-muted-foreground"
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        {variant === "brand" ? (
          <Zap className={cn(sizeClasses[size], variantClasses[variant], "animate-spin")} />
        ) : (
          <Loader2 className={cn(sizeClasses[size], variantClasses[variant], "animate-spin")} />
        )}
      </div>
    );
  }
);
LoadingSpinner.displayName = "LoadingSpinner";

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "avatar" | "card" | "button";
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, variant = "text", ...props }, ref) => {
    const variantClasses = {
      text: "h-4 w-full rounded-md",
      avatar: "h-12 w-12 rounded-full",
      card: "h-32 w-full rounded-2xl",
      button: "h-10 w-24 rounded-xl"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-muted/50",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
LoadingSkeleton.displayName = "LoadingSkeleton";

interface LoadingStateProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: "default" | "brand" | "minimal";
}

const LoadingState: React.FC<LoadingStateProps> = ({
  children,
  title = "Loading...",
  description,
  variant = "default"
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <LoadingSpinner size="lg" variant={variant} />
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      
      {children}
    </div>
  );
};

export { LoadingSpinner, LoadingSkeleton, LoadingState };