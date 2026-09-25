"use client";

// src/components/ui/demo.tsx
// demos/image-slider-login-demo.tsx

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { ImageSlider } from "@/components/ui/image-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Apple, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

// Inline Google SVG since lucide-react does not bundle brand icons
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
      />
    </svg>
  );
}

export default function ImageSliderLoginDemo() {
  // Verified high-resolution padel & sports court images
  const images = [
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop", // Panoramic Blue Padel Court
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop", // Padel Player Ready to Serve
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop", // Pro Racket & Ball on Court
    "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?q=80&w=1200&auto=format&fit=crop", // Athletic Indoor Court Match
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="w-full min-h-[700px] flex items-center justify-center bg-transparent p-2 sm:p-4">
      <motion.div
        className="w-full max-w-5xl h-[700px] grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl border border-[#1F2B3E] bg-[#0E1522]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Left side: Image Slider */}
        <div className="hidden lg:block relative">
          <ImageSlider images={images} interval={4000} className="h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/90 via-[#0B0F17]/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-8 left-8 right-8 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4FE2B]/20 border border-[#D4FE2B]/40 text-[#D4FE2B] text-xs font-black uppercase tracking-widest backdrop-blur-md mb-2">
              <Zap className="w-3.5 h-3.5 fill-[#D4FE2B]" /> Club Senayan
            </div>
            <h3 className="text-2xl font-black text-white leading-snug">
              Padel Prime Arena
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              Panoramic Glass Courts berstandar WPT dengan pencahayaan LED turnamen dan lounge eksklusif.
            </p>
          </div>
        </div>

        {/* Right side: Login / Member Form */}
        <div className="w-full h-full bg-[#121A26] text-slate-100 flex flex-col items-center justify-center p-8 md:p-12 border-t lg:border-t-0 lg:border-l border-[#1F2B3E]">
          <motion.div
            className="w-full max-w-sm"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#D4FE2B]" />
              </div>
              <span className="text-xs font-black tracking-widest uppercase text-[#D4FE2B]">
                Member & Player Portal
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2"
            >
              Selamat Datang
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-slate-400 text-xs sm:text-sm mb-6"
            >
              Akses riwayat reservasi, invoice digital, dan kelola jadwal main padel Anda.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-3 mb-5"
            >
              <Button
                variant="outline"
                className="bg-[#182334] border-[#253752] text-slate-200 hover:text-white hover:bg-[#1E2C42] text-xs h-10"
              >
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                variant="outline"
                className="bg-[#182334] border-[#253752] text-slate-200 hover:text-white hover:bg-[#1E2C42] text-xs h-10"
              >
                <Apple className="mr-2 h-4 w-4" />
                Apple
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#1F2B3E]" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-[#121A26] px-3 text-slate-400 font-semibold">
                  Atau masuk dengan email
                </span>
              </div>
            </motion.div>

            <motion.form
              variants={itemVariants}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Silakan langsung pilih jadwal di Dashboard Booking untuk reservasi instan tanpa registrasi!");
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-300">
                  Email / WhatsApp Number
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="nomor@whatsapp atau email"
                  required
                  className="bg-[#182334] border-[#253752] text-white placeholder:text-slate-500 focus-visible:ring-[#D4FE2B] text-xs h-10"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs text-slate-300">
                    PIN / Password
                  </Label>
                  <a
                    href="#"
                    className="text-[11px] font-semibold text-[#D4FE2B] hover:underline"
                  >
                    Lupa PIN?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-[#182334] border-[#253752] text-white placeholder:text-slate-500 focus-visible:ring-[#D4FE2B] text-xs h-10"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#D4FE2B] text-black font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-[0_0_15px_rgba(212,254,43,0.3)] h-10"
              >
                Masuk ke Portal Member
              </Button>
            </motion.form>

            <motion.div variants={itemVariants} className="mt-6 pt-5 border-t border-[#1F2B3E]/80 text-center">
              <p className="text-xs text-slate-400">
                Ingin langsung booking slot tanpa akun?
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-[#D4FE2B] hover:underline"
              >
                Buka Dashboard Booking Publik <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export { ImageSliderLoginDemo };
