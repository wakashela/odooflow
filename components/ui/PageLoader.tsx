import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = "Loading…", className }: PageLoaderProps) {
  return (
    <div className={cn("flex h-screen items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-[var(--color-muted)]">{message}</p>
      </div>
    </div>
  );
}
