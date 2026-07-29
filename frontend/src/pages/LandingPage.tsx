// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import weblogo from '@/assets/weblogo.jpeg';
import {
  Zap, Brain, Users, BarChart3, ArrowRight,
  Sparkles, MessageSquare, Target, Code2,
  TrendingUp, DollarSign, ChevronDown,
} from 'lucide-react';

// ── Typing animation ────────────────────────────────────────────────────
const TYPING_TEXTS = [
  'Requirement Analysis',
  'Freelancer Matching',
  'Budget Intelligence',
  'Proposal Intelligence',
  'Project Planning',
  'Progress Monitoring',
];

function useTypingAnimation(texts, speed = 80, pause = 2000) {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentText.length) {
        setDisplayText(currentText.slice(0, charIndex + 1));
        setCharIndex(c => c + 1);
      } else if (!isDeleting && charIndex === currentText.length) {
        setTimeout(() => setIsDeleting(true), pause);
      } else if (isDeleting && charIndex > 0) {
        setDisplayText(currentText.slice(0, charIndex - 1));
        setCharIndex(c => c - 1);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setTextIndex(i => (i + 1) % texts.length);
      }
    }, isDeleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed, pause]);

  return displayText;
}

// ── Soft glow sprite texture (canvas-generated radial gradient) ─────────
function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ── Project keywords, deduplicated, used as the floating word cloud ──────
const CLOUD_WORDS = [
  'AI', 'AgentVerse', 'Freelancing', 'Client', 'Freelancer', 'Project',
  'Innovation', 'Automation', 'Intelligence', 'Matching', 'Requirement',
  'Analysis', 'Planning', 'Budget', 'Proposal', 'Progress', 'Workflow',
  'Assignment', 'Dashboard', 'OpenRouter', 'Python', 'FastAPI', 'React',
  'TypeScript', 'PostgreSQL', 'JWT', 'Authentication', 'Database', 'API',
  'Frontend', 'Backend', 'Cloud', 'Deployment', 'GitHub', 'Repository',
  'Coding', 'Developer', 'Software', 'Engineering', 'Technology',
  'Algorithm', 'Recommendation', 'Roadmap', 'Milestone', 'Timeline',
  'Deadline', 'Quality', 'Tracking', 'Monitoring', 'Analytics',
  'Productivity', 'Collaboration', 'Communication', 'Efficiency',
  'Reliability', 'Scalability', 'Performance', 'Architecture', 'AI Agent',
  'LLM', 'Gemini', 'OpenAI', 'Prompt', 'Reasoning', 'Decision', 'Insights',
  'Optimization', 'Integration', 'Experience', 'Skills', 'Expertise',
  'Portfolio', 'Opportunity', 'Career', 'Startup', 'Future', 'Digital',
  'Platform', 'Success', 'Growth', 'Strategy', 'Security', 'DevOps',
  'Testing', 'Achievement', 'Excellence', 'Vision', 'Creative',
  'Professional', 'Trusted', 'Smart', 'Dynamic', 'Responsive', 'NextGen',
  'Intelligent',
];

// vibrant, varied palette — cycled with a shuffled offset per word so
// neighbouring words rarely share a color
const WORD_COLORS = [
  '#60a5fa', '#c084fc', '#34d399', '#fbbf24', '#f472b6', '#38bdf8',
  '#a78bfa', '#4ade80', '#fb923c', '#2dd4bf', '#f87171', '#818cf8',
];

