"use client";

import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import ImageSliderLoginDemo from "@/components/ui/demo";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121A26] border border-[#1F2B3E] text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4FE2B]" /> Kembali ke Beranda
        </Link>

        <Link
          href="/booking"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D4FE2B] text-black text-xs font-extrabold hover:brightness-110 transition shadow-[0_0_15px_rgba(212,254,43,0.3)]"
        >
          <Calendar className="w-3.5 h-3.5" /> Dashboard Booking
        </Link>
      </div>

      {/* Main Login / Slider Component */}
      <div className="flex-1 flex items-center justify-center">
        <ImageSliderLoginDemo />
      </div>

      {/* Footer Info */}
      <div className="text-center py-3 text-xs text-slate-500">
        Padel Prime Club Senayan &copy; {new Date().getFullYear()} &middot; Gelora Bung Karno, Jakarta
      </div>
    </div>
  );
}
