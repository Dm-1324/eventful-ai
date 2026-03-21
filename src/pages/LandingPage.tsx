import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Bell, Calendar, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Three.js constellation background                                  */
/* ------------------------------------------------------------------ */
function ConstellationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;                       // WebGL unavailable → CSS fallback shows
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    // --- nodes ---
    const COUNT = 120;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT * 3; i++) positions[i] = (Math.random() - 0.5) * 10;

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: new THREE.Color("hsl(38, 44%, 60%)"),
      size: 0.06,
      transparent: true,
      opacity: 0.85,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodes);

    // --- lines ---
    const linePositions: number[] = [];
    const THRESHOLD = 1.8;
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
      color: new THREE.Color("hsl(38, 44%, 60%)"),
      transparent: true,
      opacity: 0.12,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // --- animate ---
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      nodes.rotation.y += 0.0008;
      nodes.rotation.x += 0.0003;
      scene.children.forEach((c) => {
        if (c instanceof THREE.LineSegments) {
          c.rotation.y = nodes.rotation.y;
          c.rotation.x = nodes.rotation.x;
        }
      });
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
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, hsl(38 44% 60% / 0.06), transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(222 43% 30% / 0.08), transparent 60%)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Typewriter hook                                                    */
/* ------------------------------------------------------------------ */
const PHRASES = [
  "Never miss a meeting.",
  "Smart reminders, beautifully designed.",
  "Your events, your way.",
];

function useTypewriter(phrases: string[], typingSpeed = 50, pause = 3000) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const phrase = phrases[phraseIdx];
    let charIdx = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!deleting) {
        charIdx++;
        setText(phrase.slice(0, charIdx));
        if (charIdx === phrase.length) {
          timeout = setTimeout(() => { deleting = true; tick(); }, pause);
          return;
        }
      } else {
        charIdx--;
        setText(phrase.slice(0, charIdx));
        if (charIdx === 0) {
          setPhraseIdx((prev) => (prev + 1) % phrases.length);
          return;
        }
      }
      timeout = setTimeout(tick, deleting ? 30 : typingSpeed);
    };
    tick();
    return () => clearTimeout(timeout);
  }, [phraseIdx, phrases, typingSpeed, pause]);

  return text;
}

/* ------------------------------------------------------------------ */
/*  Speech                                                             */
/* ------------------------------------------------------------------ */
function useSpeakAthena() {
  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(
      "Hi, I'm Athena, your personal event assistant. I'll help you organize your schedule, send smart reminders, and keep your world running smoothly.",
    );
    const voices = speechSynthesis.getVoices();
    const female = voices.find(
      (v) => /female|samantha|karen|victoria|zira/i.test(v.name),
    );
    if (female) utterance.voice = female;
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
  }, []);
  return speak;
}

/* ------------------------------------------------------------------ */
/*  Feature cards data                                                 */
/* ------------------------------------------------------------------ */
const features = [
  { icon: Bell, title: "Smart Reminders", desc: "Get notified before every event via email or WhatsApp — never miss what matters." },
  { icon: Calendar, title: "Beautiful Calendar", desc: "A clean, interactive monthly view with event dots and quick-access side panels." },
  { icon: Sparkles, title: "AI-Powered", desc: "Intelligent scheduling suggestions and natural language event creation." },
] as const;

/* ------------------------------------------------------------------ */
/*  AnimatedSection                                                    */
/* ------------------------------------------------------------------ */
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================== */
/*  Landing Page                                                       */
/* ================================================================== */
export default function LandingPage() {
  const typedText = useTypewriter(PHRASES);
  const speakAthena = useSpeakAthena();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-background text-foreground">
      {/* ---- HERO ---- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <ConstellationCanvas />

        {/* overlay content */}
        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl sm:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
          >
            Athena
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            Your personal AI event assistant
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 h-8 text-foreground/80 font-medium"
          >
            {typedText}
            <span className="inline-block w-[2px] h-5 bg-primary ml-0.5 align-text-bottom animate-pulse" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link to="/login">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" onClick={scrollToFeatures}>
              See how it works
            </Button>
          </motion.div>
        </div>

        {/* Meet Athena pill */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4, duration: 0.4 }}
          onClick={speakAthena}
          className="absolute bottom-8 right-8 z-20 glass-card pill gap-2 px-5 py-2.5 text-sm font-medium text-foreground hover-lift cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-primary" />
          🎙 Meet Athena
        </motion.button>
      </section>

      {/* ---- FEATURES ---- */}
      <section ref={featuresRef} className="py-24 px-4">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">Everything you need</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Athena keeps your schedule organized so you can focus on what matters.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <AnimatedSection key={f.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.45 }}
                className="glass-card rounded-lg p-8 text-center hover-lift"
              >
                <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        <p>© 2026 Athena</p>
        <p className="mt-1">Built for humans, powered by AI</p>
      </footer>
    </div>
  );
}
