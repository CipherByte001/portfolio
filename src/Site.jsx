import React, { useEffect, useMemo, useRef, useState } from "react";
// Added useSpring and AnimatePresence to this list!
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { projects as PROJECTS_DATA } from "./data/projects.js";
import { research as RESEARCH_DATA } from "./data/research.js";
import { achievements as ACHIEVEMENTS_DATA } from "./data/achievements.js";
import {
  fetchProjects,
  fetchResearch,
  fetchAchievements,
  fetchRecommendations,
  fetchAbout,
  fetchSkills,
  fetchResume,
  sendMessageToCMS,
  mediaUrl,
} from "./lib/api.js";

// -- useCMS hook ---------------------------------------------------------------
// Fetches a resource from the CMS and falls back to the static default
// if the CMS isn't configured or isn't reachable yet.
// -- useCMS hook (Lightspeed SWR Cache) ----------------------------------------
// Instant 0ms load from localStorage cache + background silent revalidation with CMS.
function useCMS(fetcher, staticFallback, cacheKey) {
  const key = cacheKey || fetcher?.name || 'default';
  const [data, setData] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = localStorage.getItem('s_cms_' + key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed !== null && parsed !== undefined) return parsed;
        }
      } catch {}
    }
    return staticFallback;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetcher()
      .then((d) => {
        if (d !== null && d !== undefined) {
          setData(d);
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.setItem('s_cms_' + key, JSON.stringify(d));
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [key]);

  return { data, loading };
}

// =====================
// DEV-ONLY sample content — lets the card -> full-page-detail flow be previewed
// before real Firestore data exists. import.meta.env.DEV is false in the production
// build, so this (and every reference to it below) is stripped out and never ships.
const SAMPLE_PROJECT = {
  id: "sample-project-har-embedded",
  title: "Human Activity Recognition on Embedded Devices (WISDM)",
  excerpt: "Quantized and pruned a HAR deep learning model for real-time inference on an STM32 Nucleo F767ZI.",
  desc: "Built a Human Activity Recognition pipeline on the WISDM dataset, then optimized the trained model for a resource-constrained microcontroller. Applied post-training quantization and pruning to shrink the TensorFlow model down to a TensorFlow Lite Micro build that fits comfortably in the Nucleo F767ZI's flash and RAM budget, while keeping real-time inference latency low enough for continuous on-device classification from accelerometer and gyroscope input.\n\nThis is placeholder sample content — only visible in local dev — showing how a real project card and its full detail page will look.",
  tags: ["Embedded ML", "Quantization", "STM32", "TensorFlow Lite"],
  components: ["STM32 Nucleo F767ZI", "Accelerometer", "Gyroscope"],
  media: { type: "image", src: "" },
  link: "https://github.com/CipherByte001/WISDM_HAR_Model_for_Embedded_Devices_Optimization",
};

const SAMPLE_RESEARCH = {
  id: "sample-research-ecg-pantompkins",
  title: "ECG Arrhythmia Feature Extraction using the Pan–Tompkins Algorithm",
  excerpt: "Implemented the Pan–Tompkins QRS-detection algorithm on the PTB-XL arrhythmia dataset for biomedical signal feature extraction.",
  desc: "Implemented the classic Pan–Tompkins algorithm to detect QRS complexes in ECG recordings from the PTB-XL arrhythmia dataset, then extracted downstream features (R-R intervals, heart-rate variability) for arrhythmia analysis. Covers bandpass filtering, derivative/squaring/integration stages, and adaptive thresholding for peak detection.\n\nThis is placeholder sample content — only visible in local dev — showing how a real research entry and its full detail page will look.",
  status: "Course Research Project",
  tags: ["Biomedical Signal Processing", "ECG", "Python"],
  media: { type: "image", src: "" },
  link: "https://github.com/CipherByte001/PTBXL_Arrhythmia_Feature_Extraction_Pan_Tompkins",
};

const SAMPLE_ACHIEVEMENT = {
  id: "sample-achievement-showcase",
  title: "University Project Showcase — Best Embedded Systems Project",
  description: "Sample placeholder — only visible in local dev. Recognizes a project presented at the department's annual showcase, e.g. an IoT energy monitor with a live web dashboard.",
  date: "2023",
  thumbnail: "",
  images: [],
};


// ===== Portfolio Site (Mobile-Optimized) =====
// - Sticky Nav with mobile hamburger
// - Hero
// - Projects (cards + modal) with pagination & lazy loading
// - About, Skills, Academics, Blog, Timeline
// - CTA, Contact, Footer
// - All helpers in this file (no external imports)

// -------
// ENV HELPERS (robust base URL)
export function getBaseUrl() {
  let base = "/";
  try {
    if (import.meta && import.meta.env && typeof import.meta.env.BASE_URL === "string" && import.meta.env.BASE_URL) {
      base = import.meta.env.BASE_URL;
    }
  } catch (_) {}
  if ((base === "/" || !base) && typeof process !== "undefined" && process.env && typeof process.env.PUBLIC_URL === "string" && process.env.PUBLIC_URL) {
    base = process.env.PUBLIC_URL.endsWith("/") ? process.env.PUBLIC_URL : process.env.PUBLIC_URL + "/";
  }
  if (!base.endsWith("/")) base += "/";
  return base;
}

function GlobalStyles() {
  return (
    <style>{`
      @keyframes caret-blink { 0%, 49% {opacity:1} 50%, 100% {opacity:0} }
      @keyframes shimmer { 0% {background-position: 0% 50%} 100% {background-position: 200% 50%} }
      @keyframes ripple { to { transform: scale(2.6); opacity: 0; } }
      @keyframes caret-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
      @keyframes shimmer { 0% {background-position: 0% 50%} 100% {background-position: 200% 50%} }
      @keyframes floatY   { 0% {transform: translateY(0)} 100% {transform: translateY(-16px)} }
       @keyframes ringSpin { to { transform: rotate(360deg); } }
      .fancy-link { position: relative; }
      .fancy-link::after{
        content:""; position:absolute; left:0; bottom:-2px; height:2px; width:100%;
        background: linear-gradient(90deg,#fb7185,#a78bfa,#38bdf8);
        transform: scaleX(0); transform-origin: left; transition: transform .35s ease;
      }
      .fancy-link:hover::after{ transform: scaleX(1); }
      .btn-ripple{ position:relative; overflow:hidden; }
      .btn-ripple span.__r{
        position:absolute; inset:0; border-radius:9999px;
        background: radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(255,255,255,.35), transparent 60%);
        transform: translateZ(0) scale(0); opacity:.6; animation: ripple .6s ease-out forwards;
        pointer-events:none;
      }
    `}</style>
  );
}

// =====================
// Ambient 3D Parallax Background
function AmbientBackground() {
  const { scrollYProgress } = useScroll();
  
  // y1 moves down slightly as you scroll down
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  // y2 moves up slightly as you scroll down
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        style={{ y: y1 }}
        className="absolute -left-[20%] top-[10%] h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[120px]"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute -right-[20%] top-[40%] h-[600px] w-[600px] rounded-full bg-white/[0.03] blur-[120px]"
      />
    </div>
  );
}

// =====================
// Root component
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function Site() {
  return (
    <main className="min-h-screen bg-[#0b0f14] text-slate-100 antialiased selection:bg-indigo-500/30">
       <GlobalStyles />
      <ScrollProgressBar />
      <AmbientBackground/>
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cv" element={<CVPage />} />
        <Route
          path="/projects/:id"
          element={<DetailPage collectionName="projects" backLabel="Projects" backHref="/#projects" />}
        />
        <Route
          path="/research/:id"
          element={<DetailPage collectionName="research" backLabel="Research" backHref="/#research" />}
        />
      </Routes>
      <Footer />
    </main>
  );
}

// Scrolls to the in-page section named by the URL hash after a route change
// (needed because SPA navigation doesn't trigger the browser's native anchor scroll).
function HomePage() {
  const location = useLocation();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // If this is the initial load or a browser reload, guarantee we land at the hero top
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      return;
    }

    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) {
      const t = setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      return () => clearTimeout(t);
    }
  }, [location]);

  return (
    <>
      <Hero />
      <Research />
      <Projects />
      <About />
      <Skills />
      <Academics />
      <Achievements />
      <Recommendations />
      <CTA />
      <Contact />
    </>
  );
}

