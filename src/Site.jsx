import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useInView, useTransform } from "framer-motion";

// ===== Portfolio Site (Mobile-Optimized) =====
// - Sticky Nav with mobile hamburger
// - Hero
// - Projects (filters + lightbox)
// - About (after Projects) with circular portrait, responsive sizes
// - Skills, Academics, Blog, Timeline
// - CTA, Contact, Footer
// - All helpers in this file (no external imports)

export default function Site() {
  return (
    <main className="min-h-screen bg-[#0b0f14] text-slate-100 antialiased selection:bg-rose-500/30">
      <ScrollProgressBar />
      <Nav />
      <Hero />
      <Projects />
      <About />
      <Skills />
      <Academics />
      <Blog />
      <Timeline />
      <CTA />
      <Contact />
      <Footer />
    </main>
  );
}

// =====================
// Layout helpers
function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

function Section({ id, children, className = "" }) {
  return (
    <section id={id} className={`relative py-16 sm:py-20 md:py-28 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

// =====================
// Global UI Bits
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.2 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[70] h-1 w-full origin-left bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500"
    />
  );
}

function MagnetButton({ children, className = "", href = "#", onClick }) {
  return (
    <a
      href={href || undefined}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 px-5 sm:px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:opacity-95 ${className}`}
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

// =====================
// Nav (desktop + mobile)
function Nav() {
  const [open, setOpen] = useState(false);
  const items = [
    { href: "#projects", label: "Projects" },
    { href: "#skills", label: "Skills" },
    { href: "#academics", label: "Academics" },
    { href: "#blog", label: "Blog" },
    { href: "#timeline", label: "Timeline" },
  ];
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 text-rose-400" />
          <span className="tracking-tight">Eitmam Omar Sanam</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden gap-8 md:flex">
          {items.map((it) => (
            <a key={it.label} href={it.href} className="text-sm text-slate-300 transition hover:text-white">
              {it.label}
            </a>
          ))}
        </nav>

        {/* Actions (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <a href="#contact" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            Contact
          </a>
          <MagnetButton href="#about">About Me</MagnetButton>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-200 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="text-xl leading-none">≡</span>
        </button>
      </Container>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden">
            <Container className="space-y-1 pb-4">
              {items.map((it) => (
                <a key={it.label} href={it.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-slate-200 hover:bg-white/5">
                  {it.label}
                </a>
              ))}
              <div className="mt-2 flex gap-2">
                <a href="#contact" onClick={() => setOpen(false)} className="flex-1 rounded-full border border-white/10 px-4 py-2 text-center text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                  Contact
                </a>
                <MagnetButton href="#about" onClick={() => setOpen(false)} className="flex-1 justify-center">
                  About Me
                </MagnetButton>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// =====================
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

  const words = "Engineer • Innovator • Problem Solver".split(" ");
  return (
    <section id="top" className="relative overflow-hidden">
      <div ref={ref} className="pointer-events-none absolute inset-0">
        <Spotlight />
      </div>
      <Container className="grid grid-cols-1 items-center gap-10 py-14 sm:py-20 md:grid-cols-2 md:py-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-rose-400">Portfolio & Blog</p>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            {words.map((w, i) => (
              <motion.span key={i} className="mr-1 inline-block" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                {w}
              </motion.span>
            ))}
          </h1>
          <p className="mt-4 sm:mt-5 max-w-xl text-slate-300 text-sm sm:text-base">
            Exploring the intersection of electronics and intelligence — from coding and AI to IoT, microcontrollers, and PCB design. I build solutions, experiment with ideas, and share my projects here.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
            <MagnetButton href="#projects">See Projects</MagnetButton>
            <a href="#blog" className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">
              Read the Blog
            </a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <ParallaxCard />
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

  // Show logo only while video isn't ready
  const [ready, setReady] = React.useState(false);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[#0f141d] ring-1 ring-white/5 shadow-xl">
      {/* Glowing blobs (parallax) */}
      <motion.div
        style={{ y: y1 }}
        className="pointer-events-none absolute -left-8 -top-8 h-40 sm:h-48 w-40 sm:w-48 rounded-full bg-rose-500/30 blur-2xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="pointer-events-none absolute -right-8 -bottom-8 h-40 sm:h-48 w-40 sm:w-48 rounded-full bg-sky-500/30 blur-2xl"
      />

      {/* Video */}
      <video
  src={`${import.meta.env.BASE_URL}vid3.mp4`}
  autoPlay
  loop
  muted
  playsInline
  className="h-full w-full object-cover"
/>


      {/* Optional dark overlay for contrast */}
      <div className="pointer-events-none absolute inset-0 bg-black/20" />

      {/* Fallback logo only while loading/not ready */}
      {!ready && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Logo className="h-14 w-14 sm:h-16 sm:w-16 text-white/60" />
        </div>
      )}
    </div>
  );
}



