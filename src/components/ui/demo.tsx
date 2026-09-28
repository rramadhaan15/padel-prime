"use client";

import { useState, type FormEvent } from "react";
import { ImageSlider } from "@/components/ui/image-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const images = [
  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1576610616656-d3aa5d1f4534?q=80&w=1200&auto=format&fit=crop",
];

export default function ImageSliderLoginDemo({ next = "/booking" }: { next?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const result: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error ?? "Belum dapat masuk. Silakan coba lagi.");
        return;
      }
      window.location.assign(next);
    } catch {
      setError("Koneksi terputus. Periksa koneksi lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full min-h-[600px] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl min-h-[600px] grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-[#1F2B3E] bg-[#0E1522]">
        <div className="hidden lg:block relative">
          <ImageSlider images={images} interval={4000} className="h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/90 via-[#0B0F17]/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-8 left-8 right-8 z-20 pointer-events-none">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D4FE2B] mb-2">Padel Prime Club</p>
            <h2 className="text-2xl font-black text-white leading-snug">Siap untuk sesi berikutnya?</h2>
            <p className="text-sm text-slate-200 mt-2">Masuk untuk melihat jadwal dan memilih waktu main.</p>
          </div>
        </div>

        <div className="w-full bg-[#121A26] text-slate-100 flex flex-col justify-center p-6 sm:p-10 lg:p-12 border-l border-[#1F2B3E]">
          <div className="w-full max-w-sm mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D4FE2B] mb-3">Portal pemain</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              {mode === "login" ? "Masuk untuk booking" : "Buat akun pemain"}
            </h1>
            <p className="text-slate-300 text-sm mb-7">
              {mode === "login"
                ? "Masuk terlebih dahulu untuk melihat jadwal dan memilih slot lapangan."
                : "Daftar sekali, lalu pilih jadwal main yang tersedia."}
            </p>

            <form className="space-y-4" onSubmit={submit}>
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm text-slate-200">Nama</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                    className="bg-[#182334] border-[#506176] text-white placeholder:text-slate-400 focus-visible:ring-[#D4FE2B] h-11"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="bg-[#182334] border-[#506176] text-white placeholder:text-slate-400 focus-visible:ring-[#D4FE2B] h-11"
                />
              </div>
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm text-slate-200">Nomor WhatsApp</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    className="bg-[#182334] border-[#506176] text-white placeholder:text-slate-400 focus-visible:ring-[#D4FE2B] h-11"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-slate-200">Kata sandi</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={mode === "register" ? 10 : 1}
                  maxLength={128}
                  required
                  className="bg-[#182334] border-[#506176] text-white placeholder:text-slate-400 focus-visible:ring-[#D4FE2B] h-11"
                />
                {mode === "register" && <p className="text-xs text-slate-300">Minimal 10 karakter.</p>}
              </div>
              {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-[#D4FE2B] text-black font-extrabold hover:brightness-110 h-11"
              >
                {pending ? "Memproses..." : mode === "login" ? "Masuk dan lihat jadwal" : "Daftar dan lihat jadwal"}
              </Button>
            </form>

            <p className="mt-6 pt-5 border-t border-[#506176] text-sm text-slate-300">
              {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                type="button"
                className="font-semibold text-[#D4FE2B] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4FE2B]"
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
              >
                {mode === "login" ? "Daftar" : "Masuk"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ImageSliderLoginDemo };
