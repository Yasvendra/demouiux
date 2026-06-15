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
  accentAlt?: string
  accentWarm?: string
  surface?: string
  card?: string
}

interface HolodeckBadge {
  text?: string
  pulse?: boolean
}

interface HolodeckStat {
  value?: string
  unit?: string
  label?: string
}

interface HolodeckCard {
  id: string
  tag?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  stat?: HolodeckStat
  gradient?: string[]
}

interface HolodeckData {
  badge?: HolodeckBadge
  eyebrow?: string
  heading?: string
  headingAccent?: string
  defaultActive?: string
  autoRotate?: boolean
  autoRotateMs?: number
  cards?: HolodeckCard[]
}

interface DesignPageData {
  theme?: ThemeData
  holodeck?: HolodeckData
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeCards(cards?: HolodeckCard[]): HolodeckCard[] {
  return (cards ?? []).filter((card): card is HolodeckCard => Boolean(trim(card?.id)))
}

function resolveDefault(cards: HolodeckCard[], preferred?: string): string {
  const id = trim(preferred)
  if (id && cards.some((card) => card.id === id)) return id
  return cards[0]?.id ?? ''
}

function cardTitle(card?: HolodeckCard | null): string {
  return trim(card?.title) || trim(card?.tag) || trim(card?.id) || 'Module'
}

function cardAlt(card?: HolodeckCard | null): string {
  return trim(card?.alt) || cardTitle(card)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'holo'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 6500): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 2500)
}

function cardGradient(card?: HolodeckCard, fallback: [string, string] = ['#6366F1', '#22D3EE']): [string, string] {
  const g = card?.gradient ?? []
  const a = trim(g[0]) || fallback[0]
  const b = trim(g[1]) || fallback[1]
  return [a, b]
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

/* ─── Arc position calculator ─── */

function getArcOffset(index: number, activeIndex: number, total: number, bp: Breakpoint) {
  let diff = index - activeIndex
  if (diff > total / 2) diff -= total
  if (diff < -total / 2) diff += total

  const spread = bp === 'mobile' ? 0 : bp === 'tablet' ? 0.55 : 1
  const xStep = bp === 'mobile' ? 0 : bp === 'tablet' ? 130 : 175
  const rotateStep = bp === 'mobile' ? 0 : 14
  const scaleDrop = bp === 'mobile' ? 0.06 : 0.12

  return {
    x: diff * xStep * spread,
    rotateY: diff * -rotateStep * spread,
    scale: Math.max(1 - Math.abs(diff) * scaleDrop, 0.72),
    zIndex: 10 - Math.abs(diff),
    opacity: Math.abs(diff) > 2 ? 0 : 1 - Math.abs(diff) * 0.22,
  }
}

/* ─── Single holo card ─── */

function HoloCard({
  card,
  isActive,
  offset,
  onSelect,
  cardBg,
  reduceMotion,
  bp,
}: {
  card: HolodeckCard
  isActive: boolean
  offset: ReturnType<typeof getArcOffset>
  onSelect: () => void
  cardBg: string
  reduceMotion: boolean
  bp: Breakpoint
}) {
  const [g1, g2] = cardGradient(card)
  const fallback = imageFallback(card.id)
  const imageUrl = trim(card.image) || fallback
  const [src, setSrc] = useState(imageUrl)
  const tag = trim(card.tag)
  const title = trim(card.title)
  const statValue = trim(card.stat?.value)
  const statUnit = trim(card.stat?.unit)
  const statLabel = trim(card.stat?.label)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  const width =
    bp === 'mobile' ? '100%' : bp === 'tablet' ? (isActive ? 300 : 240) : isActive ? 340 : 260

  const isMobileLayout = bp === 'mobile'

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className={`shrink-0 overflow-hidden rounded-2xl border text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:rounded-3xl ${
        isMobileLayout ? 'relative w-full' : 'absolute left-1/2 top-1/2'
      }`}
      style={{
        width: isMobileLayout ? '100%' : width,
        zIndex: offset.zIndex,
        borderColor: isActive ? `${g1}88` : 'rgba(255,255,255,0.08)',
        background: cardBg,
        transformStyle: 'preserve-3d',
      }}
      initial={false}
      animate={
        isMobileLayout
          ? { rotateY: 0, scale: 1, opacity: 1 }
          : {
              x: `calc(-50% + ${offset.x}px)`,
              y: '-50%',
              rotateY: offset.rotateY,
              scale: offset.scale,
              opacity: offset.opacity,
            }
      }
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              scale: isActive ? 1.02 : offset.scale + 0.04,
              y: '-52%',
              boxShadow: `0 24px 60px ${g1}44`,
            }
      }
      whileTap={{ scale: offset.scale * 0.97 }}
      aria-current={isActive ? 'true' : undefined}
      aria-label={cardTitle(card)}
    >
      {/* Gradient border glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `linear-gradient(135deg, ${g1}33, transparent 50%, ${g2}22)`,
        }}
      />

      <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5]">
        <motion.img
          src={src}
          alt={cardAlt(card)}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setSrc((c) => (c === fallback ? c : fallback))}
          animate={{ scale: isActive ? 1.05 : 1 }}
          transition={{ duration: 0.6, ease }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {tag && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:left-4 sm:top-4 sm:px-3 sm:text-[11px]"
            style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
          >
            {tag}
          </span>
        )}

        {statValue && isActive && (
          <motion.div
            className="absolute right-3 top-3 rounded-xl border border-white/20 bg-black/50 px-3 py-2 backdrop-blur-md sm:right-4 sm:top-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.35, ease }}
          >
            <p className="text-lg font-bold text-white sm:text-xl">
              {statValue}
              {statUnit && <span className="ml-0.5 text-xs font-medium text-white/60">{statUnit}</span>}
            </p>
            {statLabel && <p className="text-[10px] text-white/55 sm:text-xs">{statLabel}</p>}
          </motion.div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          {title && (
            <p
              className={`font-bold leading-snug text-white transition-all ${
                isActive ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              }`}
            >
              {title}
            </p>
          )}
        </div>
      </div>

      {/* Active indicator bar */}
      <motion.div
        className="h-1 w-full origin-left"
        style={{ background: `linear-gradient(90deg, ${g1}, ${g2})` }}
        animate={{ scaleX: isActive ? 1 : 0 }}
        transition={{ duration: 0.4, ease }}
      />
    </motion.button>
  )
}

