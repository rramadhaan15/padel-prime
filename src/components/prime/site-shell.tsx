"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader({ booking = false }: { booking?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>
      <header className="prime-header">
        <div className="prime-container header-inner">
          <Link
            href="/"
            className="prime-wordmark"
            aria-label="Padel Prime, beranda"
          >
            PADEL<span>PRIME</span>
            <span className="wordmark-period">.</span>
          </Link>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            <Link href="/#lapangan">Lapangan</Link>
            <Link href="/#cara-booking">Cara booking</Link>
            <Link href="/booking" aria-current={booking ? "page" : undefined}>
              Jadwal main
            </Link>
          </nav>
          <div className="header-actions">
            <Link
              className="prime-button primary header-book"
              href={booking ? "/" : "/booking"}
            >
              {booking ? "Beranda" : "Booking lapangan"}
            </Link>
            <button
              className="menu-toggle"
              ref={toggle}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
              <span>{menuOpen ? "Tutup" : "Menu"}</span>
            </button>
          </div>
        </div>
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Navigasi ponsel"
          hidden={!menuOpen}
        >
          <Link href="/#lapangan" onClick={() => setMenuOpen(false)}>
            Lapangan
          </Link>
          <Link href="/#cara-booking" onClick={() => setMenuOpen(false)}>
            Cara booking
          </Link>
          <Link href="/booking" onClick={() => setMenuOpen(false)}>
            Jadwal main
          </Link>
        </nav>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="prime-footer prime-container">
      <Link
        className="prime-wordmark"
        href="/"
        aria-label="Padel Prime, beranda"
      >
        PADEL<span>PRIME</span>
        <span className="wordmark-period">.</span>
      </Link>
      <p>Padel Prime Club · Senayan, Jakarta</p>
      <div>
        <Link href="/booking">Jadwal main</Link>
        <Link href="/staff">Portal staf</Link>
      </div>
    </footer>
  );
}
