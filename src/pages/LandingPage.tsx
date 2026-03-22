import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Bell, Calendar, Sparkles, Volume2, ChevronDown, Shield, Star, Check, Github, Twitter } from "lucide-react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const GRADIENT = "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)";
const PHRASES = [
  "Never miss a meeting.",
  "Smart reminders, beautifully designed.",
  "Your events, your way.",
];

/* ------------------------------------------------------------------ */
/*  Three.js constellation                                             */
/* ------------------------------------------------------------------ */
function ConstellationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    const COUNT = 150;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [
      [0.39, 0.40, 0.95], // indigo
      [0.55, 0.36, 0.96], // violet
      [0.93, 0.29, 0.60], // pink
      [0.70, 0.70, 0.95], // light
    ];
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const nodeMat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodes);

    const linePositions: number[] = [];
    const THRESHOLD = 2.0;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < THRESHOLD) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2],
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const mx = mouseRef.current.x * 0.0003;
      const my = mouseRef.current.y * 0.0003;
      nodes.rotation.y += 0.001;
      nodes.rotation.x += 0.0004;
      nodes.rotation.y += mx * 0.02;
      nodes.rotation.x += my * 0.02;
      lines.rotation.copy(nodes.rotation);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX - window.innerWidth / 2;
      mouseRef.current.y = e.clientY - window.innerHeight / 2;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}

/* ------------------------------------------------------------------ */
/*  Typewriter                                                         */
/* ------------------------------------------------------------------ */
function useTypewriter(phrases: string[], speed = 50, pause = 3000) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const phrase = phrases[idx];
    let charIdx = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!deleting) {
        charIdx++;
        setText(phrase.slice(0, charIdx));
        if (charIdx === phrase.length) { timeout = setTimeout(() => { deleting = true; tick(); }, pause); return; }
      } else {
        charIdx--;
        setText(phrase.slice(0, charIdx));
        if (charIdx === 0) { setIdx((p) => (p + 1) % phrases.length); return; }
      }
      timeout = setTimeout(tick, deleting ? 30 : speed);
    };
    tick();
    return () => clearTimeout(timeout);
  }, [idx, phrases, speed, pause]);

  return text;
}

/* ------------------------------------------------------------------ */
/*  Speech                                                             */
/* ------------------------------------------------------------------ */
function useSpeakAthena() {
  return useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(
      "Hi, I'm Athena, your personal event assistant. I'll help you organize your schedule, send smart reminders, and keep your world running smoothly.",
    );
    const voices = speechSynthesis.getVoices();
    const female = voices.find((v) => /female|samantha|karen|victoria|zira/i.test(v.name));
    if (female) u.voice = female;
    u.rate = 0.95;
    speechSynthesis.speak(u);
  }, []);
}

/* ------------------------------------------------------------------ */
/*  Scroll-aware navbar                                                */
/* ------------------------------------------------------------------ */
function useNavbarVisible() {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < 80 || y < lastY.current);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return visible;
}

/* ------------------------------------------------------------------ */
/*  AnimatedSection                                                    */
/* ------------------------------------------------------------------ */
function Anim({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Counter                                                            */
/* ------------------------------------------------------------------ */
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let c = 0;
    const step = Math.max(1, Math.floor(value / 30));
    const id = setInterval(() => {
      c += step;
      if (c >= value) { setCount(value); clearInterval(id); } else setCount(c);
    }, 25);
    return () => clearInterval(id);
  }, [inView, value]);

  return <span ref={ref} className="bg-clip-text text-transparent" style={{ backgroundImage: GRADIENT }}>{count}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/*  GradientText helper                                                */
/* ------------------------------------------------------------------ */
function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`bg-clip-text text-transparent ${className}`} style={{ backgroundImage: GRADIENT }}>{children}</span>;
}

/* ================================================================== */
/*  Data                                                               */
/* ================================================================== */
const features = [
  { icon: Bell, title: "Smart Reminders", desc: "Never miss a moment. Get notified via email or WhatsApp before every event, automatically.", color: "#6366f1" },
  { icon: Calendar, title: "Beautiful Calendar", desc: "Visualize your entire schedule in a stunning monthly view with quick-access event details.", color: "#8b5cf6" },
  { icon: Sparkles, title: "AI-Powered", desc: "Describe events in plain English. Athena understands and schedules them for you — coming soon.", color: "#ec4899" },
];

const steps = [
  { num: "01", title: "Create an account", desc: "Sign up free in under 60 seconds. No credit card required." },
  { num: "02", title: "Add your events", desc: "Type naturally or use the form. Athena organizes everything beautifully." },
  { num: "03", title: "Get reminded", desc: "Receive smart reminders via email or WhatsApp before every event." },
];

