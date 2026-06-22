"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { APP_TAGLINE } from "@/lib/constants/branding";

const utilityLinks = [
  { label: "Soy candidato", href: "/candidatos" },
  { label: "Plataforma ATS", href: "#servicios" },
  { label: "Soporte", href: "#contacto" },
  { label: "Acceso reclutadores", href: "/login" },
];

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Soy candidato", href: "/candidatos" },
  { label: "Servicios", href: "#servicios" },
  { label: "Novedades", href: "#novedades" },
  { label: "Acceso", href: "/login" },
];

const slides = [
  {
    title: "Reclutamiento potenciado por IA",
    desc: "Parsea CVs automáticamente, evalúa candidatos y acelera tu proceso de selección.",
    cta: "Comenzar ahora",
    href: "/register",
    bg: "from-[#1a3a5c] to-[#2d5a87]",
    image: "/hero/IA.jpg",
    imageAlt: "Análisis de CVs con inteligencia artificial",
  },
  {
    title: "Ranking semántico de candidatos",
    desc: "Ordena perfiles por afinidad con la vacante usando embeddings y análisis inteligente.",
    cta: "Ver demo",
    href: "/login",
    bg: "from-[#1e4d6e] to-[#3a7ca5]",
    image: "/hero/candidatos.jpg",
    imageAlt: "Ranking de candidatos por afinidad semántica",
  },
  {
    title: "Pipeline visual de selección",
    desc: "Gestiona etapas, mueve candidatos y mantén control total del proceso de contratación.",
    cta: "Ingresar al panel",
    href: "/dashboard",
    bg: "from-[#16324f] to-[#286090]",
    image: "/hero/pipeline.jpg",
    imageAlt: "Pipeline visual de etapas de selección",
  },
];

const quickLinks = [
  { label: "Soy candidato", href: "/candidatos", icon: "🎯" },
  { label: "Subir CV", href: "/upload", icon: "📄" },
  { label: "Vacantes", href: "/jobs", icon: "💼" },
  { label: "Pipeline", href: "/pipeline", icon: "🔄" },
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Crear cuenta", href: "/register", icon: "✨" },
];

const services = [
  {
    title: "Portal de candidatos",
    desc: "Aplica a vacantes abiertas, elige tu reclutador y carga tu CV en línea.",
    href: "/candidatos",
    icon: "🎯",
  },
  {
    title: "Análisis con IA",
    desc: "Evaluación automática de CVs con clasificación de seniority y detección de riesgos.",
    href: "/upload",
    icon: "🤖",
  },
  {
    title: "Ranking inteligente",
    desc: "Ordena candidatos por afinidad semántica respecto a los requisitos de cada vacante.",
    href: "/candidates",
    icon: "📊",
  },
  {
    title: "Pipeline de selección",
    desc: "Visualiza y gestiona etapas: aplicado, evaluación, entrevista, contratado.",
    href: "/pipeline",
    icon: "🔄",
  },
  {
    title: "Gestión de vacantes",
    desc: "Crea y administra posiciones abiertas con requisitos técnicos detallados.",
    href: "/jobs",
    icon: "💼",
  },
  {
    title: "Métricas en tiempo real",
    desc: "Dashboard con indicadores de vacantes, candidatos y distribución por etapa.",
    href: "/dashboard",
    icon: "📈",
  },
  {
    title: "Perfil personalizable",
    desc: "Foto de perfil, datos personales y cambio de contraseña en un solo lugar.",
    href: "/settings",
    icon: "👤",
  },
];

const news = [
  {
    date: "Jun 2026",
    category: "Plataforma",
    title: "Análisis IA en segundo plano para cargas más rápidas",
    excerpt: "Los CVs se registran al instante; la evaluación con Gemini continúa en background.",
  },
  {
    date: "Jun 2026",
    category: "Seguridad",
    title: "Nuevo panel de perfil con cambio de contraseña",
    excerpt: "Personaliza tu cuenta, sube tu foto y actualiza tu contraseña desde Mi perfil.",
  },
  {
    date: "Jun 2026",
    category: "Rendimiento",
    title: "Consultas optimizadas y carga directa desde servidor",
    excerpt: "Dashboard, vacantes y pipeline cargan sin esperar APIs intermedias.",
  },
];

