import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "minimal" | "glow";
}

const logoSizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-2xl overflow-hidden",
          logoSizes[size],
          variant === "glow" &&
            "shadow-glow hover:shadow-glow-strong transition-smooth",
          className
        )}
        {...props}
      >
        {/* Logo Image */}
        <img
          src="/echo-logo.png"
          alt="ECHO Logo"
          className="w-full h-full object-contain"
          loading="lazy"
        />

        {/* Glow effect overlay */}
        {variant === "glow" && (
          <div className="absolute inset-0 bg-brand-gradient opacity-10 blur-sm animate-pulse-glow pointer-events-none" />
        )}
      </div>
    );
  }
);
Logo.displayName = "Logo";

export { Logo };
