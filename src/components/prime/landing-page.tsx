"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronDown, Clock3 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/prime/site-shell";
import { useAvailability } from "@/components/prime/use-availability";
import {
  bookingDays,
  formatPrice,
  type CourtFilter,
} from "@/lib/booking-display";

export default function LandingPage({
  days,
}: {
  days: ReturnType<typeof bookingDays>;
}) {
  const [date, setDate] = useState(days[0].date);
  const [courtType, setCourtType] = useState<CourtFilter>("ALL");
  const { data, loading, error, refresh } = useAvailability(date);
  const courts = data?.courts.filter(
    ({ court }) => courtType === "ALL" || court.type === courtType,
  );
  const openSlots =
    courts
      ?.flatMap(({ slots }) => slots)
      .filter((slot) => slot.status === "open") ?? [];
  const bookingUrl = `/booking?date=${date}&type=${courtType}`;

  return (
    <div className="prime-site">
      <SiteHeader />
      <main id="main-content">
        <section
          className="prime-hero prime-container"
          aria-labelledby="hero-title"
        >
          <div className="hero-copy">
            <p className="eyebrow">Padel Prime Club / Senayan, Jakarta</p>
            <h1 id="hero-title">
              Waktunya
              <br />
              turun ke
              <br />
              <span>lapangan.</span>
            </h1>
            <p className="hero-description">
              Ajak partner mainmu. Pilih lapangan dan waktu yang pas, lalu
              selesaikan reservasi tanpa perlu membuat akun.
            </p>
            <a className="prime-button primary hero-cta" href="#pilih-jadwal">
              Cari jadwal main <ArrowUpRight size={21} aria-hidden="true" />
            </a>
            <div className="hero-details">
              <span>
                <Clock3 size={16} aria-hidden="true" /> 90 menit per sesi
              </span>
              <span>Indoor & outdoor</span>
            </div>
          </div>
          <figure className="hero-photo">
            <img
              src="https://images.unsplash.com/photo-1709587824751-dd30420f5cf3?auto=format&fit=crop&w=1400&q=85"
              alt="Foto ilustrasi lapangan padel biru dengan dinding kaca dan net"
              fetchPriority="high"
              width="1400"
              height="788"
            />
            <div className="photo-title" aria-hidden="true">
              SEE YOU
              <br />
              ON COURT.
            </div>
            <figcaption>
              <span>Ruang untuk main. Waktu untuk bersama.</span>
              <span>Foto ilustrasi</span>
            </figcaption>
          </figure>
        </section>

        <section
          id="pilih-jadwal"
          className="prime-container quick-booking"
          aria-labelledby="quick-title"
        >
          <div className="quick-heading">
            <CalendarDays size={24} aria-hidden="true" />
            <div>
              <h2 id="quick-title">Kapan kita main?</h2>
              <p>Hari ini hingga 7 hari ke depan.</p>
            </div>
          </div>
          <div className="quick-fields">
            <label className="prime-field">
              Tanggal main
              <span className="select-wrap">
                <select
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                >
                  {days.map((day) => (
                    <option key={day.date} value={day.date}>
                      {day.fullLabel}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} aria-hidden="true" />
              </span>
            </label>
            <label className="prime-field">
              Pilihan lapangan
              <span className="select-wrap">
                <select
                  value={courtType}
                  onChange={(event) =>
                    setCourtType(event.target.value as CourtFilter)
                  }
                >
                  <option value="ALL">Semua lapangan</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
                <ChevronDown size={17} aria-hidden="true" />
              </span>
            </label>
            <Link className="prime-button primary" href={bookingUrl}>
              Lihat jadwal <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
          <div className="quick-status" aria-live="polite">
            {loading ? (
              <span>Memeriksa jadwal yang tersedia...</span>
            ) : error ? (
              <>
                <span>Jadwal belum dapat dimuat.</span>
                <button onClick={refresh} className="text-action">
                  Coba lagi
                </button>
              </>
            ) : openSlots.length > 0 ? (
              <>
                <span>{openSlots.length} slot tersedia untuk pilihanmu</span>
                <span>
                  Mulai{" "}
                  {formatPrice(
                    Math.min(...openSlots.map((slot) => slot.price)),
                  )}{" "}
                  / sesi
                </span>
              </>
            ) : (
              <span>
                Belum ada slot tersedia. Coba tanggal atau tipe lapangan
                lainnya.
              </span>
            )}
          </div>
        </section>

        <section
          id="lapangan"
          className="courts-section"
          aria-labelledby="courts-title"
        >
          <div className="prime-container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Pilih tempat mainmu</p>
                <h2 id="courts-title">
                  Dua suasana.
                  <br />
                  Sama serunya.
                </h2>
              </div>
              <p>
                Lebih suka bermain di dalam atau di luar ruangan? Tentukan
                pilihanmu, lalu cek jam yang masih tersedia.
              </p>
            </div>
            <div className="court-editorial">
              <div className="court-intro">
                <span className="court-index">01 / Indoor</span>
                <h3>
                  Fokus ke
                  <br />
                  set berikutnya.
                </h3>
                <p>
                  Main di dalam ruangan dengan pilihan jadwal dari pagi hingga
                  malam.
                </p>
                <Link
                  className="prime-button dark-button"
                  href={`/booking?date=${date}&type=Indoor`}
                >
                  Lihat jadwal indoor{" "}
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              </div>
              <div className="court-options">
                <div className="court-option">
                  <div>
                    <span className="court-index">Durasi bermain</span>
                    <h3>Waktumu di lapangan.</h3>
                  </div>
                  <span className="court-kind">
                    <strong>90</strong> menit / sesi
                  </span>
                </div>
                <div className="court-option outdoor">
                  <div>
                    <span className="court-index">02 / Outdoor</span>
                    <h3>
                      Ambil waktu
                      <br />
                      di luar rutinitas.
                    </h3>
                    <p>
                      Pilih lapangan terbuka untuk sesi main berikutnya bersama
                      teman.
                    </p>
                  </div>
                  <Link
                    className="text-action"
                    href={`/booking?date=${date}&type=Outdoor`}
                  >
                    Lihat jadwal outdoor{" "}
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </Link>
                </div>
                <p className="court-footnote">
                  Tarif mengikuti tipe lapangan dan jam main. Harga setiap sesi
                  ditampilkan pada halaman jadwal.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="cara-booking"
          className="prime-container booking-guide"
          aria-labelledby="guide-title"
        >
          <div>
            <p className="eyebrow">Dari rencana jadi main</p>
            <h2 id="guide-title">
              Jadwal beres.
              <br />
              Tinggal siap main.
            </h2>
            <p className="guide-intro">
              Reservasi langsung dari jadwal. Siapkan nama, email, dan nomor
              WhatsApp saat checkout.
            </p>
            <Link href={bookingUrl} className="text-action">
              Pilih sesi bermain <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
          <div className="guide-details">
            <details open>
              <summary>
                Waktu untuk menyelesaikan booking{" "}
                <span className="details-sign" aria-hidden="true" />
              </summary>
              <p>
                Setelah slot berhasil dipilih, kamu punya waktu 10 menit untuk
                menyelesaikan checkout. Perhatikan penghitung waktu di halaman
                pembayaran.
              </p>
            </details>
            <details>
              <summary>
                Perlengkapan untuk sesi mainmu{" "}
                <span className="details-sign" aria-hidden="true" />
              </summary>
              <p>
                Sewa raket dan pembelian bola dapat ditambahkan saat checkout
                sesuai stok yang tersedia. Maksimal 4 raket untuk satu sesi.
              </p>
            </details>
            <details>
              <summary>
                Kalau rencana berubah{" "}
                <span className="details-sign" aria-hidden="true" />
              </summary>
              <p>
                Perubahan jadwal dapat diajukan paling lambat 24 jam sebelum
                sesi dimulai. Pindah ke tarif lebih tinggi memerlukan pembayaran
                selisih; selisih tarif lebih rendah tidak dikembalikan. Tidak
                tersedia pengembalian dana tunai.
              </p>
            </details>
          </div>
        </section>
        <section className="closing-section">
          <div className="prime-container closing-content">
            <p>Partner sudah siap?</p>
            <h2>
              Sampai ketemu
              <br />
              di lapangan.
            </h2>
            <Link className="prime-button dark-button" href={bookingUrl}>
              Cari sesi berikutnya <ArrowUpRight size={21} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