export function HomePage() {
  const [slide, setSlide] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const current = slides[slide];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Barra superior — estilo institucional Las Condes */}
      <div className="bg-[var(--institutional)] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 justify-center sm:justify-end">
          {utilityLinks.map((l) => (
            <Link key={l.label} href={l.href} className="hover:underline opacity-90">
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Header principal */}
      <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-semibold text-[var(--institutional)] hover:bg-[var(--institutional-light)] rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle variant="compact" className="ml-1" />
            <Link href="/register">
              <Button size="sm" className="ml-2">Registrarse</Button>
            </Link>
            <Link href="/candidatos">
              <Button size="sm" variant="secondary" className="ml-1 border-[var(--accent)] text-[var(--accent)]">
                Postular
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle variant="compact" />
            <button
            type="button"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--institutional-light)] text-[var(--institutional)]"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Menú"
          >
            ☰
          </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-[var(--border)] px-4 py-3 space-y-1 bg-[var(--surface)]">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block px-3 py-2.5 text-sm font-semibold text-[var(--institutional)] rounded-lg hover:bg-[var(--institutional-light)]"
                onClick={() => setMobileMenu(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/register" onClick={() => setMobileMenu(false)}>
              <Button size="sm" className="w-full mt-2">Registrarse</Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero carousel */}
      <section className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-gradient-to-r ${current.bg} text-white`}
          >
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <p className="text-xs uppercase tracking-widest text-white/70 mb-3">
                  {APP_TAGLINE}
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                  {current.title}
                </h1>
                <p className="text-white/80 text-base md:text-lg mb-8 max-w-lg leading-relaxed">
                  {current.desc}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/candidatos">
                    <Button size="lg" className="bg-white text-[var(--institutional)] hover:bg-white/90 shadow-lg">
                      Soy candidato
                    </Button>
                  </Link>
                  <Link href={current.href}>
                    <Button size="lg" variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                      {current.cta}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                      Iniciar sesión
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="order-1 md:order-2 flex justify-center">
                <motion.div
                  key={current.image}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45 }}
                  className="relative w-full max-w-[280px] sm:max-w-[320px] md:w-80 md:max-w-none aspect-square rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20"
                >
                  <Image
                    src={current.image}
                    alt={current.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 280px, 320px"
                    priority={slide === 0}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === slide ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Portal de candidatos — destacado arriba */}
      <section
        id="candidatos"
        className="relative overflow-hidden bg-gradient-to-br from-[var(--institutional-light)] via-white to-[var(--accent-soft)]/30 border-b border-[var(--border)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-bold uppercase tracking-wider mb-4">
                Para candidatos
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--institutional)] leading-tight mb-4">
                Postula en minutos a tu próxima oportunidad laboral
              </h2>
              <p className="text-[var(--foreground-muted)] leading-relaxed mb-6 max-w-lg">
                Explora vacantes abiertas, elige al reclutador que te acompañará en el proceso
                y envía tu CV para ser evaluado en el puesto que buscas.
              </p>
              <Link href="/candidatos">
                <Button size="lg" className="shadow-lg">
                  Ver vacantes y postular →
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid gap-3"
            >
              {[
                { n: "1", title: "Elige tu vacante", desc: "Tarjetas con las posiciones abiertas" },
                { n: "2", title: "Elige tu reclutador", desc: "Quién gestionará tu proceso" },
                { n: "3", title: "Tus datos y CV", desc: "Contacto y carga del currículum" },
              ].map((item, i) => (
                <div
                  key={item.n}
                  className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                  style={{ marginLeft: i * 12 }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--institutional)] text-white font-bold">
                    {item.n}
                  </span>
                  <div>
                    <p className="font-bold text-[var(--institutional)]">{item.title}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="bg-[var(--institutional-light)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {quickLinks.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="flex shrink-0 items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--institutional)] hover:shadow-md hover:border-[var(--institutional)]/30 transition-all"
              >
                <span>{q.icon}</span>
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--institutional)]">
            Servicios de la plataforma
          </h2>
          <p className="text-[var(--foreground-muted)] mt-2 max-w-xl mx-auto">
            Herramientas diseñadas para optimizar cada etapa de tu proceso de reclutamiento
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:shadow-lg hover:border-[var(--institutional)]/20 transition-all"
            >
              <span className="text-3xl">{s.icon}</span>
              <h3 className="font-bold text-lg mt-4 text-[var(--institutional)]">{s.title}</h3>
              <p className="text-sm text-[var(--foreground-muted)] mt-2 leading-relaxed">{s.desc}</p>
              <Link
                href={s.href}
                className="inline-flex mt-4 text-sm font-bold text-[var(--accent)] group-hover:underline"
              >
                Ingresar →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Banners CTA */}
      <section className="bg-[var(--institutional)] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
              Tus trámites de manera más simple
            </h2>
            <p className="text-white/75 leading-relaxed">
              Centraliza vacantes, candidatos y evaluaciones en un solo lugar. Sube CVs, revisa rankings y gestiona tu pipeline sin complicaciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/candidatos">
              <Button size="lg" className="bg-white text-[var(--institutional)] hover:bg-white/90">
                Soy candidato
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Acceso reclutadores
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Novedades */}
      <section id="novedades" className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--institutional)]">
              Plataforma al día
            </h2>
            <p className="text-[var(--foreground-muted)] mt-1 text-sm">
              Novedades y mejoras recientes
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {news.map((n) => (
            <article
              key={n.title}
              className="rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-2 bg-gradient-to-r from-[var(--institutional)] to-[var(--accent)]" />
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] mb-2">
                  <span>{n.date}</span>
                  <span>·</span>
                  <span className="font-semibold text-[var(--institutional)]">{n.category}</span>
                </div>
                <h3 className="font-bold text-[var(--foreground)] leading-snug">{n.title}</h3>
                <p className="text-sm text-[var(--foreground-muted)] mt-2 line-clamp-3">{n.excerpt}</p>
                <span className="inline-block mt-3 text-sm font-semibold text-[var(--accent)]">
                  Seguir leyendo →
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-[#0f2438] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Logo size="sm" variant="light" />
            <p className="text-white/60 text-sm mt-4 leading-relaxed">
              Plataforma ATS con inteligencia artificial para gestión de talento.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Acceso</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/candidatos" className="hover:text-white">Portal de candidatos</Link></li>
              <li><Link href="/login" className="hover:text-white">Iniciar sesión</Link></li>
              <li><Link href="/register" className="hover:text-white">Registrarse</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Servicios</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/jobs" className="hover:text-white">Vacantes</Link></li>
              <li><Link href="/upload" className="hover:text-white">Cargar CV</Link></li>
              <li><Link href="/pipeline" className="hover:text-white">Pipeline</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Soporte</h4>
            <p className="text-sm text-white/70">
              Venesoft · AI Recruitment ATS
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 text-center text-xs text-white/40 py-4">
          © {new Date().getFullYear()} AI Recruit Platform. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
