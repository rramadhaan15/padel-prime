"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  Users,
  Coffee,
  ShoppingBag,
  ShowerHead,
  Flame,
  HelpCircle,
} from "lucide-react";
import ImageSliderLoginDemo from "@/components/ui/demo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-[#D4FE2B] selection:text-black">
      {/* Top Floating Navbar */}
      <header className="sticky top-0 z-50 bg-[#0B0F17]/85 backdrop-blur-md border-b border-[#1F2B3E]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-br from-[#D4FE2B] via-emerald-400 to-[#10B981] shadow-[0_0_20px_rgba(212,254,43,0.3)] transition-transform group-hover:scale-105 duration-200">
              <div className="w-11 h-11 rounded-[14px] bg-[#0E1624] flex items-center justify-center relative overflow-hidden backdrop-blur-md">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4FE2B]/15 via-transparent to-emerald-500/20" />
                <Zap className="w-5 h-5 text-[#D4FE2B] fill-[#D4FE2B] drop-shadow-[0_0_10px_rgba(212,254,43,0.8)] relative z-10" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black tracking-tight text-xl sm:text-2xl text-white">
                  PADEL<span className="text-[#D4FE2B] ml-1.5 drop-shadow-[0_0_16px_rgba(212,254,43,0.45)]">PRIME</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-[#D4FE2B]/10 border border-[#D4FE2B]/35 text-[#D4FE2B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> SENAYAN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium tracking-wide">
                <MapPin className="w-3 h-3 text-[#10B981] shrink-0" /> Gelora Bung Karno, Jakarta
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#lapangan" className="hover:text-[#D4FE2B] transition-colors">
              Lapangan
            </a>
            <a href="#keunggulan" className="hover:text-[#D4FE2B] transition-colors">
              Keunggulan
            </a>
            <a href="#fasilitas" className="hover:text-[#D4FE2B] transition-colors">
              Fasilitas
            </a>
            <a href="#cara-booking" className="hover:text-[#D4FE2B] transition-colors">
              Cara Booking
            </a>
            <a href="#member-portal" className="hover:text-[#D4FE2B] transition-colors">
              Portal Member
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Link
              href="/staff"
              className="px-3 py-2 rounded-lg bg-[#121A26] hover:bg-[#182334] text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition hidden sm:flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" /> Portal Staf
            </Link>

            <Link
              href="/booking"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-xs sm:text-sm hover:brightness-110 transition shadow-[0_0_20px_rgba(212,254,43,0.35)] flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Dashboard Booking</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#1F2B3E]">
        {/* Ambient Glow Circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#D4FE2B]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121A26] border border-[#D4FE2B]/30 text-xs font-semibold text-slate-200 mb-6 backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4FE2B]" />
            <span className="text-[#D4FE2B] font-bold">Padel Club Senayan</span> &bull; 4 Panoramic Courts Berstandar WPT
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]"
          >
            Sensasi Main Padel <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#D4FE2B] via-emerald-300 to-[#10B981] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(212,254,43,0.35)]">
              Eksklusif & Real-Time
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Booking lapangan padel di Gelora Bung Karno tanpa ribet. Jadwal 7 hari real-time,
            proteksi kunci slot 10 menit anti-bentrok, tanpa registrasi akun, dan pembayaran instan QRIS.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/booking"
              className="px-8 py-3.5 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-sm sm:text-base hover:brightness-110 transition shadow-[0_0_30px_rgba(212,254,43,0.4)] flex items-center gap-2 group"
            >
              <Calendar className="w-5 h-5" />
              <span>Buka Dashboard Booking</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#member-portal"
              className="px-6 py-3.5 rounded-xl bg-[#121A26] hover:bg-[#182334] text-slate-200 hover:text-white font-bold text-sm sm:text-base border border-[#1F2B3E] transition backdrop-blur-md flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Portal Member</span>
            </a>
          </motion.div>

          {/* Hero Quick Highlights Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left"
          >
            <div className="p-4 rounded-2xl bg-[#121A26]/80 border border-[#1F2B3E] backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 flex items-center justify-center mb-2">
                <Award className="w-4 h-4 text-[#D4FE2B]" />
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">Kualitas Lapangan</span>
              <span className="text-sm sm:text-base font-extrabold text-white">4 Panoramic WPT</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121A26]/80 border border-[#1F2B3E] backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">Durasi Match</span>
              <span className="text-sm sm:text-base font-extrabold text-[#D4FE2B]">90 Menit / Sesi</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121A26]/80 border border-[#1F2B3E] backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">Garansi Slot</span>
              <span className="text-sm sm:text-base font-extrabold text-white">10 Menit Hold Lock</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121A26]/80 border border-[#1F2B3E] backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">Tiket & Akses</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400">QR Code WhatsApp</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courts Showcase Section */}
      <section id="lapangan" className="py-20 border-b border-[#1F2B3E] bg-[#0E1522]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black tracking-widest uppercase text-[#D4FE2B] mb-2 block">
              SPESIFIKASI LAPANGAN
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Pilihan Lapangan Indoor & Outdoor
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Didesain khusus untuk performa tinggi dengan kaca panoramic tanpa sudut tiang penghalang dan rumput sintetis Supercourt XN.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Indoor Court Card */}
            <div className="rounded-3xl bg-[#121A26] border border-[#1F2B3E] overflow-hidden hover:border-[#D4FE2B]/50 transition-all duration-300 shadow-xl group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop"
                  alt="Indoor Panoramic Court"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121A26] via-[#121A26]/40 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase backdrop-blur-md">
                  Indoor Panoramic (AC)
                </span>
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-[#D4FE2B] text-xs font-extrabold backdrop-blur-md">
                  Court 1 & 2
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-black text-white">Panoramic Indoor Court</h3>
                  <span className="text-xs text-slate-400 font-semibold">90 Menit / Sesi</span>
                </div>
                <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                  Ruangan ber-AC penuh dengan suhu terkontrol 22&deg;C, pencahayaan turnamen LED anti-silau 8 titik, serta kaca panoramic 12mm tebal tanpa tiang sudut.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FE2B]" /> AC Dingin 22&deg;C
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FE2B]" /> WPT Supercourt XN Turf
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FE2B]" /> Kaca Panoramic 12mm
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FE2B]" /> Anti-Glare Lighting
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#1F2B3E]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarif Mulai</span>
                    <span className="text-lg font-black text-[#D4FE2B]">Rp 350.000</span>
                    <span className="text-xs text-slate-400"> / slot</span>
                  </div>
                  <Link
                    href="/booking"
                    className="px-4 py-2.5 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-xs hover:brightness-110 transition flex items-center gap-1.5"
                  >
                    <span>Cek Jadwal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Outdoor Court Card */}
            <div className="rounded-3xl bg-[#121A26] border border-[#1F2B3E] overflow-hidden hover:border-[#10B981]/50 transition-all duration-300 shadow-xl group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?q=80&w=1200&auto=format&fit=crop"
                  alt="Outdoor Open Arena Court"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121A26] via-[#121A26]/40 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase backdrop-blur-md">
                  Outdoor Open Arena
                </span>
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-[#10B981] text-xs font-extrabold backdrop-blur-md">
                  Court 3 & 4
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-black text-white">Outdoor Open Arena</h3>
                  <span className="text-xs text-slate-400 font-semibold">90 Menit / Sesi</span>
                </div>
                <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                  Lapangan semi-terbuka dengan sirkulasi udara alami dan lampu sorot stadion malam hari. Ideal untuk pertandingan kompetitif dan latihan sore santai.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Udara Terbuka & Segar
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Quick-Dry All-Weather
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Lampu Sorot Malam Hari
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Tribun Penonton
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#1F2B3E]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarif Mulai</span>
                    <span className="text-lg font-black text-emerald-400">Rp 300.000</span>
                    <span className="text-xs text-slate-400"> / slot</span>
                  </div>
                  <Link
                    href="/booking"
                    className="px-4 py-2.5 rounded-xl bg-emerald-400 text-black font-extrabold text-xs hover:brightness-110 transition flex items-center gap-1.5"
                  >
                    <span>Cek Jadwal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrated ImageSlider + Member Portal Component Showcase */}
      <section id="member-portal" className="py-20 border-b border-[#1F2B3E] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black tracking-widest uppercase text-[#D4FE2B] mb-2 block">
              PORTAL MEMBER & RESERVASI
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Akses Cepat Member & Tiket Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Masuk untuk melihat riwayat reservasi digital, unduh invoice PDF, atau langsung buka kalender booking publik di bawah.
            </p>
          </div>

          {/* Render the ImageSliderLoginDemo Component */}
          <div className="w-full flex justify-center">
            <ImageSliderLoginDemo />
          </div>
        </div>
      </section>

      {/* Key Advantages ("Mengapa Padel Prime") */}
      <section id="keunggulan" className="py-20 border-b border-[#1F2B3E] bg-[#0E1522]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black tracking-widest uppercase text-[#D4FE2B] mb-2 block">
              MENGAPA PADEL PRIME
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Sistem Booking Tercanggih di Indonesia
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Dibangun dengan teknologi concurrency canggih yang menjamin kepastian reservasi tanpa keraguan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] hover:border-[#D4FE2B]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-[#D4FE2B]" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">10-Minute Pessimistic Hold</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Saat Anda mengklik slot, sistem langsung mengunci slot tersebut selama 10 menit dengan Redis lock. Nol kemungkinan bentrok atau direbut pemain lain saat mengisi data.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] hover:border-[#D4FE2B]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Checkout Kilat Tanpa Akun</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tidak perlu membuat akun atau menghafal password. Cukup masukkan nama, email, dan nomor WhatsApp aktif, pembayaran langsung selesai dalam hitungan detik.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] hover:border-[#D4FE2B]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Add-on Raket & Bola Terjamin</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Butuh sewa raket Babolat/Wilson atau beli can bola baru? Tambahkan langsung saat checkout. Stok perlengkapan disinkronisasi per jam agar tidak pernah kehabisan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] hover:border-[#D4FE2B]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Reschedule Fleksibel (H-24)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ada perubahan rencana mendadak? Anda bisa memindahkan jadwal secara mandiri via link di tiket digital hingga 24 jam sebelum jam main, dengan perhitungan selisih tarif otomatis.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] hover:border-[#D4FE2B]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Tiket QR WhatsApp & PDF Resmi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tiket digital langsung masuk ke WhatsApp Anda dilengkapi QR code berenkripsi aman. Lampiran invoice PDF resmi juga dikirim ke email untuk kebutuhan reimbursement kantor.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] hover:border-[#D4FE2B]/40 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base font-extrabold text-white mb-2">Lokasi Strategis Senayan</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Terletak di kawasan premium Gelora Bung Karno, Senayan, Jakarta Pusat. Akses mudah dari Sudirman, SCBD, dan Senayan dengan parkir luas dan aman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities & Amenities */}
      <section id="fasilitas" className="py-20 border-b border-[#1F2B3E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black tracking-widest uppercase text-[#D4FE2B] mb-2 block">
              FASILITAS CLUB
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Kenyamanan Menyeluruh Sebelum & Sesudah Main
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Nikmati fasilitas pendukung terlengkap untuk menunjang performa dan waktu santai Anda bersama rekan tanding.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#121A26] border border-[#1F2B3E] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-3">
                <Coffee className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-sm mb-1">Padel Cafe & Lounge</h4>
              <p className="text-[11px] text-slate-400">Kopi spesialti, smoothies protein, dan camilan sehat pasca pertandingan.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121A26] border border-[#1F2B3E] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mb-3">
                <ShowerHead className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-sm mb-1">Hot Shower & Locker</h4>
              <p className="text-[11px] text-slate-400">Kamar mandi air panas bertekanan tinggi, loker digital, dan hair dryer.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121A26] border border-[#1F2B3E] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-[#D4FE2B]/10 border border-[#D4FE2B]/20 flex items-center justify-center text-[#D4FE2B] mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-sm mb-1">Pro Shop & Demo Gear</h4>
              <p className="text-[11px] text-slate-400">Pusat apparel resmi, sewa raket uji coba Babolat & Bullpadel.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121A26] border border-[#1F2B3E] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-white text-sm mb-1">Free Handuk Dingin</h4>
              <p className="text-[11px] text-slate-400">Layanan handuk dingin gratis & air mineral untuk setiap pemain.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="cara-booking" className="py-20 border-b border-[#1F2B3E] bg-[#0E1522]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black tracking-widest uppercase text-[#D4FE2B] mb-2 block">
              CARA RESERVASI
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              3 Langkah Booking Dalam 30 Detik
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Proses pemesanan instan tanpa birokrasi chat manual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] relative">
              <div className="w-10 h-10 rounded-xl bg-[#D4FE2B] text-black font-black flex items-center justify-center mb-4 text-base">
                01
              </div>
              <h3 className="text-lg font-black text-white mb-2">Pilih Slot di Dashboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Buka Dashboard Booking publik, pilih tanggal (tersedia 7 hari ke depan), tentukan lapangan Indoor atau Outdoor, dan klik slot waktu yang Anda mau.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] relative">
              <div className="w-10 h-10 rounded-xl bg-[#D4FE2B] text-black font-black flex items-center justify-center mb-4 text-base">
                02
              </div>
              <h3 className="text-lg font-black text-white mb-2">Kunci 10 Menit & Bayar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Slot Anda terkunci otomatis. Tambahkan sewa raket atau bola jika perlu, lalu selesaikan pembayaran instan via QRIS semua e-wallet atau Virtual Account bank.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#121A26] border border-[#1F2B3E] relative">
              <div className="w-10 h-10 rounded-xl bg-[#D4FE2B] text-black font-black flex items-center justify-center mb-4 text-base">
                03
              </div>
              <h3 className="text-lg font-black text-white mb-2">Terima Tiket & Tanding</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tiket QR dikirim via WhatsApp. Tiba di Padel Prime Senayan, staf kami akan memindai QR code dalam 3 detik, dan Anda siap langsung bermain!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* High-Impact Bottom Call to Action */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-[#0E1522] to-[#0B0F17]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4FE2B]/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 text-[#D4FE2B] text-xs font-bold mb-4">
            <Flame className="w-3.5 h-3.5 fill-[#D4FE2B]" /> Amankan Jadwal Bermain Anda
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Siap Menguasai Lapangan Hari Ini?
          </h2>
          <p className="mt-4 text-slate-300 text-xs sm:text-base max-w-xl mx-auto leading-relaxed">
            Slot prime-time malam dan akhir pekan cepat terisi. Cek kalender real-time sekarang dan kunci jadwal Anda dalam hitungan detik.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/booking"
              className="px-9 py-4 rounded-xl bg-[#D4FE2B] text-black font-black text-sm sm:text-base hover:brightness-110 transition shadow-[0_0_35px_rgba(212,254,43,0.45)] flex items-center gap-2 group"
            >
              <Calendar className="w-5 h-5" />
              <span>Buka Dashboard Booking Sekarang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/staff"
              className="px-6 py-4 rounded-xl bg-[#121A26] hover:bg-[#182334] text-slate-200 hover:text-white font-bold text-sm sm:text-base border border-[#1F2B3E] transition backdrop-blur-md flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
              <span>Portal Staf</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1F2B3E] bg-[#080C13] py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1: Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#D4FE2B]" />
                </div>
                <span className="font-black text-lg text-white tracking-tight">
                  PADEL<span className="text-[#D4FE2B] ml-1">PRIME</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-4">
                Club padel premier di Gelora Bung Karno, Senayan, Jakarta Pusat. Menghadirkan 4 lapangan panoramic internasional dengan sistem reservasi instan bebas antre.
              </p>
              <p className="text-slate-500 text-[11px]">
                Jam Operasional: Setiap Hari 06:00 - 23:00 WIB
              </p>
            </div>

            {/* Col 2: Navigasi */}
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Navigasi</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/booking" className="hover:text-[#D4FE2B] transition-colors">
                    Dashboard Booking
                  </Link>
                </li>
                <li>
                  <a href="#lapangan" className="hover:text-[#D4FE2B] transition-colors">
                    Pilihan Lapangan
                  </a>
                </li>
                <li>
                  <a href="#fasilitas" className="hover:text-[#D4FE2B] transition-colors">
                    Fasilitas Club
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#D4FE2B] transition-colors">
                    Portal Member
                  </Link>
                </li>
                <li>
                  <Link href="/staff" className="hover:text-[#D4FE2B] transition-colors">
                    Portal Staf
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Hubungi Kami */}
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs mb-3">Lokasi & Kontak</h4>
              <p className="text-slate-300 font-medium mb-1">Padel Prime Club Senayan</p>
              <p className="text-slate-400 mb-3">
                Area Lapangan Olahraga Gelora Bung Karno, Senayan, Jakarta Pusat 10270
              </p>
              <p className="text-[#D4FE2B] font-bold">
                WhatsApp: +62 812-3456-7890
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1F2B3E] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} PADEL PRIME SENAYAN. Seluruh Hak Cipta Dilindungi.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-slate-400">Ketentuan Layanan</a>
              <a href="#" className="hover:text-slate-400">Kebijakan Privasi</a>
              <a href="#" className="hover:text-slate-400">Kebijakan Reschedule H-24</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
