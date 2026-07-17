"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  Play,
  BellRing,
  UtensilsCrossed,
  Pill,
  Building2,
  GraduationCap,
  Clapperboard,
  MessageSquare,
  CalendarDays,
  HeartPulse,
  ShieldCheck,
  Star,
  Quote,
  ChevronDown,
  Check,
  Sparkles,
  GlassWater,
  Globe,
  Send,
  AtSign,
  MessageCircle,
  Clock,
  Lock,
  HandHeart,
  ChevronLeft,
} from "lucide-react";
import { BrandMark } from "@/src/features/shell/components/Brand";

/* ==========================================================================
   Palette — strictly green (#22C55E / #16A34A) + white + black.
   Muted tones are black-at-opacity; tints are green-at-opacity. Nothing else.
   Photography is real (Unsplash CDN) so the product feels lived-in, not templated.
   ========================================================================== */

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  room: "1538108149393-fbbd81895907",
  care: "1584515933487-779824d29309",
  consult: "1631217868264-e5b90bb7e133",
  food: "1546069901-ba9599a7e63c",
  pills: "1584308666744-24d5c474f2ae",
  reception: "1519494026892-80bbd2d6fd0d",
  books: "1532012197267-da84d127e765",
  media: "1611162617213-7d7a39e9b1d7",
  talk: "1573497491208-6b1acb260507",
  planner: "1506784983877-45594efa4cbe",
  building: "1586773860418-d37222d8fce3",
};

const NAV = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "benefits", label: "Benefits" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];

const HOSPITALS = [
  "RS Sehat Sentosa",
  "Mitra Medika",
  "Prima Husada",
  "Bunda Care",
  "Graha Medika",
  "Nusa Medical",
  "Cahaya Insani",
  "Amanah Hospital",
];

const PROBLEMS = [
  { n: "01", title: "Calling a nurse is hard", body: "Pressing a bell, then waiting with no idea whether anyone heard or when help arrives." },
  { n: "02", title: "Hospital information is vague", body: "Confusion about who the attending doctor is, visiting hours, house rules, and what happens next." },
  { n: "03", title: "Schedules slip by unnoticed", body: "Medication, doctor visits and therapy live in different places, so patients can't follow them." },
  { n: "04", title: "Ordering meals is a hassle", body: "Choosing a diet menu means waiting for staff, with no idea where the order stands." },
];

const SOLUTIONS = [
  { icon: BellRing, title: "Nurse Call transparan", body: "Pick exactly what's needed and watch it get picked up, live." },
  { icon: CalendarDays, title: "Schedules in one place", body: "Medication, visits and therapy on one timeline, with reminders." },
  { icon: UtensilsCrossed, title: "Order meals independently", body: "Daily diet menus with order status the patient can follow." },
  { icon: Building2, title: "Hospital info made clear", body: "Doctor profiles, house rules and inpatient guidance, always at hand." },
];

const STATS = [
  { value: 20, suffix: "+", label: "Fitur terintegrasi" },
  { value: null, display: "24/7", label: "Always available" },
  { value: 100, suffix: "%", label: "Patient-friendly" },
  { value: 8, suffix: "", label: "Layanan inti" },
];

const FEATURES = [
  { icon: BellRing, tag: "Help", title: "Nurse Call", body: "Call for help with the need spelled out — straight into the nurses' queue.", image: IMG.care, span: "lg:col-span-2 lg:row-span-2" },
  { icon: UtensilsCrossed, tag: "Kitchen", title: "Meal Ordering", body: "Pick a menu that fits the diet, then follow its status.", image: IMG.food, span: "" },
  { icon: Pill, tag: "Medical", title: "Medication schedule", body: "Reminders for every dose and when to take it.", image: IMG.pills, span: "" },
  { icon: Clapperboard, tag: "Entertainment", title: "Entertainment", body: "Films, music and podcasts to pass the time.", image: IMG.media, span: "" },
  { icon: Building2, tag: "Info", title: "Hospital Information", body: "Doctor profiles, house rules and inpatient guidance.", image: IMG.reception, span: "" },
  { icon: GraduationCap, tag: "Education", title: "Health Education", body: "Articles and videos curated to the patient's condition.", image: IMG.books, span: "lg:col-span-2" },
  { icon: MessageSquare, tag: "Patient voices", title: "Feedback", body: "Rate the service without leaving the bed.", image: IMG.talk, span: "" },
  { icon: CalendarDays, tag: "Daily", title: "Daily Schedule", body: "A timeline of activity and daily recovery goals.", image: IMG.planner, span: "" },
];