// Placeholder page for the downloadable/embeddable CV — drop cv.pdf into /public
// and swap the placeholder block below for an <iframe> or a direct download link.
function CVPage() {
  const base = getBaseUrl();
  const { data: resume } = useCMS(fetchResume, null, 'resume');
  const pdfUrl = resume?.url || `${base}cv.pdf`;
  return (
    <Section id="cv-page" animation="none" className="!py-4 sm:!py-6">
      <div className="mx-auto w-full max-w-5xl lg:max-w-6xl pt-2 sm:pt-4">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <Link to="/#top" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 transition hover:text-white mb-2">
              <span>&larr;</span> Back to home
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Curriculum Vitae
              <span className="hidden sm:inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-mono text-indigo-300">
                PDF
              </span>
            </h1>
            {resume?.note ? (
              <p className="mt-1 text-xs font-mono text-indigo-400">{resume.note}</p>
            ) : (
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Full curriculum vitae with research publications, project experience, and credentials.
              </p>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              download="Eitmam_Omar_Sanam_CV.pdf"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 hover:shadow-indigo-600/50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>

        {/* Wide Full-Scale Embedded PDF Viewer */}
        <div className="mt-5 w-full rounded-2xl border border-white/10 bg-[#0f141d] overflow-hidden shadow-2xl ring-1 ring-white/5">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-[85vh] sm:h-[88vh] rounded-2xl border-0"
            title="Eitmam Omar Sanam CV"
          />
        </div>
      </div>
    </Section>
  );
}

// =====================
// Layout helpers (Upgraded for Zero-Lag Performance)
function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

function Section({ id, children, className = "", animation = "slideUp" }) {
  const premiumEase = [0.22, 1, 0.36, 1];
  
  // OPTIMIZATION 1: Slightly faster duration and shorter travel distance (40px)
  // This drastically reduces the calculation load on the browser's GPU
  const speed = 0.85; 
  const distance = 40; 

  const animations = {
    slideUp: {
      initial: { opacity: 0, y: distance, scale: 0.98 },
      whileInView: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: speed, ease: premiumEase }
    },
    slideRight: { 
      initial: { opacity: 0, x: -distance },
      whileInView: { opacity: 1, x: 0 },
      transition: { duration: speed, ease: premiumEase }
    },
    slideLeft: { 
      initial: { opacity: 0, x: distance },
      whileInView: { opacity: 1, x: 0 },
      transition: { duration: speed, ease: premiumEase }
    },
    zoomIn: {
      initial: { opacity: 0, scale: 0.9 },
      whileInView: { opacity: 1, scale: 1 },
      transition: { duration: speed, ease: premiumEase }
    },
    flipUp: {
      initial: { opacity: 0, rotateX: -10, y: 36 },
      whileInView: { opacity: 1, rotateX: 0, y: 0 },
      transition: { duration: speed + 0.1, ease: premiumEase }
    },
    none: {
      initial: { opacity: 1, y: 0, scale: 1 },
      whileInView: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0 }
    }
  };

  const activeAnim = animations[animation] || animations.slideUp;

  return (
    <motion.section
      id={id}
      initial={activeAnim.initial}
      whileInView={activeAnim.whileInView}
      
      // OPTIMIZATION 2: Trigger almost immediately when it enters the screen (-50px instead of -15%)
      viewport={{ once: true, margin: "-50px" }}
      transition={activeAnim.transition}
      style={{ perspective: 1000 }}

      // OPTIMIZATION 3: Removed "will-change-transform".
      // Keeping that on permanently consumes too much memory. Framer Motion applies it dynamically now.
      className={`relative z-10 py-16 sm:py-20 md:py-28 ${className}`}
    >
      <Container>{children}</Container>
    </motion.section>
  );
}

// =====================
// Terminal Scroll Tracker (Idea 2)
// =====================
// Original Scroll Progress Bar
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[100] h-1 origin-left bg-indigo-500"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

function MagnetButton({ children, className = "", href = "#", to, onClick }) {
  const commonClasses = `inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 sm:px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 hover:shadow-indigo-600/50 ${className}`;
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={commonClasses}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href || undefined}
      onClick={onClick}
      className={commonClasses}
    >
      {children}
    </a>
  );
}

function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = -((y - rect.height / 2) / rect.height) * 10;
    const ry = ((x - rect.width / 2) / rect.width) * 10;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    el.style.boxShadow = `${-ry * 1.5}px ${rx * 1.5}px 30px rgba(244,63,94,0.2)`;
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `rotateX(0) rotateY(0)`;
    el.style.boxShadow = `0 0 0 rgba(0,0,0,0)`;
  }
  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave} className={`group relative rounded-2xl bg-[#0f141d] p-5 sm:p-6 ring-1 ring-white/5 transition-transform duration-300 ${className}`}>
      <div ref={ref} className="will-change-transform">{children}</div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/10 to-sky-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

function Spotlight({ className = "" }) {
  return <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_var(--x,50%)_var(--y,30%),rgba(56,189,248,0.12),transparent)] ${className}`} />;
}

// Lazy mount wrapper for heavy content (thumbs, etc.)
// >>> Disabled lazy-loading: render immediately
function InView({ children }) {
  return <>{children}</>;
}

// =====================
// Nav (desktop + mobile)
// =====================
// Nav (Upgraded with Scroll Spy Active States)
function Nav() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();

  const items = [
    { href: "#research", label: "Research" },
    { href: "#projects", label: "Projects" },
    { href: "#skills", label: "Skills" },
    { href: "#academics", label: "Academics" },
    { href: "#achievements", label: "Achievements" },
  ];

  const scrollTo = (href) => {
    if (window.location.pathname === "/" || window.location.pathname === "") {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", window.location.pathname);
      }
    } else {
      navigate(`/${href}`);
    }
  };

  // Scroll Spy Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" } // Triggers when a section hits the middle of the screen
    );

    items.forEach((item) => {
      const el = document.querySelector(item.href);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            if (window.location.pathname === "/" || window.location.pathname === "") {
              window.scrollTo({ top: 0, behavior: "smooth" });
              window.history.replaceState(null, "", window.location.pathname);
            } else {
              navigate("/");
            }
          }}
          className="flex items-center gap-2 font-semibold"
        >
          <Logo className="h-6 w-6 text-white" />
          <span className="tracking-tight">Eitmam Omar Sanam</span>
        </a>

       {/* Desktop nav */}
        <nav className="hidden gap-8 md:flex relative">
          {items.map((it) => {
            const isActive = activeSection === it.href;
            return (
              <a
                key={it.label}
                href={it.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(it.href);
                }}
                className={`text-sm transition-all duration-300 relative cursor-pointer ${isActive ? "text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                {it.label}
              </a>
            );
          })}
        </nav>

        {/* Actions (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#contact");
            }}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white cursor-pointer"
          >
            Contact
          </a>
          {/* The Glowing About Me Button is back! */}
          <MagnetButton
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#about");
            }}
          >
            About Me
          </MagnetButton>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-200 md:hidden">
          <span className="text-xl leading-none">≡</span>
        </button>
      </Container>
      
      {/* Mobile menu panel remains the same... */}
    </header>
  );
}
// =====================
function Typewriter({
  words = [],
  typeSpeed = 80,
  deleteSpeed = 45,
  pauseAfterType = 900,
  className = "",
}) {
  const [i, setI] = useState(0);
  const [txt, setTxt] = useState("");
  const [phase, setPhase] = useState("typing"); // typing | pausing | deleting

  useEffect(() => {
    if (!words.length) return;
    const w = words[i % words.length];

    if (phase === "typing") {
      if (txt.length < w.length) {
        const t = setTimeout(() => setTxt(w.slice(0, txt.length + 1)), typeSpeed);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("pausing"), pauseAfterType);
      return () => clearTimeout(t);
    }

    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), 450);
      return () => clearTimeout(t);
    }

    if (phase === "deleting") {
      if (txt.length > 0) {
        const t = setTimeout(() => setTxt(w.slice(0, txt.length - 1)), deleteSpeed);
        return () => clearTimeout(t);
      }
      setI((v) => (v + 1) % words.length);
      setPhase("typing");
    }
  }, [txt, phase, i, words, typeSpeed, deleteSpeed, pauseAfterType]);

  return (
  <span className={`inline break-words [word-break:break-word] ${className}`}>
    <span className="text-white">
      {txt}
    </span>
    <span
      aria-hidden="true"
      className="ml-[2px] inline-block h-[1em] w-[2px] align-[-0.1em] bg-indigo-400"
      style={{ animation: "caret-blink 1s step-end infinite" }}
    />
  </span>
);

}
function HeroParticles() {
  // simple static particle set; animate with CSS and a bit of random delay
  const dots = Array.from({ length: 18 }).map((_, i) => ({
    left: Math.random() * 70 + "%",       // keep mostly in left column
    top: Math.random() * 70 + "%",        // avoid edges
    size: Math.random() * 6 + 4,          // 4–10px
    delay: Math.random() * 2000,          // ms
    duration: 4000 + Math.random() * 3500 // ms up/down
  }));

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ maskImage: "radial-gradient(60% 60% at 30% 40%, #000 60%, transparent)" }}
    >
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-sky-400/20"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            filter: "blur(0.5px)",
            animation: `floatY ${d.duration}ms ease-in-out ${d.delay}ms infinite alternate`
          }}
        />
      ))}
    </div>
  );
}

