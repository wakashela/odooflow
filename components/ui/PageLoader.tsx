import { cn } from "@/lib/utils";

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = "Loading…", className }: PageLoaderProps) {
  return (
    <div className={cn("flex h-screen items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--color-hairline)] border-t-[var(--color-primary)]" />
        <p className="text-sm text-[var(--color-muted)]">{message}</p>
      </div>
    </div>
  );
}
