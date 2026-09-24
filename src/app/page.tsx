"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  Lock,
  Timer,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

interface SlotData {
  id: string;
  courtId: string;
  courtName: string;
  courtType: "Indoor" | "Outdoor";
  date: string;
  startTime: string;
  endTime: string;
  timeBand: "Regular" | "Peak";
  price: number;
  status: "open" | "held" | "booked" | "blocked";
  blockReason?: string | null;
}

interface CourtGroup {
  court: {
    id: string;
    venueId: string;
    name: string;
    type: "Indoor" | "Outdoor";
    isActive: boolean;
  };
  slots: SlotData[];
}

interface GridApiResponse {
  success: boolean;
  data?: {
    venueId: string;
    venueName: string;
    date: string;
    advanceDaysAllowed: number;
    courts: CourtGroup[];
  };
  error?: string;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [filterType, setFilterType] = useState<"ALL" | "Indoor" | "Outdoor">("ALL");
  const [gridData, setGridData] = useState<GridApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [holdingSlotId, setHoldingSlotId] = useState<string | null>(null);

  // Generate 7-day rolling window dates
  const rollingDays = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
    const dayNum = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return { dateStr, dayName, dayNum, isWeekend, isToday: i === 0 };
  });

  const fetchGrid = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/availability?date=${date}`);
      const json: GridApiResponse = await res.json();
      if (json.success && json.data) {
        setGridData(json.data);
      } else {
        setError(json.error || "Gagal memuat ketersediaan lapangan.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan saat mengambil jadwal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrid(selectedDate);
  }, [selectedDate]);

  const handleSelectSlot = async (slot: SlotData) => {
    if (slot.status !== "open") return;

    setHoldingSlotId(slot.id);
    try {
      const res = await fetch("/api/holds/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, courtId: slot.courtId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect to checkout with holdId
        router.push(`/checkout/${data.data.holdId}`);
      } else {
        alert(data.error || "Slot ini baru saja diambil pelanggan lain.");
        fetchGrid(selectedDate);
      }
    } catch {
      alert("Gagal mengunci slot. Silakan coba kembali.");
    } finally {
      setHoldingSlotId(null);
    }
  };

  const filteredCourts = gridData?.courts.filter((c) => {
    if (filterType === "ALL") return true;
    return c.court.type === filterType;
  });

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans pb-20">
      {/* Top Navbar */}
      <header className="border-b border-[#1F2B3E] bg-[#0E1522]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4FE2B] to-[#10B981] flex items-center justify-center shadow-glow">
              <Zap className="w-6 h-6 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-xl text-white">PADEL PRIME</span>
                <span className="text-[10px] bg-[#D4FE2B]/15 text-[#D4FE2B] px-2 py-0.5 rounded-full font-bold border border-[#D4FE2B]/30 tracking-widest uppercase">
                  Club Senayan
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#10B981]" /> Gelora Bung Karno, Jakarta Pusat
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/staff")}
              className="px-4 py-2 rounded-lg bg-[#182335] hover:bg-[#202E46] text-slate-300 hover:text-white text-xs font-semibold border border-[#253752] transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" /> Portal Staf
            </button>
          </div>
        </div>
      </header>

      {/* Lamp Hero Section */}
      <section className="relative w-full overflow-hidden bg-slate-950 border-b border-[#1F2B3E]">
        <LampContainer className="pt-20 pb-12 min-h-[580px] md:min-h-[640px]" contentClassName="-translate-y-28 sm:-translate-y-36">
          <motion.div
            initial={{ opacity: 0.5, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.2,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center text-center max-w-4xl mx-auto px-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-[#D4FE2B]" /> Jakarta&apos;s Premier Padel Club
            </div>

            <h1 className="bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 py-2 bg-clip-text text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent">
              Booking Lapangan Padel <br />
              <span className="text-[#D4FE2B] drop-shadow-[0_0_35px_rgba(212,254,43,0.35)]">
                Real-Time & Bebas Antre
              </span>
            </h1>

            <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Jadwal akurat dalam rentang 7 hari rolling. Tanpa registrasi akun,
              pembayaran instan QRIS/VA, dan perlindungan slot otomatis 10 menit saat checkout.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#jadwal"
                className="px-7 py-3 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-xs sm:text-sm hover:brightness-110 transition shadow-glow flex items-center gap-2"
              >
                Pilih Jadwal Sekarang <ChevronRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => router.push("/staff")}
                className="px-5 py-3 rounded-xl bg-[#121A26]/80 hover:bg-[#182334] text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-[#1F2B3E] transition backdrop-blur-md flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#22D3EE]" /> Portal Staf
              </button>
            </div>

            {/* Quick Club Info Row */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-2xl text-left">
              <div className="p-3 rounded-xl bg-[#121A26]/80 border border-[#1F2B3E]/80 backdrop-blur-md">
                <span className="text-[10px] text-slate-400 block">Total Lapangan</span>
                <span className="text-sm font-extrabold text-white">4 Courts (2 In / 2 Out)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121A26]/80 border border-[#1F2B3E]/80 backdrop-blur-md">
                <span className="text-[10px] text-slate-400 block">Durasi Main</span>
                <span className="text-sm font-extrabold text-[#D4FE2B]">90 Menit / Slot</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121A26]/80 border border-[#1F2B3E]/80 backdrop-blur-md">
                <span className="text-[10px] text-slate-400 block">Jam Operasional</span>
                <span className="text-sm font-extrabold text-cyan-300">06:00 - 23:00 WIB</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121A26]/80 border border-[#1F2B3E]/80 backdrop-blur-md">
                <span className="text-[10px] text-slate-400 block">Pembayaran</span>
                <span className="text-sm font-extrabold text-emerald-400">QRIS & VA Dinamis</span>
              </div>
            </div>
          </motion.div>
        </LampContainer>
      </section>

      {/* Main Booking Container */}
      <main id="jadwal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 w-full flex-1">
        {/* 7-Day Rolling Advance Date Carousel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4FE2B]" /> Pilih Tanggal (Rolling 7 Hari)
            </h2>
            <span className="text-xs text-slate-400">
              Maksimal reservasi hingga 7 hari ke depan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {rollingDays.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#D4FE2B] text-black border-[#D4FE2B] shadow-glow font-bold scale-[1.02]"
                      : "bg-[#121A26] border-[#1F2B3E] text-slate-300 hover:border-[#2D3E57] hover:bg-[#182334]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isSelected ? "text-black/80" : item.isWeekend ? "text-amber-400" : "text-slate-400"
                      }`}
                    >
                      {item.isToday ? "Hari Ini" : item.dayName}
                    </span>
                    {item.isWeekend && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                          isSelected ? "bg-black/20 text-black" : "bg-amber-400/10 text-amber-400"
                        }`}
                      >
                        PEAK
                      </span>
                    )}
                  </div>
                  <div className={`text-base font-extrabold ${isSelected ? "text-black" : "text-white"}`}>
                    {item.dayNum}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & Legend Bar */}
        <div className="bg-[#121A26] border border-[#1F2B3E] rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Court Type Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#D4FE2B]" /> Filter:
            </span>
            {(["ALL", "Indoor", "Outdoor"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === type
                    ? "bg-[#1F2B3E] text-[#D4FE2B] border border-[#D4FE2B]/40"
                    : "text-slate-400 hover:text-white hover:bg-[#182334]"
                }`}
              >
                {type === "ALL" ? "Semua Lapangan" : `${type} Courts`}
              </button>
            ))}
          </div>

          {/* Status Legends */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></span> Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500 animate-pulse"></span> Held (10m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600"></span> Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-950 border border-red-800"></span> Blocked
            </span>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-[#D4FE2B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm">Memuat ketersediaan lapangan...</p>
          </div>
        )}

        {error && (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-center my-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Court Grid Matrix */}
        {!loading && !error && filteredCourts && (
          <div className="space-y-6">
            {filteredCourts.map((courtGroup) => (
              <div
                key={courtGroup.court.id}
                className="bg-[#121A26] border border-[#1F2B3E] rounded-2xl p-5 glow-card"
              >
                {/* Court Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-[#1F2B3E] pb-4 mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-white">{courtGroup.court.name}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        courtGroup.court.type === "Indoor"
                          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {courtGroup.court.type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Durasi slot: 90 menit (Termasuk pemanasan & game)
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {courtGroup.slots.map((slot) => {
                    const isHoldingThis = holdingSlotId === slot.id;
                    const isOpen = slot.status === "open";
                    const isHeld = slot.status === "held";
                    const isBooked = slot.status === "booked";
                    const isBlocked = slot.status === "blocked";

                    return (
                      <button
                        key={slot.id}
                        disabled={!isOpen || isHoldingThis}
                        onClick={() => handleSelectSlot(slot)}
                        className={`group relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[105px] ${
                          isOpen
                            ? "bg-[#182334] border-[#253752] hover:border-[#D4FE2B] hover:bg-[#1E2C42] cursor-pointer"
                            : isHeld
                            ? "bg-amber-950/20 border-amber-600/40 opacity-80 cursor-not-allowed"
                            : isBooked
                            ? "bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed"
                            : "bg-red-950/20 border-red-900/40 text-red-400 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        {/* Time & Band */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-black text-white group-hover:text-[#D4FE2B] transition">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              slot.timeBand === "Peak"
                                ? "bg-amber-400/20 text-amber-300"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {slot.timeBand}
                          </span>
                        </div>

                        {/* Price & State indicator */}
                        <div className="mt-2 flex items-end justify-between w-full">
                          <div>
                            <span className="text-xs font-bold text-slate-200">
                              {formatPrice(slot.price)}
                            </span>
                          </div>

                          {/* Status Icon / Text */}
                          {isOpen && (
                            <span className="text-[10px] text-emerald-400 font-bold group-hover:text-[#D4FE2B] flex items-center">
                              Pilih <ChevronRight className="w-3 h-3 ml-0.5" />
                            </span>
                          )}

                          {isHeld && (
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                              <Timer className="w-3 h-3 animate-spin" /> Held
                            </span>
                          )}

                          {isBooked && (
                            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Booked
                            </span>
                          )}

                          {isBlocked && (
                            <span className="text-[9px] text-red-400 font-semibold truncate max-w-[80px]">
                              {slot.blockReason || "Blocked"}
                            </span>
                          )}
                        </div>

                        {/* Loading spinner overlay if selecting */}
                        {isHoldingThis && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#D4FE2B] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