const testimonials = [
  { quote: "Athena completely changed how I manage my week. The WhatsApp reminders are a game changer.", name: "Priya S.", role: "Product Manager", initials: "PS" },
  { quote: "I've tried every calendar app. Athena is the first one that actually feels intelligent.", name: "Arjun M.", role: "Founder", initials: "AM" },
  { quote: "Setup took 2 minutes. Now I never miss a meeting. Simple and beautiful.", name: "Neha R.", role: "Designer", initials: "NR" },
];

const stats = [
  { value: 10000, suffix: "+", label: "Events Created" },
  { value: 98, suffix: "%", label: "On-time Reminders" },
  { value: 3, suffix: "", label: "Channels — Email, WhatsApp, SMS" },
  { value: 2, suffix: "", label: "Minutes to Set Up" },
];

const freeFeatures = ["Up to 20 events/month", "Email reminders", "Calendar view", "Basic support"];
const proFeatures = ["Unlimited events", "WhatsApp + Email reminders", "AI natural language input", "Priority support", "Custom notification times"];

/* ================================================================== */
/*  Landing Page                                                       */
/* ================================================================== */
export default function LandingPage() {
  const typedText = useTypewriter(PHRASES);
  const speakAthena = useSpeakAthena();
  const navVisible = useNavbarVisible();

  const cardStyle = "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm rounded-2xl";
  const btnGradient = "text-white font-semibold rounded-full px-8 py-3 transition-all duration-200 active:scale-95 cursor-pointer";

  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      {/* Ambient mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]" style={{
        background: "radial-gradient(ellipse at 20% 20%, #6366f1, transparent 50%), radial-gradient(ellipse at 80% 80%, #ec4899, transparent 50%), radial-gradient(ellipse at 50% 50%, #8b5cf6, transparent 60%)",
      }} />

      {/* ---- NAVBAR ---- */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: navVisible ? 0 : -80 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b border-white/10"
        style={{ background: "rgba(0,0,0,0.4)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "#f59e0b" }} />
            <span className="font-bold text-lg bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #f59e0b, #d97706)" }}>Athena</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-[#94a3b8] hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-[#94a3b8] hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="text-[#94a3b8] hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#94a3b8] hover:text-white transition-colors hidden sm:block">Sign in</Link>
            <Link
              to="/login"
              className={`${btnGradient} text-sm px-5 py-2`}
              style={{ backgroundImage: GRADIENT, boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ---- HERO ---- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <ConstellationCanvas />
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #6366f1, #8b5cf6, transparent)" }} />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm text-[#e2e8f0] border border-[rgba(255,255,255,0.1)]"
              style={{ background: "rgba(255,255,255,0.05)", animation: "shimmer 3s ease-in-out infinite" }}
            >
              <span style={{ backgroundImage: GRADIENT }} className="bg-clip-text text-transparent font-medium">✦ AI-Powered Event Assistant</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter"
            style={{ textShadow: "0 0 80px rgba(99,102,241,0.3)" }}
          >
            <GradientText>Athena</GradientText>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-5 text-xl text-[#94a3b8]">
            Your personal AI event assistant
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-4 h-8 text-lg text-[#cbd5e1]">
            {typedText}<span className="inline-block w-[2px] h-5 ml-0.5 align-text-bottom animate-pulse" style={{ background: "#8b5cf6" }} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login" className={btnGradient} style={{ backgroundImage: GRADIENT, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}>
              Get Started Free
            </Link>
            <a href="#features" className={`${btnGradient} border border-white/20 bg-transparent hover:bg-white/5`}>
              See how it works
            </a>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={speakAthena}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-[#94a3b8] border border-white/10 hover:border-white/20 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <Volume2 className="w-4 h-4" style={{ color: "#8b5cf6" }} />
            🎙 Meet Athena
          </motion.button>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5 text-[#94a3b8]" />
          </motion.div>
        </motion.div>
      </section>

      {/* ---- SOCIAL PROOF ---- */}
      <section className="relative z-10 border-y border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-16 px-4">
          {stats.map((s, i) => (
            <Anim key={i} delay={i * 0.1} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold">
                {s.value === 3 ? <GradientText>{s.value}</GradientText> :
                 s.value === 2 ? <><GradientText>{"<"} {s.value}</GradientText></> :
                 <Counter value={s.value} suffix={s.suffix} />}
              </div>
              <p className="text-sm text-[#64748b] mt-1">{s.label}</p>
            </Anim>
          ))}
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section id="features" className="relative z-10 py-24 px-4">
        <Anim className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything you need</h2>
          <p className="mt-3 text-[#94a3b8] max-w-lg mx-auto">Athena keeps your schedule organized so you can focus on what matters.</p>
        </Anim>
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <Anim key={f.title} delay={i * 0.12}>
              <div className="rounded-2xl p-10 group hover:border-[rgba(255,255,255,0.25)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)", boxShadow: `0 0 0px ${f.color}00` }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 50px ${f.color}25`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 0px ${f.color}00`)}
              >
                <div className="absolute top-0 inset-x-0 h-[2px]" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6 border" style={{ borderColor: `${f.color}40`, boxShadow: `0 0 20px ${f.color}99` }}>
                  <f.icon className="w-7 h-7" style={{ color: f.color }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{f.desc}</p>
              </div>
            </Anim>
          ))}
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section id="how-it-works" className="relative z-10 py-24 px-4">
        <Anim className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Up and running in minutes</h2>
        </Anim>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 relative">
          {/* Dashed connecting line on desktop */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-[1px] border-t border-dashed border-white/10" />
          {steps.map((s, i) => (
            <Anim key={s.num} delay={i * 0.15} className="relative text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[80px] font-black leading-none opacity-[0.04] pointer-events-none select-none" style={{ backgroundImage: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.num}</div>
              <div className="relative w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 border border-white/10" style={{ backgroundImage: GRADIENT, boxShadow: "0 0 30px rgba(99,102,241,0.15)" }}>
                <span className="text-white font-bold text-lg">{s.num}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{s.desc}</p>
            </Anim>
          ))}
        </div>
      </section>

      {/* ---- TESTIMONIALS ---- */}
      <section className="relative z-10 py-24 px-4">
        <Anim className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Loved by people who value their time</h2>
        </Anim>
        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <Anim key={t.name} delay={i * 0.12}>
              <div className={`${cardStyle} p-8`}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[#e2e8f0] text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundImage: GRADIENT }}>{t.initials}</div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-[#64748b] text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            </Anim>
          ))}
        </div>
      </section>

      {/* ---- PRICING ---- */}
      <section id="pricing" className="relative z-10 py-24 px-4">
        <Anim className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, honest pricing</h2>
        </Anim>
        <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
          {/* Free */}
          <Anim>
            <div className={`${cardStyle} p-8 flex flex-col h-full`}>
              <p className="text-[#94a3b8] text-sm font-medium mb-1">Free forever</p>
              <p className="text-4xl font-bold text-white mb-6">$0</p>
              <ul className="space-y-3 mb-8 flex-1">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                    <Check className="w-4 h-4 text-[#6366f1] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className={`${btnGradient} text-center`} style={{ backgroundImage: GRADIENT }}>
                Get Started Free
              </Link>
            </div>
          </Anim>
          {/* Pro */}
          <Anim delay={0.12}>
            <div className={`relative p-8 rounded-2xl backdrop-blur-sm flex flex-col h-full border`} style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(139,92,246,0.3)", boxShadow: "0 0 60px rgba(139,92,246,0.1)" }}>
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundImage: GRADIENT }}>Most Popular</span>
              </div>
              <p className="text-[#94a3b8] text-sm font-medium mb-1">Pro</p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl font-bold text-white">$5</p>
                <span className="text-[#64748b] text-sm">/mo</span>
              </div>
              <span className="inline-block mb-6 px-2 py-0.5 rounded text-xs font-medium" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Coming Soon</span>
              <ul className="space-y-3 mb-8 flex-1">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                    <Check className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button className={`${btnGradient} border border-white/20 bg-transparent hover:bg-white/5 text-center w-full`}>
                Join Waitlist
              </button>
            </div>
          </Anim>
        </div>
      </section>

      {/* ---- CTA BANNER ---- */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto rounded-2xl p-12 text-center relative overflow-hidden" style={{ backgroundImage: GRADIENT }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')" }} />
          <h2 className="text-3xl sm:text-4xl font-bold text-white relative">Start organizing your life with Athena</h2>
          <p className="mt-3 text-white/80 relative">Free forever. No credit card required.</p>
          <Link to="/login" className="mt-8 inline-block rounded-full px-8 py-3 font-semibold transition-all duration-200 active:scale-95 relative" style={{ background: "white" }}>
            <GradientText className="font-semibold">Get Started Free</GradientText>
          </Link>
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: "#f59e0b" }} />
              <span className="font-bold text-lg bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #f59e0b, #d97706)" }}>Athena</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#features" className="text-[#64748b] hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-[#64748b] hover:text-white transition-colors">How it works</a>
              <a href="#pricing" className="text-[#64748b] hover:text-white transition-colors">Pricing</a>
              <Link to="/login" className="text-[#64748b] hover:text-white transition-colors">Sign in</Link>
            </div>
            <div className="flex items-center gap-4">
              <Github className="w-5 h-5 text-[#64748b] hover:text-white transition-colors cursor-pointer" />
              <Twitter className="w-5 h-5 text-[#64748b] hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>
          <p className="text-center text-sm text-[#475569]">© 2026 Athena. Built for humans, powered by AI.</p>
        </div>
      </footer>

      {/* Shimmer keyframe */}
      <style>{`@keyframes shimmer { 0%,100%{opacity:0.8} 50%{opacity:1} }`}</style>
    </div>
  );
}
