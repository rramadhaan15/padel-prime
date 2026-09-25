import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Padel Prime Club | Court Reservation",
  description:
    "Pilih jadwal main padel indoor dan outdoor di Padel Prime Club. Cek ketersediaan lapangan dan reservasi tanpa membuat akun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" data-scroll-behavior="smooth">
      <body className="bg-[#0B0F17] text-slate-100 antialiased selection:bg-[#D4FE2B] selection:text-black">
        {children}
      </body>
    </html>
  );
}
