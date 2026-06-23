import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  accentWarm?: string
  surface?: string
  panel?: string
}

interface ForgeBadge {
  text?: string
  pulse?: boolean
}

interface ForgeMetric {
  value?: string
  unit?: string
  label?: string
}

interface ForgeModule {
  id: string
  ring?: number
  angle?: number
  icon?: string
  label?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: ForgeMetric
}

interface RippleForgeData {
  badge?: ForgeBadge
  eyebrow?: string
  heading?: string
  headingAccent?: string
  hubLabel?: string
  defaultActive?: string
  autoPulse?: boolean
  autoPulseMs?: number
  modules?: ForgeModule[]
}

interface DesignPageData {
  theme?: ThemeData
  rippleForge?: RippleForgeData
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeModules(modules?: ForgeModule[]): ForgeModule[] {
  return (modules ?? []).filter((m): m is ForgeModule => Boolean(trim(m?.id)))
}

function resolveDefault(modules: ForgeModule[], preferred?: string): string {
  const id = trim(preferred)
  if (id && modules.some((m) => m.id === id)) return id
  return modules[0]?.id ?? ''
}

function moduleLabel(mod?: ForgeModule | null): string {
  return trim(mod?.label) || trim(mod?.title) || trim(mod?.id) || 'Module'
}

function moduleAlt(mod?: ForgeModule | null): string {
  return trim(mod?.alt) || trim(mod?.title) || moduleLabel(mod)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'ripple'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 7000): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 2500)
}

function safeRing(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 1
  return Math.max(1, Math.min(Math.round(value), 3))
}

function safeAngle(value?: number | null, index = 0, total = 1): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return (index / Math.max(total, 1)) * 360
}

function splitHeadline(headline: string, accent?: string) {
  if (!accent) return { before: headline, accent: '', after: '' }
  const index = headline.toLowerCase().indexOf(accent.toLowerCase())
  if (index === -1) return { before: headline, accent: '', after: '' }
  return {
    before: headline.slice(0, index),
    accent: headline.slice(index, index + accent.length),
    after: headline.slice(index + accent.length),
  }
}

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w < 640) return 'mobile'
    if (w < 1024) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 640) setBp('mobile')
      else if (w < 1024) setBp('tablet')
      else setBp('desktop')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return bp
}

