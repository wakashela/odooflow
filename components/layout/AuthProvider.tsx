"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { checkSession } from "@/lib/odoo/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, setSession, setLoading, reset } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isLoginPage = pathname === "/login";

    checkSession().then((s) => {
      if (s && s.uid) {
        setSession(s);
        if (isLoginPage) router.replace("/");
      } else {
        reset();
        if (!isLoginPage) router.replace("/login");
      }
    }).catch(() => {
      reset();
      if (!isLoginPage) router.replace("/login");
    });
  }, []);

  if (useAuthStore.getState().loading && pathname !== "/login") {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
