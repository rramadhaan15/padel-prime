import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Padel Prime Club | Court Reservation",
  description: "Deterministic real-time court availability, instant holds, and seamless padel bookings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F17] text-slate-100 antialiased selection:bg-[#D4FE2B] selection:text-black">
        {children}
      </body>
    </html>
  );
}
