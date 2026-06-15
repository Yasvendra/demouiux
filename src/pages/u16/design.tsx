import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentAlt?: string
  accentGlow?: string
  surface?: string
  panel?: string
}

interface LensMetric {
  value?: string
  unit?: string
  label?: string
}

interface LensModule {
  id: string
  code?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: LensMetric
}

interface DualLensData {
  label?: string
  headline?: string
  legacyTag?: string
  innovationTag?: string
  defaultActive?: string
  autoCycle?: boolean
  autoCycleMs?: number
  hint?: string
  modules?: LensModule[]
}

interface DesignPageData {
  theme?: ThemeData
  dualLens?: DualLensData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeModules(modules?: LensModule[]): LensModule[] {
  return (modules ?? []).filter((m): m is LensModule => Boolean(trim(m?.id)))
}

function resolveDefault(modules: LensModule[], preferred?: string): string {
  const id = trim(preferred)
  if (id && modules.some((m) => m.id === id)) return id
  return modules[0]?.id ?? ''
}

function moduleTitle(mod?: LensModule | null): string {
  return trim(mod?.title) || trim(mod?.id) || 'Module'
}

function moduleAlt(mod?: LensModule | null): string {
  return trim(mod?.alt) || moduleTitle(mod)
}

function moduleCode(mod: LensModule, index: number): string {
  return trim(mod.code) || String(index + 1).padStart(2, '0')
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'lens'}/1600/900`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 7800): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

/* ─── Vertical typography nav (left edge) ─── */

function TypoNav({
  modules,
  activeId,
  accent,
  accentAlt,
  reduceMotion,
  onSelect,
}: {
  modules: LensModule[]
  activeId: string
  accent: string
  accentAlt: string
  reduceMotion: boolean
  onSelect: (id: string) => void
}) {
  return (
    <nav className="hidden shrink-0 flex-col gap-1 border-r border-white/[0.06] pr-6 lg:flex lg:pr-8">
      {modules.map((mod, i) => {
        const isActive = mod.id === activeId
        const code = moduleCode(mod, i)
        const title = moduleTitle(mod)
        return (
          <motion.button
            key={mod.id}
            type="button"
            onClick={() => onSelect(mod.id)}
            className="group relative flex items-baseline gap-3 py-2.5 text-left"
            whileHover={reduceMotion ? undefined : { x: 4 }}
            aria-current={isActive ? 'true' : undefined}
            aria-label={title}
          >
            {isActive && (
              <motion.span
                className="absolute -left-6 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-full"
                style={{ background: `linear-gradient(to bottom, ${accent}, ${accentAlt})` }}
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className="text-lg font-bold tabular-nums sm:text-xl"
              style={{ color: isActive ? accent : 'rgba(255,255,255,0.2)' }}
            >
              {code}
            </span>
            <span
              className="max-w-[9rem] truncate text-xs font-medium uppercase tracking-wide sm:text-sm"
              style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.3)' }}
            >
              {title.split(' ').slice(0, 2).join(' ')}
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}

/* ─── Mobile module strip ─── */

function MobileNav({
  modules,
  activeId,
  accent,
  onSelect,
}: {
  modules: LensModule[]
  activeId: string
  accent: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
      {modules.map((mod, i) => {
        const isActive = mod.id === activeId
        return (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelect(mod.id)}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold tabular-nums"
            style={{
              background: isActive ? `${accent}28` : 'rgba(255,255,255,0.05)',
              color: isActive ? accent : 'rgba(255,255,255,0.4)',
              border: `1px solid ${isActive ? `${accent}55` : 'rgba(255,255,255,0.08)'}`,
            }}
            aria-current={isActive ? 'true' : undefined}
          >
            {moduleCode(mod, i)}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Draggable comparison lens ─── */

function ComparisonLens({
  mod,
  legacyTag,
  innovationTag,
  accent,
  accentAlt,
  panelBg,
  reduceMotion,
  resetKey,
}: {
  mod: LensModule
  legacyTag: string
  innovationTag: string
  accent: string
  accentAlt: string
  panelBg: string
  reduceMotion: boolean
  resetKey: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rawPos = useMotionValue(50)
  const dividerPos = useSpring(rawPos, {
    stiffness: reduceMotion ? 500 : 220,
    damping: reduceMotion ? 50 : 28,
  })
  const [dragging, setDragging] = useState(false)

  const img = trim(mod.image) || imageFallback(mod.id)
  const title = moduleTitle(mod)
  const description = trim(mod.description)
  const link = trim(mod.link)
  const metric = mod.metric
  const metricValue = trim(metric?.value)
  const metricUnit = trim(metric?.unit)
  const metricLabel = trim(metric?.label)

  const clipRight = useTransform(dividerPos, (v) => `inset(0 0 0 ${v}%)`)
  const handleLeft = useTransform(dividerPos, (v) => `${v}%`)

  useEffect(() => {
    rawPos.set(50)
  }, [resetKey, rawPos])

  const pctFromClientX = (clientX: number) => {
    const el = containerRef.current
    if (!el) return 50
    const rect = el.getBoundingClientRect()
    return Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100))
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    rawPos.set(pctFromClientX(e.clientX))
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    rawPos.set(pctFromClientX(e.clientX))
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <motion.div
      key={mod.id}
      className="relative w-full"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease }}
    >
      <div
        ref={containerRef}
        className="relative aspect-[16/10] cursor-ew-resize touch-none select-none overflow-hidden rounded-2xl border border-white/[0.08] sm:rounded-3xl"
        style={{ background: panelBg }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setDragging(false)}
        role="slider"
        aria-valuemin={8}
        aria-valuemax={92}
        aria-label="Comparison lens — drag to reveal"
      >
        {/* Legacy layer — grayscale + dim (full width under) */}
        <div className="absolute inset-0">
          <img
            src={img}
            alt=""
            className="h-full w-full scale-105 object-cover grayscale brightness-[0.45] contrast-90"
            aria-hidden
            onError={(e) => {
              e.currentTarget.src = imageFallback(mod.id)
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
          <span className="absolute left-4 top-4 rounded-md bg-black/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/50 backdrop-blur-sm sm:left-6 sm:top-6">
            {legacyTag || 'Before'}
          </span>
        </div>

        {/* Innovation layer — full color, clipped from divider right */}
        <motion.div className="absolute inset-0" style={{ clipPath: clipRight }}>
          <img
            src={img}
            alt={moduleAlt(mod)}
            className="h-full w-full scale-105 object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = imageFallback(mod.id)
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accent}18 0%, transparent 50%)`,
            }}
          />
          <span
            className="absolute right-4 top-4 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm sm:right-6 sm:top-6"
            style={{ background: `${accent}44`, color: '#fff' }}
          >
            {innovationTag || 'After'}
          </span>
        </motion.div>

        {/* Divider handle */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 z-20 w-0.5"
          style={{
            left: handleLeft,
            background: `linear-gradient(to bottom, transparent, ${accent}, ${accentAlt}, transparent)`,
            boxShadow: dragging
              ? `0 0 24px ${accent}, 0 0 48px ${accentAlt}66`
              : `0 0 12px ${accent}88`,
          }}
        >
          <motion.div
            className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12"
            style={{
              borderColor: accent,
              background: `${panelBg}ee`,
              color: accent,
            }}
            animate={dragging ? { scale: 1.12 } : { scale: 1 }}
            whileHover={reduceMotion ? undefined : { scale: 1.08 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8 6v12M16 6v12M4 12h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Bottom info overlay on image */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-6">
          <h2 className="text-lg font-bold text-white sm:text-xl md:text-2xl">{title}</h2>
          {description && (
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/55 sm:text-sm">{description}</p>
          )}
        </div>

        {/* Metric chip — top center */}
        {metricValue && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-1.5 backdrop-blur-md sm:top-6"
            animate={dragging && !reduceMotion ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, repeat: dragging ? Infinity : 0 }}
          >
            <span className="text-sm font-bold tabular-nums sm:text-base" style={{ color: accentAlt }}>
              {metricValue}
              {metricUnit && <span className="ml-0.5 text-xs text-white/50">{metricUnit}</span>}
            </span>
            {metricLabel && (
              <span className="ml-2 text-[10px] uppercase tracking-wide text-white/40">{metricLabel}</span>
            )}
          </motion.div>
        )}
      </div>

      {link && (
        <motion.a
          href={link}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: accent }}
          whileHover={reduceMotion ? undefined : { gap: 8, x: 4 }}
        >
          Explore capability <span aria-hidden>→</span>
        </motion.a>
      )}
    </motion.div>
  )
}

