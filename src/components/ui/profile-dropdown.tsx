"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, UserRound, LogOut, ClipboardList } from "lucide-react";
import { LogoutButton } from "@/components/prime/logout-button";

export type ProfileIdentity = { name: string; email: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) ?? "P").toUpperCase();
}

export function ProfileDropdown({ account }: { account: ProfileIdentity }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="profile-dropdown" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="profile-trigger"
        aria-label={`Akun ${account.name}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="profile-trigger-text">
          <strong>{account.name}</strong>
          <span>{account.email}</span>
        </span>
        <span className="profile-avatar" aria-hidden="true">{initials(account.name)}</span>
        <ChevronDown className="profile-chevron" size={16} aria-hidden="true" />
      </button>

      {open && (
        <div className="profile-menu" id={panelId}>
          <div className="profile-menu-heading">
            <span className="profile-menu-avatar" aria-hidden="true">{initials(account.name)}</span>
            <div>
              <strong>{account.name}</strong>
              <span>{account.email}</span>
            </div>
          </div>
          <nav aria-label="Menu akun">
            <Link href="/profil" onClick={() => setOpen(false)}>
              <UserRound size={18} aria-hidden="true" /> Profil saya
            </Link>
            <Link href="/pesanan" onClick={() => setOpen(false)}>
              <ClipboardList size={18} aria-hidden="true" /> Booking saya
            </Link>
            <Link href="/booking" onClick={() => setOpen(false)}>
              <CalendarDays size={18} aria-hidden="true" /> Jadwal main
            </Link>
          </nav>
          <div className="profile-menu-signout">
            <LogoutButton className="profile-menu-logout" icon={<LogOut size={18} aria-hidden="true" />} />
          </div>
        </div>
      )}
    </div>
  );
}