/* ─── Detail panel ─── */

function DetailPanel({
  card,
  accent,
  accentAlt,
  reduceMotion,
}: {
  card: HolodeckCard
  accent: string
  accentAlt: string
  reduceMotion: boolean
}) {
  const [g1, g2] = cardGradient(card, [accent, accentAlt])
  const title = trim(card.title)
  const description = trim(card.description)
  const link = trim(card.link) || '#'
  const statValue = trim(card.stat?.value)
  const statUnit = trim(card.stat?.unit)
  const statLabel = trim(card.stat?.label)

  return (
    <motion.div
      key={card.id}
      className="relative overflow-hidden rounded-xl border border-white/10 p-5 sm:rounded-2xl sm:p-6 md:p-8"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease }}
      whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.18)' }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `${g1}33` }}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          {trim(card.tag) && (
            <span
              className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-xs"
              style={{ background: `${g1}22`, color: g1 }}
            >
              {card.tag}
            </span>
          )}
          {title && (
            <h3 className="text-lg font-bold text-white sm:text-xl md:text-2xl">{title}</h3>
          )}
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-white/55 sm:mt-3 sm:text-base">
              {description}
            </p>
          )}
          <motion.a
            href={link}
            className="group mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold sm:mt-5"
            style={{ color: g1 }}
            whileHover={reduceMotion ? undefined : { x: 4 }}
          >
            Launch module
            <ChevronIcon dir="right" />
          </motion.a>
        </div>

        {statValue && (
          <motion.div
            className="shrink-0 rounded-xl border border-white/10 px-4 py-3 text-center sm:px-5 sm:py-4"
            style={{ background: `linear-gradient(135deg, ${g1}18, ${g2}10)` }}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          >
            <p className="text-2xl font-bold text-white sm:text-3xl">
              {statValue}
              {statUnit && <span className="text-sm font-medium text-white/50"> {statUnit}</span>}
            </p>
            {statLabel && <p className="mt-0.5 text-xs text-white/45">{statLabel}</p>}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Main HoloDeck component ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const bp = useBreakpoint()

  const theme = data?.theme ?? {}
  const holodeck = data?.holodeck ?? {}

  const accent = safeColor(theme.accent, '#6366F1')
  const accentAlt = safeColor(theme.accentAlt, '#22D3EE')
  const surface = safeColor(theme.surface, '#080B14')
  const cardBg = safeColor(theme.card, '#111827')

  const cards = safeCards(holodeck.cards)
  const defaultId = resolveDefault(cards, holodeck.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)

  const autoRotate = holodeck.autoRotate !== false
  const rotateMs = safeMs(holodeck.autoRotateMs, 6500)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(
    0,
    cards.findIndex((card) => card.id === activeId),
  )
  const activeCard = cards[activeIndex] ?? cards[0] ?? null

  useEffect(() => {
    setActiveId((current) =>
      cards.some((card) => card.id === current) ? current : defaultId,
    )
  }, [cards, defaultId])

  const goTo = useCallback(
    (index: number) => {
      if (!cards.length) return
      const safe = ((index % cards.length) + cards.length) % cards.length
      const next = cards[safe]
      if (next?.id) setActiveId(next.id)
    },
    [cards],
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  useEffect(() => {
    if (!autoRotate || paused || cards.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(goNext, rotateMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, autoRotate, cards.length, goNext, paused, reduceMotion, rotateMs])

  const dragX = useMotionValue(0)
  const dragSpring = useSpring(dragX, { stiffness: 300, damping: 30 })

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) goNext()
    else if (info.offset.x > 60) goPrev()
    dragX.set(0)
  }

  const badgeText = trim(holodeck.badge?.text)
  const showPulse = holodeck.badge?.pulse !== false
  const eyebrow = trim(holodeck.eyebrow)
  const heading = trim(holodeck.heading)
  const headingParts = splitHeadline(heading, trim(holodeck.headingAccent))

  if (!cards.length) {
    return (
      <section
        className="flex min-h-[50vh] items-center justify-center px-4"
        style={{ background: surface }}
      >
        <p className="text-sm text-white/50 sm:text-base">No content available.</p>
      </section>
    )
  }

  const arcHeight = bp === 'mobile' ? 0 : bp === 'tablet' ? 340 : 400

  return (
    <section
      className="w-full overflow-x-hidden px-3 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16 lg:px-14 lg:py-20"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{ background: `${accent}18` }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full blur-[100px]"
          style={{ background: `${accentAlt}12` }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.header
          className="mb-8 text-center sm:mb-10 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          {badgeText && (
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/75 sm:text-sm"
              whileHover={reduceMotion ? undefined : { scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              {showPulse && (
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                    style={{ background: accentAlt }}
                  />
                  <span className="relative h-2 w-2 rounded-full" style={{ background: accentAlt }} />
                </span>
              )}
              {badgeText}
            </motion.div>
          )}

          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 sm:text-xs">
              {eyebrow}
            </p>
          )}

          {heading && (
            <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {headingParts.before}
              {headingParts.accent ? (
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, ${accent}, ${accentAlt})` }}
                >
                  {headingParts.accent}
                </span>
              ) : null}
              {headingParts.after}
            </h1>
          )}
        </motion.header>

        {/* HoloDeck — single unified component */}
        <motion.div
          className="relative rounded-2xl border border-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          onFocus={() => setPaused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
          }}
        >
          {/* Mobile: single card + swipe */}
          {bp === 'mobile' ? (
            <div className="relative">
              <motion.div
                className="relative mx-auto max-w-[320px]"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                style={{ x: dragSpring }}
                onDragEnd={handleDragEnd}
              >
                {activeCard && (
                  <div className="relative w-full">
                    <HoloCard
                      card={activeCard}
                      isActive
                      offset={{ x: 0, rotateY: 0, scale: 1, zIndex: 10, opacity: 1 }}
                      onSelect={() => undefined}
                      cardBg={cardBg}
                      reduceMotion={reduceMotion}
                      bp={bp}
                    />
                  </div>
                )}
              </motion.div>
              <p className="mt-3 text-center text-[10px] text-white/30">Swipe to explore</p>
            </div>
          ) : (
            /* Desktop / tablet: 3D arc */
            <div
              className="relative mx-auto"
              style={{ height: arcHeight, perspective: 1200 }}
            >
              {cards.map((card, index) => (
                <HoloCard
                  key={card.id}
                  card={card}
                  isActive={card.id === activeId}
                  offset={getArcOffset(index, activeIndex, cards.length, bp)}
                  onSelect={() => setActiveId(card.id)}
                  cardBg={cardBg}
                  reduceMotion={reduceMotion}
                  bp={bp}
                />
              ))}
            </div>
          )}

          {/* Nav controls */}
          <div className="mt-4 flex items-center justify-center gap-3 sm:mt-6">
            <motion.button
              type="button"
              onClick={goPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70"
              whileHover={reduceMotion ? undefined : { scale: 1.08, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous module"
            >
              <ChevronIcon dir="left" />
            </motion.button>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Module selector">
              {cards.map((card, i) => {
                const [g1] = cardGradient(card, [accent, accentAlt])
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className="rounded-full p-1"
                    aria-label={cardTitle(card)}
                    aria-current={card.id === activeId ? 'true' : undefined}
                  >
                    <motion.span
                      className="block rounded-full"
                      animate={{
                        width: card.id === activeId ? 22 : 7,
                        height: 7,
                        background: card.id === activeId ? g1 : 'rgba(255,255,255,0.2)',
                      }}
                      transition={{ duration: 0.3, ease }}
                    />
                  </button>
                )
              })}
            </div>

            <motion.button
              type="button"
              onClick={goNext}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70"
              whileHover={reduceMotion ? undefined : { scale: 1.08, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next module"
            >
              <ChevronIcon dir="right" />
            </motion.button>
          </div>

          {/* Detail panel */}
          <div className="mt-5 sm:mt-6 md:mt-8">
            <AnimatePresence mode="wait">
              {activeCard && (
                <DetailPanel
                  key={activeCard.id}
                  card={activeCard}
                  accent={accent}
                  accentAlt={accentAlt}
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
