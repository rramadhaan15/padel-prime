"use client";

import { useState } from "react";

export function LogoutButton({ className = "back-link" }: { className?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setError("Belum dapat keluar. Silakan coba lagi.");
        return;
      }
      window.location.replace("/");
    } catch {
      setError("Koneksi terputus saat keluar. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="logout-control">
      <button type="button" className={className} onClick={logout} disabled={pending}>
        {pending ? "Sedang keluar..." : "Keluar dari akun"}
      </button>
      {error && <span className="logout-error" role="alert">{error}</span>}
    </div>
  );
}
