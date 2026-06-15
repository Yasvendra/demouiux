import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type PanInfo,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  accentGlow?: string
  surface?: string
  face?: string
}

interface PrismBadge {
  text?: string
  pulse?: boolean
}

interface PrismMetric {
  value?: string
  unit?: string
  label?: string
}

interface PrismFacet {
  id: string
  tag?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: PrismMetric
}

interface PrismShiftData {
  badge?: PrismBadge
  eyebrow?: string
  heading?: string
  headingAccent?: string
  defaultActive?: string
  autoRotate?: boolean
  autoRotateMs?: number
  facets?: PrismFacet[]
}

interface DesignPageData {
  theme?: ThemeData
  prismShift?: PrismShiftData
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeFacets(facets?: PrismFacet[]): PrismFacet[] {
  return (facets ?? []).filter((f): f is PrismFacet => Boolean(trim(f?.id)))
}

function resolveDefault(facets: PrismFacet[], preferred?: string): string {
  const id = trim(preferred)
  if (id && facets.some((f) => f.id === id)) return id
  return facets[0]?.id ?? ''
}

function facetLabel(facet?: PrismFacet | null): string {
  return trim(facet?.tag) || trim(facet?.title) || trim(facet?.id) || 'Facet'
}

function facetAlt(facet?: PrismFacet | null): string {
  return trim(facet?.alt) || trim(facet?.title) || facetLabel(facet)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'prism'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 5800): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 2500)
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

/* ─── Icons ─── */

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      {dir === 'left' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      )}
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

/* ─── 3D Prism face card ─── */

