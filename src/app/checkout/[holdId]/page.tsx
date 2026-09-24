"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  CreditCard,
  Copy,
  Check,
  ChevronRight,
  Info,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";

interface HoldData {
  isValid: boolean;
  remainingSeconds: number;
  hold?: {
    id: string;
    slotId: string;
    courtId: string;
    racketsCount: number;
    ballsCount: number;
    expiresAt: string;
  };
  slot?: {
    id: string;
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    timeBand: "Regular" | "Peak";
    price: number;
  };
  court?: {
    id: string;
    name: string;
    type: "Indoor" | "Outdoor";
  };
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ holdId: string }>;
}) {
  const router = useRouter();
  const { holdId } = use(params);

  const [holdData, setHoldData] = useState<HoldData | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(600);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "VA_BCA" | "VA_MANDIRI">("QRIS");

  // Add-ons state
  const [racketsCount, setRacketsCount] = useState(0);
  const [ballsCount, setBallsCount] = useState(0);
  const [availableStock, setAvailableStock] = useState<{ rackets: number; balls: number }>({
    rackets: 24,
    balls: 100,
  });

  // Payment state
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    orderId: string;
    qrisString?: string;
    virtualAccountNumber?: string;
    bank?: string;
    expiryTime: string;
    totalAmount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  // Fetch hold status
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetchHold = async () => {
      try {
        const res = await fetch(`/api/holds/${holdId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setHoldData(data.data);
          setRemainingSec(data.data.remainingSeconds);
          setRacketsCount(data.data.hold?.racketsCount || 0);
          setBallsCount(data.data.hold?.ballsCount || 0);

          // Fetch stock for that slot
          if (data.data.slot) {
            const stockRes = await fetch(
              `/api/equipment?date=${data.data.slot.date}&timeSlot=${data.data.slot.startTime}`
            );
            const stockData = await stockRes.json();
            if (stockData.success && stockData.data) {
              setAvailableStock({
                rackets: stockData.data.availableRackets,
                balls: stockData.data.availableBalls,
              });
            }
          }
        } else {
          setError(data.error || "Slot hold tidak valid atau telah kadaluarsa.");
        }
      } catch {
        setError("Gagal memverifikasi hold slot.");
      } finally {
        setLoading(false);
      }
    };

    fetchHold();

    // 1-second countdown interval
    timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [holdId]);

  // Sync add-ons with server whenever count changes
  const handleUpdateAddons = async (newRackets: number, newBalls: number) => {
    if (newRackets < 0 || newRackets > 4 || newBalls < 0) return;
    setRacketsCount(newRackets);
    setBallsCount(newBalls);

    try {
      await fetch(`/api/holds/${holdId}/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ racketsCount: newRackets, ballsCount: newBalls }),
      });
    } catch {
      // Ignore background sync errors
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      alert("Harap lengkapi semua data tamu terlebih dahulu.");
      return;
    }

    try {
      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdId,
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod,
        }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        setPaymentInitiated(true);
        setPaymentDetails({
          orderId: data.data.orderId,
          qrisString: data.data.paymentDetails.qrisString,
          virtualAccountNumber: data.data.paymentDetails.virtualAccountNumber,
          bank: data.data.paymentDetails.bank,
          expiryTime: data.data.paymentDetails.expiryTime,
          totalAmount: data.data.totalAmount,
        });
      } else {
        alert(data.error || "Gagal memulai transaksi pembayaran.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleSimulateSettlement = async () => {
    if (!paymentDetails) return;
    setIsSettling(true);
    try {
      const res = await fetch("/api/checkout/simulate-settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: paymentDetails.orderId }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        // Payment settled! Redirect to digital ticket
        router.push(`/ticket/${data.data.booking.id}`);
      } else {
        alert(data.error || "Gagal melakukan konfirmasi settlement.");
      }
    } catch {
      alert("Terjadi kesalahan saat memproses simulasi pembayaran.");
    } finally {
      setIsSettling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pricing calculations
  const slotPrice = holdData?.slot?.price || 0;
  const racketsTotal = racketsCount * 50000;
  const ballsTotal = ballsCount * 120000;
  const grandTotal = slotPrice + racketsTotal + ballsTotal;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const isUrgent = remainingSec < 120 && remainingSec > 0;
  const isExpired = remainingSec <= 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-[#D4FE2B] border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  if (error || isExpired) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Slot Hold Telah Berakhir</h1>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          {error || "Batas waktu hold 10 menit telah terlewati. Slot telah dilepaskan kembali ke kalender publik untuk menjaga keadilan ketersediaan."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-sm hover:brightness-110 transition shadow-glow"
        >
          Kembali ke Kalender Lapangan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 pb-20 font-sans">
      {/* Top Bar with Live Hold Timer */}
      <div className={`sticky top-0 z-40 border-b transition-colors ${
        isUrgent ? "bg-amber-950/90 border-amber-600/50" : "bg-[#0E1522]/90 border-[#1F2B3E]"
      } backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Batal & Kembali
          </button>

          {/* Live Timer Pill */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-black ${
            isUrgent
              ? "bg-amber-500/20 text-amber-300 border-amber-500 animate-pulse"
              : "bg-[#D4FE2B]/10 text-[#D4FE2B] border-[#D4FE2B]/40"
          }`}>
            <Timer className="w-4 h-4" />
            <span>
              Hold Tersisa: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        <div className="mb-6">
          <span className="text-xs font-bold text-[#D4FE2B] uppercase tracking-widest">
            Frictionless Guest Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Konfirmasi & Pembayaran Slot
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Add-ons */}
          <div className="lg:col-span-7 space-y-6">
            {/* Slot Details Card */}
            <div className="bg-[#121A26] border border-[#1F2B3E] rounded-2xl p-5 glow-card">
              <div className="flex items-center justify-between border-b border-[#1F2B3E] pb-3 mb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">{holdData?.court?.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#10B981]" /> Padel Prime Club Jakarta
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  holdData?.court?.type === "Indoor"
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {holdData?.court?.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#182334] p-3 rounded-xl border border-[#253752]">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#D4FE2B]" /> Tanggal Main
                  </span>
                  <span className="font-extrabold text-white text-sm">
                    {holdData?.slot?.date}
                  </span>
                </div>
                <div className="bg-[#182334] p-3 rounded-xl border border-[#253752]">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D4FE2B]" /> Jam Main (90 Menit)
                  </span>
                  <span className="font-extrabold text-white text-sm">
                    {holdData?.slot?.startTime} - {holdData?.slot?.endTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Equipment Add-on Selector */}
            <div className="bg-[#121A26] border border-[#1F2B3E] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Peralatan Tambahan (Add-on)</h3>
                  <p className="text-xs text-slate-400">Siap disiapkan di meja staf sebelum Anda tiba.</p>
                </div>
                <span className="text-[10px] text-[#D4FE2B] bg-[#D4FE2B]/10 px-2 py-0.5 rounded border border-[#D4FE2B]/30 font-bold">
                  Opsional
                </span>
              </div>

              <div className="space-y-3">
                {/* Racket Rental */}
                <div className="bg-[#182334] border border-[#253752] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block">Sewa Raket Padel Pro</span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Rp 50.000 / raket (Maks. 4 raket per slot)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                      Tersedia: {availableStock.rackets} raket di venue
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateAddons(racketsCount - 1, ballsCount)}
                      disabled={racketsCount <= 0}
                      className="w-8 h-8 rounded-lg bg-[#253752] hover:bg-[#32496D] text-white disabled:opacity-40 font-bold text-base transition"
                    >
                      -
                    </button>
                    <span className="font-black text-white text-base w-4 text-center">
                      {racketsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateAddons(racketsCount + 1, ballsCount)}
                      disabled={racketsCount >= 4 || availableStock.rackets <= 0}
                      className="w-8 h-8 rounded-lg bg-[#253752] hover:bg-[#32496D] text-white disabled:opacity-40 font-bold text-base transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Ball Can Purchase */}
                <div className="bg-[#182334] border border-[#253752] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block">Kaleng Bola Padel Baru (Isi 3)</span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Rp 120.000 / kaleng (Beli baru & bawa pulang)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                      Tersedia: {availableStock.balls} kaleng
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateAddons(racketsCount, ballsCount - 1)}
                      disabled={ballsCount <= 0}
                      className="w-8 h-8 rounded-lg bg-[#253752] hover:bg-[#32496D] text-white disabled:opacity-40 font-bold text-base transition"
                    >
                      -
                    </button>
                    <span className="font-black text-white text-base w-4 text-center">
                      {ballsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateAddons(racketsCount, ballsCount + 1)}
                      disabled={availableStock.balls <= 0}
                      className="w-8 h-8 rounded-lg bg-[#253752] hover:bg-[#32496D] text-white disabled:opacity-40 font-bold text-base transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Details Form */}
            {!paymentInitiated && (
              <form onSubmit={handleInitiatePayment} className="bg-[#121A26] border border-[#1F2B3E] rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">Data Pemesan (Guest Identity)</h3>
                  <p className="text-xs text-slate-400">
                    Tiket digital dan invoice akan dikirim langsung ke WhatsApp & Email Anda tanpa perlu password.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nama Lengkap Pemesan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#182334] border border-[#253752] focus:border-[#D4FE2B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Alamat Email (Untuk Invoice PDF) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="budi@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-[#182334] border border-[#253752] focus:border-[#D4FE2B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nomor WhatsApp (Format E.164 / Lokal) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="08123456789 atau +628123456789"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#182334] border border-[#253752] focus:border-[#D4FE2B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Payment Method Radio */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    Pilih Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("QRIS")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        paymentMethod === "QRIS"
                          ? "bg-[#D4FE2B]/10 border-[#D4FE2B] text-white"
                          : "bg-[#182334] border-[#253752] text-slate-400 hover:text-white"
                      }`}
                    >
                      <QrCode className="w-5 h-5 text-[#D4FE2B] mb-2" />
                      <div>
                        <span className="text-xs font-extrabold text-white block">QRIS Dinamis</span>
                        <span className="text-[10px] text-slate-400">BCA, Mandiri, GoPay, OVO</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("VA_BCA")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        paymentMethod === "VA_BCA"
                          ? "bg-[#D4FE2B]/10 border-[#D4FE2B] text-white"
                          : "bg-[#182334] border-[#253752] text-slate-400 hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-[#22D3EE] mb-2" />
                      <div>
                        <span className="text-xs font-extrabold text-white block">BCA Virtual Account</span>
                        <span className="text-[10px] text-slate-400">Verifikasi Otomatis</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("VA_MANDIRI")}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        paymentMethod === "VA_MANDIRI"
                          ? "bg-[#D4FE2B]/10 border-[#D4FE2B] text-white"
                          : "bg-[#182334] border-[#253752] text-slate-400 hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-amber-400 mb-2" />
                      <div>
                        <span className="text-xs font-extrabold text-white block">Mandiri VA</span>
                        <span className="text-[10px] text-slate-400">Verifikasi Otomatis</span>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#D4FE2B] text-black font-extrabold text-sm hover:brightness-110 transition shadow-glow flex items-center justify-center gap-2 mt-4"
                >
                  Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Payment Interactive Card (After Initiate) */}
            {paymentInitiated && paymentDetails && (
              <div className="bg-[#121A26] border-2 border-[#D4FE2B] rounded-2xl p-6 glow-card animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#1F2B3E] pb-3 mb-4">
                  <div>
                    <span className="text-xs text-[#D4FE2B] font-bold uppercase tracking-widest">
                      Instruksi Pembayaran
                    </span>
                    <h3 className="text-lg font-black text-white">Selesaikan Transaksi</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {paymentDetails.orderId}
                  </span>
                </div>

                {paymentMethod === "QRIS" && (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="p-4 bg-white rounded-2xl shadow-xl mb-4 max-w-[220px]">
                      {/* Stylized QR placeholder with real QR payload */}
                      <div className="w-48 h-48 bg-slate-900 rounded-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
                        <QrCode className="w-36 h-36 text-white" />
                        <span className="text-[8px] text-[#D4FE2B] font-black uppercase tracking-widest mt-1">
                          SCAN QRIS DINAMIS
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 max-w-sm mb-2">
                      Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, ShopeePay, Dana) dan scan QR di atas.
                    </p>
                  </div>
                )}

                {(paymentMethod === "VA_BCA" || paymentMethod === "VA_MANDIRI") && (
                  <div className="bg-[#182334] p-4 rounded-xl border border-[#253752] my-4">
                    <span className="text-xs text-slate-400 block mb-1">
                      Nomor Virtual Account {paymentDetails.bank}:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-[#D4FE2B] font-mono tracking-wider">
                        {paymentDetails.virtualAccountNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(paymentDetails.virtualAccountNumber || "")}
                        className="px-3 py-1.5 rounded-lg bg-[#253752] hover:bg-[#32496D] text-xs text-slate-200 flex items-center gap-1.5 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Simulation button for demo */}
                <div className="border-t border-[#1F2B3E] pt-4 mt-4">
                  <div className="p-3 rounded-xl bg-[#182334]/80 border border-[#253752] mb-3 text-xs text-slate-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#22D3EE] shrink-0" />
                    <span>
                      Mode Simulasi Gateway: Anda dapat mensimulasikan pembayaran lunas secara instan di bawah ini.
                    </span>
                  </div>

                  <button
                    onClick={handleSimulateSettlement}
                    disabled={isSettling}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-[#10B981] text-black font-extrabold text-sm hover:brightness-110 transition shadow-glow-emerald flex items-center justify-center gap-2"
                  >
                    {isSettling ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Konfirmasi Pembayaran Berhasil (Simulasi)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Price Summary */}
          <div className="lg:col-span-5">
            <div className="bg-[#121A26] border border-[#1F2B3E] rounded-2xl p-5 sticky top-24 space-y-4">
              <h3 className="font-extrabold text-white text-base border-b border-[#1F2B3E] pb-3">
                Rincian Biaya Transaksi
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Sewa Lapangan (90 Menit)</span>
                  <span className="font-bold text-white">{formatPrice(slotPrice)}</span>
                </div>

                {racketsCount > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Sewa Raket ({racketsCount}x @ Rp 50.000)</span>
                    <span className="font-bold text-white">{formatPrice(racketsTotal)}</span>
                  </div>
                )}

                {ballsCount > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Beli Kaleng Bola ({ballsCount}x @ Rp 120.000)</span>
                    <span className="font-bold text-white">{formatPrice(ballsTotal)}</span>
                  </div>
                )}

                <div className="border-t border-[#1F2B3E] pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-extrabold text-white block">Total Pembayaran</span>
                    <span className="text-[10px] text-slate-400">Termasuk pajak & biaya admin</span>
                  </div>
                  <span className="text-xl font-black text-[#D4FE2B]">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="bg-[#182334] p-3 rounded-xl border border-[#253752] text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Kebijakan Transaksi
                </span>
                <p>• Reschedule dapat dilakukan mandiri hingga H-24 jam sebelum jadwal main.</p>
                <p>• Tidak melayani pengembalian uang tunai (zero cash refund).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