//dot network
function ParticleNetwork({
  className = "",
  colorStart = "rgba(129,140,248,0.9)", // indigo-400
  colorEnd   = "rgba(79,70,229,0.9)", // indigo-600
}) {
  const ref = React.useRef(null);
  const pointer = React.useRef({ x: -9999, y: -9999, active: false });
  const stopRef = React.useRef(false);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function fit() {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    // fewer, slower particles
    const particles = [];
    const rect = canvas.getBoundingClientRect();
    const count = 45; // calm number of dots
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.1; // very slow
      particles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random() * 1.5,
      });
    }

    // gradient
    function makeGradient() {
      const r = canvas.getBoundingClientRect();
      const g = ctx.createLinearGradient(0, 0, r.width, 0);
      g.addColorStop(0, colorStart);
      g.addColorStop(1, colorEnd);
      return g;
    }
    let grad = makeGradient();

    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      pointer.current.x = e.clientX - r.left;
      pointer.current.y = e.clientY - r.top;
      pointer.current.active = true;
    }
    function onLeave() {
      pointer.current.active = false;
    }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(canvas);

    stopRef.current = false;
    function loop() {
      if (stopRef.current) return;
      if (!isVisible) {
        requestAnimationFrame(loop);
        return;
      }
      const r = canvas.getBoundingClientRect();
      if (canvas.width / dpr !== Math.floor(r.width) || canvas.height / dpr !== Math.floor(r.height)) {
        fit(); grad = makeGradient();
      }

      ctx.clearRect(0, 0, r.width, r.height);

      // move
      for (const p of particles) {
        if (pointer.current.active) {
          const dx = pointer.current.x - p.x;
          const dy = pointer.current.y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 200 * 200) {
            p.vx += dx * 0.00002;
            p.vy += dy * 0.00002;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = r.width;
        if (p.x > r.width) p.x = 0;
        if (p.y < 0) p.y = r.height;
        if (p.y > r.height) p.y = 0;
      }

      // draw
      ctx.fillStyle = grad;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // links
      ctx.strokeStyle = grad;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.globalAlpha = 1 - d / 120;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    return () => {
      stopRef.current = true;
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
      observer.disconnect();
    };
  }, [colorStart, colorEnd]);

  return (
    <canvas
      ref={ref}
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden
    />
  );
}

