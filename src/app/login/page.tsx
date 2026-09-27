import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ImageSliderLoginDemo from "@/components/ui/demo";
import { currentAccount } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const requested = (await searchParams).next;
  const next = requested?.startsWith("/booking") && !requested.startsWith("//")
    ? requested
    : "/booking";
  if (await currentAccount()) redirect(next);

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121A26] border border-[#1F2B3E] text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4FE2B]" /> Kembali ke Beranda
        </Link>

        <span className="text-xs font-semibold text-slate-300">Masuk untuk melihat jadwal</span>
      </div>

      {/* Main Login / Slider Component */}
      <div className="flex-1 flex items-center justify-center">
        <ImageSliderLoginDemo next={next} />
      </div>

      {/* Footer Info */}
      <div className="text-center py-3 text-xs text-slate-500">
        Padel Prime Club Senayan &copy; {new Date().getFullYear()} &middot; Gelora Bung Karno, Jakarta
      </div>
    </div>
  );
}