// =====================
// Projects
function Projects() {
  const allProjects = useMemo(() => ([
    { id: 1, title: "Smart Home Energy Monitor", desc: "ESP32 + CT sensors + dashboard.", tags: ["IoT", "Embedded", "Stm32"], media: { type: "image", src: null } },
    { id: 2, title: "Quadcopter Flight Controller", desc: "PID tuning & telemetry.", tags: ["Robotics", "Control", "C++"], media: { type: "video", src: null } },
    { id: 3, title: "ML Defect Detector", desc: "Vision model for surface defects.", tags: ["ML", "Vision", "Python"], media: { type: "image", src: null } },
    { id: 4, title: "Edge Audio Keyword Spotting", desc: "TinyML on microcontrollers.", tags: ["ML", "Embedded"], media: { type: "video", src: null } },
  ]), []);

  const allTags = useMemo(() => Array.from(new Set(allProjects.flatMap(p => p.tags))).sort(), [allProjects]);
  const [activeTags, setActiveTags] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  const filtered = useMemo(() => {
    if (!activeTags.length) return allProjects;
    return allProjects.filter(p => activeTags.every(t => p.tags.includes(t)));
  }, [allProjects, activeTags]);

  function toggleTag(tag) {
    setActiveTags((cur) => cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]);
  }

  return (
    <Section id="projects" className="bg-[#0a0e13]">
      <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">Projects</h2>

      {/* Filters */}
      <div className="mx-auto mt-5 sm:mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <button onClick={() => setActiveTags([])} className={`${activeTags.length ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-rose-500/40 bg-rose-500/10 text-white"} rounded-full border px-3 py-1.5 text-xs transition`}>All</button>
        {allTags.map((t) => (
          <button key={t} onClick={() => toggleTag(t)} className={`${activeTags.includes(t) ? "border-rose-500/40 bg-rose-500/10 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"} rounded-full border px-3 py-1.5 text-xs transition`}>{t}</button>
        ))}
      </div>

      {/* Grid */}
      <motion.div className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
        {filtered.map((p) => (
          <TiltCard key={p.id}>
            <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl bg-[#0b0f14]">
              {p.media.type === "video" ? (
                p.media.src ? (
                  <video src={p.media.src} controls className="h-full w-full object-cover" />
                ) : <VideoPlaceholder />
              ) : p.media.type === "image" ? (
                p.media.src ? (
                  <img src={p.media.src} alt={p.title} className="h-full w-full object-cover" />
                ) : <ImagePlaceholder />
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-300">{p.desc}</p>
              </div>
              <MagnetButton href={null} onClick={() => setLightbox({ ...p.media, title: p.title })} className="px-3 py-2 text-xs">Open</MagnetButton>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">{t}</span>
              ))}
            </div>
          </TiltCard>
        ))}
      </motion.div>

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
    </Section>
  );
}

function Lightbox({ media, onClose }) {
  return (
    <AnimatePresence>
      {media && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-[#0f141d] ring-1 ring-white/10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
            <div className="aspect-video w-full bg-black">
              {media.type === "video" ? (
                media.src ? <video src={media.src} controls autoPlay className="h-full w-full object-contain" /> : <VideoPlaceholder />
              ) : (
                media.src ? <img src={media.src} alt={media.title || "media"} className="h-full w-full object-contain" /> : <ImagePlaceholder />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-sm text-slate-300">{media.title}</div>
              <MagnetButton href={null} onClick={onClose} className="px-4 py-2 text-xs">Close</MagnetButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ImagePlaceholder() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(244,63,94,0.25),rgba(14,165,233,0.25))]" />
      <div className="absolute inset-0 grid place-items-center text-xs text-white/70">Add your image</div>
    </div>
  );
}

function VideoPlaceholder() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.25),rgba(244,63,94,0.25))]" />
      <div className="absolute inset-0 grid place-items-center text-xs text-white/70">Add your video</div>
    </div>
  );
}

// =====================
// About (after Projects)
function About() {
  return (
    <Section id="about" className="bg-[#0a0e13]">
      <div className="grid grid-cols-1 items-center gap-8 md:gap-10 md:grid-cols-2">
        {/* Photo */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="flex justify-center">
          <div className="relative h-44 w-44 sm:h-56 sm:w-56 md:h-64 md:w-64 overflow-hidden rounded-full ring-4 ring-rose-500/30 shadow-xl shadow-rose-500/20">
            <img
  src={`${import.meta.env.BASE_URL}sanam.jpg`}
  alt="Eitmam Omar Sanam"
  className="h-full w-full object-cover"
/>

          </div>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-center md:text-left">
          <p className="text-sm font-semibold tracking-wider text-rose-400">About Me</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">Building at the edge of electronics and intelligence</h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base">
            I’m an undergraduate student in Electrical and Electronics Engineering with a strong interest in hardware, robotics, and embedded systems. Most of my time goes into Programming and making project with STM32 , Arduino , Esp32  microcontrollers, PCB design and experimenting with sensors to bring ideas to life.

I enjoy being hands-on — whether it’s debugging a circuit, programming a microcontroller, or testing out a new hardware setup. Alongside electronics, I also explore Python programming, which helps me connect hardware projects with smarter, software-driven intelligence.

What excites me most is problem-solving and tinkering — taking something from concept to prototype, learning by doing, and building technology that can have a real impact, from sustainable designs to accessible smart devices.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0f141d] p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Focus</div>
              <div className="mt-1 text-sm text-slate-200">IoT • Embedded • ML</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f141d] p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Currently</div>
              <div className="mt-1 text-sm text-slate-200">Programming with STM32</div>
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
// Skills & Tools
function Skills() {
  const groups = [
    { name: "Languages", items: ["C", "Python", "JavaScript", "MATLAB"] },
    { name: "Frameworks", items: ["React", "Node JS", "scikit-learn", "Numpy"] },
    { name: "Hardware / CAD", items: ["Arduino", "ESP32", "Stm32", "Altium"] },
    { name: "Cloud / DevOps", items: ["Docker", "GitHub Actions", "Firebase", "Vercel"] },
  ];
  return (
    <Section id="skills">
      <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">Skills & Tools</h2>
      <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <div key={g.name} className="rounded-2xl border border-white/10 bg-[#0f141d] p-5 sm:p-6">
            <div className="mb-3 text-sm font-semibold text-white">{g.name}</div>
            <div className="flex flex-wrap gap-2">
              {g.items.map((i) => (
                <span key={i} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">{i}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// =====================
// Academics
function Academics() {
  const schools = [
    { level: "School", name: "Monipur High School", location: "Mirpur, Dhaka" },
    { level: "College", name: "Adamjee Cantonment College", location: "Dhaka Cantonment, Dhaka" },
    { level: "University", name: "Rajshahi University of Engineering and Technology", location: "Rajshahi" },
  ];
  return (
    <Section id="academics" className="bg-[#0a0e13]">
      <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">Academics</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300 text-sm sm:text-base">My educational journey and institutions.</p>
      <div className="mx-auto mt-8 sm:mt-10 max-w-3xl">
        <ol className="relative border-l border-white/10 pl-4 sm:pl-6">
          {schools.map((s, idx) => (
            <li key={idx} className="mb-8 sm:mb-10 ml-2 sm:ml-4">
              <span className="absolute -left-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-rose-500 ring-2 ring-[#0a0e13]" />
              <h4 className="text-base font-semibold text-white">{s.level}: {s.name}</h4>
              <p className="mt-1 text-sm text-slate-300">{s.location}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// =====================
// Blog
function Blog() {
  const posts = useMemo(() => ([
    { id: 1, title: "Building a PID Loop from Scratch", date: "2025-03-02", tags: ["Control", "Robotics"], excerpt: "How I tuned a quadcopter PID using step response and ZN heuristics.", minutes: 6 },
    { id: 2, title: "ESP32 Power Profiling", date: "2025-01-15", tags: ["IoT", "Embedded"], excerpt: "Measuring deep-sleep vs active current and optimizing wake windows.", minutes: 5 },
    { id: 3, title: "TinyML Keyword Spotting", date: "2024-11-20", tags: ["ML", "Audio"], excerpt: "Datasets, MFCC, and quantization tricks for microcontrollers.", minutes: 7 },
  ]), []);

  const allTags = useMemo(() => Array.from(new Set(posts.flatMap(p => p.tags))).sort(), [posts]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState([]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchText = (p.title + " " + p.excerpt).toLowerCase().includes(q.toLowerCase());
      const matchTags = active.length ? active.every(t => p.tags.includes(t)) : true;
      return matchText && matchTags;
    });
  }, [posts, q, active]);

  function toggleTag(tag) {
    setActive((cur) => cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]);
  }

  return (
    <Section id="blog">
      <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">Blog</h2>

      <div className="mx-auto mt-5 sm:mt-6 flex max-w-3xl flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm sm:text-base text-slate-100 outline-none focus:ring-2 focus:ring-rose-500" />
        <button onClick={() => { setQ(""); setActive([]); }} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5">Reset</button>
      </div>

      <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-2">
        <button onClick={() => setActive([])} className={`${active.length ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-rose-500/40 bg-rose-500/10 text-white"} rounded-full border px-3 py-1.5 text-xs transition`}>All</button>
        {allTags.map((t) => (
          <button key={t} onClick={() => toggleTag(t)} className={`${active.includes(t) ? "border-rose-500/40 bg-rose-500/10 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"} rounded-full border px-3 py-1.5 text-xs transition`}>{t}</button>
        ))}
      </div>

      <motion.div className="mx-auto mt-8 sm:mt-10 grid max-w-4xl grid-cols-1 gap-5 sm:gap-6" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
        {filtered.map((p) => (
          <article key={p.id} className="rounded-2xl border border-white/10 bg-[#0f141d] p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <time dateTime={p.date}>{new Date(p.date).toLocaleDateString()}</time>
              <span>•</span>
              <span>{p.minutes} min read</span>
              <span className="hidden sm:inline">•</span>
              <div className="hidden gap-2 sm:flex">
                {p.tags.map(t => <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px]">{t}</span>)}
              </div>
            </div>
            <h3 className="mt-2 text-lg sm:text-xl font-semibold text-white">{p.title}</h3>
            <p className="mt-2 text-sm sm:text-base text-slate-300">{p.excerpt}</p>
            <div className="mt-4">
              <MagnetButton href="#" className="px-4 py-2 text-xs">Read More</MagnetButton>
            </div>
          </article>
        ))}
      </motion.div>
    </Section>
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
              <span className="absolute -left-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-sky-500 ring-2 ring-[#0a0e13]" />
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
    <Section id="get-started">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Want feedback on a project?</h2>
        <MagnetButton className="mt-6 sm:mt-8" href="#contact">Get in Touch</MagnetButton>
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <section id="contact" className="bg-[#0a0e13] py-16 sm:py-20">
      <Container className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Contact</h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base">Email:eosanam191384@gmail.com<br/>Dhaka,Bangladesh</p>
          <div className="mt-8 space-y-3 sm:space-y-4">
            {[{label:"Projects",href:"#projects"},{label:"Skills",href:"#skills"},{label:"Academics",href:"#academics"},{label:"Blog",href:"#blog"},{label:"Timeline",href:"#timeline"}].map((l) => (
              <a key={l.label} href={l.href} className="block text-sm text-slate-300 transition hover:text-white">{l.label}</a>
            ))}
          </div>
        </div>
        <form className="rounded-2xl bg-[#0f141d] p-5 sm:p-6 ring-1 ring-white/10">
          <div className="grid grid-cols-1 gap-4">
            <Input label="Full Name" name="name" />
            <Input label="Email" name="email" type="email" />
            <Input label="Subject" name="subject" />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Message</label>
              <textarea className="h-28 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-rose-500"></textarea>
            </div>
            <MagnetButton className="mt-2 w-full text-center" href="#">Send Message</MagnetButton>
          </div>
        </form>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 sm:py-10 text-sm">
      <Container className="flex flex-col items-center justify-between gap-4 sm:gap-6 text-center md:flex-row md:text-left">
        <div className="opacity-80">© {new Date().getFullYear()} by Your Name</div>
        <form className="flex w-full max-w-md items-center gap-2 md:w-auto">
          <input type="email" placeholder="Subscribe to blog updates" className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-rose-500" />
          <MagnetButton href="#">Subscribe</MagnetButton>
        </form>
        <div className="flex items-center gap-3">
          {["GitHub", "LinkedIn", "Twitter"].map((s) => (
            <a key={s} href="#" className="text-slate-300 transition hover:text-white">{s}</a>
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
      <input id={name} name={name} type={type} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-rose-500" />
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
// Tiny tests for formatNumber
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
    // Additional tests
    console.assert(formatNumber(42) === "42", "formatNumber(42) should be '42'");
    console.assert(formatNumber(2_000_000) === "2M", "formatNumber(2000000) should be '2M'");
    console.log("✅ UI helper tests passed");
  } catch (e) {
    console.error("❌ UI helper tests failed", e);
  }
}