const BENEFITS = {
  patient: [
    "Faster help through a nurse call you can see",
    "Medication and therapy no longer missed",
    "Order diet-appropriate meals independently",
    "Entertainment and education fill the hours",
    "Independence and calm through recovery",
  ],
  hospital: [
    "Lighter, better-directed workload for nurses",
    "Every patient request recorded and measurable",
    "A modern, digital standard of care",
    "Real-time patient feedback",
    "Connected to the systems you run",
  ],
};

const TESTIMONIALS = [
  { name: "Budi Santoso", role: "Patient · RS Sehat Sentosa", avatar: "1500648767791-00dcc994a43e", rating: 5, quote: "I can call a nurse and check my own medication schedule. It made the whole stay far less anxious." },
  { name: "Ns. Rina Wijaya", role: "Nurse · Mitra Medika", avatar: "1494790108377-be9c29b29330", rating: 5, quote: "Patient requests arrive with clear priority. We reach the urgent ones faster." },
  { name: "dr. Andini Putri", role: "Doctor · Prima Husada", avatar: "1438761681033-6461ffad8d80", rating: 5, quote: "Schedules and education reach patients consistently. Communication got much easier." },
  { name: "Rian Pratama", role: "Patient's family · Bunda Care", avatar: "1507003211169-0a1dd7228f2d", rating: 5, quote: "As family, I worry less — everything my father needs is tracked on one screen." },
];

const FAQS = [
  { q: "What is Medly?", a: "Medly is a digital bedside companion — a tablet beside the bed that brings nurse call, schedules, meal ordering, education and entertainment together for the whole stay." },
  { q: "Bagaimana cara kerja Medly?", a: "The patient signs in on the tablet, picks what they need, and the request goes to the right team — with its status visible the whole way." },
  { q: "Can it be tailored to our hospital?", a: "Yes. Meal menus, hospital information, education content and service flows are all configurable to each hospital's policies." },
  { q: "Apakah membutuhkan internet?", a: "Medly runs best on the hospital network. Most core features keep working offline and sync again once the connection returns." },
  { q: "Is patient data safe?", a: "Security comes first. Access is scoped to each room, data is encrypted, and the connection to your systems follows medical confidentiality standards." },
];

/* -------------------------------------------------------------------------- */
/*  Reusable pieces (kept in-file per constraint)                             */
/* -------------------------------------------------------------------------- */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "up" | "left" | "right" | "scale";
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
};