function PrismFace({
  facet,
  accent,
  accentSecondary,
  faceBg,
  reduceMotion,
  isFront,
}: {
  facet: PrismFacet
  accent: string
  accentSecondary: string
  faceBg: string
  reduceMotion: boolean
  isFront: boolean
}) {
  const fallback = imageFallback(facet.id)
  const imageUrl = trim(facet.image) || fallback
  const [src, setSrc] = useState(imageUrl)
  const tag = trim(facet.tag)
  const title = trim(facet.title)
  const metricValue = trim(facet.metric?.value)
  const metricUnit = trim(facet.metric?.unit)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl"
      style={{
        background: faceBg,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <img
        src={src}
        alt={facetAlt(facet)}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setSrc((c) => (c === fallback ? c : fallback))}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      {tag && (
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:left-4 sm:top-4 sm:text-xs"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accentSecondary})` }}
        >
          {tag}
        </span>
      )}

      {metricValue && isFront && (
        <motion.div
          className="absolute right-3 top-3 rounded-lg border border-white/20 bg-black/50 px-3 py-2 backdrop-blur-sm sm:right-4 sm:top-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35, ease }}
        >
          <p className="text-lg font-bold text-white sm:text-xl">
            {metricValue}
            {metricUnit && <span className="ml-0.5 text-xs text-white/55">{metricUnit}</span>}
          </p>
        </motion.div>
      )}

      {title && (
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className={`font-bold text-white ${isFront ? 'text-base sm:text-lg' : 'text-sm'}`}>
            {title}
          </p>
        </div>
      )}

      {isFront && !reduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ boxShadow: `inset 0 0 40px ${accent}22` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

/* ─── 3D Prism carousel ─── */

function PrismCarousel({
  facets,
  activeIndex,
  accent,
  accentSecondary,
  faceBg,
  reduceMotion,
  prismWidth,
}: {
  facets: PrismFacet[]
  activeIndex: number
  accent: string
  accentSecondary: string
  faceBg: string
  reduceMotion: boolean
  prismWidth: number
}) {
  const count = facets.length
  const angleStep = 360 / count
  const rotateY = -activeIndex * angleStep
  const translateZ = Math.round(prismWidth / (2 * Math.tan((Math.PI * 2) / count / 2)))

  return (
    <div
      className="relative mx-auto"
      style={{ width: prismWidth, height: prismWidth * 0.72, perspective: 1200 }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      >
        {facets.map((facet, i) => {
          const faceAngle = i * angleStep
          return (
            <div
              key={facet.id}
              className="absolute inset-0"
              style={{
                transform: `rotateY(${faceAngle}deg) translateZ(${translateZ}px)`,
                transformStyle: 'preserve-3d',
              }}
            >
              <PrismFace
                facet={facet}
                accent={accent}
                accentSecondary={accentSecondary}
                faceBg={faceBg}
                reduceMotion={reduceMotion}
                isFront={i === activeIndex}
              />
            </div>
          )
        })}
      </motion.div>

      {/* Floor reflection glow */}
      <div
        className="pointer-events-none absolute -bottom-6 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full blur-xl"
        style={{ background: `${accent}33` }}
      />
    </div>
  )
}

/* ─── Mobile swipe card ─── */

function MobileFacetCard({
  facet,
  accent,
  accentSecondary,
  faceBg,
  reduceMotion,
}: {
  facet: PrismFacet
  accent: string
  accentSecondary: string
  faceBg: string
  reduceMotion: boolean
}) {
  return (
    <div className="relative mx-auto w-full max-w-sm" style={{ height: 280 }}>
      <PrismFace
        facet={facet}
        accent={accent}
        accentSecondary={accentSecondary}
        faceBg={faceBg}
        reduceMotion={reduceMotion}
        isFront
      />
    </div>
  )
}

/* ─── Detail panel ─── */

function FacetDetail({
  facet,
  accent,
  accentSecondary,
  panelBg,
  reduceMotion,
}: {
  facet: PrismFacet
  accent: string
  accentSecondary: string
  panelBg: string
  reduceMotion: boolean
}) {
  const title = trim(facet.title)
  const description = trim(facet.description)
  const link = trim(facet.link) || '#'
  const metricValue = trim(facet.metric?.value)
  const metricUnit = trim(facet.metric?.unit)
  const metricLabel = trim(facet.metric?.label)

  return (
    <motion.div
      key={facet.id}
      className="overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl"
      style={{ background: panelBg }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease }}
      whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.16)' }}
    >
      <div className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            {trim(facet.tag) && (
              <span
                className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-xs"
                style={{ background: `${accent}22`, color: accent }}
              >
                {facet.tag}
              </span>
            )}
            {title && <h3 className="text-base font-bold text-white sm:text-lg md:text-xl">{title}</h3>}
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-white/55 sm:mt-3 sm:text-base">
                {description}
              </p>
            )}
            <motion.a
              href={link}
              className="group mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white sm:mt-5"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accentSecondary})` }}
              whileHover={reduceMotion ? undefined : { scale: 1.03, boxShadow: `0 8px 24px ${accent}44` }}
              whileTap={{ scale: 0.97 }}
            >
              Deploy facet
              <ArrowIcon />
            </motion.a>
          </div>

          {metricValue && (
            <motion.div
              className="shrink-0 rounded-xl border border-white/10 px-4 py-3 text-center sm:px-5 sm:py-4"
              style={{ background: `linear-gradient(135deg, ${accent}15, ${accentSecondary}10)` }}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            >
              <p className="text-xl font-bold text-white sm:text-2xl">
                {metricValue}
                {metricUnit && <span className="text-sm font-medium text-white/45"> {metricUnit}</span>}
              </p>
              {metricLabel && <p className="mt-0.5 text-xs text-white/40">{metricLabel}</p>}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Facet pill strip ─── */

function FacetPills({
  facets,
  activeId,
  onSelect,
  accent,
  reduceMotion,
}: {
  facets: PrismFacet[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  reduceMotion: boolean
}) {
  return (
    <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-min justify-center gap-1.5 sm:gap-2">
        {facets.map((facet) => {
          const isActive = facet.id === activeId
          return (
            <motion.button
              key={facet.id}
              type="button"
              onClick={() => onSelect(facet.id)}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm"
              style={{
                borderColor: isActive ? `${accent}88` : 'rgba(255,255,255,0.1)',
                background: isActive ? `${accent}28` : 'rgba(255,255,255,0.04)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
              }}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              aria-current={isActive ? 'true' : undefined}
            >
              {facetLabel(facet)}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main: PrismShift ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const theme = data?.theme ?? {}
  const prism = data?.prismShift ?? {}

  const accent = safeColor(theme.accent, '#06B6D4')
  const accentSecondary = safeColor(theme.accentSecondary, '#F59E0B')
  const accentGlow = safeColor(theme.accentGlow, 'rgba(6, 182, 212, 0.35)')
  const surface = safeColor(theme.surface, '#0B1120')
  const faceBg = safeColor(theme.face, '#131C2E')

  const facets = safeFacets(prism.facets)
  const defaultId = resolveDefault(facets, prism.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)

  const autoRotate = prism.autoRotate !== false
  const rotateMs = safeMs(prism.autoRotateMs, 5800)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(0, facets.findIndex((f) => f.id === activeId))
  const activeFacet = facets[activeIndex] ?? facets[0] ?? null

  const dragX = useMotionValue(0)
  const dragSpring = useSpring(dragX, { stiffness: 300, damping: 30 })

  const prismWidth = bp === 'mobile' ? 300 : bp === 'tablet' ? 340 : 400

  useEffect(() => {
    setActiveId((current) =>
      facets.some((f) => f.id === current) ? current : defaultId,
    )
  }, [facets, defaultId])

  const goTo = useCallback(
    (index: number) => {
      if (!facets.length) return
      const safe = ((index % facets.length) + facets.length) % facets.length
      const next = facets[safe]
      if (next?.id) setActiveId(next.id)
    },
    [facets],
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  const selectFacet = useCallback(
    (id: string) => {
      if (!trim(id) || !facets.some((f) => f.id === id)) return
      setActiveId(id)
    },
    [facets],
  )

  useEffect(() => {
    if (!autoRotate || paused || facets.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(goNext, rotateMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, autoRotate, facets.length, goNext, paused, reduceMotion, rotateMs])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) goNext()
    else if (info.offset.x > 50) goPrev()
    dragX.set(0)
  }

  const badgeText = trim(prism.badge?.text)
  const showPulse = prism.badge?.pulse !== false
  const eyebrow = trim(prism.eyebrow)
  const heading = trim(prism.heading)
  const headingParts = splitHeadline(heading, trim(prism.headingAccent))

  if (!facets.length) {
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
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${accentGlow} 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl">
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

        {/* Single PrismShift component */}
        <motion.div
          className="rounded-2xl border border-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.14)' }}
        >
          {/* 3D prism or mobile swipe */}
          <div className="mb-5 sm:mb-6">
            {isMobile || reduceMotion ? (
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                style={{ x: dragSpring }}
                onDragEnd={handleDragEnd}
              >
                {activeFacet && (
                  <MobileFacetCard
                    facet={activeFacet}
                    accent={accent}
                    accentSecondary={accentSecondary}
                    faceBg={faceBg}
                    reduceMotion={reduceMotion}
                  />
                )}
                <p className="mt-2 text-center text-[10px] text-white/30">Swipe to rotate prism</p>
              </motion.div>
            ) : (
              <PrismCarousel
                facets={facets}
                activeIndex={activeIndex}
                accent={accent}
                accentSecondary={accentSecondary}
                faceBg={faceBg}
                reduceMotion={reduceMotion}
                prismWidth={prismWidth}
              />
            )}
          </div>

          {/* Controls */}
          <div className="mb-4 flex items-center justify-center gap-3 sm:mb-5">
            <motion.button
              type="button"
              onClick={goPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous facet"
            >
              <ChevronIcon dir="left" />
            </motion.button>

            <span className="text-xs tabular-nums text-white/35">
              {activeIndex + 1} / {facets.length}
            </span>

            <motion.button
              type="button"
              onClick={goNext}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next facet"
            >
              <ChevronIcon dir="right" />
            </motion.button>
          </div>

          <FacetPills
            facets={facets}
            activeId={activeId}
            onSelect={selectFacet}
            accent={accent}
            reduceMotion={reduceMotion}
          />

          {/* Detail */}
          <div className="mt-5 sm:mt-6 md:mt-8">
            <AnimatePresence mode="wait">
              {activeFacet && (
                <FacetDetail
                  key={activeFacet.id}
                  facet={activeFacet}
                  accent={accent}
                  accentSecondary={accentSecondary}
                  panelBg={faceBg}
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