// ── Canvas-rendered glowing text texture for one word ─────────────────────
function makeWordTexture(text, color) {
  const scale = 3; // supersample for crisp text on a sprite
  const fontSize = 42 * scale;
  const font = `700 ${fontSize}px 'Segoe UI', Arial, sans-serif`;

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  mctx.font = font;
  const textWidth = mctx.measureText(text).width;

  const padX = fontSize * 0.6;
  const padY = fontSize * 0.6;
  const canvas = document.createElement('canvas');
  canvas.width = textWidth + padX * 2;
  canvas.height = fontSize + padY * 2;
  const ctx = canvas.getContext('2d');

  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // soft outer glow (reduced so background words stay subtle, not hot)
  ctx.shadowColor = color;
  ctx.shadowBlur = fontSize * 0.28;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);

  // crisp core pass, no bright white boost — keeps text readable but dim
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return { texture, aspect: canvas.width / canvas.height };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// ── Full-page 3D floating keyword-cloud background ────────────────────────
// The product's own vocabulary — AI, AgentVerse, React, FastAPI, Matching,
// Automation, etc. — floats as glowing colorful 3D text on a loose spherical
// cloud around a soft central core. The whole group auto-rotates slowly and
// continuously (a real loop, never resets/jumps), each word also bobs on its
// own gentle phase, and depth-based scale/opacity gives genuine parallax so
// it reads as volumetric rather than a flat wall of tags. Fixed + full
// viewport behind the entire scrollable page; scroll adds a slow dolly so
// the cloud stays present through every section.
function ThreeBackground() {
  const mountRef = useRef(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current = max > 0 ? window.scrollY / max : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const mount = mountRef.current;
    if (!mount) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060a, 0.011);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 500);
    camera.position.set(0, 0, 52);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const glowTex = makeGlowTexture();
    const world = new THREE.Group();
    scene.add(world);

    // ── soft central core: quiet focal point, not the star of the show
    const coreMat = new THREE.SpriteMaterial({
      map: glowTex, color: 0xfbbf24, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const core = new THREE.Sprite(coreMat);
    core.scale.set(5, 5, 1);
    world.add(core);

    // ── sparse background dust for depth texture (kept dim, not distracting)
    const DUST_COUNT = 90;
    const dustGeoPositions = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustGeoPositions[i * 3] = (Math.random() - 0.5) * 140;
      dustGeoPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      dustGeoPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustGeoPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x60a5fa, size: 0.3, transparent: true, opacity: 0.15, sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    world.add(dust);

    // ── the word cloud: words distributed on a loose Fibonacci sphere with
    // radial jitter so it reads as a volume, not a flat shell
    const words = [];
    const BASE_RADIUS = 32;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const count = CLOUD_WORDS.length;

    CLOUD_WORDS.forEach((word, i) => {
      const color = WORD_COLORS[(i * 5 + Math.floor(hashString(word) / 97)) % WORD_COLORS.length];
      const { texture, aspect } = makeWordTexture(word, color);

      const mat = new THREE.SpriteMaterial({
        map: texture, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);

      const h = 2.6 + (hashString(word) % 100) / 100 * 1.4; // 2.6–4.0 world units tall
      sprite.scale.set(h * aspect, h, 1);

      const yFrac = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - yFrac * yFrac));
      const theta = goldenAngle * i;
      const jitter = 0.85 + (hashString(word + 'r') % 100) / 100 * 0.45; // volumetric spread
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      const pos = new THREE.Vector3(x, yFrac, z).multiplyScalar(BASE_RADIUS * jitter);

      sprite.position.copy(pos);
      sprite.userData = {
        basePos: pos.clone(),
        phase: (hashString(word + 'p') % 628) / 100,
        bobSpeed: 0.35 + (hashString(word + 's') % 40) / 100,
        baseOpacity: 0.32 + (hashString(word + 'o') % 30) / 100,
      };

      world.add(sprite);
      words.push(sprite);
    });

    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let frameId;
    let t = 0;
    const clock = new THREE.Clock();
    const cameraWorldPos = new THREE.Vector3();

    const animate = () => {
      const dt = clock.getDelta();
      t += dt;

      // continuous, never-resetting auto-rotation — the "loop"
      world.rotation.y += dt * 0.045;
      dust.rotation.y -= dt * 0.01;

      core.material.opacity = 0.24 + Math.sin(t * 1.5) * 0.1;
      const corePulse = 4.6 + Math.sin(t * 1.5) * 0.5;
      core.scale.set(corePulse, corePulse, 1);

      camera.getWorldPosition(cameraWorldPos);

      words.forEach((sprite) => {
        const { basePos, phase, bobSpeed, baseOpacity } = sprite.userData;
        sprite.position.set(
          basePos.x + Math.sin(t * bobSpeed + phase) * 1.1,
          basePos.y + Math.cos(t * bobSpeed * 0.8 + phase) * 1.1,
          basePos.z + Math.sin(t * bobSpeed * 0.6 + phase) * 1.1
        );

        // depth-based scale/opacity for real parallax: words whose rotated
        // position is nearer the camera read bigger & brighter
        const worldPos = sprite.position.clone().applyMatrix4(world.matrixWorld);
        const dist = worldPos.distanceTo(cameraWorldPos);
        const depthFactor = THREE.MathUtils.clamp(
          THREE.MathUtils.mapLinear(dist, 30, 85, 1.25, 0.55), 0.5, 1.3
        );
        const baseH = sprite.userData.baseHeight || (sprite.userData.baseHeight = sprite.scale.y);
        sprite.scale.set(sprite.scale.x / (sprite.scale.y / baseH) * depthFactor, baseH * depthFactor, 1);
        sprite.material.opacity = baseOpacity * depthFactor;
      });

      // scroll-driven camera dolly, so the cloud stays present through the
      // whole page rather than only near the top
      const s = scrollRef.current;
      const targetZ = 52 - s * 22;
      const targetRotX = s * 0.3;
      camera.position.z += (targetZ - camera.position.z) * 0.04;
      world.rotation.x += (targetRotX - world.rotation.x) * 0.03;

      // mouse parallax
      camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', onScroll);
      renderer.dispose();
      glowTex.dispose();
      coreMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      words.forEach(s => { s.material.map.dispose(); s.material.dispose(); });
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

// ── Data ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Brain, title: 'Requirement Analysis', description: 'AI extracts technologies, skills, features, complexity and timeline from your project description.', badge: 'Phase 1 — Live', tint: '#3b82f6' },
  { icon: Users, title: 'AI Talent Matching', description: 'Intelligent freelancer discovery and ranking based on skills, experience, and project fit.', badge: 'Phase 2 — Live', tint: '#8b5cf6' },
  { icon: DollarSign, title: 'Budget Intelligence', description: 'Calculates market-aligned budget ranges, cost estimates, and financial resource allocation.', badge: 'Phase 3 — Live', tint: '#10b981' },
  { icon: MessageSquare, title: 'Proposal Intelligence', description: 'AI crafts and evaluates project proposals for optimal client-freelancer alignment.', badge: 'Phase 4 — Live', tint: '#f59e0b' },
  { icon: BarChart3, title: 'Project Planning', description: 'AI generates detailed sprint plans, milestones, and project roadmaps automatically.', badge: 'Phase 5 — Live', tint: '#6366f1' },
  { icon: TrendingUp, title: 'Progress Monitoring', description: 'Real-time project health tracking with AI-powered risk detection and alerts.', badge: 'Phase 6 — Live', tint: '#10b981' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Describe Your Project', description: 'Enter your project title, description, budget and timeline.', icon: Code2 },
  { step: '02', title: 'AI Analyses Requirements', description: 'The Requirement Agent extracts tech, skills, features & risks.', icon: Brain },
  { step: '03', title: 'Get Structured Insights', description: 'Receive a full breakdown — tech stack, team size, budget, timeline.', icon: Target },
  { step: '04', title: 'Match & Execute', description: 'Agents discover talent, generate proposals, plan sprints, monitor.', icon: Zap },
];

const STATS = [
  { value: '6', label: 'AI Agents', sub: 'Working in harmony' },
  { value: '< 30s', label: 'Analysis Time', sub: 'Instant AI insights' },
  { value: '100%', label: 'JSON Output', sub: 'Structured & validated' },
  { value: '∞', label: 'Scalability', sub: 'Enterprise-grade' },
];

// ── Main ─────────────────────────────────────────────────────────────────
export default function LandingPage3D() {
  const typingText = useTypingAnimation(TYPING_TEXTS);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: '#05060a', minHeight: '100vh', color: 'white', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden', position: 'relative' }}>
      <ThreeBackground />

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all .3s',
        background: scrolled ? 'rgba(5,6,10,0.75)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={weblogo} alt="Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(139,92,246,0.4)' }} />
            <span style={{ fontWeight: 800, fontSize: 17, background: 'linear-gradient(135deg,#60a5fa,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI FREELANCING PLATFORM</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/freelancer/login" style={navBtnGhost}>Freelancer Login</Link>
            <Link to="/login" style={navBtnPrimary}>Client Sign In</Link>
          </div>
        </div>
      </nav>

      {/* content sits above the fixed 3D canvas; sections are transparent
          (or lightly translucent) so the background reads through the
          entire scroll, not just behind the hero */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 64 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#93c5fd', fontSize: 14, fontWeight: 500, marginBottom: 32 }}>
              <Sparkles size={14} />
              All 6 AI Agents Live & Operational
              <span style={{ width: 8, height: 8, borderRadius: 999, background: '#34d399' }} />
            </div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
              Next Generation<br />
              <span style={{ background: 'linear-gradient(135deg,#60a5fa,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI-Powered</span><br />
              Freelancing Platform
            </h1>

            <div style={{ fontSize: 22, color: '#9ca3af', marginBottom: 24, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>AI automates</span>
              <span style={{ fontWeight: 600, color: '#93c5fd', minWidth: 260, textAlign: 'left' }}>
                {typingText}<span style={{ opacity: 0.7 }}>|</span>
              </span>
            </div>

            <p style={{ color: '#9ca3af', fontSize: 18, maxWidth: 620, margin: '0 auto 48px' }}>
              6 AI agents work together to analyse requirements, discover talent, plan sprints,
              and monitor project quality — all from a single intelligent platform.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Link to="/login" style={{ ...navBtnPrimary, padding: '14px 32px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <Zap size={18} /> Client Login <ArrowRight size={16} />
              </Link>
              <Link to="/freelancer/login" style={{ ...navBtnGhost, padding: '14px 32px', fontSize: 16, border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <Users size={18} /> Freelancer Login <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ marginTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#6b7280' }}>
              <span style={{ fontSize: 12 }}>Scroll to explore</span>
              <ChevronDown size={20} />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section style={{ padding: '48px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5,6,10,0.35)', backdropFilter: 'blur(6px)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 32, textAlign: 'center' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 34, fontWeight: 900, background: 'linear-gradient(135deg,#60a5fa,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
                <div style={{ color: '#9ca3af', fontSize: 12 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding: '96px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800, marginBottom: 12 }}>
                Six Agents.<br />
                <span style={{ background: 'linear-gradient(135deg,#60a5fa,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>One Platform.</span>
              </h2>
              <p style={{ color: '#9ca3af', fontSize: 17, maxWidth: 560, margin: '0 auto' }}>
                Each AI agent specialises in a different phase of the freelancing lifecycle.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{
                  padding: 24, borderRadius: 16,
                  background: `linear-gradient(135deg, ${f.tint}26, rgba(5,6,10,0.55))`,
                  border: `1px solid ${f.tint}40`,
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: f.tint }}>
                      <f.icon size={22} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: `${f.tint}26`, color: f.tint, height: 'fit-content' }}>{f.badge}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: '96px 24px', background: 'rgba(5,6,10,0.4)', backdropFilter: 'blur(6px)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800 }}>
                How <span style={{ background: 'linear-gradient(135deg,#60a5fa,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AgentVerse</span> Works
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(139,92,246,0.3))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <step.icon size={24} color="#60a5fa" />
                    <span style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 999, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '96px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: 48, borderRadius: 24, background: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.12))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Sparkles size={36} color="#60a5fa" style={{ margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, marginBottom: 16 }}>
              Ready to transform<br />
              <span style={{ background: 'linear-gradient(135deg,#60a5fa,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>how you freelance?</span>
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: 32 }}>Join AgentVerse and let AI handle the complexity.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{ ...navBtnPrimary, padding: '14px 32px', textDecoration: 'none' }}>Create Free Account</Link>
              <Link to="/login" style={{ ...navBtnGhost, padding: '14px 32px', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>
        </section>

        <footer style={{ padding: '48px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', color: '#6b7280', fontSize: 13, background: 'rgba(5,6,10,0.4)', backdropFilter: 'blur(6px)' }}>
          © 2024 AgentVerse — live 3D agent network background
        </footer>
      </div>
    </div>
  );
}

const navBtnPrimary = {
  background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
  color: 'white', border: 'none', borderRadius: 10,
  padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
const navBtnGhost = {
  background: 'transparent', color: '#c4b5fd',
  border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10,
  padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
};