function polarToXY(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

/* ─── Icons ─── */

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

/* ─── Radar ripple rings (decorative) ─── */

function RippleRings({
  accent,
  accentSecondary,
  reduceMotion,
  size,
}: {
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  size: number
}) {
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      {[0.28, 0.46, 0.64, 0.82].map((scale, i) => (
        <motion.circle
          key={scale}
          cx={cx}
          cy={cy}
          r={size * scale * 0.5}
          fill="none"
          stroke={i % 2 === 0 ? accent : accentSecondary}
          strokeWidth={1}
          strokeOpacity={0.12 - i * 0.02}
          animate={
            reduceMotion
              ? undefined
              : { strokeOpacity: [0.06, 0.18, 0.06], r: [size * scale * 0.5, size * scale * 0.5 + 4, size * scale * 0.5] }
          }
          transition={{ duration: 3 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      {/* Sweep line */}
      {!reduceMotion && (
        <motion.line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - size * 0.42}
          stroke={accent}
          strokeWidth={1.5}
          strokeOpacity={0.35}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </svg>
  )
}

/* ─── Radar node button ─── */

function RadarNode({
  mod,
  isActive,
  onSelect,
  position,
  accent,
  accentSecondary,
  reduceMotion,
  nodeSize,
}: {
  mod: ForgeModule
  isActive: boolean
  onSelect: () => void
  position: { x: number; y: number }
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  nodeSize: number
}) {
  const icon = trim(mod.icon) || '●'
  const label = moduleLabel(mod)

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="absolute z-20 flex flex-col items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      style={{
        left: position.x,
        top: position.y,
        x: '-50%',
        y: '-50%',
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.14 }}
      whileTap={{ scale: 0.92 }}
      aria-current={isActive ? 'true' : undefined}
      aria-label={label}
    >
      {/* Pulse ring on active */}
      {isActive && !reduceMotion && (
        <motion.span
          className="absolute rounded-full"
          style={{
            width: nodeSize + 16,
            height: nodeSize + 16,
            border: `1px solid ${accent}`,
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <motion.span
        className="relative flex items-center justify-center rounded-full font-medium text-white shadow-lg"
        style={{
          width: nodeSize,
          height: nodeSize,
          fontSize: nodeSize * 0.38,
          background: isActive
            ? `linear-gradient(135deg, ${accent}, ${accentSecondary})`
            : 'rgba(255,255,255,0.08)',
          border: isActive ? 'none' : '1px solid rgba(255,255,255,0.15)',
          boxShadow: isActive ? `0 0 20px ${accent}66` : 'none',
        }}
        animate={
          isActive && !reduceMotion
            ? { boxShadow: [`0 0 12px ${accent}44`, `0 0 28px ${accent}88`, `0 0 12px ${accent}44`] }
            : undefined
        }
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.span>

      <span
        className={`max-w-[5rem] truncate text-center text-[9px] font-semibold sm:max-w-none sm:text-[10px] ${
          isActive ? 'text-white' : 'text-white/45'
        }`}
      >
        {label}
      </span>
    </motion.button>
  )
}

/* ─── Radar display ─── */

function RadarDisplay({
  modules,
  activeId,
  onSelect,
  accent,
  accentSecondary,
  hubLabel,
  activeModule,
  reduceMotion,
  bp,
}: {
  modules: ForgeModule[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  hubLabel: string
  activeModule: ForgeModule | null
  reduceMotion: boolean
  bp: Breakpoint
}) {
  const size = bp === 'mobile' ? 280 : bp === 'tablet' ? 340 : 400
  const cx = size / 2
  const cy = size / 2
  const ringRadii = [size * 0.22, size * 0.34]
  const nodeSize = bp === 'mobile' ? 36 : bp === 'tablet' ? 40 : 44

  const metricValue = trim(activeModule?.metric?.value)
  const metricUnit = trim(activeModule?.metric?.unit)
  const metricLabel = trim(activeModule?.metric?.label)

  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: size, height: size }}
    >
      <RippleRings accent={accent} accentSecondary={accentSecondary} reduceMotion={reduceMotion} size={size} />

      {/* Ring guides */}
      {ringRadii.map((r) => (
        <div
          key={r}
          className="absolute rounded-full border border-white/[0.07]"
          style={{
            width: r * 2,
            height: r * 2,
            left: cx - r,
            top: cy - r,
          }}
        />
      ))}

      {/* Center hub */}
      <motion.div
        className="absolute z-10 flex flex-col items-center justify-center rounded-full border border-white/15 text-center backdrop-blur-md"
        style={{
          width: size * 0.28,
          height: size * 0.28,
          left: cx - size * 0.14,
          top: cy - size * 0.14,
          background: 'rgba(0,0,0,0.55)',
        }}
        whileHover={reduceMotion ? undefined : { scale: 1.04, borderColor: 'rgba(255,255,255,0.25)' }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}28 0%, transparent 70%)` }}
          animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {hubLabel && (
          <span className="relative text-[8px] font-bold uppercase tracking-[0.15em] text-white/40 sm:text-[9px]">
            {hubLabel}
          </span>
        )}
        {metricValue && (
          <p className="relative mt-0.5 text-lg font-bold text-white sm:text-xl">
            {metricValue}
            {metricUnit && (
              <span className="ml-0.5 text-[10px] font-medium text-white/50">{metricUnit}</span>
            )}
          </p>
        )}
        {metricLabel && (
          <p className="relative text-[9px] text-white/45 sm:text-[10px]">{metricLabel}</p>
        )}
      </motion.div>

      {/* Nodes */}
      {modules.map((mod, index) => {
        const ring = safeRing(mod.ring)
        const radius = ringRadii[Math.min(ring - 1, ringRadii.length - 1)] ?? ringRadii[0]
        const angle = safeAngle(mod.angle, index, modules.length)
        const pos = polarToXY(angle, radius, cx, cy)

        return (
          <RadarNode
            key={mod.id}
            mod={mod}
            isActive={mod.id === activeId}
            onSelect={() => onSelect(mod.id)}
            position={pos}
            accent={accent}
            accentSecondary={accentSecondary}
            reduceMotion={reduceMotion}
            nodeSize={nodeSize}
          />
        )
      })}
    </div>
  )
}

/* ─── Mobile module list ─── */

function ModuleList({
  modules,
  activeId,
  onSelect,
  accent,
  accentSecondary,
  reduceMotion,
}: {
  modules: ForgeModule[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  reduceMotion: boolean
}) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {modules.map((mod, i) => {
        const isActive = mod.id === activeId
        return (
          <motion.button
            key={mod.id}
            type="button"
            onClick={() => onSelect(mod.id)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm"
            style={{
              borderColor: isActive ? `${accent}88` : 'rgba(255,255,255,0.1)',
              background: isActive
                ? `linear-gradient(135deg, ${accent}33, ${accentSecondary}22)`
                : 'rgba(255,255,255,0.04)',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease }}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            aria-current={isActive ? 'true' : undefined}
          >
            {trim(mod.icon) && <span aria-hidden>{mod.icon}</span>}
            <span className="truncate">{moduleLabel(mod)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Detail panel ─── */

function DetailPanel({
  mod,
  accent,
  accentSecondary,
  panelBg,
  reduceMotion,
}: {
  mod: ForgeModule
  accent: string
  accentSecondary: string
  panelBg: string
  reduceMotion: boolean
}) {
  const fallback = imageFallback(mod.id)
  const imageUrl = trim(mod.image) || fallback
  const [src, setSrc] = useState(imageUrl)
  const title = trim(mod.title)
  const description = trim(mod.description)
  const link = trim(mod.link) || '#'
  const metricValue = trim(mod.metric?.value)
  const metricUnit = trim(mod.metric?.unit)
  const metricLabel = trim(mod.metric?.label)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  return (
    <motion.div
      key={mod.id}
      className="overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl"
      style={{ background: panelBg }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease }}
      whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.16)' }}
    >
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[220px]">
          <motion.img
            src={src}
            alt={moduleAlt(mod)}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setSrc((c) => (c === fallback ? c : fallback))}
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, ease }}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30 md:bg-gradient-to-t md:from-black/50 md:to-transparent" />
        </div>

        <div className="flex flex-col justify-center p-4 sm:p-5 md:p-6 lg:p-7">
          {trim(mod.label) && (
            <span
              className="mb-2 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-xs"
              style={{ background: `${accent}22`, color: accent }}
            >
              {mod.label}
            </span>
          )}
          {title && (
            <h3 className="text-base font-bold text-white sm:text-lg md:text-xl">{title}</h3>
          )}
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-white/55 sm:mt-3 sm:text-base">
              {description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-5">
            <motion.a
              href={link}
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accentSecondary})` }}
              whileHover={reduceMotion ? undefined : { scale: 1.03, boxShadow: `0 8px 24px ${accent}44` }}
              whileTap={{ scale: 0.97 }}
            >
              View solution
              <ArrowIcon />
            </motion.a>

            {metricValue && (
              <div
                className="rounded-lg border border-white/10 px-3 py-2"
                style={{ background: `${accent}10` }}
              >
                <p className="text-sm font-bold text-white">
                  {metricValue}
                  {metricUnit && <span className="ml-0.5 text-xs text-white/45">{metricUnit}</span>}
                </p>
                {metricLabel && <p className="text-[10px] text-white/40">{metricLabel}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main: RippleForge ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const bp = useBreakpoint()

  const theme = data?.theme ?? {}
  const forge = data?.rippleForge ?? {}

  const accent = safeColor(theme.accent, '#10B981')
  const accentSecondary = safeColor(theme.accentSecondary, '#0EA5E9')
  const surface = safeColor(theme.surface, '#030F0A')
  const panelBg = safeColor(theme.panel, '#0A1A14')

  const modules = safeModules(forge.modules)
  const defaultId = resolveDefault(modules, forge.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)

  const autoPulse = forge.autoPulse !== false
  const pulseMs = safeMs(forge.autoPulseMs, 7000)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0] ?? null

  useEffect(() => {
    setActiveId((current) =>
      modules.some((m) => m.id === current) ? current : defaultId,
    )
  }, [modules, defaultId])

  const selectModule = useCallback(
    (id: string) => {
      if (!trim(id) || !modules.some((m) => m.id === id)) return
      setActiveId(id)
    },
    [modules],
  )

  const advance = useCallback(() => {
    if (modules.length < 2) return
    setActiveId((current) => {
      const idx = modules.findIndex((m) => m.id === current)
      const next = modules[(idx + 1) % modules.length]
      return next?.id ?? current
    })
  }, [modules])

  useEffect(() => {
    if (!autoPulse || paused || modules.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(advance, pulseMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, advance, autoPulse, modules.length, paused, pulseMs, reduceMotion])

  const badgeText = trim(forge.badge?.text)
  const showPulse = forge.badge?.pulse !== false
  const eyebrow = trim(forge.eyebrow)
  const heading = trim(forge.heading)
  const hubLabel = trim(forge.hubLabel) || 'Hub'
  const headingParts = splitHeadline(heading, trim(forge.headingAccent))

  if (!modules.length) {
    return (
      <section
        className="flex min-h-[50vh] items-center justify-center px-4"
        style={{ background: surface }}
      >
        <p className="text-sm text-white/50">No content available.</p>
      </section>
    )
  }

  return (
    <section
      className="relative w-full overflow-x-hidden px-3 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16 lg:px-14 lg:py-20"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{ background: `${accent}12` }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <motion.header
          className="mb-6 text-center sm:mb-8 md:mb-10"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          {badgeText && (
            <motion.div
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/75 sm:px-4 sm:py-2 sm:text-sm"
              whileHover={reduceMotion ? undefined : { scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              {showPulse && (
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                    style={{ background: accent }}
                  />
                  <span className="relative h-2 w-2 rounded-full" style={{ background: accent }} />
                </span>
              )}
              {badgeText}
            </motion.div>
          )}

          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 sm:text-xs">
              {eyebrow}
            </p>
          )}

          {heading && (
            <h1 className="mt-2 text-xl font-bold leading-tight sm:text-2xl md:text-3xl lg:text-4xl">
              {headingParts.before}
              {headingParts.accent ? (
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${accent}, ${accentSecondary})`,
                  }}
                >
                  {headingParts.accent}
                </span>
              ) : null}
              {headingParts.after}
            </h1>
          )}
        </motion.header>

        {/* Single RippleForge component */}
        <motion.div
          className="rounded-2xl border border-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.14)' }}
        >
          {/* Mobile chip strip */}
          {bp === 'mobile' && (
            <div className="mb-4">
              <ModuleList
                modules={modules}
                activeId={activeId}
                onSelect={selectModule}
                accent={accent}
                accentSecondary={accentSecondary}
                reduceMotion={reduceMotion}
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-6 md:gap-8">
            <RadarDisplay
              modules={modules}
              activeId={activeId}
              onSelect={selectModule}
              accent={accent}
              accentSecondary={accentSecondary}
              hubLabel={hubLabel}
              activeModule={activeModule}
              reduceMotion={reduceMotion}
              bp={bp}
            />

            {/* Nav arrows — tablet/desktop */}
            {bp !== 'mobile' && modules.length > 1 && (
              <div className="flex items-center gap-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    const idx = modules.findIndex((m) => m.id === activeId)
                    const prev = modules[((idx - 1) % modules.length + modules.length) % modules.length]
                    if (prev?.id) selectModule(prev.id)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
                  whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff' }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Previous module"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>

                <div className="flex gap-1.5" role="tablist" aria-label="Module selector">
                  {modules.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => selectModule(mod.id)}
                      className="rounded-full p-1"
                      aria-label={moduleLabel(mod)}
                      aria-current={mod.id === activeId ? 'true' : undefined}
                    >
                      <motion.span
                        className="block rounded-full"
                        animate={{
                          width: mod.id === activeId ? 20 : 6,
                          height: 6,
                          background: mod.id === activeId ? accent : 'rgba(255,255,255,0.18)',
                        }}
                        transition={{ duration: 0.3, ease }}
                      />
                    </button>
                  ))}
                </div>

                <motion.button
                  type="button"
                  onClick={advance}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
                  whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff' }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Next module"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="mt-5 sm:mt-6 md:mt-8">
            <AnimatePresence mode="wait">
              {activeModule && (
                <DetailPanel
                  key={activeModule.id}
                  mod={activeModule}
                  accent={accent}
                  accentSecondary={accentSecondary}
                  panelBg={panelBg}
                  reduceMotion={reduceMotion}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