//nural network
function NeuralNetworkVisualizer({
  className = "",
  layers = [3, 6, 5, 3],     // nodes per layer
  nodeRadius = 3.2,
  edgeColorA = "rgba(129,140,248,0.9)",   // indigo-400
  edgeColorB = "rgba(79,70,229,0.9)",  // indigo-600
  nodeColor = "rgba(255,255,255,0.9)",
  backgroundFade = 1,        // 1 = hard clear; 0.03..0.08 = faint trails
  pulseRate = 6,             // pulses per second
  baseSpeed = 0.18,          // pulse speed (lower = calmer)
  linkDistanceBoost = 0,     // leave 0 (edge alpha falloff is handled per-edge)
}) {
  const canvasRef = useRef(null);
  const stopRef = useRef(false);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    // DPR & sizing
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function fit() {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    // pause when not visible
    let isVisible = true;
    const io = new IntersectionObserver(
      ([en]) => (isVisible = en.isIntersecting),
      { threshold: 0.1 }
    );
    io.observe(canvas);

    // reduced motion
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // pointer
    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      pointer.current.x = e.clientX - r.left;
      pointer.current.y = e.clientY - r.top;
      pointer.current.active = true;
    }
    function onLeave() {
      pointer.current.active = false;
      pointer.current.x = -9999; pointer.current.y = -9999;
    }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // build network
    function layoutNodes(w, h) {
      const L = layers.length;
      const left = 48, right = w - 48;
      const top = 36, bot = h - 36;
      const xs = Array.from({ length: L }, (_, i) => L === 1 ? (left + right) / 2 : left + (right - left) * (i / (L - 1)));
      const nodes = [];
      for (let li = 0; li < L; li++) {
        const count = Math.max(1, layers[li]);
        for (let n = 0; n < count; n++) {
          const y = count === 1 ? (top + bot) / 2 : top + (bot - top) * (n / (count - 1));
          nodes.push({ x: xs[li], y, li, idx: n });
        }
      }
      // edges fully connect adjacent layers
      const edges = [];
      let idxOffset = 0;
      for (let li = 0; li < L - 1; li++) {
        const aCount = layers[li], bCount = layers[li + 1];
        for (let a = 0; a < aCount; a++) {
          for (let b = 0; b < bCount; b++) {
            const A = nodes[idxOffset + a];
            const B = nodes[idxOffset + aCount + b];
            edges.push({ A, B, len: Math.hypot(B.x - A.x, B.y - A.y) });
          }
        }
        idxOffset += aCount;
      }
      return { nodes, edges };
    }

    // pulses
    const pulses = []; // {A,B,t,speed}
    function spawnPulse(edgesNow) {
      if (!edgesNow.length) return;
      const e = edgesNow[Math.floor(Math.random() * edgesNow.length)];
      const speed = (baseSpeed + Math.random() * 0.12) * (prefersReduced ? 0.5 : 1);
      pulses.push({ A: e.A, B: e.B, t: 0, speed });
    }

    // gradient for edges/points
    function makeGradient(w) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, edgeColorA);
      g.addColorStop(1, edgeColorB);
      return g;
    }

    stopRef.current = false;
    let last = performance.now();
    let spawnAcc = 0;

    function loop(now) {
      if (stopRef.current) return;
      const dt = Math.min(48, now - last); // clamp delta
      last = now;

      const r = canvas.getBoundingClientRect();
      if (canvas.width / dpr !== Math.floor(r.width) || canvas.height / dpr !== Math.floor(r.height)) {
        fit();
      }

      // layout each frame (cheap, sizes rarely change; OK for small nets)
      const { nodes, edges } = layoutNodes(r.width, r.height);
      const grad = makeGradient(r.width);

      // clear/fade
      if (backgroundFade >= 1) ctx.clearRect(0, 0, r.width, r.height);
      else {
        ctx.fillStyle = `rgba(0,0,0,${backgroundFade})`;
        ctx.fillRect(0, 0, r.width, r.height);
      }

      // draw edges (alpha falloff based on proximity to pointer)
      ctx.lineWidth = 1;
      ctx.strokeStyle = grad;
      for (const e of edges) {
        let alpha = 0.35;
        if (pointer.current.active) {
          // distance of pointer to segment AB
          const { x: x0, y: y0 } = pointer.current;
          const { x: x1, y: y1 } = e.A, { x: x2, y: y2 } = e.B;
          const dx = x2 - x1, dy = y2 - y1;
          const l2 = dx * dx + dy * dy || 1;
          let t = ((x0 - x1) * dx + (y0 - y1) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          const px = x1 + t * dx, py = y1 + t * dy;
          const d = Math.hypot(px - x0, py - y0);
          alpha = Math.max(0.08, Math.min(0.9, (120 - d) / 120 + linkDistanceBoost));
        }
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(e.A.x, e.A.y);
        ctx.lineTo(e.B.x, e.B.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // spawn pulses
      if (isVisible && !prefersReduced) {
        spawnAcc += (dt / 1000) * pulseRate;
        while (spawnAcc >= 1) {
          spawnPulse(edges);
          spawnAcc -= 1;
        }
      }

      // draw pulses & advance
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += (dt / 1000) * p.speed; // 0..1
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const x = p.A.x + (p.B.x - p.A.x) * p.t;
        const y = p.A.y + (p.B.y - p.A.y) * p.t;
        ctx.fillStyle = grad;
        ctx.shadowBlur = 6;
        ctx.shadowColor = edgeColorB;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // draw nodes on top
      ctx.fillStyle = nodeColor;
      for (const n of nodes) {
        let rNode = nodeRadius;
        if (pointer.current.active) {
          const d = Math.hypot(n.x - pointer.current.x, n.y - pointer.current.y);
          if (d < 90) rNode += (90 - d) * 0.02; // subtle grow near pointer
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, rNode, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      stopRef.current = true;
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [layers, nodeRadius, edgeColorA, edgeColorB, nodeColor, backgroundFade, pulseRate, baseSpeed, linkDistanceBoost]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden
    />
  );
}


// Hero
function Hero() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (e) => {
      el.style.setProperty("--x", `${e.clientX}px`);
      el.style.setProperty("--y", `${e.clientY}px`);
    };
    window.addEventListener("mousemove", set);
    return () => window.removeEventListener("mousemove", set);
  }, []);

  return (
    <section id="top" className="relative">
      {/* 🚀 THE FIX: A CSS Alpha Mask that softly fades the effects out at the bottom */}
      <div 
        className="pointer-events-none absolute inset-0 z-0"
        style={{ 
          maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)"
        }}
      >
        {/* 🌈 Mobile fallback */}
        <div className="absolute inset-0 md:hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/15 via-indigo-500/5 to-transparent blur-2xl animate-pulse-slow" />
          <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        </div>

        {/* 🖥️ Desktop background: particle network */}
        <div className="absolute inset-0 hidden md:block">
          <div className="absolute inset-y-0 left-0 w-1/2">
            <ParticleNetwork
              maxParticlesPerKpx={0.04}
              linkDist={120}
              hoverBoost={90}
              bgFade={0.08}
            />
          </div>
        </div>

        {/* Existing spotlight glow */}
        <div ref={ref} className="absolute inset-0">
          <Spotlight />
        </div>
      </div>

      {/* Foreground content */}
      <Container className="relative z-10 grid grid-cols-1 items-center gap-10 py-14 sm:py-20 md:grid-cols-2 md:py-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-slate-400">Electrical & Electronic Engineering Student</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {["Generative AI for Medicine", "Wearable Sensing", "Biomedical Signal Processing"].map((tag) => (
              <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                {tag}
              </span>
            ))}
          </div>

          <motion.h1
            className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typewriter
              words={[
                "Electronics • AI • Embedded Systems",
                "Deep Learning • Signal Processing",
                "STM32 • IoT • Machine Learning"
              ]}
              typeSpeed={70}
              deleteSpeed={40}
              pauseAfterType={1200}
            />
          </motion.h1>

          <p className="mt-4 sm:mt-5 max-w-xl text-slate-300 text-sm sm:text-base leading-relaxed">
            Trustworthy generative AI for medicine and lightweight AI for wearables. Expertise spans biomedical signal acquisition, embedded firmware, and on-device inference, from analog front-end design to models running on a microcontroller.
          </p>

          <div className="mt-6 flex flex-wrap gap-6 sm:gap-10">
            {[
              ["7+", "Projects"],
              ["6+", "Repositories"],
              ["EEE", "RUET"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
            <MagnetButton to="/cv">Online CV</MagnetButton>
            <a
              href="#research"
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Research & Publications
            </a>
            <a
              href="#projects"
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              See Projects
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <ParallaxCard />
        </motion.div>
        {/* Scroll Indicator (Idea 3) */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-slate-500"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">Scroll</span>
          <motion.div 
            animate={{ y: [0, 8, 0] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="h-6 w-4 rounded-full border border-slate-500 flex justify-center p-1"
          >
            <div className="h-1 w-1 rounded-full bg-slate-500" />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}



function ParallaxCard() {
  const { scrollYProgress } = useScroll();
  const t1 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const t2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y1 = useSpring(t1, { stiffness: 120, damping: 20, mass: 0.3 });
  const y2 = useSpring(t2, { stiffness: 120, damping: 25, mass: 0.3 });

  const base = getBaseUrl();

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#0f141d] ring-1 ring-white/5 shadow-xl">
      {/* Glowing blobs (parallax) */}
      <motion.div
        style={{ y: y1 }}
        className="pointer-events-none absolute -left-8 -top-8 h-40 sm:h-48 w-40 sm:w-48 rounded-full bg-indigo-500/20 blur-2xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="pointer-events-none absolute -right-8 -bottom-8 h-40 sm:h-48 w-40 sm:w-48 rounded-full bg-indigo-500/10 blur-2xl"
      />

       {/* Local hero video (improved) */}
      <video
        src={`${base}vid3.mp4`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={`${base}vid3-poster.jpg`}   // <-- add a jpg/png poster image in your public folder
        className="h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-black/20" />
    </div>
  );
}

function Projects() {
  const base = getBaseUrl();
  const [activeTags, setActiveTags] = useState([]);

  // Fetch from CMS; falls back to static data when CMS is not configured.
  const { data: cmsProjects } = useCMS(fetchProjects, PROJECTS_DATA, 'projects');
  const displayProjects = useMemo(
    () => (import.meta.env.DEV ? [...cmsProjects, SAMPLE_PROJECT] : cmsProjects),
    [cmsProjects]
  );

  const allTags = useMemo(() => Array.from(new Set(displayProjects.flatMap(p => p.tags || []))).sort(), [displayProjects]);

  const filtered = useMemo(() => {
    if (!activeTags.length) return displayProjects;
    return displayProjects.filter(p => activeTags.every(t => (p.tags || []).includes(t)));
  }, [displayProjects, activeTags]);

  function toggleTag(tag) {
    setActiveTags((cur) => cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]);
  }

  return (
    <Section id="projects" animation="slideLeft">
      
      <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">Projects</h2>

      {/* Filters */}
      <div className="mx-auto mt-5 sm:mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <button onClick={() => setActiveTags([])} className={`${activeTags.length ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-indigo-500/40 bg-indigo-500/10 text-white"} rounded-full border px-3 py-1.5 text-xs transition`}>All</button>
        {allTags.map((t) => (
          <button key={t} onClick={() => toggleTag(t)} className={`${activeTags.includes(t) ? "border-indigo-500/40 bg-indigo-500/10 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"} rounded-full border px-3 py-1.5 text-xs transition`}>{t}</button>
        ))}
      </div>

      {/* Grid (Optimized Staggered Cascade) */}
      <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const rawCover = p.media?.type === "image" ? p.media?.src : p.media?.thumb;
          const coverImage = rawCover ? (rawCover.startsWith("http") || rawCover.startsWith("/") ? rawCover : `${base}${rawCover}`) : null;
          const visibleTags = (p.tags || []).slice(0, 2);
          const extra = (p.tags || []).length - visibleTags.length;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className="group relative cursor-pointer pt-6 select-none will-change-transform"
            >
              {/* Folder tab */}
              <div className="absolute top-0 left-0 h-7 w-32 rounded-t-2xl border-t border-x border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-md transition-colors duration-500 group-hover:border-indigo-500/40" />

              {/* Repo link — a sibling overlay, not nested inside the card's own Link */}
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${p.title} on GitHub`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-3 top-9 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-slate-300 backdrop-blur transition-colors hover:bg-indigo-500 hover:text-white"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                </a>
              )}

              <Link
                to={`/projects/${p.id}`}
                className="relative block overflow-hidden rounded-3xl rounded-tl-none border border-white/10 bg-gradient-to-b from-white/[0.05] to-black/80 backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:border-indigo-500/30 group-hover:shadow-indigo-500/10"
              >
                <div className="aspect-[16/10] w-full overflow-hidden border-b border-white/5 bg-black/40 p-2 sm:p-3">
                  <div className="h-full w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0b0f14]">
                    <InView>
                      {coverImage ? (
                        <img src={coverImage} alt={`${p.title} thumbnail`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                      ) : p.media?.type === "video" || p.media?.type === "youtube" ? (
                        <VideoPlaceholder />
                      ) : (
                        <ImagePlaceholder />
                      )}
                    </InView>
                  </div>
                </div>

                <div className="p-5 sm:p-6 relative z-10">
                  <h3 className="text-base sm:text-lg font-bold text-white transition-colors group-hover:text-indigo-400">{p.title}</h3>
                  <p className="mt-2 text-sm text-slate-400" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.excerpt || p.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleTags.map((t) => (
                      <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">{t}</span>
                    ))}
                    {extra > 0 && (
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">+{extra}</span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    <span>Open project</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}


// =====================
// Research & Publications — same folder-card language as Achievements,
// but each card opens its own full page instead of a modal.
function Research() {
  // Fetch from CMS; falls back to static data when CMS is not configured.
  const { data: cmsResearch } = useCMS(fetchResearch, RESEARCH_DATA, 'research');
  const displayItems = import.meta.env.DEV ? [...cmsResearch, SAMPLE_RESEARCH] : cmsResearch;

  return (
    <Section id="research" animation="zoomIn">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Research & Publications</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mx-auto max-w-6xl">
        {displayItems.map((paper) => {
          const coverImage = paper.thumbnail || (paper.images && paper.images[0]);
          return (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className="group relative cursor-pointer pt-6 select-none will-change-transform"
            >
              <div className="absolute top-0 left-0 h-7 w-32 rounded-t-2xl border-t border-x border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-md transition-colors duration-500 group-hover:border-indigo-500/40" />

              <Link
                to={`/research/${paper.id}`}
                className="relative block overflow-hidden rounded-3xl rounded-tl-none border border-white/10 bg-gradient-to-b from-white/[0.05] to-black/80 backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:border-indigo-500/30 group-hover:shadow-indigo-500/10"
              >
                {coverImage ? (
                  <div className="aspect-[16/10] w-full overflow-hidden border-b border-white/5 bg-black/40 p-2 sm:p-3">
                    <div className="h-full w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0b0f14]">
                      <img src={coverImage} alt={paper.title} loading="lazy" decoding="async" className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[16/10] w-full p-2 sm:p-3">
                    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02]">
                      <svg className="h-10 w-10 text-slate-600 transition-transform duration-500 group-hover:scale-110 group-hover:text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="p-5 sm:p-6 relative z-10">
                  {(paper.status || paper.date) && (
                    <span className="inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-indigo-300">
                      {paper.status || paper.date}
                    </span>
                  )}
                  <h3 className="mt-2 text-base sm:text-lg font-bold text-white transition-colors group-hover:text-indigo-400">{paper.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-400 line-clamp-2">{paper.excerpt || paper.description}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                    <span>Read more</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {displayItems.length === 0 && (
          <div className="col-span-full text-center text-slate-500 text-sm py-10 font-mono">
            {`[research_records: none_published_yet_]`}
          </div>
        )}
      </div>
    </Section>
  );
}

// =====================
// Shared full-page detail view for a single project or research record.
// Replaces the old modal — gives every item its own shareable URL.
function DetailPage({ collectionName, backLabel, backHref }) {
  const { id } = useParams();
  const base = getBaseUrl();

  const { data: allProjects } = useCMS(fetchProjects, PROJECTS_DATA, 'projects');
  const { data: allResearch } = useCMS(fetchResearch, RESEARCH_DATA, 'research');
  const item = useMemo(() => {
    const realData = collectionName === "projects" ? allProjects : collectionName === "research" ? allResearch : [];
    const found = realData.find((r) => r.id === id);
    if (found) return found;
    // DEV-ONLY: fall back to the sample record so the detail page can be
    // previewed alongside the real ones. Stripped out of the production build.
    if (import.meta.env.DEV) {
      const sample = collectionName === "projects" ? SAMPLE_PROJECT : collectionName === "research" ? SAMPLE_RESEARCH : null;
      if (sample && sample.id === id) return sample;
    }
    return null;
  }, [collectionName, id, allProjects, allResearch]);

  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!item || !v) return;
    if (item.media?.type === "video") {
      const p = v.play();
      if (p && typeof p.then === "function") p.catch(() => {});
    }
  }, [item]);

  return (
    <Section id="detail-page" animation="none" className="!py-6 sm:!py-8">
      <div className="mx-auto max-w-4xl pt-2 sm:pt-4">
        <Link to={backHref} className="text-sm text-slate-400 transition hover:text-white">&larr; Back to {backLabel}</Link>

        {!item && (
          <div className="mt-10">
            <h1 className="text-2xl font-bold text-white">Not found</h1>
            <p className="mt-2 text-sm text-slate-400">This record doesn't exist, or hasn't been published yet.</p>
          </div>
        )}

        {item && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              {item.media?.type === "youtube" ? (
                <iframe
                  src={`https://www.youtube.com/embed/${item.media.id}?rel=0&modestbranding=1&playsinline=1`}
                  title={item.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : item.media?.type === "video" ? (
                <video
                  ref={videoRef}
                  src={item.media.src ? (item.media.src.startsWith("http") ? item.media.src : `${base}${item.media.src}`) : ""}
                  poster={item.media.thumb ? (item.media.thumb.startsWith("http") ? item.media.thumb : `${base}${item.media.thumb}`) : undefined}
                  controls
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : item.media?.type === "image" && item.media?.src ? (
                <img src={item.media.src.startsWith("http") ? item.media.src : `${base}${item.media.src}`} alt={item.title} className="h-full w-full object-contain" />
              ) : (
                <ImagePlaceholder />
              )}
            </div>

            <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-white">{item.title}</h1>
            {(item.date || item.status) && (
              <span className="inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest text-indigo-300">
                {item.status || item.date}
              </span>
            )}
            <p className="mt-4 text-sm sm:text-base text-slate-300 whitespace-pre-wrap">{item.desc || item.description}</p>

            {Array.isArray(item.components) && item.components.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Main Components</div>
                <div className="flex flex-wrap gap-2">
                  {item.components.map((c) => (
                    <span key={c} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-200">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">#{t}</span>
                ))}
              </div>
            )}

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
              >
                View full record
              </a>
            )}
          </motion.div>
        )}
      </div>
    </Section>
  );
}

function ImagePlaceholder() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(79,70,229,0.2),rgba(30,27,75,0.3))]" />
      <div className="absolute inset-0 grid place-items-center text-xs text-white/70">Add your image</div>
    </div>
  );
}

function VideoPlaceholder() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(30,27,75,0.3),rgba(79,70,229,0.2))]" />
      <div className="absolute inset-0 grid place-items-center text-xs text-white/70">Add your video</div>
    </div>
  );
}

