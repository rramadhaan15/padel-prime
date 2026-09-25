"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Users,
  DollarSign,
  Wrench,
  Package,
  PlusCircle,
  Unlock,
  Lock,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface OccupancyStats {
  date: string;
  totalSlots: number;
  openSlots: number;
  heldSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  occupancyRatePercent: number;
  totalEstimatedRevenue: number;
}

interface StagingItem {
  timeSlot: string;
  courtName: string;
  customerName: string;
  racketsCount: number;
  ballsCount: number;
}

interface StagingSummary {
  date: string;
  totalRacketsToStage: number;
  totalBallsToStage: number;
  items: StagingItem[];
}

export default function StaffPage() {
  const router = useRouter();

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"checkin" | "staging" | "walkin" | "blocking">("checkin");

  // Date state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Data states
  const [stats, setStats] = useState<OccupancyStats | null>(null);
  const [staging, setStaging] = useState<StagingSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Check-in state
  const [checkInInput, setCheckInInput] = useState("");
  const [checkInResult, setCheckInResult] = useState<any | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Walk-in form state
  const [openSlots, setOpenSlots] = useState<Array<{ id: string; label: string; price: number }>>([]);
  const [walkInSlotId, setWalkInSlotId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInRackets, setWalkInRackets] = useState(0);
  const [walkInBalls, setWalkInBalls] = useState(0);
  const [walkInMessage, setWalkInMessage] = useState<string | null>(null);

  // Block/unblock slots
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [blockReason, setBlockReason] = useState("Perawatan Kaca Lapangan");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "padel888") {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const fetchStaffData = async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/stats?date=${date}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data.stats);
        setStaging(data.data.staging);
      }

      // Fetch availability for slots
      const availRes = await fetch(`/api/availability?date=${date}`);
      const availData = await availRes.json();
      if (availData.success && availData.data) {
        const opens: typeof openSlots = [];
        const flat: any[] = [];
        for (const c of availData.data.courts) {
          for (const s of c.slots) {
            flat.push({ ...s, courtName: c.court.name });
            if (s.status === "open") {
              opens.push({
                id: s.id,
                label: `${c.court.name} (${s.startTime} - ${s.endTime})`,
                price: s.price,
              });
            }
          }
        }
        setOpenSlots(opens);
        setAllSlots(flat);
        if (opens.length > 0 && !walkInSlotId) {
          setWalkInSlotId(opens[0].id);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStaffData(selectedDate);
    }
  }, [isAuthenticated, selectedDate]);

  // Handle Search
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/staff/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch {
      // ignore
    }
  };

  // Handle QR Check-in
  const handleExecuteCheckIn = async (tokenOrRef: string) => {
    setCheckInError(null);
    setCheckInResult(null);
    try {
      const res = await fetch("/api/staff/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenOrRef }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCheckInResult(data.data);
        fetchStaffData(selectedDate);
      } else {
        setCheckInError(data.error || "Gagal melakukan check-in.");
      }
    } catch {
      setCheckInError("Terjadi kesalahan jaringan saat verifikasi check-in.");
    }
  };

  // Handle No-Show Sweep
  const handleRunNoShowSweep = async () => {
    try {
      const res = await fetch("/api/staff/noshow-sweep", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(
          `Automated Sweep Selesai:\n${data.data.transitionedCount} booking yang terlewat berhasil dialihkan ke No-Show.`
        );
        fetchStaffData(selectedDate);
      }
    } catch {
      alert("Gagal menjalankan no-show sweep.");
    }
  };

  // Handle Walk-in submit
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInSlotId || !walkInName || !walkInPhone) return;

    try {
      const res = await fetch("/api/staff/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: walkInSlotId,
          customerName: walkInName,
          customerPhone: walkInPhone,
          racketsCount: walkInRackets,
          ballsCount: walkInBalls,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWalkInMessage(`Booking walk-in berhasil! Kode Ref: ${data.data.bookingRef}`);
        setWalkInName("");
        setWalkInPhone("");
        setWalkInRackets(0);
        setWalkInBalls(0);
        fetchStaffData(selectedDate);
      } else {
        alert(data.error || "Gagal membuat booking walk-in.");
      }
    } catch {
      alert("Kesalahan jaringan.");
    }
  };

  // Handle Block / Unblock
  const handleBlockSlot = async (slotId: string) => {
    try {
      const res = await fetch("/api/staff/slots/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, reason: blockReason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStaffData(selectedDate);
      } else {
        alert(data.error || "Gagal memblokir slot.");
      }
    } catch {
      alert("Kesalahan jaringan.");
    }
  };

  const handleUnblockSlot = async (slotId: string) => {
    try {
      const res = await fetch("/api/staff/slots/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStaffData(selectedDate);
      } else {
        alert(data.error || "Gagal membuka blokir slot.");
      }
    } catch {
      alert("Kesalahan jaringan.");
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // PIN Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121A26] border border-[#1F2B3E] rounded-3xl p-8 shadow-2xl text-center space-y-6 glow-card">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-[#22D3EE]">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Portal Staf Venue</h1>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan PIN Staf untuk mengakses sistem operasional & scanner check-in.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Masukkan PIN (Default: padel888)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-[#182334] border border-[#253752] focus:border-[#D4FE2B] rounded-xl px-4 py-3 text-center text-lg tracking-widest text-white focus:outline-none"
              />
              {pinError && (
                <p className="text-xs text-red-400 mt-1.5 font-semibold">
                  PIN salah. Coba PIN demo: padel888
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-sm hover:brightness-110 transition shadow-glow"
            >
              Masuk Dashboard Staf
            </button>
          </form>

          <button
            onClick={() => router.push("/booking")}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Kalender Publik
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-20 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#1F2B3E] bg-[#0E1522]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-lg bg-[#182334] hover:bg-[#202E46] text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white">STAFF OPERATIONS</span>
              <span className="text-[10px] bg-cyan-500/20 text-[#22D3EE] px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                Padel Prime Club
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunNoShowSweep}
              className="px-3 py-1.5 rounded-lg bg-[#1F2B3E] hover:bg-[#2A3B54] text-xs font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Run No-Show Sweep
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-xs font-bold text-red-300 border border-red-800/40 transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Operations Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Date Selector & Metrics Grid */}
        <div className="bg-[#121A26] border border-[#1F2B3E] rounded-3xl p-6 glow-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F2B3E] pb-4 mb-6">
            <div>
              <span className="text-xs text-[#D4FE2B] font-bold uppercase tracking-wider">
                Ringkasan Harian Venue
              </span>
              <h2 className="text-2xl font-black text-white">Metrik & Okupansi Lapangan</h2>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Pilih Tanggal:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#182334] border border-[#253752] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#182334] p-4 rounded-2xl border border-[#253752]">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Estimasi Pendapatan
                </span>
                <span className="text-xl font-black text-[#D4FE2B]">
                  {formatPrice(stats.totalEstimatedRevenue)}
                </span>
              </div>

              <div className="bg-[#182334] p-4 rounded-2xl border border-[#253752]">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" /> Tingkat Okupansi
                </span>
                <span className="text-xl font-black text-white">
                  {stats.occupancyRatePercent}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {stats.bookedSlots} dari {stats.totalSlots} slot terisi
                </span>
              </div>

              <div className="bg-[#182334] p-4 rounded-2xl border border-[#253752]">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Slot Open / Kosong
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {stats.openSlots}
                </span>
              </div>

              <div className="bg-[#182334] p-4 rounded-2xl border border-[#253752]">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-red-400" /> Slot Diblokir
                </span>
                <span className="text-xl font-black text-red-400">
                  {stats.blockedSlots}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-[#1F2B3E] pb-2">
          {[
            { id: "checkin", label: "Check-in & QR Scanner", icon: QrCode },
            { id: "staging", label: "Persiapan Alat (Staging)", icon: Package },
            { id: "walkin", label: "Reservasi Walk-in", icon: PlusCircle },
            { id: "blocking", label: "Blokir / Maintenance Lapangan", icon: Wrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isActive
                    ? "bg-[#D4FE2B] text-black shadow-glow"
                    : "bg-[#121A26] border border-[#1F2B3E] text-slate-400 hover:text-white hover:bg-[#182334]"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: Check-in & Search */}
        {activeTab === "checkin" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: QR Scanner / Ref Input */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-[#121A26] border border-[#1F2B3E] rounded-3xl p-6 glow-card">
                <h3 className="font-extrabold text-white text-base mb-1 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#D4FE2B]" /> Pemindai Tiket QR / Input Referensi
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Scan kode QR pelanggan dengan kamera atau masukkan kode booking referensi (contoh: BK-...).
                </p>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Scan QR token atau tempel Booking Ref..."
                    value={checkInInput}
                    onChange={(e) => setCheckInInput(e.target.value)}
                    className="w-full bg-[#182334] border border-[#253752] focus:border-[#D4FE2B] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleExecuteCheckIn(checkInInput)}
                    disabled={!checkInInput}
                    className="w-full py-3 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-xs hover:brightness-110 disabled:opacity-50 transition shadow-glow"
                  >
                    Verifikasi & Selesaikan Check-in
                  </button>
                </div>

                {checkInError && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{checkInError}</span>
                  </div>
                )}

                {checkInResult && (
                  <div className="mt-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                      <CheckCircle2 className="w-5 h-5" /> CHECK-IN BERHASIL DIKONFIRMASI!
                    </div>
                    <div className="text-xs text-slate-300 space-y-1 pt-1">
                      <p>• Pemesan: <span className="font-bold text-white">{checkInResult.booking.customerName}</span></p>
                      <p>• Lapangan: <span className="font-bold text-white">{checkInResult.court.name}</span></p>
                      <p>• Jam: <span className="font-bold text-white">{checkInResult.slot.startTime} - {checkInResult.slot.endTime}</span></p>
                      {(checkInResult.booking.racketsCount > 0 || checkInResult.booking.ballsCount > 0) && (
                        <p className="text-amber-300 font-semibold">
                          🎾 Siapkan: {checkInResult.booking.racketsCount} Raket & {checkInResult.booking.ballsCount} Kaleng Bola!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Search Booking by Phone / Name */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-[#121A26] border border-[#1F2B3E] rounded-3xl p-6">
                <h3 className="font-extrabold text-white text-base mb-1 flex items-center gap-2">
                  <Search className="w-5 h-5 text-cyan-400" /> Pencarian Cepat Pelanggan
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Cari booking jika baterai HP pelanggan habis (berdasarkan nomor WhatsApp atau Nama).
                </p>

                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Ketik nomor WhatsApp atau nama..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-[#182334] border border-[#253752] focus:border-[#22D3EE] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {searchResults.map((item) => {
                    const b = item.booking;
                    const cust = item.customer;
                    const isFlagged = cust?.isFlagged || false;

                    return (
                      <div
                        key={b.id}
                        className="bg-[#182334] border border-[#253752] rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm">{b.customerName}</span>
                            {isFlagged && (
                              <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.2 rounded font-black">
                                ⚠️ FLAGGED (3+ NO-SHOW)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">{b.customerPhone}</span>
                          <span className="text-[11px] text-cyan-300 block font-mono mt-0.5">{b.bookingRef}</span>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            b.status === "Confirmed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : b.status === "Checked-In"
                              ? "bg-cyan-500/20 text-cyan-300"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {b.status}
                          </span>

                          {b.status === "Confirmed" && (
                            <button
                              onClick={() => handleExecuteCheckIn(b.bookingRef)}
                              className="px-3 py-1 rounded-lg bg-[#D4FE2B] text-black font-extrabold text-xs hover:brightness-110 transition"
                            >
                              Check-In
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {searchQuery.length >= 2 && searchResults.length === 0 && (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      Tidak ada hasil yang sesuai dengan &quot;{searchQuery}&quot;.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Equipment Staging */}
        {activeTab === "staging" && staging && (
          <div className="bg-[#121A26] border border-[#1F2B3E] rounded-3xl p-6 glow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-[#1F2B3E] pb-4">
              <div>
                <h3 className="font-extrabold text-white text-lg">Alokasi Persiapan Peralatan (Staging Desk)</h3>
                <p className="text-xs text-slate-400">Daftar raket dan bola yang wajib disiapkan di meja staf untuk sesi hari ini.</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="bg-[#182334] px-3 py-1.5 rounded-xl border border-[#253752]">
                  Total Raket Disiapkan: <span className="font-bold text-[#D4FE2B]">{staging.totalRacketsToStage}</span>
                </span>
                <span className="bg-[#182334] px-3 py-1.5 rounded-xl border border-[#253752]">
                  Total Kaleng Bola Disiapkan: <span className="font-bold text-cyan-400">{staging.totalBallsToStage}</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#182334] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Waktu Slot</th>
                    <th className="p-3">Lapangan</th>
                    <th className="p-3">Nama Pemesan</th>
                    <th className="p-3 text-center">Raket Sewa</th>
                    <th className="p-3 text-center rounded-r-xl">Kaleng Bola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2B3E]">
                  {staging.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#182334]/50 transition">
                      <td className="p-3 font-bold text-white">{item.timeSlot}</td>
                      <td className="p-3 text-slate-300">{item.courtName}</td>
                      <td className="p-3 font-medium text-slate-200">{item.customerName}</td>
                      <td className="p-3 text-center font-extrabold text-[#D4FE2B]">
                        {item.racketsCount}
                      </td>
                      <td className="p-3 text-center font-extrabold text-cyan-400">
                        {item.ballsCount}
                      </td>
                    </tr>
                  ))}
                  {staging.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Tidak ada add-on peralatan yang dipesan untuk tanggal ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 3: Walk-in Reservation */}
        {activeTab === "walkin" && (
          <div className="max-w-xl mx-auto bg-[#121A26] border border-[#1F2B3E] rounded-3xl p-6 glow-card">
            <div className="border-b border-[#1F2B3E] pb-3 mb-6">
              <h3 className="font-extrabold text-white text-lg">Buat Reservasi Walk-In / Telepon</h3>
              <p className="text-xs text-slate-400">
                Pesan langsung di venue. Melewati payment gateway dan langsung terkonfirmasi.
              </p>
            </div>

            {walkInMessage && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                {walkInMessage}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Pilih Slot Kosong *</label>
                <select
                  value={walkInSlotId}
                  onChange={(e) => setWalkInSlotId(e.target.value)}
                  className="w-full bg-[#182334] border border-[#253752] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                >
                  {openSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} - {formatPrice(s.price)}
                    </option>
                  ))}
                  {openSlots.length === 0 && <option value="">Tidak ada slot open pada tanggal ini</option>}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nama Pemesan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Walk-in Guest"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full bg-[#182334] border border-[#253752] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full bg-[#182334] border border-[#253752] rounded-xl px-4 py-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Sewa Raket (Maks. 4)</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={walkInRackets}
                    onChange={(e) => setWalkInRackets(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#182334] border border-[#253752] rounded-xl px-4 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Beli Kaleng Bola</label>
                  <input
                    type="number"
                    min={0}
                    value={walkInBalls}
                    onChange={(e) => setWalkInBalls(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#182334] border border-[#253752] rounded-xl px-4 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={openSlots.length === 0}
                className="w-full py-3 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-xs hover:brightness-110 disabled:opacity-50 transition shadow-glow mt-4"
              >
                Konfirmasi Reservasi Walk-In
              </button>
            </form>
          </div>
        )}

        {/* Tab Content 4: Slot Blocking */}
        {activeTab === "blocking" && (
          <div className="bg-[#121A26] border border-[#1F2B3E] rounded-3xl p-6 glow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-[#1F2B3E] pb-4 gap-4">
              <div>
                <h3 className="font-extrabold text-white text-lg">Manajemen Pemblokiran Slot (Slot Block)</h3>
                <p className="text-xs text-slate-400">Blokir slot lapangan untuk keperluan perawatan berkala atau turnamen internal.</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Alasan Blokir:</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="bg-[#182334] border border-[#253752] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-52"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSlots.map((s) => {
                const isOpen = s.status === "open";
                const isBlocked = s.status === "blocked";

                return (
                  <div
                    key={s.id}
                    className="bg-[#182334] border border-[#253752] rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-extrabold text-sm text-white block">
                        {s.startTime} - {s.endTime}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{s.courtName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block ${
                        isOpen
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isBlocked
                          ? "bg-red-500/20 text-red-400"
                          : "bg-slate-700 text-slate-400"
                      }`}>
                        {s.status} {s.blockReason ? `(${s.blockReason})` : ""}
                      </span>
                    </div>

                    <div>
                      {isOpen && (
                        <button
                          onClick={() => handleBlockSlot(s.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" /> Blokir
                        </button>
                      )}

                      {isBlocked && (
                        <button
                          onClick={() => handleUnblockSlot(s.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Unlock className="w-3 h-3" /> Buka
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
