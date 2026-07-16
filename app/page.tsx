import Link from "next/link";
import {
  BellRing,
  Stethoscope,
  UtensilsCrossed,
  GraduationCap,
  Clapperboard,
  HeartPulse,
  Sparkles,
  ArrowRight,
  GlassWater,
  Frown,
} from "lucide-react";
import { BrandMark } from "@/src/features/shell/components/Brand";

const FEATURES = [
  { icon: BellRing, title: "Bantuan perawat", body: "Pasien memilih kebutuhan spesifik; permintaannya langsung masuk ke antrean perawat." },
  { icon: Stethoscope, title: "Info medis & jadwal", body: "Dokter, diagnosa, vital sign, dan seluruh rencana perawatan dalam satu linimasa." },
  { icon: UtensilsCrossed, title: "Pemesanan makanan", body: "Menu hari ini, pemesanan mandiri, dan status pesanan yang bisa dipantau." },
  { icon: HeartPulse, title: "Progres pemulihan", body: "Hari ke berapa, target harian dari nakes, dan checklist yang bisa dicentang pasien." },
  { icon: GraduationCap, title: "Edukasi kesehatan", body: "Artikel, video, dan infografik yang dikurasi rumah sakit sesuai kondisi pasien." },
  { icon: Clapperboard, title: "Hiburan", body: "Film, musik, podcast, buku digital, dan video relaksasi untuk mengisi waktu." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <span className="text-lg font-extrabold tracking-tight text-ink">Medly</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Masuk
          </Link>
          <Link href="/register" className="btn-primary">
            Daftarkan rumah sakit
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: the claim on the left, the thing itself on the right. */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pt-16">
          <div className="animate-fade-up">
            <p className="eyebrow">Digital bedside companion</p>
            <h1 className="mt-4 text-[44px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Rawat inap tidak harus berarti{" "}
              <span className="relative whitespace-nowrap text-brand-600">
                menunggu
                <svg
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-brand-200"
                  aria-hidden="true"
                >
                  <path d="M2 8c40-5 90-6 196-3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              Medly adalah tablet di sisi tempat tidur yang menyatukan layanan rumah sakit, hiburan,
              edukasi, dan pendampingan — terhubung langsung dengan sistem operasional rumah sakit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-5 py-3">
                Mulai sekarang <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-ghost px-5 py-3">
                Masuk ke dashboard
              </Link>
            </div>
          </div>

          {/* A quiet reproduction of the bedside home screen. */}
          <div
            className="animate-fade-up rounded-[28px] border border-line bg-gradient-to-b from-brand-50 to-white p-4 shadow-float sm:p-5"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-center justify-between px-1 pb-4">
              <span className="eyebrow">Kamar 1218</span>
              <span className="flex -space-x-1.5">
                {["SA", "BW", "RN"].map((i) => (
                  <span
                    key={i}
                    className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand-100 text-[9px] font-extrabold text-brand-700"
                  >
                    {i}
                  </span>
                ))}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
              <div className="card p-5">
                <p className="text-xl font-extrabold leading-tight tracking-tight text-ink">
                  Selamat pagi,
                  <br />
                  Budi
                </p>
                <p className="mt-1.5 text-xs font-bold text-brand-600">Jadwal Anda hari ini</p>
                <div className="mt-4 space-y-2">
                  {[
                    { t: "09:00", n: "Visit dr. Siti" },
                    { t: "14:30", n: "Fisioterapi" },
                  ].map((s) => (
                    <div key={s.t} className="relative overflow-hidden rounded-xl border border-line px-3 py-2">
                      <span className="absolute inset-y-0 left-0 w-1 bg-brand-500" />
                      <p className="tabular text-[10px] font-bold text-ink-mute">{s.t}</p>
                      <p className="text-xs font-extrabold text-ink">{s.n}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: BellRing, label: "Perawat" },
                  { icon: Frown, label: "Nyeri", urgent: true },
                  { icon: GlassWater, label: "Air Minum" },
                  { icon: Sparkles, label: "Lainnya" },
                ].map((q) => (
                  <div key={q.label} className="card flex flex-col items-center justify-center gap-2 px-2 py-4">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl ${
                        q.urgent ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600"
                      }`}
                    >
                      <q.icon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <span className="text-[10px] font-extrabold text-ink">{q.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1 rounded-full border border-line bg-white/90 p-1.5 backdrop-blur">
              {["Beranda", "Info Medis", "Makanan", "Hiburan"].map((n, i) => (
                <span
                  key={n}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                    i === 0 ? "bg-brand-500 text-white" : "text-ink-mute"
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-line bg-white py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <p className="eyebrow">Cakupan MVP</p>
            <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight text-ink">
              Semuanya bersumber dari satu sistem rumah sakit.
            </h2>

            <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <f.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="text-[15px] font-extrabold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white py-7">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <span className="text-sm font-extrabold text-ink">Medly</span>
          </div>
          <p className="text-xs text-ink-mute">Patient-centered care, satu layar di sisi tempat tidur.</p>
        </div>
      </footer>
    </div>
  );
}