/* ─── Main: DualLens (single component) ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false

  const theme = data?.theme ?? {}
  const lens = data?.dualLens ?? {}

  const accent = safeColor(theme.accent, '#10B981')
  const accentAlt = safeColor(theme.accentAlt, '#818CF8')
  const accentGlow = safeColor(theme.accentGlow, 'rgba(16, 185, 129, 0.2)')
  const surface = safeColor(theme.surface, '#0C0C0E')
  const panelBg = safeColor(theme.panel, '#141416')

  const modules = safeModules(lens.modules)
  const defaultId = resolveDefault(modules, lens.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(0, modules.findIndex((m) => m.id === activeId))
  const activeModule = modules[activeIndex] ?? modules[0] ?? null

  const autoCycle = lens.autoCycle !== false
  const cycleMs = safeMs(lens.autoCycleMs, 7800)

  const label = trim(lens.label)
  const headline = trim(lens.headline)
  const legacyTag = trim(lens.legacyTag)
  const innovationTag = trim(lens.innovationTag)
  const hint = trim(lens.hint)

  useEffect(() => {
    setActiveId((cur) => (modules.some((m) => m.id === cur) ? cur : defaultId))
  }, [modules, defaultId])

  const selectModule = useCallback(
    (id: string) => {
      if (!trim(id) || !modules.some((m) => m.id === id)) return
      setActiveId(id)
    },
    [modules],
  )

  const goNext = useCallback(() => {
    if (!modules.length) return
    const next = modules[(activeIndex + 1) % modules.length]
    if (next?.id) setActiveId(next.id)
  }, [activeIndex, modules])

  useEffect(() => {
    if (!autoCycle || paused || modules.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(goNext, cycleMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, autoCycle, cycleMs, goNext, modules.length, paused, reduceMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = modules[(activeIndex - 1 + modules.length) % modules.length]
        if (prev?.id) setActiveId(prev.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, goNext, modules])

  if (!modules.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6" style={{ background: surface }}>
        <p className="text-sm text-white/40">No modules available.</p>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-[100svh] px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-1/3 opacity-50"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${accentGlow} 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col lg:flex-row lg:gap-10 xl:gap-14">
        {/* Header block — sits above on mobile, beside nav on desktop */}
        <div className="mb-6 lg:mb-0 lg:hidden">
          {label && (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{label}</p>
          )}
          {headline && <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{headline}</h1>}
          {hint && <p className="mt-2 text-xs text-white/30">{hint}</p>}
        </div>

        <MobileNav modules={modules} activeId={activeId} accent={accent} onSelect={selectModule} />

        <TypoNav
          modules={modules}
          activeId={activeId}
          accent={accent}
          accentAlt={accentAlt}
          reduceMotion={reduceMotion}
          onSelect={selectModule}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-8 hidden lg:block">
            {label && (
              <motion.p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {label}
              </motion.p>
            )}
            {headline && (
              <motion.h1
                className="text-3xl font-bold tracking-tight xl:text-4xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease }}
              >
                {headline}
              </motion.h1>
            )}
            {hint && <p className="mt-3 text-sm text-white/30">{hint}</p>}
          </div>

          <AnimatePresence mode="wait">
            {activeModule && (
              <ComparisonLens
                key={activeModule.id}
                mod={activeModule}
                legacyTag={legacyTag}
                innovationTag={innovationTag}
                accent={accent}
                accentAlt={accentAlt}
                panelBg={panelBg}
                reduceMotion={reduceMotion}
                resetKey={activeModule.id}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
