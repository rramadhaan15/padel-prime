import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/prime/logout-button";
import { SiteFooter, SiteHeader } from "@/components/prime/site-shell";
import { currentAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const account = await currentAccount();
  if (!account) redirect("/login?next=%2Fprofil");

  return (
    <div className="prime-site account-page">
      <SiteHeader booking />
      <main id="main-content" className="prime-container account-main">
        <Link className="back-link" href="/booking">
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke jadwal main
        </Link>

        <div className="account-heading">
          <p className="eyebrow">Akun pemain</p>
          <h1>Profil saya<span>.</span></h1>
          <p>Informasi yang tersimpan untuk reservasi lapanganmu.</p>
        </div>

        <section className="account-details" aria-labelledby="account-details-title">
          <div className="account-details-intro">
            <h2 id="account-details-title">Detail akun</h2>
            <p>Data ini digunakan saat kamu membuat reservasi.</p>
          </div>
          <dl>
            <div>
              <dt>Nama</dt>
              <dd>{account.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{account.email}</dd>
            </div>
            <div>
              <dt>Nomor WhatsApp</dt>
              <dd>{account.phone || "Belum ditambahkan"}</dd>
            </div>
          </dl>
        </section>

        <section className="account-session" aria-labelledby="account-session-title">
          <div>
            <h2 id="account-session-title">Sesi akun</h2>
            <p>Keluar setelah selesai menggunakan akun ini, terutama di perangkat bersama.</p>
          </div>
          <LogoutButton className="prime-button secondary" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
