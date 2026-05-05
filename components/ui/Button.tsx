import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "tertiary-text";
  size?: "sm" | "md" | "lg";
}

const VARIANT_STYLES = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-active)] disabled:bg-[var(--color-primary-disabled)] border border-transparent",
  secondary:
    "bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]",
  danger:
    "bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover)] border border-transparent",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] border border-transparent",
  outline:
    "border border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]",
  "tertiary-text":
    "bg-transparent text-[var(--color-ink)] border-transparent hover:underline p-0 h-auto",
};

const SIZE_STYLES = {
  sm: "px-4 py-2 text-[14px]",
  md: "px-6 py-3 h-[48px] text-[16px]",
  lg: "px-8 py-4 h-[56px] text-[16px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANT_STYLES[variant],
          variant !== "tertiary-text" && SIZE_STYLES[size],
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

