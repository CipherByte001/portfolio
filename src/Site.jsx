import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from "framer-motion";



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
// Root component
export default function Site() {
  return (
    <main className="min-h-screen bg-[#0b0f14] text-slate-100 antialiased selection:bg-rose-500/30">
       <GlobalStyles />
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

// Lazy mount wrapper for heavy content (thumbs, etc.)
// >>> Disabled lazy-loading: render immediately
function InView({ children }) {
  return <>{children}</>;
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
                <a key={it.label} href={it.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-slate-200 hover:bg:white/5">
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
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-fuchsia-400 to-sky-400">
      {txt}
    </span>
    <span
      aria-hidden="true"
      className="ml-[2px] inline-block h-[1em] w-[2px] align-[-0.1em] bg-gradient-to-b from-rose-400 to-sky-400"
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
  colorStart = "rgba(244,63,94,0.9)", // rose-500
  colorEnd   = "rgba(56,189,248,0.9)", // sky-400
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

    stopRef.current = false;
    function loop() {
      if (stopRef.current) return;
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
  edgeColorA = "rgba(244,63,94,0.9)",   // rose-500
  edgeColorB = "rgba(56,189,248,0.9)",  // sky-400
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

  const words = "Engineer • Innovator • Problem Solver".split(" ");
  return (
    <section id="top" className="relative overflow-hidden">
      <div ref={ref} className="pointer-events-none absolute inset-0">
        <Spotlight />
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none">
    {/* show only on left half at md+ to avoid covering video */}
    <div className="absolute inset-y-0 left-0 w-full md:w-1/2">
      <ParticleNetwork
  maxParticlesPerKpx={0.06}  // fewer dots
  linkDist={130}             // shorter links
  hoverBoost={70}            // weaker pull to cursor
  bgFade={0.04}              // slight trails = feels slower
/><ParticleNetwork
        // try louder defaults first so you can *see* it
        maxParticlesPerKpx={0.12}
        linkDist={160}
        hoverBoost={160}
        bgFade={1}          // hard clear each frame (no trails) so visibility is obvious
      />
    </div>
  </div>
      
      <Container className="grid grid-cols-1 items-center gap-10 py-14 sm:py-20 md:grid-cols-2 md:py-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-rose-400">Portfolio & Blog</p>
          <motion.h1
  className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight"
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  <Typewriter
    words={[
      "Engineering Student • Innovator • Problem Solver",
      "Electronics • AI • Embedded",
      "STM32 • IoT • Machine Learning"
    ]}
    typeSpeed={70}
    deleteSpeed={40}
    pauseAfterType={1200}
  />
</motion.h1>


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

  const base = getBaseUrl();

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

// =====================
// Projects (cards + modal)
function Projects() {
  const base = getBaseUrl();

  const allProjects = useMemo(() => ([
    {
      id: 1,
      title: "Digital Counter on OLED Display using STM32",
      excerpt: "Counts 1–10,000 on 0.96\" OLED (STM32F103C8).",
      desc: "This project demonstrates a simple yet effective digital counter system using the STM32F103C8 Blue Pill microcontroller and a 0.96-inch OLED display. The system continuously counts from 1 to 10,000, displaying each number on the OLED screen with proper alignment for 1, 2, 3, and 4-digit values. The project features dynamic screen updates and smooth transitions, with a delay between number updates to make the display easily readable. The main goal of this project is to showcase the ability of STM32 microcontrollers to interface with an OLED display and handle basic operations such as converting integers to strings and updating the display at regular intervals. This project can be expanded further by adding functionalities like button-based pause/resume, speed control, or even a countdown mode.",
      tags: ["STM32", "Embedded", "OLED", "Blue Pill"],
      components: ["STM32F103C8", "OLED 0.96\""],
      // YouTube video + optional thumbnail image for the card
      media: { type: "youtube", id: "0hqF-edwhlI", thumb: `${base}hq720.jpg` }
    },
    {
      id: 2,
      title: "Email Spam Classification Using Machine Learning",
      excerpt:"Built an ML-based email spam filter using Logistic Regression and NLP (TF-IDF). Achieved strong accuracy and deployed a real-time web demo.",
      desc: (
    <div className="prose prose-invert max-w-none text-slate-300">
      <h4 className="text-white font-semibold">Overview</h4>
      <p>
        This project demonstrates a machine learning–based spam email classifier. 
        It leverages Natural Language Processing (NLP) and TF-IDF features to 
        transform raw email text into structured numerical data that Logistic Regression 
        can learn from, ensuring accurate spam vs ham predictions.
      </p>

      <h4 className="text-white font-semibold mt-4">Workflow</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Cleaning, tokenization, stop-word removal</li>
        <li>TF-IDF feature extraction</li>
        <li>Evaluation with accuracy, precision, recall, F1</li>
      </ul>

      <h4 className="text-white font-semibold mt-4">Deployment & Demo</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Web demo with instant spam / ham prediction</li>
      </ul>

      <h4 className="text-white font-semibold mt-4">Applications</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Email clients (Gmail / Outlook)</li>
        <li>Enterprise anti-phishing & security</li>
      </ul>

      <h4 className="text-white font-semibold mt-4">Key Takeaways</h4>
      <ul className="list-disc pl-5 space-y-1">
        <li>Hands-on NLP in Python</li>
        <li>End-to-end model deployment</li>11
      </ul>
    </div>
  ),
      tags: ["Machine Learning", "Spam Classification", "Logistic Regression" ,"Python"],
      components: ["Anaconda", "VS Code"],
      media: { type: "youtube", id: "Le5HsRq_mWM", thumb: `${base}images.jpeg` }
    },
    {
      id: 3,
      title: "ML Defect Detector",
      excerpt: "Vision model for surface defects.",
      desc: "Traditional CV + ML pipeline for surface defect classification. Covers data capture, lighting, feature engineering, and model evaluation.",
      tags: ["ML", "Vision", "Python"],
      components: ["OpenCV", "scikit-learn", "LED Ring"],
      media: { type: "image", src: null, thumb: null }
    },
    {
      id: 4,
      title: "Edge Audio Keyword Spotting",
      excerpt: "TinyML KWS on microcontrollers.",
      desc: "Collecting audio, extracting MFCCs, training a tiny CNN, quantization, and deployment to STM32 with CMSIS-NN.",
      tags: ["ML", "Embedded"],
      components: ["STM32", "Mic", "CMSIS-NN"],
      media: { type: "video", src: null, thumb: null }
    },
  ]), [base]);

  const allTags = useMemo(() => Array.from(new Set(allProjects.flatMap(p => p.tags))).sort(), [allProjects]);
  const [activeTags, setActiveTags] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  // Removed pagination: show all filtered items
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

      {/* Grid (render ALL filtered items, thumbs eager) */}
      <motion.div className="mt-8 sm:mt-10 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}>
        {filtered.map((p) => {
          const visibleTags = (p.tags || []).slice(0, 2);
          const extra = (p.tags || []).length - visibleTags.length;
          return (
            <TiltCard key={p.id}>
              <button onClick={() => setActiveProject(p)} className="block w-full text-left">
     <>
  <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl bg-[#0b0f14]">
    <InView>
      {p.media.type === "youtube" ? (
        // visible thumbnail stays exactly the same
        p.media.thumb ? (
          <img
            src={p.media.thumb}
            alt={`${p.title} thumbnail`}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="sync"
            fetchpriority="high"
          />
        ) : (
          <VideoPlaceholder />
        )
      ) : p.media.type === "video" ? (
        p.media.thumb ? (
          <img
            src={p.media.thumb}
            alt={`${p.title} thumbnail`}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="sync"
            fetchpriority="high"
          />
        ) : (
          <VideoPlaceholder />
        )
      ) : p.media.type === "image" ? (
        p.media.src ? (
          <img
            src={p.media.src}
            alt={p.title}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="sync"
            fetchpriority="high"
          />
        ) : (
          <ImagePlaceholder />
        )
      ) : null}
    </InView>
  </div>

  {/* Off-screen but rendered iframe to preload YouTube (no layout/visual change) */}
  {p.media.type === "youtube" && (
    <iframe
      src={`https://www.youtube.com/embed/${p.media.id}?rel=0&modestbranding=1&playsinline=1`}
      title={`${p.title} preloader`}
      style={{
        position: "absolute",
        left: "-10000px",
        top: 0,
        width: "1px",
        height: "1px",
        opacity: 0.01
      }}
      tabIndex={-1}
      aria-hidden="true"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  )}
</>


                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">{p.title}</h3>
                    <p className="mt-1 text-sm text-slate-400" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.excerpt}
                    </p>
                  </div>
                  <MagnetButton href={null} className="px-3 py-2 text-xs">Open</MagnetButton>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleTags.map((t) => (
                    <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">{t}</span>
                  ))}
                  {extra > 0 && (
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">+{extra}</span>
                  )}
                </div>
              </button>
            </TiltCard>
          );
        })}
      </motion.div>

      {/* Pagination controls removed */}
      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </Section>
  );
}
function ProjectModal({ project, onClose }) {
  const videoRef = useRef(null);

  // Close on Esc
  useEffect(() => {
    if (!project) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  // Autoplay for <video>; (YouTube uses URL params)
  useEffect(() => {
    const v = videoRef.current;
    if (!project || !v) return;
    if (project.media?.type === "video") {
      const p = v.play();
      if (p && typeof p.then === "function") p.catch(() => {});
    }
  }, [project]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Modal container with a fixed max height; body scrolls */}
          <motion.div
  className="w-full max-w-5xl rounded-2xl bg-[#0f141d] ring-1 ring-white/10
             max-h-[90vh] overflow-y-auto"
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 20, opacity: 0 }}
>
  {/* Media */}
  <div className="aspect-video w-full bg-black">
    {project.media?.type === 'youtube' ? (
      <iframe
        key={project.id}
        src={`https://www.youtube.com/embed/${project.media.id}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`}
        title={project.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    ) : project.media?.type === 'video' ? (
      <video
        key={project.id}
        ref={videoRef}
        src={project.media.src || ''}
        poster={project.media.thumb || undefined}
        controls
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />
    ) : project.media?.type === 'image' ? (
      project.media.src ? (
        <img src={project.media.src} alt={project.title} className="h-full w-full object-contain" />
      ) : (
        <ImagePlaceholder />
      )
    ) : (
      <ImagePlaceholder />
    )}
  </div>

  {/* Details */}
  <div className="flex flex-col gap-4 p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-white">{project.title}</h3>
        <p className="mt-1 text-sm sm:text-base text-slate-300 whitespace-pre-wrap">{project.desc}</p>
      </div>
      <MagnetButton href={null} onClick={onClose} className="px-4 py-2 text-xs">Close</MagnetButton>
    </div>

    {Array.isArray(project.components) && project.components.length > 0 && (
      <div>
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Main Components</div>
        <div className="flex flex-wrap gap-2">
          {project.components.map((c) => (
            <span key={c} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-200">{c}</span>
          ))}
        </div>
      </div>
    )}

    <div className="flex flex-wrap gap-2">
      {project.tags?.map((t) => (
        <span key={t} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">#{t}</span>
      ))}
    </div>
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
  const base = getBaseUrl();

  return (
    <Section id="about" className="bg-[#0a0e13]">
      <div className="grid grid-cols-1 items-center gap-8 md:gap-10 md:grid-cols-2">
        {/* Photo */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }} className="flex justify-center">
          <div className="relative h-44 w-44 sm:h-56 sm:w-56 md:h-64 md:w-64 overflow-hidden rounded-full ring-4 ring-rose-500/30 shadow-xl shadow-rose-500/20">
            <img
              src={`${base}sanam.jpg`}
              alt="Eitmam Omar Sanam"
              className="h-full w-full object-cover"
              loading="lazy" decoding="async"
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-center md:text-left">
          <p className="text-sm font-semibold tracking-wider text-rose-400">About Me</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text:white">Building at the edge of electronics and intelligence</h2>
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
            <div className="rounded-2xl border border:white/10 bg-[#0f141d] p-4">
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
              <span className="absolute -left-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-sky-500 ring-2 ring-[#0a0e13]" />
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
// Blog (list + modal)
function Blog() {
  const base = getBaseUrl();
  const posts = useMemo(() => ([
    { id: 1, title: "Building a PID Loop from Scratch", date: "2025-03-02", tags: ["Control", "Robotics"], excerpt: "How I tuned a quadcopter PID using step response and ZN heuristics.", minutes: 6, cover: `${base}sanam.jpg`, content: `In this post, we walk through modeling, Ziegler–Nichols tuning, and step-response validation...` },
    { id: 2, title: "ESP32 Power Profiling", date: "2025-01-15", tags: ["IoT", "Embedded"], excerpt: "Measuring deep-sleep vs active current and optimizing wake windows.", minutes: 5, cover: `${base}sanam.jpg`, content: `We measure current with a DMM and INA219, compare deep sleep and modem-sleep, and script wake windows...` },
    { id: 3, title: "TinyML Keyword Spotting", date: "2024-11-20", tags: ["ML", "Audio"], excerpt: "Datasets, MFCC, and quantization tricks for microcontrollers.", minutes: 7, cover: `${base}sanam.jpg`, content: `Collecting audio, extracting MFCCs, training a small CNN, and deploying with CMSIS-NN...` },
  ]), [base]);

  const allTags = useMemo(() => Array.from(new Set(posts.flatMap(p => p.tags))).sort(), [posts]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState([]);
  const [activePost, setActivePost] = useState(null);

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
          <article key={p.id} className="rounded-2xl border border-white/10 bg-[#0f141d] p-5 sm:p-6 cursor-pointer" onClick={() => setActivePost(p)}>
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
              <MagnetButton href={null} className="px-4 py-2 text-xs" onClick={(e)=>{ e.stopPropagation(); setActivePost(p); }}>Read More</MagnetButton>
            </div>
          </article>
        ))}
      </motion.div>

      <BlogModal post={activePost} onClose={() => setActivePost(null)} />
    </Section>
  );
}

function BlogModal({ post, onClose }) {
  useEffect(() => {
    if (!post) return;
    function onKey(e){ if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [post, onClose]);

  return (
    <AnimatePresence>
      {post && (
        <motion.div className="fixed inset-0 z:[85] grid place-items-center bg-black/70 p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e)=>{ if(e.target === e.currentTarget) onClose(); }}>
          <motion.article className="w-full max-w-3xl overflow-hidden rounded-2xl bg-[#0f141d] ring-1 ring-white/10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
            {post.cover ? (
              <div className="relative w-full overflow-hidden bg-black">
                <img src={post.cover} alt={`${post.title} cover`} className="w-full max-h-64 object-cover" loading="lazy" decoding="async" />
              </div>
            ) : null}
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
                <span>•</span>
                <span>{post.minutes} min read</span>
                <span className="hidden sm:inline">•</span>
                <div className="hidden gap-2 sm:flex">
                  {post.tags.map(t => <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 text-[10px]">{t}</span>)}
                </div>
              </div>
              <h3 className="mt-2 text-xl sm:text-2xl font-semibold text-white">{post.title}</h3>
              <div className="prose prose-invert max-w-none mt-4 text-slate-300 text-sm sm:text-base whitespace-pre-wrap">{post.content}</div>
              <div className="mt-6 flex justify-end">
                <MagnetButton href={null} onClick={onClose} className="px-4 py-2 text-xs">Close</MagnetButton>
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
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
        <div className="opacity-80">© {new Date().getFullYear()} by Eitmam Omar Sanam</div>
        <form className="flex w/full max-w-md items-center gap-2 md:w-auto">
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
