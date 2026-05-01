"use client";

import { useAuthStore } from "@/store/authStore";
import { logout } from "@/lib/odoo/auth";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { session, reset } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    reset();
    router.replace("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <User size={14} />
          </div>
          <span className="font-medium text-[var(--color-text)]">
            {session?.name || "User"}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)] transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  );
}
