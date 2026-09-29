import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/prime/site-shell";
import { currentAccount } from "@/lib/auth";
import { formatPrice } from "@/lib/booking-display";
import { db, type BookingRecord, type CourtRecord, type ScheduleSlotRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

type BookingItem = { booking: BookingRecord; slot: ScheduleSlotRecord; court: CourtRecord };

function sessionEnd(slot: ScheduleSlotRecord) {
  return new Date(`${slot.date}T${slot.endTime}:00+07:00`).getTime();
}

function sessionStart(slot: ScheduleSlotRecord) {
  return new Date(`${slot.date}T${slot.startTime}:00+07:00`).getTime();
}

function statusLabel(status: BookingRecord["status"]) {
  return {
    Confirmed: "Terkonfirmasi",
    "Checked-In": "Sudah check-in",
    "No-Show": "Tidak hadir",
    Rescheduled: "Dijadwalkan ulang",
  }[status];
}

function BookingSection({ title, description, items, empty }: {
  title: string;
  description: string;
  items: BookingItem[];
  empty: string;
}) {
  return (
    <section className="orders-section" aria-label={title}>
      <div className="orders-section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="orders-empty">
          <CalendarDays size={24} aria-hidden="true" />
          <p>{empty}</p>
          {title === "Akan datang" && <Link href="/booking">Lihat jadwal lapangan <ArrowUpRight size={16} aria-hidden="true" /></Link>}
        </div>
      ) : (
        <div className="orders-list">
          {items.map(({ booking, slot, court }) => (
            <article className="order-card" key={booking.id}>
              <div className="order-card-top">
                <div>
                  <p className="order-reference">{booking.bookingRef}</p>
                  <h3>{court.name}</h3>
                  <p className="order-court-type">Lapangan {court.type}</p>
                </div>
                <span className="order-status">{statusLabel(booking.status)}</span>
              </div>
              <div className="order-card-facts">
                <div><span>Tanggal main</span><strong>{new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${slot.date}T00:00:00+07:00`))}</strong></div>
                <div><span>Waktu</span><strong>{slot.startTime}–{slot.endTime} WIB</strong></div>
                <div><span>Total bayar</span><strong>{formatPrice(booking.totalAmount)}</strong></div>
              </div>
              {(booking.racketsCount > 0 || booking.ballsCount > 0) && (
                <p className="order-addons">Tambahan: {[
                  booking.racketsCount > 0 && `${booking.racketsCount} raket`,
                  booking.ballsCount > 0 && `${booking.ballsCount} kaleng bola`,
                ].filter(Boolean).join(" · ")}</p>
              )}
              <Link className="order-ticket-link" href={`/ticket/${booking.id}`}>
                Lihat tiket dan detail booking <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function OrdersPage() {
  const account = await currentAccount();
  if (!account) redirect("/login?next=%2Fpesanan");

  const now = Date.now();
  const items = db.listBookings()
    .filter((booking) => booking.customerEmail.trim().toLowerCase() === account.email.toLowerCase())
    .flatMap((booking) => {
      const slot = db.getScheduleSlot(booking.slotId);
      const court = db.getCourt(booking.courtId);
      return slot && court ? [{ booking, slot, court }] : [];
    });
  const upcoming = items
    .filter(({ booking, slot }) => booking.status !== "No-Show" && sessionEnd(slot) > now)
    .sort((a, b) => sessionStart(a.slot) - sessionStart(b.slot));
  const past = items
    .filter(({ booking, slot }) => booking.status === "No-Show" || sessionEnd(slot) <= now)
    .sort((a, b) => sessionStart(b.slot) - sessionStart(a.slot));

  return (
    <div className="prime-site account-page orders-page">
      <SiteHeader account={account} />
      <main id="main-content" className="prime-container account-main orders-main">
        <Link className="back-link" href="/booking"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke jadwal main</Link>
        <div className="account-heading">
          <p className="eyebrow">Akun pemain</p>
          <h1>Booking saya<span>.</span></h1>
          <p>Semua sesi lapangan yang kamu pesan, dari yang akan datang sampai yang sudah lewat.</p>
        </div>
        <BookingSection title="Akan datang" description="Sesi berikutnya, urut dari yang paling dekat." items={upcoming} empty="Belum ada sesi yang akan datang." />
        <BookingSection title="Riwayat booking" description="Sesi yang sudah lewat dan catatan kehadiranmu." items={past} empty="Belum ada riwayat booking." />
      </main>
      <SiteFooter />
    </div>
  );
}
