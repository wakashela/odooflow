import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6 border-[3px]",
    md: "h-8 w-8 border-[3px]",
    lg: "h-10 w-10 border-[3px]",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-[var(--color-hairline)] border-t-[var(--color-primary)]",
        sizeClasses[size],
        className
      )}
    />
  );
}
