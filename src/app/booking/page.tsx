"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  Lock,
  Timer,
  AlertCircle,
  ChevronRight,
  Filter,
  ArrowLeft,
  Info,
  CheckCircle2,
  RefreshCw,
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

export default function BookingDashboardPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [filterType, setFilterType] = useState<"ALL" | "Indoor" | "Outdoor">("ALL");
  const [gridData, setGridData] = useState<GridApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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

  const fetchGrid = async (date: string, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
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
      setRefreshing(false);
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

  // Calculate live stats for the selected date
  const totalSlots = gridData?.courts.reduce((acc, c) => acc + c.slots.length, 0) || 0;
  const openSlots = gridData?.courts.reduce(
    (acc, c) => acc + c.slots.filter((s) => s.status === "open").length,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans pb-24">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0E1522]/95 backdrop-blur-md border-b border-[#1F2B3E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 rounded-xl bg-[#121A26] border border-[#1F2B3E] hover:border-[#D4FE2B]/50 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4FE2B]" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>

            <div className="h-6 w-px bg-[#1F2B3E] hidden sm:block" />

            <div className="flex items-center space-x-3">
              <div className="relative p-[1.5px] rounded-xl bg-gradient-to-br from-[#D4FE2B] to-[#10B981]">
                <div className="w-10 h-10 rounded-[10px] bg-[#0E1624] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#D4FE2B] fill-[#D4FE2B]" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black tracking-tight text-lg sm:text-xl text-white">
                    PADEL<span className="text-[#D4FE2B] ml-1">PRIME</span>
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 text-[#D4FE2B]">
                    DASHBOARD BOOKING
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#10B981]" /> Gelora Bung Karno, Senayan
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => fetchGrid(selectedDate, true)}
              disabled={refreshing || loading}
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#121A26] hover:bg-[#182334] text-slate-300 hover:text-white text-xs font-semibold border border-[#1F2B3E] transition flex items-center gap-1.5"
              title="Perbarui Jadwal"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D4FE2B] ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <Link
              href="/login"
              className="px-3 py-2 rounded-lg bg-[#121A26] hover:bg-[#182334] text-slate-300 hover:text-white text-xs font-semibold border border-[#1F2B3E] transition hidden sm:flex items-center gap-1.5"
            >
              Portal Member
            </Link>

            <Link
              href="/staff"
              className="px-3.5 py-2 rounded-lg bg-[#121A26] hover:bg-[#182334] text-slate-200 hover:text-white text-xs font-semibold border border-[#1F2B3E] transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span className="hidden sm:inline">Staf</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Booking Dashboard Banner & Live Metrics */}
      <section className="bg-gradient-to-b from-[#0E1522] to-[#0B0F17] border-b border-[#1F2B3E] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Ketersediaan Real-Time Aktif
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pilih Waktu & Lapangan Padel
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Pilih slot waktu di bawah ini. Slot yang Anda pilih akan dikunci selama 10 menit
              saat checkout agar terhindar dari pemesanan ganda.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
            <div className="p-3 rounded-xl bg-[#121A26] border border-[#1F2B3E]">
              <span className="text-[10px] text-slate-400 block font-medium">Slot Tersedia</span>
              <span className="text-lg font-black text-[#D4FE2B]">{openSlots}</span>
              <span className="text-[10px] text-slate-500 block">dari {totalSlots} slot</span>
            </div>
            <div className="p-3 rounded-xl bg-[#121A26] border border-[#1F2B3E]">
              <span className="text-[10px] text-slate-400 block font-medium">Durasi Bermain</span>
              <span className="text-lg font-black text-cyan-300">90 Min</span>
              <span className="text-[10px] text-slate-500 block">per sesi</span>
            </div>
            <div className="p-3 rounded-xl bg-[#121A26] border border-[#1F2B3E]">
              <span className="text-[10px] text-slate-400 block font-medium">Hold Lock</span>
              <span className="text-lg font-black text-amber-400">10 Min</span>
              <span className="text-[10px] text-slate-500 block">garansi checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Booking Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full flex-1">
        {/* 7-Day Rolling Advance Date Carousel */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4FE2B]" /> Kalender 7 Hari Rolling
            </h2>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Maksimal reservasi hingga 7 hari ke depan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {rollingDays.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#D4FE2B] text-black border-[#D4FE2B] shadow-[0_0_20px_rgba(212,254,43,0.35)] font-bold scale-[1.02]"
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
              <Filter className="w-3.5 h-3.5 text-[#D4FE2B]" /> Tipe Lapangan:
            </span>
            {(["ALL", "Indoor", "Outdoor"] as const).map((type) => (
              <button
                key={type}
                type="button"
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
              <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500" /> Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500 animate-pulse" /> Held (10m)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600" /> Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-950 border border-red-800" /> Blocked
            </span>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-[#D4FE2B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
                className="bg-[#121A26] border border-[#1F2B3E] rounded-2xl p-5 shadow-lg"
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
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Durasi slot: 90 menit (Termasuk pemanasan & game)
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
                        type="button"
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
                            <div className="w-5 h-5 border-2 border-[#D4FE2B] border-t-transparent rounded-full animate-spin" />
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

        {/* Quick Booking Guide Footer Note */}
        <div className="mt-10 p-5 rounded-2xl bg-[#121A26]/60 border border-[#1F2B3E] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 flex items-center justify-center text-[#D4FE2B] shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-bold text-white mb-0.5">Pilih Slot Waktu</p>
              <p>Pilih jam main yang diinginkan. Slot akan dikunci secara eksklusif selama 10 menit.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 flex items-center justify-center text-[#D4FE2B] shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-bold text-white mb-0.5">Checkout & Tambah Raket</p>
              <p>Isi nomor WhatsApp & nama tanpa password. Tambahkan sewa raket atau bola jika perlu.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#D4FE2B]/10 border border-[#D4FE2B]/30 flex items-center justify-center text-[#D4FE2B] shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-bold text-white mb-0.5">Bayar & Terima Tiket</p>
              <p>Bayar via QRIS dinamis atau Virtual Account. Tiket digital QR otomatis dikirim ke WhatsApp.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
