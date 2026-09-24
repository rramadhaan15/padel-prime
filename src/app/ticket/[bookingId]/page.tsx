"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Share2,
  CalendarClock,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Download,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface TicketDetails {
  booking: {
    id: string;
    bookingRef: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    racketsCount: number;
    ballsCount: number;
    slotPrice: number;
    addonsPrice: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    status: "Confirmed" | "Checked-In" | "No-Show" | "Rescheduled";
    createdAt: string;
  };
  slot: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    timeBand: "Regular" | "Peak";
    price: number;
  };
  court: {
    id: string;
    name: string;
    type: "Indoor" | "Outdoor";
  };
  qrToken: string;
  qrDataUrl: string;
}

export default function TicketPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const router = useRouter();
  const { bookingId } = use(params);

  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [rescheduleSlots, setRescheduleSlots] = useState<Array<{
    id: string;
    courtName: string;
    startTime: string;
    endTime: string;
    price: number;
    timeBand: string;
  }>>([]);
  const [selectedNewSlotId, setSelectedNewSlotId] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${bookingId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTicket(data.data);
      } else {
        setError(data.error || "Gagal memuat tiket digital.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan saat mengambil tiket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [bookingId]);

  // Load slots for reschedule date
  useEffect(() => {
    if (!showRescheduleModal) return;
    const loadRescheduleSlots = async () => {
      try {
        const res = await fetch(`/api/availability?date=${rescheduleDate}`);
        const data = await res.json();
        if (data.success && data.data) {
          const openSlots: typeof rescheduleSlots = [];
          for (const c of data.data.courts) {
            for (const s of c.slots) {
              if (s.status === "open") {
                openSlots.push({
                  id: s.id,
                  courtName: c.court.name,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  price: s.price,
                  timeBand: s.timeBand,
                });
              }
            }
          }
          setRescheduleSlots(openSlots);
        }
      } catch {
        // ignore
      }
    };
    loadRescheduleSlots();
  }, [showRescheduleModal, rescheduleDate]);

  const handleExecuteReschedule = async () => {
    if (!selectedNewSlotId) {
      alert("Pilih slot baru terlebih dahulu.");
      return;
    }
    setRescheduling(true);
    setRescheduleError(null);
    try {
      const res = await fetch("/api/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          newSlotId: selectedNewSlotId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Reschedule berhasil dikonfirmasi!");
        setShowRescheduleModal(false);
        fetchTicket();
      } else {
        setRescheduleError(data.error || "Gagal melakukan reschedule.");
      }
    } catch {
      setRescheduleError("Terjadi kesalahan saat memproses reschedule.");
    } finally {
      setRescheduling(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!ticket) return;
    const url = window.location.href;
    const text = encodeURIComponent(
      `Halo! Ini tiket digital booking Padel saya di Padel Prime Club:\n\nRef: ${ticket.booking.bookingRef}\nLapangan: ${ticket.court.name}\nTanggal: ${ticket.slot.date} (${ticket.slot.startTime} WIB)\n\nBuka tiket: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#D4FE2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h1 className="text-xl font-bold mb-2">Tiket Tidak Ditemukan</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2.5 rounded-xl bg-[#D4FE2B] text-black font-bold text-xs"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const { booking, slot, court, qrDataUrl } = ticket;

  // Calculate if reschedule is eligible (>= 24h prior)
  const slotDateObj = new Date(`${slot.date}T${slot.startTime}:00`);
  const hoursUntilGame = (slotDateObj.getTime() - Date.now()) / (1000 * 60 * 60);
  const isRescheduleEligible = hoursUntilGame >= 24 && booking.status === "Confirmed";

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-20 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#1F2B3E] bg-[#0E1522]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kalender Lapangan
          </button>
          <span className="text-xs font-bold text-[#D4FE2B] flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Pass Terverifikasi
          </span>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 mt-8">
        {/* Pass Card Container */}
        <div className="bg-[#121A26] border border-[#1F2B3E] rounded-3xl overflow-hidden shadow-2xl glow-card">
          {/* Top Pass Header Banner */}
          <div className="bg-gradient-to-r from-[#182334] to-[#121A26] p-6 border-b border-[#1F2B3E] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-white tracking-wider">PADEL PRIME</span>
                <span className="text-[9px] bg-[#D4FE2B]/15 text-[#D4FE2B] px-2 py-0.5 rounded-full font-bold border border-[#D4FE2B]/30 tracking-widest uppercase">
                  OFFICIAL PASS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#10B981]" /> Gelora Bung Karno, Senayan
              </p>
            </div>

            {/* Status Pill */}
            <div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                  booking.status === "Confirmed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : booking.status === "Checked-In"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : booking.status === "Rescheduled"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          {/* QR Code Presentation Area */}
          <div className="p-8 flex flex-col items-center bg-[#0E1522] border-b border-dashed border-[#1F2B3E] relative">
            <div className="p-4 bg-white rounded-3xl shadow-glow mb-4">
              <img
                src={qrDataUrl}
                alt="Ticket QR Code"
                className="w-56 h-56 rounded-xl object-contain"
              />
            </div>

            <span className="font-mono text-base font-black text-[#D4FE2B] tracking-widest mt-1">
              {booking.bookingRef}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#10B981]" /> Tanda Tangan Kriptografis HMAC-SHA256
            </span>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-5">
            {/* Player Identity */}
            <div className="flex items-center justify-between border-b border-[#1F2B3E] pb-4">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                  Nama Pemesan
                </span>
                <span className="text-base font-black text-white">{booking.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                  WhatsApp
                </span>
                <span className="text-sm font-bold text-slate-200">{booking.customerPhone}</span>
              </div>
            </div>

            {/* Schedule & Court Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#182334] p-3.5 rounded-2xl border border-[#253752]">
                <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D4FE2B]" /> Tanggal Main
                </span>
                <span className="font-black text-white text-sm">{slot.date}</span>
              </div>

              <div className="bg-[#182334] p-3.5 rounded-2xl border border-[#253752]">
                <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#D4FE2B]" /> Jam Main
                </span>
                <span className="font-black text-white text-sm">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
            </div>

            {/* Court Specification */}
            <div className="bg-[#182334] p-3.5 rounded-2xl border border-[#253752] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Lapangan</span>
                <span className="font-extrabold text-white text-sm">{court.name}</span>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                court.type === "Indoor"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}>
                {court.type} Court
              </span>
            </div>

            {/* Add-ons & Financials */}
            <div className="bg-[#182334]/60 p-4 rounded-2xl border border-[#253752] space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Sewa Lapangan</span>
                <span className="font-bold text-white">{formatPrice(booking.slotPrice)}</span>
              </div>

              {booking.racketsCount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Sewa Raket ({booking.racketsCount}x)</span>
                  <span className="font-bold text-white">{formatPrice(booking.racketsCount * 50000)}</span>
                </div>
              )}

              {booking.ballsCount > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Kaleng Bola ({booking.ballsCount}x)</span>
                  <span className="font-bold text-white">{formatPrice(booking.ballsCount * 120000)}</span>
                </div>
              )}

              <div className="border-t border-[#253752] pt-2 flex justify-between items-baseline">
                <span className="font-extrabold text-white text-sm">Total Lunas</span>
                <span className="font-black text-base text-[#D4FE2B]">
                  {formatPrice(booking.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-[#0E1522] border-t border-[#1F2B3E] space-y-3">
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-glow-emerald"
            >
              <Share2 className="w-4 h-4" /> Bagikan Tiket via WhatsApp
            </button>

            {isRescheduleEligible && (
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="w-full py-3 rounded-xl bg-[#1F2B3E] hover:bg-[#2A3B54] text-slate-200 hover:text-white font-bold text-xs border border-[#2E415D] transition flex items-center justify-center gap-2"
              >
                <CalendarClock className="w-4 h-4 text-[#D4FE2B]" /> Reschedule Jadwal Main
              </button>
            )}

            {!isRescheduleEligible && booking.status === "Confirmed" && (
              <p className="text-[11px] text-amber-400/80 text-center">
                Batas waktu reschedule mandiri (&ge; 24 jam sebelum main) telah ditutup.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A26] border border-[#1F2B3E] rounded-3xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F2B3E] pb-3">
              <div>
                <h3 className="font-extrabold text-white text-lg">Reschedule Jadwal</h3>
                <p className="text-xs text-slate-400">Pilih tanggal dan slot baru untuk booking Anda.</p>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Asymmetric pricing policy notice */}
            <div className="p-3 bg-[#182334] rounded-xl border border-[#253752] text-xs text-slate-300 space-y-1">
              <span className="font-bold text-[#D4FE2B] block">Ketentuan Reschedule:</span>
              <p>• Upgrade ke jam Peak/Indoor memerlukan pelunasan selisih harga secara instan.</p>
              <p>• Downgrade ke jam Regular/Outdoor tidak ada refund (selisih harga hangus).</p>
            </div>

            {/* Date Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Pilih Tanggal Baru
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-[#182334] border border-[#253752] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            {/* Slots available */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Pilih Slot Baru ({rescheduleSlots.length} slot tersedia)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {rescheduleSlots.map((s) => {
                  const isSelected = selectedNewSlotId === s.id;
                  const priceDiff = s.price - slot.price;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedNewSlotId(s.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? "bg-[#D4FE2B]/10 border-[#D4FE2B] text-white"
                          : "bg-[#182334] border-[#253752] text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-sm block">
                          {s.startTime} - {s.endTime} ({s.courtName})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {s.timeBand} Band • {formatPrice(s.price)}
                        </span>
                      </div>

                      <div className="text-right">
                        {priceDiff > 0 && (
                          <span className="text-xs font-bold text-amber-400 block">
                            + {formatPrice(priceDiff)}
                          </span>
                        )}
                        {priceDiff <= 0 && (
                          <span className="text-xs font-bold text-emerald-400 block">
                            Tanpa Biaya Tambahan
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {rescheduleSlots.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Tidak ada slot kosong yang tersedia pada tanggal ini.
                  </p>
                )}
              </div>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                {rescheduleError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#182334] text-slate-300 text-xs font-bold hover:bg-[#223147] transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteReschedule}
                disabled={rescheduling || !selectedNewSlotId}
                className="flex-1 py-2.5 rounded-xl bg-[#D4FE2B] text-black text-xs font-extrabold hover:brightness-110 disabled:opacity-50 transition"
              >
                {rescheduling ? "Memproses..." : "Konfirmasi Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