function Reveal({ children, className = "", variant = "up", delay = 0, as = "div" }: RevealProps) {
  const { ref, shown } = useReveal<HTMLElement>();
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={`md-reveal md-${variant} ${shown ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

function Counter({ to, suffix = "", duration = 1600 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref} className="tabular">
      {val}
      {suffix}
    </span>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
        open ? "border-[#22C55E] bg-white shadow-[0_18px_40px_-24px_rgba(22,163,74,0.4)]" : "border-black/10 bg-white"
      }`}
    >
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6" aria-expanded={open}>
        <span className="text-[15px] font-extrabold text-black sm:text-base">{q}</span>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-500 ${
            open ? "rotate-180 bg-[#16A34A] text-white" : "bg-black/[0.05] text-black/50"
          }`}
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
        </span>
      </button>
      <div className="grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="px-5 pb-6 text-sm leading-relaxed text-black/60 sm:px-6">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [slide, setSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);


  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (y / h) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

 const goToSlide = useCallback((next: number) => {
  setIsAnimating((animating) => {
    if (animating) return animating; 
    setSlide(next);
    return true;
  });
}, []);

useEffect(() => {
  const t = setTimeout(() => setIsAnimating(false), 650);
  return () => clearTimeout(t);
}, [slide]);

useEffect(() => {
  const t = setInterval(() => {
    goToSlide((slide + 1) % TESTIMONIALS.length);
  }, 5000);
  return () => clearInterval(t);
}, [slide, goToSlide]);

  const goTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="md-root relative min-h-screen overflow-x-hidden bg-white text-black">
      <style>{`
        html { scroll-behavior: smooth; }
        .md-reveal { opacity: 0; transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); will-change: opacity, transform; }
        .md-up { transform: translateY(30px); }
        .md-left { transform: translateX(-36px); }
        .md-right { transform: translateX(36px); }
        .md-scale { transform: scale(.94); }
        .md-reveal.is-in { opacity: 1; transform: none; }
        @keyframes md-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .md-marquee { animation: md-marquee 34s linear infinite; }
        .md-marquee-group:hover .md-marquee { animation-play-state: paused; }
        @keyframes md-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .md-float { animation: md-float 7s ease-in-out infinite; }
        .md-float-slow { animation: md-float 10s ease-in-out infinite; }
        @keyframes md-gradient { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .md-gradient { background-size: 200% 200%; animation: md-gradient 9s ease infinite; }
        @keyframes md-ping { 0% { transform: scale(.9); opacity: .55; } 70%,100% { transform: scale(2.2); opacity: 0; } }
        .md-ping::after { content:""; position:absolute; inset:0; border-radius:9999px; background: rgba(34,197,94,.5); animation: md-ping 2.4s cubic-bezier(0,0,.2,1) infinite; }
        @keyframes md-pop-in { 0% { opacity: 0; transform: translateY(20px) scale(.95); } 100% { opacity: 1; transform: none; } }
        .md-pop-in > * { animation: md-pop-in .6s cubic-bezier(.16,1,.3,1) both; }
        .md-pop-in > *:nth-child(2) { animation-delay: .08s; }
        .md-pop-in > *:nth-child(3) { animation-delay: .16s; }
        @media (prefers-reduced-motion: reduce) {
          .md-reveal { opacity:1 !important; transform:none !important; }
          .md-marquee, .md-float, .md-float-slow, .md-gradient, .md-ping::after { animation: none !important; }
        }
      `}</style>

      {/* Scroll progress */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px]">
        <div className="h-full bg-gradient-to-r from-[#16A34A] to-[#22C55E] transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* ---------------- Navbar ---------------- */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "border-b border-black/[0.07] bg-white/75 py-2.5 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] backdrop-blur-xl" : "border-b border-transparent bg-transparent py-4"
        }`}
      >
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6">
          <button onClick={() => goTo("home")} className="flex items-center gap-2.5">
            <BrandMark className="h-9 w-9" />
            <span className="text-lg font-extrabold tracking-tight text-black">Medly</span>
          </button>

          <div className="hidden items-center gap-1 rounded-full border border-black/[0.07] bg-white/60 px-1.5 py-1.5 backdrop-blur lg:flex">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => goTo(n.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors duration-300 ${
                  active === n.id ? "bg-[#16A34A] text-white shadow-sm" : "text-black/60 hover:text-[#16A34A]"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black transition hover:text-[#16A34A]">Sign in</Link>
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#22C55E]/30 transition-all duration-300 hover:bg-[#16A34A] hover:shadow-xl active:scale-[0.97]">
              Get Started <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button onClick={() => setMenuOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white/70 text-black backdrop-blur lg:hidden" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${menuOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="mx-4 mt-3 rounded-2xl border border-black/[0.07] bg-white/95 p-3 shadow-xl backdrop-blur-xl">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => goTo(n.id)} className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${active === n.id ? "bg-[#22C55E]/10 text-[#16A34A]" : "text-black/70 hover:bg-black/[0.03]"}`}>
                {n.label}
              </button>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-black/[0.07] pt-3">
              <Link href="/login" className="rounded-xl border border-black/10 px-4 py-2.5 text-center text-sm font-semibold text-black">Sign in</Link>
              <Link href="/register" className="rounded-xl bg-[#22C55E] px-4 py-2.5 text-center text-sm font-semibold text-white">Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section id="home" className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#22C55E]/[0.06] via-white to-white" />
          <div className="absolute -left-24 top-6 h-96 w-96 rounded-full bg-[#22C55E]/15 blur-3xl md-float-slow" />
          <div className="absolute -right-16 top-40 h-[26rem] w-[26rem] rounded-full bg-[#16A34A]/10 blur-3xl md-float" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/[0.06] px-3.5 py-1.5 text-[12px] font-bold text-[#16A34A]">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-[#22C55E] md-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" /></span>
                Digital Bedside Companion
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[42px] font-extrabold leading-[1.04] tracking-tight text-black sm:text-6xl">
                A hospital stay that feels{" "}
                <span className="relative text-[#16A34A]">
                  more human
                  <svg viewBox="0 0 240 12" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-3 w-full text-[#22C55E]/40" aria-hidden>
                    <path d="M2 8c50-6 120-7 236-3" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/60">
                One tablet at the bedside that brings hospital services, schedules, education and entertainment together — wired straight into the hospital’s own systems.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#22C55E]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#16A34A] hover:shadow-xl active:scale-[0.98]">
                  Get Started <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <button onClick={() => goTo("features")} className="group inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-6 py-3.5 text-sm font-bold text-black transition-all duration-300 hover:-translate-y-0.5 hover:border-[#22C55E]/50">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#22C55E]/10 text-[#16A34A] transition group-hover:bg-[#22C55E] group-hover:text-white"><Play className="h-3 w-3 translate-x-px" fill="currentColor" /></span>
                  Watch Demo
                </button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-black/55">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#16A34A]" /> Encrypted data</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-[#16A34A]" /> Available 24/7</span>
                <span className="inline-flex items-center gap-1.5"><HeartPulse className="h-4 w-4 text-[#16A34A]" /> Connected to your HIS</span>
              </div>
            </Reveal>
          </div>

          {/* Hero visual: real ward photo framed as a bedside device */}
          <Reveal variant="right" delay={200} className="relative">
            <div className="md-float rounded-[32px] border border-black/10 bg-white p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.4)]">
              <div className="relative overflow-hidden rounded-[22px]">
                <img src={img(IMG.room, 900)} alt="Inpatient room" className="h-[300px] w-full object-cover sm:h-[420px]" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-black backdrop-blur">Room 1218</span>
                  <span className="flex -space-x-1.5">
                    {["SA", "BW", "RN"].map((i) => (
                      <span key={i} className="grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#16A34A] text-[9px] font-extrabold text-white">{i}</span>
                    ))}
                  </span>
                </div>
                <div className="absolute inset-x-3 bottom-3 grid grid-cols-4 gap-2">
                  {[{ icon: BellRing, label: "Nurses" }, { icon: GlassWater, label: "Water" }, { icon: UtensilsCrossed, label: "Meals" }, { icon: Pill, label: "Medication" }].map((q) => (
                    <div key={q.label} className="flex flex-col items-center gap-1 rounded-xl bg-white/85 py-2.5 backdrop-blur transition hover:bg-white">
                      <q.icon className="h-4 w-4 text-[#16A34A]" strokeWidth={2} />
                      <span className="text-[9px] font-extrabold text-black">{q.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* floating cards */}
            <div className="absolute -left-4 top-8 hidden rounded-2xl border border-black/[0.07] bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur md-float-slow sm:flex">
              <div className="flex items-center gap-2.5">
                <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#22C55E]/10 text-[#16A34A] md-ping"><BellRing className="h-4 w-4" /></span>
                <div><p className="text-[11px] font-extrabold text-black">A nurse is on the way</p><p className="text-[10px] font-semibold text-black/50">~ 2 min</p></div>
              </div>
            </div>
            <div className="absolute -bottom-5 right-2 hidden items-center gap-2.5 overflow-hidden rounded-2xl border border-black/[0.07] bg-white/95 p-2 pr-3.5 shadow-xl backdrop-blur md-float sm:flex">
              <img src={img(IMG.food, 200)} alt="" className="h-11 w-11 rounded-xl object-cover" />
              <div><p className="text-[11px] font-extrabold text-black">Meal ordered</p><p className="text-[10px] font-semibold text-[#16A34A]">Low-salt diet</p></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Trusted by ---------------- */}
      <section className="border-y border-black/[0.06] bg-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-black/40">Trusted by hospitals across Indonesia</p>
        </div>
        <div className="md-marquee-group relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
          <div className="md-marquee flex w-max gap-4 pr-4">
            {[...HOSPITALS, ...HOSPITALS].map((h, i) => (
              <div key={i} className="group flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-white px-6 py-3.5 opacity-50 transition duration-500 hover:opacity-100 hover:shadow-md">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-black/[0.04] text-black/40 transition group-hover:bg-[#22C55E]/10 group-hover:text-[#16A34A]"><HeartPulse className="h-4 w-4" /></span>
                <span className="whitespace-nowrap text-sm font-extrabold text-black/70 transition group-hover:text-black">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Problem (editorial) ---------------- */}
      <section className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Reveal><span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">Permasalahan</span></Reveal>
              <Reveal delay={80}><h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-black sm:text-4xl">A hospital stay is full of small, repeating frictions</h2></Reveal>
              <Reveal delay={140}><p className="mt-5 text-[17px] leading-relaxed text-black/60">Uncertainty and waiting wear people down — the patient and the hospital team alike.</p></Reveal>
              <Reveal delay={200} className="mt-8 overflow-hidden rounded-3xl border border-black/[0.07]">
                <img src={img(IMG.consult, 700)} alt="Patient consultations" className="h-56 w-full object-cover" loading="lazy" />
              </Reveal>
            </div>
            <div className="divide-y divide-black/[0.08]">
              {PROBLEMS.map((p, i) => (
                <Reveal key={p.n} delay={i * 90}>
                  <div className="group flex gap-6 py-7 transition">
                    <span className="text-3xl font-extrabold text-black/15 transition group-hover:text-[#22C55E]">{p.n}</span>
                    <div>
                      <h3 className="text-lg font-extrabold text-black">{p.title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-black/55">{p.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Solution: Meet Medly ---------------- */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#22C55E]/[0.04]" />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
          <Reveal variant="left" className="relative order-2 lg:order-1">
            <div className="absolute -inset-5 -z-10 rounded-[40px] bg-[#22C55E]/10 blur-2xl" />
            <div className="overflow-hidden rounded-[28px] border border-black/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.45)]">
              <img src={img(IMG.room, 1000)} alt="Medly inpatient room" className="h-[380px] w-full object-cover md-float" loading="lazy" />
            </div>
            <div className="absolute -bottom-6 -right-4 hidden rounded-2xl border border-black/[0.07] bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#16A34A] text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>
                <div><p className="text-[11px] font-extrabold text-black">Everything connected</p><p className="text-[10px] font-semibold text-black/50">Real-time to your HIS</p></div>
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal><span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">Solusinya</span></Reveal>
            <Reveal delay={80}><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Meet Medly</h2></Reveal>
            <Reveal delay={140}><p className="mt-4 text-[17px] leading-relaxed text-black/60">One simple interface that answers every one of those frustrations — right from the patient’s bedside.</p></Reveal>
            <div className="mt-8 space-y-3">
              {SOLUTIONS.map((s, i) => (
                <Reveal key={s.title} delay={i * 90}>
                  <div className="group flex items-start gap-4 rounded-2xl border border-black/[0.07] bg-white p-4 transition-all duration-400 hover:-translate-y-0.5 hover:border-[#22C55E]/40 hover:shadow-[0_18px_40px_-24px_rgba(22,163,74,0.4)]">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#22C55E]/10 text-[#16A34A] transition duration-400 group-hover:bg-[#16A34A] group-hover:text-white"><s.icon className="h-5 w-5" strokeWidth={2} /></span>
                    <div><h3 className="text-[15px] font-extrabold text-black">{s.title}</h3><p className="mt-1 text-[13px] leading-relaxed text-black/55">{s.body}</p></div>
                    <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-black/20 transition group-hover:text-[#16A34A]" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- About + stats ---------------- */}
      <section id="about" className="relative py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <Reveal><span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">Tentang Medly</span></Reveal>
              <Reveal delay={80}><h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-black sm:text-4xl">Technology that brings patients and care closer</h2></Reveal>
              <Reveal delay={140}><p className="mt-5 text-[17px] leading-relaxed text-black/60">Medly is a digital bedside companion for the inpatient experience. From one tablet a patient can call a nurse, check their schedule, order meals, learn about their condition and enjoy entertainment — all connected to the hospital’s own systems in real time.</p></Reveal>
              <Reveal delay={200}>
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {STATS.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-black/[0.07] bg-white p-4">
                      <div className="text-3xl font-extrabold tracking-tight text-[#16A34A]">{s.value !== null ? <Counter to={s.value} suffix={s.suffix} /> : s.display}</div>
                      <p className="mt-1 text-[12px] font-semibold text-black/55">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal variant="right" delay={120} className="relative">
              <div className="overflow-hidden rounded-[28px] border border-black/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.45)]">
                <img src={img(IMG.building, 900)} alt="Medly partner hospitals" className="h-[420px] w-full object-cover" loading="lazy" />
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/40 bg-white/85 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#16A34A] text-white"><HeartPulse className="h-5 w-5" /></span>
                  <div><p className="text-sm font-extrabold text-black">Patient-centered care</p><p className="text-[12px] font-medium text-black/55">One screen at the bedside</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Features: bento of real imagery ---------------- */}
      <section id="features" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#22C55E]/[0.04]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal><span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">Fitur</span></Reveal>
            <Reveal delay={80}><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Everything a patient needs, on one screen</h2></Reveal>
            <Reveal delay={140}><p className="mt-4 text-[17px] leading-relaxed text-black/60">Eight core services, all drawn from the same hospital system.</p></Reveal>
          </div>

          <div className="mt-14 grid auto-rows-[240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 80} variant="scale" className={f.span}>
                <article className="group relative h-full overflow-hidden rounded-3xl border border-black/10">
                  <img src={img(f.image, 900)} alt={f.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/5 transition duration-500 group-hover:ring-[#22C55E]/60" />
                  <div className="relative flex h-full flex-col justify-end p-6">
                    <div className="mb-auto flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur transition duration-500 group-hover:bg-[#22C55E] group-hover:-rotate-6"><f.icon className="h-5 w-5" strokeWidth={2} /></span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">{f.tag}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-extrabold text-white">{f.title}</h3>
                    <p className="mt-1.5 max-h-0 overflow-hidden text-[13px] leading-relaxed text-white/80 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">{f.body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Benefits ---------------- */}
      <section id="benefits" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#22C55E]/[0.04]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#22C55E]/10 blur-[120px]" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal><span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">Manfaat</span></Reveal>
            <Reveal delay={80}><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Both sides win</h2></Reveal>
            <Reveal delay={140}><p className="mt-4 text-[17px] leading-relaxed text-black/60">One system that calms the patient and lightens the hospital’s load at the same time.</p></Reveal>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {/* Patient */}
            <Reveal variant="left">
              <div className="group relative h-full overflow-hidden rounded-3xl border border-black/[0.07] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#22C55E]/30 hover:shadow-[0_30px_60px_-32px_rgba(22,163,74,0.35)] sm:p-10">
                <span className="absolute right-6 top-6 rounded-full bg-[#22C55E]/10 px-3 py-1 text-[11px] font-bold text-[#16A34A]">Patient side</span>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#22C55E]/10 text-[#16A34A] transition duration-500 group-hover:bg-[#16A34A] group-hover:text-white group-hover:-rotate-6"><HandHeart className="h-6 w-6" /></span>
                <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-black">For Patients</h3>
                <p className="mt-1.5 text-sm font-medium text-black/50">Control and comfort back in the patient’s hands.</p>
                <ul className="mt-7 space-y-1">
                  {BENEFITS.patient.map((b) => (
                    <li key={b} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 hover:bg-[#22C55E]/[0.07]">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#22C55E] text-white shadow-sm shadow-[#22C55E]/40"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                      <span className="text-[14px] font-medium leading-snug text-black/75">{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex items-center gap-2.5 border-t border-black/[0.07] pt-5 text-sm font-semibold text-black/60">
                  <HeartPulse className="h-4 w-4 text-[#16A34A]" /> Rasa tenang & mandiri di setiap momen
                </div>
              </div>
            </Reveal>

            {/* Hospital */}
            <Reveal variant="right" delay={100}>
              <div className="group relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#16A34A] to-[#22C55E] p-8 text-white shadow-[0_30px_60px_-30px_rgba(22,163,74,0.7)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_40px_75px_-32px_rgba(22,163,74,0.85)] sm:p-10">
                <div className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(ellipse 70% 60% at 80% 10%, #000, transparent 70%)" }} />
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
                <div className="relative">
                  <span className="absolute right-0 top-0 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">Hospital side</span>
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur transition duration-500 group-hover:bg-white group-hover:text-[#16A34A] group-hover:-rotate-6"><Building2 className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-2xl font-extrabold tracking-tight">For Hospitals</h3>
                  <p className="mt-1.5 text-sm font-medium text-white/70">Sharper efficiency and better service quality.</p>
                  <ul className="mt-7 space-y-1">
                    {BENEFITS.hospital.map((b) => (
                      <li key={b} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 hover:bg-white/10">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[#16A34A]"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                        <span className="text-[14px] font-medium leading-snug text-white/90">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex items-center gap-2.5 border-t border-white/20 pt-5 text-sm font-semibold text-white/85">
                    <ShieldCheck className="h-4 w-4" /> Modern, measurable, dependable care
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

 {/* ---------------- Testimonials ---------------- */}
<section className="relative py-20 sm:py-24 lg:py-28">
  <div className="mx-auto max-w-4xl px-6 sm:px-8">
    <div className="text-center">
      <Reveal>
        <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">
          Testimoni
        </span>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
          Felt right there in the ward
        </h2>
      </Reveal>
    </div>

    <Reveal delay={120} className="relative mt-12 sm:mt-14">
      {/* clipping wrapper — HANYA ini yang overflow-hidden */}
      <div className="relative overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_30px_70px_-40px_rgba(22,163,74,0.35)]">
        <Quote
          className="pointer-events-none absolute right-6 top-6 h-14 w-14 text-[#22C55E]/10 sm:right-8 sm:top-8 sm:h-16 sm:w-16"
          fill="currentColor"
        />

        {/* track: lebar total = jumlah slide x 100% */}
        <div
          className="flex transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `${TESTIMONIALS.length * 100}%`,
            transform: `translateX(-${(100 / TESTIMONIALS.length) * slide}%)`,
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="shrink-0 p-8 sm:p-10 lg:p-14"
              style={{ width: `${100 / TESTIMONIALS.length}%` }}
            >
              <div className={`relative z-10 ${slide === i ? "md-pop-in" : "opacity-100"}`}>
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 text-[#22C55E]" fill="currentColor" />
                  ))}
                </div>

                <p className="mt-5 max-w-xl text-lg font-semibold leading-relaxed text-black sm:text-xl">
                  “{t.quote}”
                </p>

                <div className="mt-8 flex items-center gap-3.5">
                  <img
                    src={img(t.avatar, 120)}
                    alt={t.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-[#22C55E]/30"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-[15px] font-extrabold text-black">{t.name}</p>
                    <p className="text-[13px] font-medium text-black/55">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          onClick={() => goToSlide((slide - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
          aria-label="Previous"
          disabled={isAnimating}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-black/60 transition hover:-translate-x-0.5 hover:border-[#22C55E]/50 hover:bg-[#22C55E]/10 hover:text-[#16A34A] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Testimoni ${i + 1}`}
              disabled={isAnimating}
              className={`h-2 rounded-full transition-all duration-500 disabled:pointer-events-none ${
                slide === i ? "w-8 bg-[#16A34A]" : "w-2 bg-black/15 hover:bg-black/30"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => goToSlide((slide + 1) % TESTIMONIALS.length)}
          aria-label="Next"
          disabled={isAnimating}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-black/60 transition hover:translate-x-0.5 hover:border-[#22C55E]/50 hover:bg-[#22C55E]/10 hover:text-[#16A34A] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </Reveal>
  </div>
</section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[#22C55E]/[0.04]" />
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <Reveal><span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#16A34A]">FAQ</span></Reveal>
            <Reveal delay={80}><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Frequently asked questions</h2></Reveal>
          </div>
          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <FaqItem q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section id="contact" className="relative px-6 py-24">
        <Reveal variant="scale" className="mx-auto max-w-5xl">
          <div className="md-gradient relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#16A34A] via-[#22C55E] to-[#16A34A] px-8 py-16 text-center shadow-[0_40px_90px_-40px_rgba(22,163,74,0.8)] sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 rounded-full bg-white/15 blur-3xl md-float" />
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-black/10 blur-3xl md-float-slow" />
            <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000, transparent 75%)" }} />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-white backdrop-blur"><Sparkles className="h-3.5 w-3.5" /> Ready to improve the patient experience?</span>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">Bring Medly to every bedside</h2>
              <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/85">Join the hospitals making care more connected, more transparent, and more centred on the patient.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#16A34A] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]">Get Started <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></Link>
                <a href="mailto:hello@medly.id" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20">Contact Sales</a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-black/[0.08] bg-white pt-16 pb-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5"><BrandMark className="h-9 w-9" /><span className="text-lg font-extrabold tracking-tight text-black">Medly</span></div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-black/55">A digital bedside companion that makes care feel more human — one screen, right beside the bed.</p>
              <div className="mt-6 flex gap-2.5">
                {[{ icon: Globe, label: "Website" }, { icon: AtSign, label: "Email" }, { icon: MessageCircle, label: "Chat" }, { icon: Send, label: "Telegram" }].map((s) => (
                  <a key={s.label} href="#" aria-label={s.label} className="grid h-10 w-10 place-items-center rounded-xl border border-black/[0.08] bg-white text-black/50 transition hover:-translate-y-0.5 hover:border-[#22C55E]/50 hover:bg-[#22C55E]/10 hover:text-[#16A34A]"><s.icon className="h-4 w-4" /></a>
                ))}
              </div>
            </div>
            {[
              { title: "Produk", links: [["Features", "features"], ["Benefits", "benefits"], ["About", "about"]] },
              { title: "Support", links: [["FAQ", "faq"], ["Contact", "contact"], ["Privacy", "contact"]] },
              { title: "Perusahaan", links: [["Home", "home"], ["About", "about"], ["Karier", "about"]] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-extrabold uppercase tracking-wide text-black">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([label, id]) => (
                    <li key={label + id}><button onClick={() => goTo(id)} className="text-sm font-medium text-black/55 transition hover:text-[#16A34A]">{label}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/[0.08] pt-6 sm:flex-row">
            <p className="text-xs text-black/40">© {new Date().getFullYear()} Medly. Patient-centered care, satu layar di sisi tempat tidur.</p>
            <div className="flex items-center gap-5 text-xs font-semibold text-black/40">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Data aman</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Medical standard</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
