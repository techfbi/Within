import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          variant === "primary" && "bg-accent text-white hover:bg-accent-hover",
          variant === "ghost" &&
            "text-text-secondary hover:text-text-primary hover:bg-surface-raised",
          variant === "outline" &&
            "border border-border text-text-primary hover:border-border-strong bg-transparent",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Please wait</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export default Button;
