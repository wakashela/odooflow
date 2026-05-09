"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { checkSession } from "@/lib/odoo/auth";
import { Spinner } from "@/components/ui/Spinner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, reset } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isLoginPage = pathname === "/login";

    checkSession()
      .then((s) => {
        if (s && s.uid) {
          setSession(s);
          if (isLoginPage) router.replace("/");
        } else {
          reset();
          if (!isLoginPage) router.replace("/login");
        }
      })
      .catch(() => {
        reset();
        if (!isLoginPage) router.replace("/login");
      })
      .finally(() => {
        setChecking(false);
        setMounted(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Before mount or during initial session check, show nothing or a full-page loader
  if (!mounted || checking) {
    if (pathname === "/login") return null; // Avoid spinner on login page during initial load

    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="md" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
