import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  surface?: string
}

interface ExplorerMetric {
  value?: string
  label?: string
}

interface ExplorerHighlight {
  text?: string
  caption?: string
}

interface ExplorerItem {
  id: string
  label?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: ExplorerMetric
  highlight?: ExplorerHighlight
}

interface ExplorerData {
  subheading?: string
  heading?: string
  defaultActive?: string
  autoPlay?: boolean
  autoPlayInterval?: number
  items?: ExplorerItem[]
}

interface DesignPageData {
  theme?: ThemeData
  explorer?: ExplorerData
}

type LayoutMode = 'stacked' | 'overlap'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

const BP = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeItems(items?: ExplorerItem[]): ExplorerItem[] {
  return (items ?? []).filter((item): item is ExplorerItem => Boolean(trim(item?.id)))
}

function resolveDefault(items: ExplorerItem[], preferred?: string): string {
  const id = trim(preferred)
  if (id && items.some((item) => item.id === id)) return id
  return items[0]?.id ?? ''
}

function itemLabel(item?: ExplorerItem | null): string {
  return trim(item?.label) || trim(item?.title) || trim(item?.id) || 'Solution'
}

function itemAlt(item?: ExplorerItem | null): string {
  return trim(item?.alt) || trim(item?.title) || itemLabel(item)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'flux'}/1600/900`
}

function safeColor(value?: string | null, fallback = '#FF000F'): string {
  const color = trim(value)
  return color || fallback
}

function safeInterval(value?: number | null, fallback = 5500): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 2000)
}

function layoutMode(bp: Breakpoint): LayoutMode {
  if (bp === 'xs' || bp === 'sm') return 'stacked'
  return 'overlap'
}

function showSignalRail(bp: Breakpoint): boolean {
  return bp === 'lg' || bp === 'xl'
}

function showChipStrip(bp: Breakpoint): boolean {
  return bp === 'xs' || bp === 'sm' || bp === 'md'
}

/* ─── Icons ─── */

function ArrowIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

/* ─── Responsive hook ─── */

function getBreakpoint(width: number): Breakpoint {
  if (width < BP.sm) return 'xs'
  if (width < BP.md) return 'sm'
  if (width < BP.lg) return 'md'
  if (width < BP.xl) return 'lg'
  return 'xl'
}

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'lg',
  )

  useEffect(() => {
    const update = () => setBp(getBreakpoint(window.innerWidth))

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return bp
}

/* ─── Auto-play progress ring ─── */

function ProgressRing({
  progress,
  accent,
  size = 36,
}: {
  progress: MotionValue<number>
  accent: string
  size?: number
}) {
  const safeSize = Math.max(size ?? 36, 16)
  const stroke = 2.5
  const radius = (safeSize - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = useTransform(progress, (v) => circumference * (1 - Math.min(Math.max(v, 0), 1)))

  return (
    <svg width={safeSize} height={safeSize} className="-rotate-90" aria-hidden>
      <circle
        cx={safeSize / 2}
        cy={safeSize / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={safeSize / 2}
        cy={safeSize / 2}
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: dashOffset }}
      />
    </svg>
  )
}

/* ─── Signal rail (large screens) ─── */

function SignalRail({
  items,
  activeId,
  onSelect,
  accent,
  progress,
  reduceMotion,
}: {
  items: ExplorerItem[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  progress: MotionValue<number>
  reduceMotion: boolean
}) {
  const trackScale = useTransform(progress, [0, 1], [0.05, 1])
  const count = Math.max(items.length, 1)

  if (!items.length) return null

  return (
    <nav className="relative flex flex-col gap-0.5 xl:gap-1" aria-label="Solution explorer">
      <div className="absolute bottom-2 left-[11px] top-2 w-px bg-white/10" aria-hidden />
      <motion.div
        className="absolute left-[11px] w-px origin-top"
        style={{
          top: 8,
          height: `${Math.max(count - 1, 1) * 48}px`,
          background: `linear-gradient(180deg, ${accent}, transparent)`,
          scaleY: trackScale,
        }}
        aria-hidden
      />

      {items.map((item, index) => {
        const isActive = item.id === activeId
        const label = itemLabel(item)

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="group relative flex min-h-[44px] items-center gap-2.5 py-2 pl-0 pr-1 text-left xl:gap-3 xl:py-2.5"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4, ease }}
            whileHover={reduceMotion ? undefined : { x: 4 }}
            whileTap={{ scale: 0.98 }}
            aria-current={isActive ? 'true' : undefined}
            aria-label={label}
          >
            <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
              {isActive ? (
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <ProgressRing progress={progress} accent={accent} size={24} />
                  <span
                    className="absolute h-2 w-2 rounded-full"
                    style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                  />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/20 transition-colors group-hover:bg-white/50" />
              )}
            </span>

            <span
              className={`min-w-0 flex-1 truncate text-sm font-medium transition-colors duration-200 xl:text-base ${
                isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'
              }`}
            >
              {label}
            </span>

            {isActive && (
              <motion.span
                layoutId="rail-arrow"
                className="shrink-0 text-white/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                <ArrowIcon className="h-4 w-4" />
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}

/* ─── Chip strip (small / medium screens) ─── */

function ChipStrip({
  items,
  activeId,
  onSelect,
  accent,
  accentSecondary,
  reduceMotion,
}: {
  items: ExplorerItem[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  reduceMotion: boolean
}) {
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = stripRef.current
    if (!container) return
    const active = container.querySelector<HTMLElement>('[aria-current="true"]')
    active?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeId])

  if (!items.length) return null

  return (
    <div
      ref={stripRef}
      className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-min gap-1.5 px-0.5 sm:gap-2">
        {items.map((item, i) => {
          const isActive = item.id === activeId
          const label = itemLabel(item)

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="inline-flex max-w-[11rem] shrink-0 items-center rounded-full border px-3 py-2 text-xs font-medium sm:max-w-none sm:px-4 sm:py-2.5 sm:text-sm"
              style={{
                borderColor: isActive ? `${accent}88` : 'rgba(255,255,255,0.12)',
                background: isActive
                  ? `linear-gradient(135deg, ${accent}33, ${accentSecondary}22)`
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease }}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              aria-current={isActive ? 'true' : undefined}
              aria-label={label}
            >
              <span className="truncate">{label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Content panel (shared between layouts) ─── */

function ContentPanel({
  item,
  accent,
  accentSecondary,
  reduceMotion,
  className = '',
}: {
  item: ExplorerItem
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  className?: string
}) {
  const title = trim(item.title)
  const description = trim(item.description)
  const link = trim(item.link) || '#'
  const label = itemLabel(item)

  if (!title && !description) return null

  return (
    <motion.div
      className={`bg-white shadow-2xl ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease }}
      whileHover={
        reduceMotion
          ? undefined
          : { y: -2, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', transition: { duration: 0.3 } }
      }
    >
      <motion.span
        className="mb-3 block h-[3px] w-[30px] origin-left sm:mb-5"
        style={{ backgroundColor: accent }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        whileHover={reduceMotion ? undefined : { width: 48 }}
        transition={{ duration: 0.35, ease }}
        aria-hidden
      />

      {title && (
        <h3 className="text-base font-bold leading-snug text-black sm:text-xl lg:text-2xl">
          {title}
        </h3>
      )}

      {description && (
        <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:mt-3 sm:text-sm md:text-[0.9375rem] lg:mt-4 lg:text-base">
          {description}
        </p>
      )}

      <motion.a
        href={link}
        className="group mt-4 inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold sm:mt-5 sm:text-sm lg:mt-6"
        style={{ color: accent }}
        whileHover={reduceMotion ? undefined : { x: 4 }}
        transition={{ duration: 0.2 }}
        aria-label={`Learn more about ${title || label}`}
      >
        Explore solution
        <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </motion.a>

      <motion.div
        className="mt-4 h-px w-10 origin-left sm:mt-5 lg:mt-6 lg:w-12"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accentSecondary})` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease }}
      />
    </motion.div>
  )
}

/* ─── Viewport ─── */

function FluxViewport({
  item,
  accent,
  accentSecondary,
  reduceMotion,
  mode,
}: {
  item: ExplorerItem
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  mode: LayoutMode
}) {
  const fallback = imageFallback(item?.id)
  const imageUrl = trim(item?.image) || fallback
  const [src, setSrc] = useState(imageUrl)
  const metricValue = trim(item?.metric?.value)
  const metricLabel = trim(item?.metric?.label)
  const highlightText = trim(item?.highlight?.text)
  const highlightCaption = trim(item?.highlight?.caption)
  const isStacked = mode === 'stacked'

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  const imageBlock = (
    <div
      className={`relative overflow-hidden ${
        isStacked
          ? 'aspect-[16/10] w-full rounded-t-xl sm:aspect-[16/9] sm:rounded-t-2xl'
          : 'absolute inset-0 min-h-[320px] rounded-xl sm:min-h-[400px] sm:rounded-2xl md:min-h-[440px] lg:min-h-[500px] xl:min-h-[540px]'
      }`}
    >
      <motion.img
        src={src}
        alt={itemAlt(item)}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setSrc((current) => (current === fallback ? current : fallback))}
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.1, ease }}
        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
      />
      <div
        className={`absolute inset-0 ${
          isStacked
            ? 'bg-gradient-to-t from-black/50 via-black/10 to-transparent'
            : 'bg-gradient-to-r from-black/70 via-black/30 to-black/10'
        }`}
      />
      {!isStacked && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      )}

      {metricValue && (
        <motion.div
          className={`absolute rounded-lg border border-white/20 bg-white/95 shadow-xl backdrop-blur-sm sm:rounded-xl ${
            isStacked
              ? 'right-3 top-3 px-3 py-2 sm:right-4 sm:top-4 sm:px-4 sm:py-3'
              : 'right-4 top-4 px-3 py-2 sm:right-6 sm:top-6 sm:px-4 sm:py-3'
          }`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease }}
          whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }}
        >
          <p className="text-lg font-bold text-black sm:text-2xl lg:text-3xl">{metricValue}</p>
          {metricLabel && (
            <p className="text-[10px] text-gray-500 sm:text-xs lg:text-sm">{metricLabel}</p>
          )}
        </motion.div>
      )}

      {!isStacked && (highlightText || highlightCaption) && (
        <motion.div
          className="absolute bottom-24 left-4 hidden max-w-xs rounded-xl border border-white/15 bg-black/60 px-4 py-3 backdrop-blur-md sm:bottom-28 sm:left-6 sm:block md:bottom-32"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease }}
        >
          {highlightText && (
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
              {highlightText}
            </p>
          )}
          {highlightCaption && (
            <p className="mt-1 text-xs text-white/65">{highlightCaption}</p>
          )}
        </motion.div>
      )}
    </div>
  )

  if (isStacked) {
    return (
      <motion.div
        key={item.id}
        className="flex w-full flex-col overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease }}
      >
        {imageBlock}

        {(highlightText || highlightCaption) && (
          <div className="border-b border-white/10 bg-black/40 px-4 py-3 sm:px-5">
            {highlightText && (
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 sm:text-xs">
                {highlightText}
              </p>
            )}
            {highlightCaption && (
              <p className="mt-0.5 text-xs text-white/55 sm:text-sm">{highlightCaption}</p>
            )}
          </div>
        )}

        <ContentPanel
          item={item}
          accent={accent}
          accentSecondary={accentSecondary}
          reduceMotion={reduceMotion}
          className="rounded-b-xl px-4 py-5 sm:rounded-b-2xl sm:px-6 sm:py-6 md:px-8 md:py-7"
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      key={item.id}
      className="relative w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease }}
    >
      <div className="relative min-h-[320px] overflow-hidden rounded-xl sm:min-h-[400px] sm:rounded-2xl md:min-h-[440px] lg:min-h-[500px] xl:min-h-[540px]">
        {imageBlock}

        <ContentPanel
          item={item}
          accent={accent}
          accentSecondary={accentSecondary}
          reduceMotion={reduceMotion}
          className="absolute bottom-4 left-4 right-4 rounded-lg px-5 py-5 sm:bottom-6 sm:left-auto sm:right-0 sm:w-[84%] sm:rounded-none sm:px-8 sm:py-8 md:bottom-8 md:w-[76%] lg:w-[60%] lg:max-w-xl lg:px-10 lg:py-10 xl:w-[56%]"
        />
      </div>
    </motion.div>
  )
}

/* ─── Progress dots ─── */

function ProgressDots({
  items,
  activeId,
  onSelect,
  accent,
}: {
  items: ExplorerItem[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
}) {
  if (items.length < 2) return null

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:mt-4" role="tablist" aria-label="Solution progress">
      {items.map((item) => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="rounded-full p-1 transition-all duration-300"
            aria-label={itemLabel(item)}
            aria-current={isActive ? 'true' : undefined}
          >
            <span
              className="block rounded-full transition-all duration-300"
              style={{
                width: isActive ? 20 : 6,
                height: 6,
                background: isActive ? accent : 'rgba(255,255,255,0.22)',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}

/* ─── Main ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const breakpoint = useBreakpoint()
  const mode = layoutMode(breakpoint)

  const theme = data?.theme ?? {}
  const explorer = data?.explorer ?? {}

  const accent = safeColor(theme.accent, '#FF000F')
  const accentSecondary = safeColor(theme.accentSecondary, '#00D4AA')
  const surface = safeColor(theme.surface, '#0A0F1C')

  const items = safeItems(explorer.items)
  const defaultId = resolveDefault(items, explorer.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [isPaused, setIsPaused] = useState(false)

  const autoPlay = explorer.autoPlay !== false
  const interval = safeInterval(explorer.autoPlayInterval, 5500)

  const progress = useMotionValue(0)
  const startRef = useRef(Date.now())

  const activeItem = items.find((item) => item.id === activeId) ?? items[0] ?? null

  useEffect(() => {
    setActiveId((current) =>
      items.some((item) => item.id === current) ? current : defaultId,
    )
  }, [defaultId, items])

  const selectItem = useCallback(
    (id: string) => {
      if (!trim(id) || !items.some((item) => item.id === id)) return
      setActiveId(id)
      progress.set(0)
      startRef.current = Date.now()
    },
    [items, progress],
  )

  const advance = useCallback(() => {
    if (items.length < 2) return
    setActiveId((current) => {
      const idx = items.findIndex((item) => item.id === current)
      const nextIndex = idx >= 0 ? (idx + 1) % items.length : 0
      return items[nextIndex]?.id ?? current
    })
    progress.set(0)
    startRef.current = Date.now()
  }, [items, progress])

  useEffect(() => {
    if (!autoPlay || isPaused || items.length < 2 || reduceMotion) {
      progress.set(0)
      return
    }

    startRef.current = Date.now()
    progress.set(0)

    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      progress.set(Math.min(elapsed / interval, 1))
      if (elapsed >= interval) advance()
    }, 50)

    return () => clearInterval(tick)
  }, [activeId, advance, autoPlay, interval, isPaused, items.length, progress, reduceMotion])

  const subheading = trim(explorer.subheading)
  const heading = trim(explorer.heading)

  if (!items.length) {
    return (
      <section
        className="flex min-h-[50vh] items-center justify-center px-4 sm:px-6"
        style={{ background: surface }}
      >
        <p className="text-sm text-white/50 sm:text-base lg:text-lg">No content available.</p>
      </section>
    )
  }

  return (
    <section
      className="w-full overflow-x-hidden font-sans px-3 py-8 sm:px-6 sm:py-12 md:px-8 md:py-14 lg:px-12 lg:py-16 xl:px-16 xl:py-20"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsPaused(false)
      }}
    >
      <div className="mx-auto w-full max-w-7xl">
        {(subheading || heading) && (
          <motion.header
            className="mb-5 text-center sm:mb-7 sm:text-left md:mb-8 lg:mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            {subheading && (
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 sm:text-xs sm:tracking-[0.22em]">
                {subheading}
              </p>
            )}
            {heading && (
              <h2 className="mt-2 text-lg font-bold leading-tight sm:text-2xl md:text-3xl lg:text-4xl">
                {heading}
              </h2>
            )}
          </motion.header>
        )}

        <motion.div
          className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-sm sm:rounded-2xl sm:p-5 md:p-6 lg:rounded-3xl lg:p-7 xl:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
          whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.15)' }}
        >
          {showChipStrip(breakpoint) && (
            <div className="mb-3 sm:mb-4 md:mb-5">
              <ChipStrip
                items={items}
                activeId={activeId}
                onSelect={selectItem}
                accent={accent}
                accentSecondary={accentSecondary}
                reduceMotion={reduceMotion}
              />
            </div>
          )}

          <div
            className={`grid w-full gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10 ${
              showSignalRail(breakpoint)
                ? 'lg:grid-cols-[minmax(168px,200px)_1fr] xl:grid-cols-[minmax(188px,220px)_1fr]'
                : 'grid-cols-1'
            }`}
          >
            {showSignalRail(breakpoint) && (
              <div className="hidden lg:block">
                <SignalRail
                  items={items}
                  activeId={activeId}
                  onSelect={selectItem}
                  accent={accent}
                  progress={progress}
                  reduceMotion={reduceMotion}
                />
              </div>
            )}

            <div className="min-w-0 w-full">
              <AnimatePresence mode="wait">
                {activeItem && (
                  <FluxViewport
                    key={activeItem.id}
                    item={activeItem}
                    accent={accent}
                    accentSecondary={accentSecondary}
                    reduceMotion={reduceMotion}
                    mode={mode}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {!showSignalRail(breakpoint) && (
            <ProgressDots
              items={items}
              activeId={activeId}
              onSelect={selectItem}
              accent={accent}
            />
          )}
        </motion.div>
      </div>
    </section>
  )
}
