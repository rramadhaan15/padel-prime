"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  RefreshCw,
  CircleAlert,
  Check,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/prime/site-shell";
import { useAvailability } from "@/components/prime/use-availability";
import {
  bookingDays,
  formatPrice,
  type CourtFilter,
} from "@/lib/booking-display";
import type { AvailabilitySlot } from "@/lib/scheduling";

type TimeFilter = "ALL" | "morning" | "afternoon" | "evening";
const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: "ALL", label: "Semua jam" },
  { value: "morning", label: "Pagi" },
  { value: "afternoon", label: "Siang" },
  { value: "evening", label: "Malam" },
];
const statusLabels = {
  open: "Tersedia",
  held: "Sedang dipesan",
  booked: "Sudah dipesan",
  blocked: "Tidak tersedia",
};

function matchesTime(slot: AvailabilitySlot, time: TimeFilter) {
  const hour = Number(slot.startTime.split(":")[0]);
  return (
    time === "ALL" ||
    (time === "morning" && hour < 12) ||
    (time === "afternoon" && hour >= 12 && hour < 18) ||
    (time === "evening" && hour >= 18)
  );
}

export default function BookingDashboardPage({
  days,
}: {
  days: ReturnType<typeof bookingDays>;
}) {
  const router = useRouter();
  const [date, setDate] = useState(days[0].date);
  const [courtType, setCourtType] = useState<CourtFilter>("ALL");
  const [time, setTime] = useState<TimeFilter>("ALL");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [holdingSlotId, setHoldingSlotId] = useState<string | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const holdPending = useRef(false);
  const { data, loading, error, refresh } = useAvailability(date);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDate = params.get("date");
    if (requestedDate && days.some((day) => day.date === requestedDate))
      setDate(requestedDate);
    const requestedType = params.get("type");
    if (requestedType === "Indoor" || requestedType === "Outdoor")
      setCourtType(requestedType);
  }, [days]);

  async function selectSlot(slot: AvailabilitySlot) {
    if (slot.status !== "open" || holdPending.current) return;
    holdPending.current = true;
    setHoldingSlotId(slot.id);
    setHoldError(null);
    let navigating = false;
    try {
      const response = await fetch("/api/holds/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, courtId: slot.courtId }),
      });
      const json = await response.json();
      if (!response.ok || !json.success || !json.data?.holdId) {
        setHoldError(
          "Slot belum berhasil diamankan. Jadwal telah diperbarui; silakan pilih slot yang tersedia.",
        );
        refresh();
        return;
      }
      navigating = true;
      router.push(`/checkout/${json.data.holdId}`);
    } catch {
      setHoldError(
        "Koneksi terputus saat memilih slot. Muat ulang jadwal sebelum mencoba lagi.",
      );
    } finally {
      if (!navigating) {
        holdPending.current = false;
        setHoldingSlotId(null);
      }
    }
  }

  const courts =
    data?.courts
      .filter(({ court }) => courtType === "ALL" || court.type === courtType)
      .map((group) => ({
        ...group,
        slots: group.slots.filter(
          (slot) =>
            matchesTime(slot, time) &&
            (!availableOnly || slot.status === "open"),
        ),
      })) ?? [];
  const openCount = courts.reduce(
    (count, group) =>
      count + group.slots.filter((slot) => slot.status === "open").length,
    0,
  );
  const visibleCount = courts.reduce(
    (count, group) => count + group.slots.length,
    0,
  );
  const selectedDay = days.find((day) => day.date === date)!;

  return (
    <div className="prime-site booking-page">
      <SiteHeader booking />
      <main id="main-content" className="prime-container booking-main">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda
        </Link>
        <div className="booking-heading">
          <div>
            <p className="eyebrow">Reservasi lapangan</p>
            <h1>
              Atur waktu.
              <br />
              <span>Siapkan permainan.</span>
            </h1>
            <p>
              Pilih sesi yang tersedia. Kamu punya 10 menit untuk menyelesaikan
              checkout setelah slot berhasil diamankan.
            </p>
          </div>
          <div className="session-note">
            <Clock3 size={24} aria-hidden="true" />
            <strong>90 menit</strong>
            <span>
              Waktu untuk setiap sesi.
              <br />
              Semua jadwal dalam WIB.
            </span>
          </div>
        </div>

        <section className="schedule-panel" aria-labelledby="date-title">
          <div className="schedule-label">
            <h2 id="date-title">
              <CalendarDays size={19} aria-hidden="true" /> Pilih tanggal main
            </h2>
            <span>Hari ini + 7 hari ke depan</span>
          </div>
          <div className="date-strip" role="group" aria-label="Tanggal main">
            {days.map((day) => (
              <button
                key={day.date}
                className={`date-option ${date === day.date ? "selected" : ""}`}
                aria-pressed={date === day.date}
                aria-label={day.fullLabel}
                onClick={() => {
                  setDate(day.date);
                  setHoldError(null);
                }}
                disabled={holdingSlotId !== null}
              >
                <span>{day.day}</span>
                <strong>{day.number}</strong>
                <span>{day.month}</span>
                {date === day.date && (
                  <Check className="date-check" size={15} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
          <div className="schedule-filters">
            <div
              role="group"
              aria-label="Tipe lapangan"
              className="segmented-control"
            >
              {(["ALL", "Indoor", "Outdoor"] as const).map((type) => (
                <button
                  key={type}
                  aria-pressed={type === courtType}
                  onClick={() => setCourtType(type)}
                >
                  {type === "ALL" ? "Semua lapangan" : type}
                </button>
              ))}
            </div>
            <label className="availability-toggle">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
              />
              <span>Hanya yang tersedia</span>
            </label>
          </div>
        </section>

        <section
          className="schedule-results"
          aria-labelledby="results-title"
          aria-busy={loading}
        >
          <div className="results-heading">
            <div>
              <h2 id="results-title">{selectedDay.fullLabel}</h2>
              <p aria-live="polite">
                {loading
                  ? "Memeriksa ketersediaan..."
                  : error
                    ? "Ketersediaan belum diketahui"
                    : `${openCount} slot tersedia sesuai filter`}
              </p>
            </div>
            <button
              className="prime-button secondary refresh-button"
              onClick={refresh}
              disabled={loading || holdingSlotId !== null}
            >
              <RefreshCw
                size={17}
                className={loading ? "loading-spin" : ""}
                aria-hidden="true"
              />{" "}
              Muat ulang
            </button>
          </div>
          <div className="time-filter" role="group" aria-label="Waktu main">
            {timeFilters.map((filter) => (
              <button
                key={filter.value}
                aria-pressed={time === filter.value}
                onClick={() => setTime(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {holdError && (
            <div className="inline-error" role="alert">
              <CircleAlert size={20} aria-hidden="true" />
              <p>{holdError}</p>
              <button
                className="text-action"
                onClick={() => {
                  setHoldError(null);
                  refresh();
                }}
              >
                Muat ulang jadwal
              </button>
            </div>
          )}
          {holdingSlotId && (
            <p role="status" className="hold-status">
              Sedang mengamankan slot dan membuka checkout...
            </p>
          )}
          {loading ? (
            <div className="schedule-state" role="status">
              <span className="loading-spinner" />
              <h3>Menyiapkan jadwal mainmu</h3>
              <p>Sebentar, kami sedang memeriksa slot lapangan.</p>
            </div>
          ) : error ? (
            <div className="schedule-state" role="alert">
              <CircleAlert size={30} aria-hidden="true" />
              <h3>Jadwal belum dapat ditampilkan</h3>
              <p>{error}</p>
              <button className="prime-button primary" onClick={refresh}>
                Coba lagi
              </button>
            </div>
          ) : visibleCount === 0 ? (
            <div className="schedule-state">
              <CalendarDays size={30} aria-hidden="true" />
              <h3>Belum ada sesi untuk pilihan ini</h3>
              <p>
                Coba tanggal lain atau tampilkan semua tipe lapangan dan jam.
              </p>
              <button
                className="prime-button primary"
                onClick={() => {
                  setCourtType("ALL");
                  setTime("ALL");
                  setAvailableOnly(false);
                }}
              >
                Tampilkan semua sesi
              </button>
            </div>
          ) : (
            <div className="court-schedules">
              {courts
                .filter((group) => group.slots.length > 0)
                .map(({ court, slots }, index) => (
                  <article className="court-schedule" key={court.id}>
                    <div className="court-schedule-heading">
                      <div className="court-name">
                        <span className="court-number" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>{court.name}</h3>
                          <p>{court.type} · 90 menit per sesi</p>
                        </div>
                      </div>
                      <span>
                        {slots.filter((slot) => slot.status === "open").length}{" "}
                        slot tersedia
                      </span>
                    </div>
                    <div className="slot-grid">
                      {slots.map((slot) => (
                        <button
                          className={`schedule-slot slot-${slot.status}`}
                          key={slot.id}
                          disabled={
                            slot.status !== "open" || holdingSlotId !== null
                          }
                          onClick={() => selectSlot(slot)}
                          aria-label={`${court.name}, ${slot.startTime} sampai ${slot.endTime}, ${formatPrice(slot.price)}, ${statusLabels[slot.status]}`}
                        >
                          <span className="slot-time">
                            {slot.startTime}
                            <span> - {slot.endTime}</span>
                          </span>
                          <span className="slot-price">
                            {formatPrice(slot.price)}
                          </span>
                          <span className="slot-bottom">
                            <span>
                              {holdingSlotId === slot.id
                                ? "Mengamankan..."
                                : statusLabels[slot.status]}
                            </span>
                            {slot.status === "open" ? (
                              <ArrowUpRight size={17} aria-hidden="true" />
                            ) : (
                              <LockKeyhole size={14} aria-hidden="true" />
                            )}
                          </span>
                          {slot.status === "blocked" && slot.blockReason && (
                            <span className="block-reason">
                              {slot.blockReason}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>
        <aside className="booking-policy">
          <Clock3 size={21} aria-hidden="true" />
          <div>
            <h2>Satu pilihan, satu sesi main.</h2>
            <p>
              Harga yang tertera adalah tarif per sesi. Sewa raket dan bola bisa
              ditambahkan saat checkout. Perubahan jadwal paling lambat 24 jam
              sebelum waktu main.
            </p>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
