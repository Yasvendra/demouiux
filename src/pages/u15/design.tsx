import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  accentGlow?: string
  surface?: string
  frame?: string
}

interface FrameMetric {
  value?: string
  unit?: string
  label?: string
}

interface HorizonFrame {
  id: string
  code?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: FrameMetric
}

interface HorizonScrollData {
  tag?: string
  defaultActive?: string
  autoAdvance?: boolean
  autoAdvanceMs?: number
  frames?: HorizonFrame[]
}

interface DesignPageData {
  theme?: ThemeData
  horizonScroll?: HorizonScrollData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeFrames(frames?: HorizonFrame[]): HorizonFrame[] {
  return (frames ?? []).filter((f): f is HorizonFrame => Boolean(trim(f?.id)))
}

function resolveDefault(frames: HorizonFrame[], preferred?: string): string {
  const id = trim(preferred)
  if (id && frames.some((f) => f.id === id)) return id
  return frames[0]?.id ?? ''
}

function frameTitle(frame?: HorizonFrame | null): string {
  return trim(frame?.title) || trim(frame?.code) || trim(frame?.id) || 'Frame'
}

function frameAlt(frame?: HorizonFrame | null): string {
  return trim(frame?.alt) || frameTitle(frame)
}

function frameCode(frame: HorizonFrame, index: number): string {
  return trim(frame.code) || String(index + 1).padStart(2, '0')
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'horizon'}/1600/900`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 7500): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

/* ─── Vertical progress rail (right edge) ─── */

function ProgressRail({
  frames,
  activeIndex,
  accent,
  accentSecondary,
  reduceMotion,
  onSelect,
}: {
  frames: HorizonFrame[]
  activeIndex: number
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  onSelect: (index: number) => void
}) {
  return (
    <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex lg:right-8">
      <div className="relative flex flex-col items-center gap-2.5 py-1">
        <div className="absolute inset-y-1 w-px bg-white/10" aria-hidden />
        {frames.map((frame, i) => {
          const isActive = i === activeIndex
          return (
            <motion.button
              key={frame.id}
              type="button"
              onClick={() => onSelect(i)}
              className="relative z-10 flex h-8 w-8 items-center justify-center"
              whileHover={reduceMotion ? undefined : { scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label={frameTitle(frame)}
              aria-current={isActive ? 'true' : undefined}
            >
              <motion.span
                className="block rounded-full"
                animate={{
                  width: isActive ? 10 : 6,
                  height: isActive ? 10 : 6,
                  background: isActive
                    ? `linear-gradient(135deg, ${accent}, ${accentSecondary})`
                    : 'rgba(255,255,255,0.25)',
                  boxShadow: isActive ? `0 0 12px ${accent}88` : 'none',
                }}
                transition={{ duration: 0.25 }}
              />
            </motion.button>
          )
        })}
      </div>
      <span className="mt-1 text-[9px] font-bold tabular-nums tracking-widest text-white/30">
        {String(activeIndex + 1).padStart(2, '0')}
      </span>
    </div>
  )
}

/* ─── Single cinema frame ─── */

function CinemaFrame({
  frame,
  index,
  accent,
  accentSecondary,
  frameBg,
  reduceMotion,
  scrollRef,
}: {
  frame: HorizonFrame
  index: number
  accent: string
  accentSecondary: string
  frameBg: string
  reduceMotion: boolean
  scrollRef: RefObject<HTMLDivElement | null>
}) {
  const img = trim(frame.image) || imageFallback(frame.id)
  const title = frameTitle(frame)
  const description = trim(frame.description)
  const link = trim(frame.link)
  const metric = frame.metric
  const metricValue = trim(metric?.value)
  const metricUnit = trim(metric?.unit)
  const metricLabel = trim(metric?.label)
  const code = frameCode(frame, index)

  const { scrollX } = useScroll({ container: scrollRef })
  const parallax = useTransform(scrollX, (v) => {
    if (reduceMotion) return 0
    const frameWidth = 920 * 0.88
    const offset = index * frameWidth - v
    return offset * 0.06
  })

  return (
    <article
      className="relative shrink-0 snap-center"
      style={{ width: 'min(88vw, 920px)' }}
      data-frame-id={frame.id}
    >
      <motion.div
        className="group relative overflow-hidden rounded-2xl border border-white/[0.07] sm:rounded-3xl"
        style={{ background: frameBg, aspectRatio: '16/10' }}
        whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.14)' }}
      >
        <motion.div className="absolute inset-0" style={{ x: reduceMotion ? 0 : parallax }}>
          <img
            src={img}
            alt={frameAlt(frame)}
            className="h-full w-full scale-110 object-cover transition-transform duration-700 group-hover:scale-[1.14]"
            loading={index < 2 ? 'eager' : 'lazy'}
            onError={(e) => {
              e.currentTarget.src = imageFallback(frame.id)
            }}
          />
        </motion.div>

        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(105deg, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.4) 45%, transparent 70%),
              linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 40%)`,
          }}
        />

        {/* Floating tag — top left on frame, not page header */}
        <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6">
          <span
            className="rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest sm:text-xs"
            style={{ background: `${accent}33`, color: accent }}
          >
            {code}
          </span>
        </div>

        {/* Content overlay — bottom left inside frame */}
        <div className="absolute bottom-0 left-0 max-w-lg p-4 sm:p-6 md:p-8">
          <h2 className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl">{title}</h2>
          {description && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/55 sm:mt-3 sm:text-[15px]">
              {description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {metricValue && (
              <motion.div
                className="flex items-baseline gap-1"
                whileHover={reduceMotion ? undefined : { x: 4 }}
              >
                <span className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: accentSecondary }}>
                  {metricValue}
                </span>
                {metricUnit && <span className="text-sm text-white/45">{metricUnit}</span>}
                {metricLabel && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-white/35">{metricLabel}</span>
                )}
              </motion.div>
            )}
            {link && (
              <motion.a
                href={link}
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: accent }}
                whileHover={reduceMotion ? undefined : { gap: 6 }}
                onClick={(e) => e.stopPropagation()}
              >
                View system <span aria-hidden>↗</span>
              </motion.a>
            )}
          </div>
        </div>

        {!reduceMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at 30% 70%, ${accent}15 0%, transparent 50%)`,
            }}
            transition={{ duration: 0.4 }}
            aria-hidden
          />
        )}
      </motion.div>
    </article>
  )
}

/* ─── Mobile dot bar ─── */

function MobileDots({
  count,
  activeIndex,
  accent,
  onSelect,
}: {
  count: number
  activeIndex: number
  accent: string
  onSelect: (index: number) => void
}) {
  return (
    <div className="flex justify-center gap-2 py-4 md:hidden">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className="h-2 rounded-full transition-all"
          style={{
            width: i === activeIndex ? 24 : 8,
            background: i === activeIndex ? accent : 'rgba(255,255,255,0.2)',
          }}
          aria-label={`Frame ${i + 1}`}
          aria-current={i === activeIndex ? 'true' : undefined}
        />
      ))}
    </div>
  )
}

/* ─── Main: HorizonScroll (single component) ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const scrollRef = useRef<HTMLDivElement>(null)

  const theme = data?.theme ?? {}
  const horizon = data?.horizonScroll ?? {}

  const accent = safeColor(theme.accent, '#A3E635')
  const accentSecondary = safeColor(theme.accentSecondary, '#38BDF8')
  const accentGlow = safeColor(theme.accentGlow, 'rgba(163, 230, 53, 0.18)')
  const surface = safeColor(theme.surface, '#0A0A0B')
  const frameBg = safeColor(theme.frame, '#111113')

  const frames = safeFrames(horizon.frames)
  const defaultId = resolveDefault(frames, horizon.defaultActive)
  const defaultIndex = Math.max(0, frames.findIndex((f) => f.id === defaultId))

  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const autoAdvance = horizon.autoAdvance !== false
  const advanceMs = safeMs(horizon.autoAdvanceMs, 7500)
  const tag = trim(horizon.tag)

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current
    if (!el || !frames.length) return
    const safe = ((index % frames.length) + frames.length) % frames.length
    const frameEl = el.querySelectorAll('article')[safe] as HTMLElement | undefined
    if (frameEl) {
      frameEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
    }
    setActiveIndex(safe)
  }, [frames.length, reduceMotion])

  useEffect(() => {
    scrollToIndex(defaultIndex)
  }, [defaultIndex, scrollToIndex])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const articles = el.querySelectorAll('article')
      if (!articles.length) return
      const center = el.scrollLeft + el.clientWidth / 2
      let closest = 0
      let minDist = Infinity
      articles.forEach((art, i) => {
        const artEl = art as HTMLElement
        const artCenter = artEl.offsetLeft + artEl.offsetWidth / 2
        const dist = Math.abs(center - artCenter)
        if (dist < minDist) {
          minDist = dist
          closest = i
        }
      })
      setActiveIndex(closest)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [frames.length])

  useEffect(() => {
    if (!autoAdvance || paused || frames.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      scrollToIndex(activeIndex + 1)
    }, advanceMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeIndex, advanceMs, autoAdvance, frames.length, paused, reduceMotion, scrollToIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        scrollToIndex(activeIndex + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        scrollToIndex(activeIndex - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeIndex, scrollToIndex])

  if (!frames.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6" style={{ background: surface }}>
        <p className="text-sm text-white/40">No frames available.</p>
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${accentGlow} 0%, transparent 60%)`,
        }}
        aria-hidden
      />

      {/* Floating tag — corner, not centered header */}
      {tag && (
        <motion.div
          className="absolute left-4 top-4 z-30 sm:left-8 sm:top-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50 backdrop-blur-md sm:text-xs">
            {tag}
          </span>
        </motion.div>
      )}

      <ProgressRail
        frames={frames}
        activeIndex={activeIndex}
        accent={accent}
        accentSecondary={accentSecondary}
        reduceMotion={reduceMotion}
        onSelect={scrollToIndex}
      />

      {/* Single HorizonScroll — horizontal snap cinema */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-[6vw] py-16 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 sm:py-20 [&::-webkit-scrollbar]:hidden"
      >
        <AnimatePresence initial={false}>
          {frames.map((frame, i) => (
            <CinemaFrame
              key={frame.id}
              frame={frame}
              index={i}
              accent={accent}
              accentSecondary={accentSecondary}
              frameBg={frameBg}
              reduceMotion={reduceMotion}
              scrollRef={scrollRef}
            />
          ))}
        </AnimatePresence>
      </div>

      <MobileDots
        count={frames.length}
        activeIndex={activeIndex}
        accent={accent}
        onSelect={scrollToIndex}
      />

      {/* Scroll hint — bottom center, fades */}
      <motion.p
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-white/25 sm:block"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        Scroll or use ← → keys
      </motion.p>
    </div>
  )
}
