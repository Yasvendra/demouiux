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
  accentAlt?: string
  accentGlow?: string
  surface?: string
  band?: string
}

interface BandStat {
  value?: string
  unit?: string
  label?: string
}

interface FluxBandItem {
  id: string
  code?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  stat?: BandStat
  tone?: string
}

interface FluxBandData {
  label?: string
  title?: string
  titleHighlight?: string
  defaultActive?: string
  autoExpand?: boolean
  autoExpandMs?: number
  bands?: FluxBandItem[]
}

interface DesignPageData {
  theme?: ThemeData
  fluxBand?: FluxBandData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const
const COLLAPSED = 56
const EXPANDED = 320
const EXPANDED_MOBILE = 420

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeBands(bands?: FluxBandItem[]): FluxBandItem[] {
  return (bands ?? []).filter((b): b is FluxBandItem => Boolean(trim(b?.id)))
}

function resolveDefault(bands: FluxBandItem[], preferred?: string): string {
  const id = trim(preferred)
  if (id && bands.some((b) => b.id === id)) return id
  return bands[0]?.id ?? ''
}

function bandTitle(band?: FluxBandItem | null): string {
  return trim(band?.title) || trim(band?.code) || trim(band?.id) || 'Band'
}

function bandAlt(band?: FluxBandItem | null): string {
  return trim(band?.alt) || bandTitle(band)
}

function bandCode(band: FluxBandItem): string {
  return trim(band.code) || trim(band.id).slice(0, 3).toUpperCase() || '—'
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'flux'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 6800): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function splitTitle(title: string, highlight?: string) {
  if (!highlight) return { before: title, highlight: '', after: '' }
  const idx = title.toLowerCase().indexOf(highlight.toLowerCase())
  if (idx === -1) return { before: title, highlight: '', after: '' }
  return {
    before: title.slice(0, idx),
    highlight: title.slice(idx, idx + highlight.length),
    after: title.slice(idx + highlight.length),
  }
}

/* ─── Single expandable band ─── */

function ExpandBand({
  band,
  isOpen,
  bandBg,
  accent,
  reduceMotion,
  isMobile,
  onOpen,
  index,
}: {
  band: FluxBandItem
  isOpen: boolean
  bandBg: string
  accent: string
  reduceMotion: boolean
  isMobile: boolean
  onOpen: () => void
  index: number
}) {
  const tone = safeColor(band.tone, accent)
  const title = bandTitle(band)
  const description = trim(band.description)
  const img = trim(band.image) || imageFallback(band.id)
  const link = trim(band.link)
  const stat = band.stat
  const statValue = trim(stat?.value)
  const statUnit = trim(stat?.unit)
  const statLabel = trim(stat?.label)
  const expandedH = isMobile ? EXPANDED_MOBILE : EXPANDED

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-white/[0.07] sm:rounded-2xl"
      style={{ background: bandBg }}
      initial={false}
      animate={{ height: isOpen ? expandedH : COLLAPSED }}
      transition={reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 280, damping: 32 }}
      onHoverStart={() => {
        if (!isMobile) onOpen()
      }}
      onClick={() => {
        if (isMobile && !isOpen) onOpen()
      }}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {/* Collapsed strip — always visible baseline */}
      <div
        className="absolute inset-x-0 top-0 flex h-14 items-center justify-between px-4 sm:px-6"
        style={{ zIndex: 2 }}
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <motion.span
            className="shrink-0 rounded-md px-2 py-1 text-[10px] font-black tracking-widest sm:text-xs"
            style={{ background: `${tone}22`, color: tone }}
            animate={isOpen ? { scale: 1.05 } : { scale: 1 }}
          >
            {bandCode(band)}
          </motion.span>
          <span
            className="truncate text-sm font-semibold sm:text-base"
            style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.55)' }}
          >
            {title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          {statValue && !isOpen && (
            <span className="hidden text-xs tabular-nums text-white/35 sm:inline">
              {statValue}
              {statUnit}
            </span>
          )}
          <motion.span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs"
            style={{
              background: isOpen ? `${tone}33` : 'rgba(255,255,255,0.06)',
              color: isOpen ? tone : 'rgba(255,255,255,0.4)',
            }}
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3, ease }}
            aria-hidden
          >
            +
          </motion.span>
        </div>
      </div>

      {/* Tone accent line */}
      <motion.div
        className="absolute left-0 top-0 h-full w-1 origin-top sm:w-1.5"
        style={{ background: tone }}
        initial={false}
        animate={{ scaleY: isOpen ? 1 : 0.3, opacity: isOpen ? 1 : 0.5 }}
        transition={{ duration: 0.35, ease }}
        aria-hidden
      />

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute inset-0 top-14 flex flex-col sm:flex-row"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex flex-1 flex-col justify-between p-4 pt-2 sm:p-6 sm:pt-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                  Module {String(index + 1).padStart(2, '0')}
                </p>
                {description && (
                  <p className="max-w-md text-sm leading-relaxed text-white/55 sm:text-[15px]">
                    {description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-4 sm:mt-0">
                {statValue && (
                  <motion.div
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    className="flex items-baseline gap-1"
                  >
                    <span className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: tone }}>
                      {statValue}
                    </span>
                    {statUnit && (
                      <span className="text-sm text-white/40">{statUnit}</span>
                    )}
                    {statLabel && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-white/35 sm:text-xs">
                        {statLabel}
                      </span>
                    )}
                  </motion.div>
                )}

                {link && (
                  <motion.a
                    href={link}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: tone }}
                    whileHover={reduceMotion ? undefined : { gap: 8 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open pipeline
                    <span aria-hidden>↗</span>
                  </motion.a>
                )}
              </div>
            </div>

            <div
              className="relative h-40 shrink-0 overflow-hidden sm:h-auto sm:w-[42%]"
              style={{
                clipPath: isMobile ? undefined : 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)',
              }}
            >
              <motion.img
                src={img}
                alt={bandAlt(band)}
                className="h-full w-full object-cover"
                loading="lazy"
                initial={reduceMotion ? false : { scale: 1.12 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.7, ease }}
                onError={(e) => {
                  e.currentTarget.src = imageFallback(band.id)
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${tone}33 0%, transparent 60%)`,
                }}
                aria-hidden
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover shimmer on collapsed */}
      {!isOpen && !reduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${tone}12 50%, transparent 60%)`,
          }}
          whileHover={{ opacity: 1, x: ['-100%', '100%'] }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          aria-hidden
        />
      )}
    </motion.div>
  )
}