// =====================
// About (after Projects)
function About() {
  const base = getBaseUrl();
  const { data: cmsAbout } = useCMS(fetchAbout, null, 'about');

  // Merge CMS data over the hardcoded defaults (CMS wins when set)
  const photoSrc = cmsAbout?.photo || `${base}sanam.jpg`;
  const bioParagraphs = cmsAbout?.bio?.length
    ? cmsAbout.bio
    : [
        "I am an undergraduate Electrical and Electronic Engineering student specializing in the intersection of artificial intelligence and embedded hardware. My primary focus is developing efficient, real-time machine learning solutions, particularly for biomedical and healthcare applications.",
        "My technical expertise bridges high-level AI architectures with practical, real-world systems. I work extensively with Deep Learning, Explainable AI (XAI), and Large Language Models (LLMs), applying these technologies to extract critical insights from multimodal data like continuous ECG and PPG signals.",
        "Beyond theoretical modeling, my core strength lies in Edge Machine Learning. I specialize in deploying custom, hardware-aware architectures\u2014such as State Space Models (SSMs)\u2014directly onto edge devices. By focusing on bare-metal firmware optimization, register-level configurations, and DMA on microcontrollers like the STM32, I ensure complex AI achieves optimal performance with ultra-low energy overhead.",
      ];
  const researchInterests = cmsAbout?.researchInterests?.length
    ? cmsAbout.researchInterests
    : ["Embedded Machine Learning", "Biomedical Signal Processing", "Edge AI / TinyML", "Explainable AI (XAI)"];
  const coreFocus = cmsAbout?.coreFocus || "Edge AI \u2022 Biomedical ML \u2022 Firmware";
  const currentlyExploring = cmsAbout?.currentlyExploring || "Explainable AI (XAI) & LLMs";

  return (
    <Section id="about" animation="slideRight">
      <div className="grid grid-cols-1 items-center gap-8 md:gap-10 md:grid-cols-2">
        {/* Photo */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="flex justify-center">
          <div className="relative h-44 w-44 sm:h-56 sm:w-56 md:h-64 md:w-64 overflow-hidden rounded-full ring-4 ring-indigo-500/30 shadow-xl shadow-indigo-500/20">
            <img
              src={photoSrc}
              alt="Eitmam Omar Sanam"
              className="h-full w-full object-cover"
              loading="lazy" decoding="async"
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-center md:text-left">
          <p className="text-sm font-semibold tracking-wider text-slate-400">About Me</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">Hello, I'm Sanam</h2>
          
          <div className="mt-4 space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed text-left">
            <p>
              I am an undergraduate Electrical and Electronic Engineering student specializing in the intersection of artificial intelligence and embedded hardware. My primary focus is developing efficient, real-time machine learning solutions, particularly for biomedical and healthcare applications.
            </p>
            <p>
              My technical expertise bridges high-level AI architectures with practical, real-world systems. I work extensively with Deep Learning, Explainable AI (XAI), and Large Language Models (LLMs), applying these technologies to extract critical insights from multimodal data like continuous ECG and PPG signals.
            </p>
            <p>
              Beyond theoretical modeling, my core strength lies in Edge Machine Learning. I specialize in deploying custom, hardware-aware architectures—such as State Space Models (SSMs)—directly onto edge devices. By focusing on bare-metal firmware optimization, register-level configurations, and DMA on microcontrollers like the STM32, I ensure complex AI achieves optimal performance with ultra-low energy overhead.
            </p>
          </div>

          <div className="mt-6 text-left">
            <div className="text-xs uppercase tracking-wide text-slate-400">Research Interests</div>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {researchInterests.map((interest) => (
                <li key={interest} className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  {interest}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-left">
            <div className="rounded-2xl border border-white/10 bg-[#0f141d] p-4 transition-colors hover:border-indigo-500/30">
              <div className="text-xs uppercase tracking-wide text-slate-400">Core Focus</div>
              <div className="mt-1 text-sm font-medium text-slate-200">Edge AI • Biomedical ML • Firmware</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f141d] p-4 transition-colors hover:border-indigo-500/30">
              <div className="text-xs uppercase tracking-wide text-slate-400">Currently Exploring</div>
              <div className="mt-1 text-sm font-medium text-slate-300">{currentlyExploring}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <a href="#contact" className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Get in Touch</a>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// =====================
// Icon-Based Skills Grid (Full-Color Brand Icons)
function Skills() {
  const { data: dynamicSkills } = useCMS(fetchSkills, null, 'skills');
  // Static fallback categories
  const defaultCategories = [
    {
      name: "Languages",
      items: [
        { name: "C", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg", color: "hover:border-sky-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
        { name: "Python", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg", color: "hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.3)]" },
        { name: "MATLAB", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/matlab/matlab-original.svg", color: "hover:border-blue-600 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]" },
      ],
    },
    {
      name: "ML & Frameworks",
      items: [
        { name: "TensorFlow", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg", color: "hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]" },
        { name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg", color: "hover:border-sky-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]" },
      ],
    },
    {
      name: "Embedded & Hardware",
      items: [
        { name: "Arduino", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/arduino/arduino-original.svg", color: "hover:border-teal-500 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)]" },
        // Espressif isn't in Devicon, so we use SimpleIcons but force its official brand red hex code (E7352C)
        { name: "Espressif", icon: "https://cdn.simpleicons.org/espressif/E7352C", color: "hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]" },
      ],
    },
    {
      name: "Tools",
      items: [
        { name: "Docker", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg", color: "hover:border-sky-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]" },
      ],
    },
  ];

  // If CMS has custom skills, format them into categories
  const categories = useMemo(() => {
    if (!dynamicSkills || !dynamicSkills.length) return defaultCategories;
    const groupMap = {};
    dynamicSkills.forEach((s) => {
      if (!groupMap[s.category]) groupMap[s.category] = [];
      groupMap[s.category].push({
        name: s.name,
        icon: s.icon,
        color: "hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]",
      });
    });
    return Object.keys(groupMap).map((catName) => ({
      name: catName,
      items: groupMap[catName],
    }));
  }, [dynamicSkills]);

  return (
    <Section id="skills" animation="zoomIn">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">/* Hardware & Intelligence Stack */</h2>
      </div>

      <div className="mx-auto max-w-4xl space-y-8">
        {categories.map((cat) => (
          <div key={cat.name}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{cat.name}</div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            >
              {cat.items.map((tech) => (
                <div
                  key={tech.name}
                  className={`group relative flex flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-[#0f141d] p-6 transition-all duration-300 ${tech.color}`}
                >
                  <img
                    src={tech.icon}
                    alt={tech.name}
                    className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="text-xs font-medium tracking-wider text-slate-400 group-hover:text-white transition-colors duration-300">
                    {tech.name}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// =====================
// Academics

function Academics() {
  const base = getBaseUrl();
  const schools = [
    {
      level: "University",
      name: "Rajshahi University of Engineering and Technology",
      degree: "B.Sc. in Electrical and Electronic Engineering",
      year: "2023 - Present",
      location: "Rajshahi",
      logo: `${base}ruet.png`,
      // TODO: fill these in once available — the line only renders when set
      cgpa: "",
      thesis: "",
    },
    { 
      level: "College", 
      name: "Adamjee Cantonment College", 
      degree: "Science", // You can change this to "HSC (Science)" if you prefer
      year: "2019 - 2021",
      location: "Dhaka Cantonment, Dhaka", 
      logo: `${base}adamjee.png` 
    },
    { 
      level: "School", 
      name: "Monipur High School", 
      degree: "Science", // You can change this to "SSC (Science)" if you prefer
      year: "2008 - 2018",
      location: "Mirpur, Dhaka", 
      logo: `${base}monipur.png` 
    },
  ];

  return (
    <Section id="academics" animation="slideLeft">
      <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">Academics</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300 text-sm sm:text-base">My educational journey and institutions.</p>
      
      <div className="mx-auto mt-8 sm:mt-10 max-w-3xl">
        <ol className="relative border-l border-white/10 pl-4 sm:pl-6">
          {schools.map((s, idx) => (
            <li key={idx} className="mb-8 sm:mb-10 ml-2 sm:ml-4 flex items-start gap-4 sm:gap-6">
              {/* Timeline Dot */}
              <span className="absolute -left-3 mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-[#0f141d]" />
              
              {/* Logo Box */}
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white/10 p-1.5 shadow-lg">
                <img 
                  src={s.logo} 
                  alt={s.name} 
                  className="h-full w-full object-contain drop-shadow-sm" 
                  onError={(e) => e.target.style.display = 'none'} 
                />
              </div>

              {/* 📝 Upgraded Text Content Area */}
              <div className="mt-0.5 sm:mt-1 flex flex-col">
                {/* Monospace Year Timeline */}
                <span className="mb-1.5 text-[10px] sm:text-xs font-mono tracking-widest text-slate-500 uppercase">
                  {s.year}
                </span>
                
                <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {s.level}: {s.name}
                </h4>
                
                {/* Highlighted Degree/Major */}
                {s.degree && (
                  <p className="mt-1 text-sm font-medium text-slate-300">
                    {s.degree}
                  </p>
                )}
                
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  {s.location}
                </p>
                {s.cgpa && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-300">CGPA: {s.cgpa}</p>
                )}
                {s.thesis && (
                  <p className="mt-1 text-xs sm:text-sm italic text-slate-400">Thesis: {s.thesis}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
// =====================
// Certificates & Achievements (static data)
// =====================
// Interactive Folder-Style Achievements & Attachments
function Achievements() {
  const [activeFolder, setActiveFolder] = useState(null);

  // Fetch from CMS; falls back to static data when CMS is not configured.
  const { data: cmsAchievements } = useCMS(fetchAchievements, ACHIEVEMENTS_DATA, 'achievements');
  const displayAttachments = import.meta.env.DEV ? [...cmsAchievements, SAMPLE_ACHIEVEMENT] : cmsAchievements;

  return (
    <Section id="achievements" animation="slideRight">
      <div className="text-center mb-10 sm:mb-14">
        <p className="text-sm font-semibold tracking-wider text-slate-400">Records & Attachments</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">Certificates & Achievements</h2>
      </div>
      
{/* 🏷️ Compact credential grid — denser and lighter than the Projects/Research
    folder cards on purpose, since these are quick proof-points, not deep reads */}
      <motion.div
        className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mx-auto max-w-5xl"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.08 } }
        }}
      >
        {displayAttachments.map((folder) => {
          const coverImage = folder.thumbnail || (folder.images && folder.images[0]);

          return (
            <motion.div
              key={folder.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
              }}
              whileHover={{ y: -4 }}
              onClick={() => setActiveFolder(folder)}
              className="group relative cursor-pointer select-none rounded-2xl border border-white/10 bg-[#0f141d] p-3 transition-all duration-300 hover:border-indigo-500/30 will-change-transform"
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl border border-white/5 bg-[#0b0f14]">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={folder.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg className="h-7 w-7 text-slate-600 transition-colors duration-300 group-hover:text-indigo-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.34a1.5 1.5 0 01-1.062-.44z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="mt-2.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">{folder.date}</span>
                <h3 className="mt-0.5 text-xs sm:text-sm font-semibold leading-snug text-white transition-colors group-hover:text-indigo-400 line-clamp-2">
                  {folder.title}
                </h3>
              </div>
            </motion.div>
          );
        })}

        {displayAttachments.length === 0 && (
          <div className="col-span-full text-center text-slate-500 text-sm py-10 font-mono">
            {`[system_status: waiting_for_database_records_]`}
          </div>
        )}
      </motion.div>

      {/* Swipeable Immersive Cabinet Drawer (Modal) */}
      <FolderModal folder={activeFolder} onClose={() => setActiveFolder(null)} />
    </Section>
  );
}

// =====================
// Expanded Folder File Viewer
// =====================
// Recommendations — short testimonials from professors/supervisors/teammates.
// No real quotes exist yet, so this renders only the DEV-ONLY placeholder below;
// once you have a real one, just add it to RECOMMENDATIONS and it'll always show.
const RECOMMENDATIONS = [];

const SAMPLE_RECOMMENDATION = {
  id: "sample-recommendation",
  quote: "Placeholder — not a real quote. Once a professor, supervisor, or teammate gives you a sentence or two vouching for your work, it goes here. Tell Claude who said it and what they said, and it replaces this card.",
  name: "Add a real quote",
  role: "Sample placeholder — only visible in local dev",
};

function Recommendations() {
  const { data: cmsRecos } = useCMS(fetchRecommendations, RECOMMENDATIONS, 'recommendations');
  const displayQuotes = import.meta.env.DEV ? [...cmsRecos, SAMPLE_RECOMMENDATION] : cmsRecos;

  if (displayQuotes.length === 0) return null;

  return (
    <Section id="recommendations" animation="slideLeft">
      <div className="text-center mb-10 sm:mb-14">
        <p className="text-sm font-semibold tracking-wider text-slate-400">Recommendations</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">What people say</h2>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2">
        {displayQuotes.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-[#0f141d] p-6">
            <p className="text-sm text-slate-300 italic leading-relaxed">&ldquo;{r.quote}&rdquo;</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-300">
                {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{r.name}</div>
                <div className="text-xs text-slate-400">{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FolderModal({ folder, onClose }) {
  const [imgIndex, setImgIndex] = useState(0);

  // Safely fallback to an empty array
  const imageList = useMemo(() => {
    if (!folder) return [];
    if (Array.isArray(folder.images)) return folder.images;
    if (folder.imageUrl) return [folder.imageUrl];
    return [];
  }, [folder]);

  // Handle Body Scroll Lock & Keyboard Events
  useEffect(() => {
    if (folder) {
      setImgIndex(0); // Reset index on open
      document.body.style.overflow = "hidden"; // Lock background scroll
    }

    // Keyboard Navigation Logic
    function handleKeyDown(e) {
      if (!folder || imageList.length <= 1) return;
      if (e.key === "ArrowRight") {
        setImgIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft") {
        setImgIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    
    return () => { 
      document.body.style.overflow = "unset"; 
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [folder, imageList.length, onClose]);

  // Handle Drag/Swipe limits
  function handleDragEnd(event, info) {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && imgIndex < imageList.length - 1) {
      setImgIndex(prev => prev + 1);
    } else if (info.offset.x > swipeThreshold && imgIndex > 0) {
      setImgIndex(prev => prev - 1);
    }
  }

return createPortal(
    <AnimatePresence>
      {folder && (
        <motion.div
          key="folder-modal-backdrop" // 👈 THE MISSING PIECE! This tells React to actually delete it.
          id="modal-backdrop" 
          initial={{ opacity: 0, pointerEvents: "none" }} // 👈 Re-added pointer safeguards
          animate={{ opacity: 1, pointerEvents: "auto" }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            // Only close if they specifically clicked the black backdrop
            if (e.target.id === "modal-backdrop") onClose();
          }}
          className="fixed inset-0 z-[9999] grid place-items-center bg-black p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c1017] shadow-2xl md:flex-row will-change-transform"
          >
            {/* Left Side: Image Gallery with Buttons */}
            <div className="relative flex aspect-[16/10] w-full items-center justify-center bg-black/60 md:h-full md:w-3/5 overflow-hidden border-b border-white/5 md:border-b-0 md:border-r">
              
              {/* Left/Right Navigation Buttons */}
              {imageList.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex(prev => Math.max(0, prev - 1))}
                    disabled={imgIndex === 0}
                    className="absolute left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur hover:bg-indigo-500 hover:border-indigo-400 disabled:opacity-0 transition-all duration-300"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <button
                    onClick={() => setImgIndex(prev => Math.min(imageList.length - 1, prev + 1))}
                    disabled={imgIndex === imageList.length - 1}
                    className="absolute right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur hover:bg-indigo-500 hover:border-indigo-400 disabled:opacity-0 transition-all duration-300"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}

              {/* Swipeable Image Area */}
              {imageList.length > 0 ? (
                <motion.div
                  key={imgIndex}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 flex cursor-grab items-center justify-center active:cursor-grabbing"
                >
                  <img
                    src={imageList[imgIndex]}
                    alt={`Attachment preview ${imgIndex + 1}`}
                    className="h-full w-full object-contain pointer-events-none p-2 sm:p-4"
                  />
                </motion.div>
              ) : (
                <div className="text-xs text-slate-600 font-mono">No documentation visuals uploaded</div>
              )}

              {/* Swipe Dots indicator */}
              {imageList.length > 1 && (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                  {imageList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${idx === imgIndex ? "bg-indigo-400 w-3" : "bg-white/30"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Scrollable Metadata & Description */}
            <div className="flex h-1/3 flex-1 flex-col p-6 md:h-full justify-between overflow-y-auto bg-[#0f141d]/80 backdrop-blur-md">
              <div className="overflow-y-auto pr-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">{folder.date}</span>
                  <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-white text-sm font-mono border border-white/10 hover:bg-white/10 rounded-lg px-2.5 py-1 transition-colors"
                  >
                    ESC_
                  </button>
                </div>

                <h3 className="mt-5 text-xl font-bold text-white tracking-tight">{folder.title}</h3>
                
                <p className="mt-4 text-sm leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
                  {folder.description}
                </p>
              </div>

              {/* Footer Guide */}
              {imageList.length > 1 && (
                <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-500 border-t border-white/5 pt-4 mt-4">
                  <span className="flex gap-1">
                    <span className="border border-slate-600 rounded px-1">←</span>
                    <span className="border border-slate-600 rounded px-1">→</span>
                  </span>
                  <span>Use arrow keys or buttons to navigate</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
// =====================
// Timeline
function Timeline() {
  const items = [
    { date: "2025", title: "Quadcopter FC v2", text: "Implemented sensor fusion + telemetry dashboard." },
    { date: "2024", title: "Internship @ Robotics Lab", text: "Worked on ROS nodes and SLAM prototyping." },
    { date: "2023", title: "University Project Showcase", text: "Presented IoT energy monitor with live web UI." },
  ];
  return (
    <Section id="timeline" className="bg-[#0a0e13]">
      <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">Timeline</h2>
      <div className="mx-auto mt-8 sm:mt-10 max-w-3xl">
        <ol className="relative border-l border-white/10 pl-4 sm:pl-6">
          {items.map((it, idx) => (
            <li key={idx} className="mb-8 sm:mb-10 ml-2 sm:ml-4">
              <span className="absolute -left-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 ring-2 ring-[#0a0e13]" />
              <h4 className="text-base font-semibold text-white">{it.title} <span className="ml-2 text-xs text-slate-400">{it.date}</span></h4>
              <p className="mt-1 text-sm text-slate-300">{it.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// =====================
// CTA, Contact, Footer
function CTA() {
  return (
    <Section id="get-started" animation="flipUp">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Want feedback on a project?</h2>
        <MagnetButton className="mt-6 sm:mt-8" href="#contact">Get in Touch</MagnetButton>
      </div>
    </Section>
  );
}

// =====================
// Contact Section (wired to FormSubmit, no backend of our own)
function Contact() {
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); // Stop the page from refreshing
    setIsSubmitting(true);

    // Grab the data from the form
    const formData = new FormData(e.target);
    const newMsg = {
      name: formData.get("user_name"),
      email: formData.get("user_email"),
      message: formData.get("user_message"),
      timestamp: new Date().toISOString()
    };

    try {
      // No backend of our own — FormSubmit emails this straight to your inbox,
      // free, no signup. First-ever submission needs a one-time confirmation
      // click in your email before messages start arriving.
      const res = await fetch("https://formsubmit.co/ajax/eosanam191384@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(newMsg),
      });
      if (!res.ok) throw new Error("FormSubmit request failed");
      setIsSuccess(true);
      e.target.reset(); // Clear the form

      // Reset the success button after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("System Error: Could not transmit message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Section className="relative overflow-hidden py-20" id="contact">
      {/* Dynamic Background Glow */}
      <motion.div
        animate={{
          opacity: focused ? 0.5 : 0.1,
          scale: focused ? 1.2 : 1,
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[100px]"
      />

      <Container className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
        {/* Left Side: Text */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          whileInView={{ opacity: 1, x: 0 }} 
          viewport={{ once: true }}
          className="text-center lg:text-left"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Initialize Connection</h2>
          <p className="mt-4 text-base text-slate-300 max-w-md mx-auto lg:mx-0">
            Whether you want to discuss an embedded systems concept, collaborate on an AI project, or just say hello—drop a message below.
          </p>
          <div className="mt-8 flex items-center justify-center lg:justify-start gap-3 text-slate-400">
            <svg className="h-5 w-5 fill-current text-slate-400" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z"/></svg>
            <span className="text-sm tracking-wide text-slate-200">System Status: Online & Accepting Messages</span>
          </div>
        </motion.div>

        {/* Right Side: Animated Form */}
        <motion.form 
          onSubmit={handleSubmit} // Connects the form to our function
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-2xl"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <div className="grid grid-cols-1 gap-5">
            <div className="group relative">
              <input name="user_name" required type="text" placeholder="Full Name" className="peer w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-transparent outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              <label className="pointer-events-none absolute left-4 top-3 text-sm text-slate-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2.5 peer-focus:left-3 peer-focus:bg-[#0f141d] peer-focus:px-1 peer-focus:text-xs peer-focus:text-indigo-400 peer-valid:-top-2.5 peer-valid:left-3 peer-valid:bg-[#0f141d] peer-valid:px-1 peer-valid:text-xs peer-valid:text-indigo-400">Full Name</label>
            </div>

            <div className="group relative">
              <input name="user_email" required type="email" placeholder="Email" className="peer w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-transparent outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              <label className="pointer-events-none absolute left-4 top-3 text-sm text-slate-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2.5 peer-focus:left-3 peer-focus:bg-[#0f141d] peer-focus:px-1 peer-focus:text-xs peer-focus:text-indigo-400 peer-valid:-top-2.5 peer-valid:left-3 peer-valid:bg-[#0f141d] peer-valid:px-1 peer-valid:text-xs peer-focus:text-indigo-400">Email Address</label>
            </div>

            <div className="group relative">
              <textarea name="user_message" required placeholder="Message" className="peer h-32 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-transparent outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              <label className="pointer-events-none absolute left-4 top-3 text-sm text-slate-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-500 peer-focus:-top-2.5 peer-focus:left-3 peer-focus:bg-[#0f141d] peer-focus:px-1 peer-focus:text-xs peer-focus:text-indigo-400 peer-valid:-top-2.5 peer-valid:left-3 peer-valid:bg-[#0f141d] peer-valid:px-1 peer-valid:text-xs peer-valid:text-indigo-400">Your Message</label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className={`btn-ripple mt-2 w-full rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all ${
                isSuccess
                  ? "bg-teal-500 hover:scale-100 cursor-default"
                  : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 hover:shadow-indigo-500/25"
              }`}
            >
              {isSubmitting ? "Transmitting..." : isSuccess ? "Message Received ✓" : "Transmit Message"}
            </button>
          </div>
        </motion.form>
      </Container>
    </Section>
  );
}

// =====================
// Footer (Animated & Visible)
function Footer() {
  const socials = [
    { name: "GitHub", href: "#", hoverColor: "hover:text-white hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]", path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
    { name: "LinkedIn", href: "#", hoverColor: "hover:text-sky-400 hover:drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
    { name: "Google Scholar", href: "#", hoverColor: "hover:text-sky-400 hover:drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]", path: "M12 2L1 9l4 2.5v6L12 22l7-4.5v-6l2-1.25V17h2V9L12 2zm0 2.311L18.942 9 12 13.689 5.058 9 12 4.311zM7 12.611l5 3.125 5-3.125v4.025l-5 3.214-5-3.214v-4.025z" }
  ];

  return (
    <footer className="border-t border-white/10 py-10 sm:py-12 bg-[#05070a]">
      <Container className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
        <div className="opacity-80 text-sm text-slate-400 font-medium">
          © {new Date().getFullYear()} by Eitmam Omar Sanam
        </div>
        
        <div className="flex items-center gap-8">
          {socials.map((s) => (
            <motion.a 
              key={s.name} 
              href={s.href} 
              target="_blank" 
              rel="noreferrer" 
              aria-label={s.name} 
              whileHover={{ y: -6, scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`text-slate-500 transition-colors duration-300 ${s.hoverColor}`}
            >
              {/* Note: fill-current instead of fill-currentColor! */}
              <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
                <path d={s.path} />
              </svg>
            </motion.a>
          ))}
        </div>
      </Container>
    </footer>
  );
}

// ---- Reusable ----
function Input({ label, name, type = "text" }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
      <input id={name} name={name} type={type} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  );
}

function Logo({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l9 5v10l-9 5-9-5V7l9-5zm0 2.2L5 7v8.8l7 3.9 7-3.9V7l-7-2.8z" />
    </svg>
  );
}

// =====================
// Tiny tests for helpers
export function formatNumber(n){
  return n >= 1e6 ? `${Math.round(n / 1e6)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`;
}

if (typeof window !== "undefined" && !window.__SITE_TESTS_RAN__) {
  window.__SITE_TESTS_RAN__ = true;
  try {
    console.assert(formatNumber(999) === "999", "formatNumber(999) should be '999'");
    console.assert(formatNumber(1000) === "1K", "formatNumber(1000) should be '1K'");
    console.assert(formatNumber(1500) === "2K", "formatNumber(1500) should be '2K'");
    console.assert(formatNumber(1_000_000) === "1M", "formatNumber(1000000) should be '1M'");
    console.assert(formatNumber(1_500_000) === "2M", "formatNumber(1500000) should be '2M'");
    console.assert(formatNumber(0) === "0", "formatNumber(0) should be '0'");
    const _b = getBaseUrl();
    console.assert(typeof _b === "string", "getBaseUrl() should return a string");
    console.assert(_b.endsWith("/"), "getBaseUrl() should end with '/'");
    console.assert((`${_b}vid3.mp4`).endsWith("vid3.mp4"), "Base URL concatenation should preserve filename");
    console.log("✅ UI helper tests passed");
  } catch (e) {
    console.error("❌ UI helper tests failed", e);
  }
}