/* ─── Side progress rail ─── */

function SideRail({
  bands,
  activeId,
  onSelect,
  reduceMotion,
}: {
  bands: FluxBandItem[]
  activeId: string
  onSelect: (id: string) => void
  reduceMotion: boolean
}) {
  return (
    <div className="hidden flex-col items-center gap-2 lg:flex">
      {bands.map((band) => {
        const isActive = band.id === activeId
        const tone = safeColor(band.tone, '#2DD4BF')
        return (
          <motion.button
            key={band.id}
            type="button"
            onClick={() => onSelect(band.id)}
            className="group relative flex items-center"
            aria-label={bandTitle(band)}
            aria-current={isActive ? 'true' : undefined}
            whileHover={reduceMotion ? undefined : { x: -3 }}
          >
            <motion.span
              className="h-8 w-1 rounded-full"
              style={{ background: isActive ? tone : 'rgba(255,255,255,0.12)' }}
              animate={isActive ? { height: 40 } : { height: 32 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            />
            <span
              className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              style={{ color: tone }}
            >
              {bandCode(band)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Main: FluxBand (single component) ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  )

  const theme = data?.theme ?? {}
  const flux = data?.fluxBand ?? {}

  const accent = safeColor(theme.accent, '#2DD4BF')
  const accentAlt = safeColor(theme.accentAlt, '#7C3AED')
  const accentGlow = safeColor(theme.accentGlow, 'rgba(45, 212, 191, 0.2)')
  const surface = safeColor(theme.surface, '#050508')
  const bandBg = safeColor(theme.band, '#0C0C12')

  const bands = safeBands(flux.bands)
  const defaultId = resolveDefault(bands, flux.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(0, bands.findIndex((b) => b.id === activeId))
  const autoExpand = flux.autoExpand !== false
  const expandMs = safeMs(flux.autoExpandMs, 6800)

  const label = trim(flux.label)
  const title = trim(flux.title)
  const titleParts = splitTitle(title, trim(flux.titleHighlight))

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setActiveId((cur) => (bands.some((b) => b.id === cur) ? cur : defaultId))
  }, [bands, defaultId])

  const selectBand = useCallback(
    (id: string) => {
      if (!trim(id) || !bands.some((b) => b.id === id)) return
      setActiveId(id)
    },
    [bands],
  )

  const goNext = useCallback(() => {
    if (!bands.length) return
    const next = bands[(activeIndex + 1) % bands.length]
    if (next?.id) setActiveId(next.id)
  }, [activeIndex, bands])

  useEffect(() => {
    if (!autoExpand || paused || bands.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(goNext, expandMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, autoExpand, expandMs, goNext, bands.length, paused, reduceMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const prev = bands[(activeIndex - 1 + bands.length) % bands.length]
        if (prev?.id) setActiveId(prev.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, bands, goNext])

  if (!bands.length) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center px-6"
        style={{ background: surface }}
      >
        <p className="text-sm text-white/40">No bands available.</p>
      </div>
    )
  }

  const totalCollapsed = COLLAPSED * (bands.length - 1)
  const expandedH = isMobile ? EXPANDED_MOBILE : EXPANDED
  const stackHeight = totalCollapsed + expandedH + (bands.length - 1) * 8

  return (
    <div
      className="relative min-h-[100svh] px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient glow — top-right, not mesh orbs */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[50vh] w-[50vw] opacity-60"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${accentGlow} 0%, transparent 65%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[40vh] w-[40vw] opacity-40"
        style={{
          background: `radial-gradient(circle at 0% 100%, ${accentAlt}18 0%, transparent 60%)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-4xl gap-8 lg:max-w-5xl">
        <SideRail
          bands={bands}
          activeId={activeId}
          onSelect={selectBand}
          reduceMotion={reduceMotion}
        />

        <div className="min-w-0 flex-1">
          {/* Compact title — not editorial split, not centered badge */}
          <header className="mb-8 sm:mb-10">
            {label && (
              <motion.p
                className="mb-3 inline-block rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:text-xs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
              >
                {label}
              </motion.p>
            )}
            {title && (
              <motion.h1
                className="text-[clamp(1.75rem,5.5vw,3.25rem)] font-bold leading-[1.08] tracking-tight"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease }}
              >
                {titleParts.before}
                {titleParts.highlight ? (
                  <span style={{ color: accent }}>{titleParts.highlight}</span>
                ) : null}
                {titleParts.after}
              </motion.h1>
            )}
            <motion.p
              className="mt-4 text-xs text-white/30 sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Hover a band to expand · ↑↓ to navigate
            </motion.p>
          </header>

          {/* Single FluxBand — vertical accordion stack */}
          <motion.div
            className="flex flex-col gap-2 sm:gap-2.5"
            style={{ minHeight: stackHeight }}
            layout
          >
            {bands.map((band, i) => (
              <ExpandBand
                key={band.id}
                band={band}
                isOpen={band.id === activeId}
                bandBg={bandBg}
                accent={accent}
                reduceMotion={reduceMotion}
                isMobile={isMobile}
                onOpen={() => selectBand(band.id)}
                index={i}
              />
            ))}
          </motion.div>

          {/* Progress footer — thin line, not pills or index strip */}
          <div className="mt-8 flex items-center gap-3 sm:mt-10">
            <div className="h-px flex-1 bg-white/10">
              <motion.div
                className="h-full origin-left"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accentAlt})` }}
                initial={false}
                animate={{ scaleX: (activeIndex + 1) / bands.length }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
            <span className="shrink-0 text-[10px] tabular-nums uppercase tracking-widest text-white/30">
              {String(activeIndex + 1).padStart(2, '0')} / {String(bands.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
