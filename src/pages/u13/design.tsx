import { useCallback, useEffect, useRef, useState } from 'react'
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
  accentWarm?: string
  accentGlow?: string
  surface?: string
  glass?: string
}

interface DeckMetric {
  value?: string
  unit?: string
  label?: string
}

interface DeckModule {
  id: string
  index?: string
  label?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: DeckMetric
}

interface NovaDeckData {
  kicker?: string
  headline?: string
  headlineEmphasis?: string
  subcopy?: string
  defaultActive?: string
  autoCycle?: boolean
  autoCycleMs?: number
  modules?: DeckModule[]
}

interface DesignPageData {
  theme?: ThemeData
  novaDeck?: NovaDeckData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeModules(modules?: DeckModule[]): DeckModule[] {
  return (modules ?? []).filter((m): m is DeckModule => Boolean(trim(m?.id)))
}

function resolveDefault(modules: DeckModule[], preferred?: string): string {
  const id = trim(preferred)
  if (id && modules.some((m) => m.id === id)) return id
  return modules[0]?.id ?? ''
}

function moduleLabel(mod?: DeckModule | null): string {
  return trim(mod?.label) || trim(mod?.title) || trim(mod?.id) || 'Module'
}

function moduleAlt(mod?: DeckModule | null): string {
  return trim(mod?.alt) || trim(mod?.title) || moduleLabel(mod)
}

function moduleIndex(mod: DeckModule, fallback: number): string {
  return trim(mod.index) || String(fallback + 1).padStart(2, '0')
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'nova'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 7200): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function splitHeadline(headline: string, emphasis?: string) {
  if (!emphasis) return { before: headline, emphasis: '', after: '' }
  const idx = headline.toLowerCase().indexOf(emphasis.toLowerCase())
  if (idx === -1) return { before: headline, emphasis: '', after: '' }
  return {
    before: headline.slice(0, idx),
    emphasis: headline.slice(idx, idx + emphasis.length),
    after: headline.slice(idx + emphasis.length),
  }
}

function stackOrder(activeIndex: number, total: number): number[] {
  return Array.from({ length: total }, (_, i) => (activeIndex + i) % total)
}

/* ─── Animated mesh background ─── */

function MeshField({
  accent,
  accentWarm,
  accentGlow,
  reduceMotion,
}: {
  accent: string
  accentWarm: string
  accentGlow: string
  reduceMotion: boolean
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 20% 20%, ${accentGlow} 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 85% 75%, rgba(249, 115, 22, 0.12) 0%, transparent 50%)`,
        }}
      />
      {!reduceMotion && (
        <>
          <motion.div
            className="absolute -left-24 top-1/4 h-96 w-96 rounded-full blur-3xl"
            style={{ background: `${accent}33` }}
            animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-16 bottom-1/4 h-80 w-80 rounded-full blur-3xl"
            style={{ background: `${accentWarm}28` }}
            animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </>
      )}
    </div>
  )
}

/* ─── 3D tilt card in stack ─── */

function DeckCard({
  mod,
  stackPos,
  total,
  isFront,
  accent,
  accentWarm,
  glass,
  reduceMotion,
  onSelect,
}: {
  mod: DeckModule
  stackPos: number
  total: number
  isFront: boolean
  accent: string
  accentWarm: string
  glass: string
  reduceMotion: boolean
  onSelect: () => void
}) {
  const img = trim(mod.image) || imageFallback(mod.id)
  const title = trim(mod.title) || moduleLabel(mod)
  const label = moduleLabel(mod)
  const idx = moduleIndex(mod, stackPos)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], reduceMotion ? [0, 0] : [8, -8]), {
    stiffness: 200,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], reduceMotion ? [0, 0] : [-10, 10]), {
    stiffness: 200,
    damping: 20,
  })

  const offsetY = stackPos * 14
  const offsetX = stackPos * 18
  const scale = 1 - stackPos * 0.045
  const opacity = Math.max(0.35, 1 - stackPos * 0.18)

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduceMotion || !isFront) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="absolute left-0 top-0 w-full origin-center text-left"
      style={{
        zIndex: total - stackPos,
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      initial={false}
      animate={{
        y: offsetY,
        x: offsetX,
        scale,
        opacity,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      whileHover={
        isFront && !reduceMotion
          ? { scale: scale * 1.02, transition: { duration: 0.2 } }
          : undefined
      }
      whileTap={isFront ? { scale: scale * 0.98 } : undefined}
      aria-label={title}
      aria-current={isFront ? 'true' : undefined}
    >
      <div
        className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
        style={{
          background: glass,
          boxShadow: isFront ? `0 32px 64px -16px ${accent}33` : undefined,
        }}
      >
        <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4]">
          <motion.img
            src={img}
            alt={moduleAlt(mod)}
            className="h-full w-full object-cover"
            loading="lazy"
            animate={isFront && !reduceMotion ? { scale: 1.06 } : { scale: 1 }}
            transition={{ duration: 0.6, ease }}
            onError={(e) => {
              e.currentTarget.src = imageFallback(mod.id)
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(3,7,18,0.92) 0%, transparent 55%)`,
            }}
          />
          <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-5 sm:top-5">
            <span
              className="rounded-lg px-2 py-1 text-[10px] font-bold tabular-nums tracking-widest sm:text-xs"
              style={{ background: `${accent}44`, color: '#fff' }}
            >
              {idx}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-xs"
              style={{ background: `${accentWarm}33`, color: accentWarm }}
            >
              {label}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5">
            <p className="text-base font-bold leading-snug text-white sm:text-lg">{title}</p>
          </div>
          {isFront && !reduceMotion && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl"
              style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }}
              animate={{ opacity: [0.3, 0.75, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              aria-hidden
            />
          )}
        </div>
      </div>
    </motion.button>
  )
}

function ModuleStack({
  modules,
  activeIndex,
  accent,
  accentWarm,
  glass,
  reduceMotion,
  onSelect,
}: {
  modules: DeckModule[]
  activeIndex: number
  accent: string
  accentWarm: string
  glass: string
  reduceMotion: boolean
  onSelect: (id: string) => void
}) {
  const order = stackOrder(activeIndex, modules.length)

  return (
    <div className="relative mx-auto h-[340px] w-full max-w-[280px] sm:h-[400px] sm:max-w-[320px] lg:mx-0 lg:ml-auto lg:mr-0">
      {order
        .slice()
        .reverse()
        .map((modIdx) => {
          const mod = modules[modIdx]
          if (!mod) return null
          const stackPos = (modIdx - activeIndex + modules.length) % modules.length
          return (
            <DeckCard
              key={mod.id}
              mod={mod}
              stackPos={stackPos}
              total={modules.length}
              isFront={stackPos === 0}
              accent={accent}
              accentWarm={accentWarm}
              glass={glass}
              reduceMotion={reduceMotion}
              onSelect={() => onSelect(mod.id)}
            />
          )
        })}
    </div>
  )
}

/* ─── Mobile snap strip ─── */

function MobileStrip({
  modules,
  activeId,
  accent,
  accentWarm,
  reduceMotion,
  onSelect,
}: {
  modules: DeckModule[]
  activeId: string
  accent: string
  accentWarm: string
  reduceMotion: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
      {modules.map((mod, i) => {
        const isActive = mod.id === activeId
        const img = trim(mod.image) || imageFallback(mod.id)
        return (
          <motion.button
            key={mod.id}
            type="button"
            onClick={() => onSelect(mod.id)}
            className="relative w-[72vw] shrink-0 snap-center overflow-hidden rounded-2xl border text-left sm:w-[55vw]"
            style={{
              borderColor: isActive ? `${accent}66` : 'rgba(255,255,255,0.08)',
              aspectRatio: '3/4',
            }}
            whileTap={{ scale: 0.98 }}
            aria-current={isActive ? 'true' : undefined}
          >
            <img
              src={img}
              alt={moduleAlt(mod)}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = imageFallback(mod.id)
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute left-3 top-3 flex gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={{ background: `${accent}55` }}
              >
                {moduleIndex(mod, i)}
              </span>
            </div>
            <p className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white">
              {trim(mod.title) || moduleLabel(mod)}
            </p>
            {isActive && !reduceMotion && (
              <motion.span
                className="absolute bottom-0 left-0 h-0.5"
                style={{ background: accentWarm }}
                layoutId="mobile-active-bar"
                initial={false}
                animate={{ width: '100%' }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Editorial content panel ─── */

function EditorialPanel({
  mod,
  kicker,
  headlineParts,
  subcopy,
  accent,
  accentWarm,
  reduceMotion,
}: {
  mod: DeckModule | null
  kicker: string
  headlineParts: { before: string; emphasis: string; after: string }
  subcopy: string
  accent: string
  accentWarm: string
  reduceMotion: boolean
}) {
  const metric = mod?.metric
  const metricValue = trim(metric?.value)
  const metricUnit = trim(metric?.unit)
  const metricLabel = trim(metric?.label)
  const description = trim(mod?.description)
  const link = trim(mod?.link)

  return (
    <div className="flex flex-col justify-center">
      {kicker && (
        <motion.p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 sm:text-xs"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          {kicker}
        </motion.p>
      )}

      {headlineParts.before || headlineParts.emphasis ? (
        <motion.h1
          className="text-[clamp(2rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-tight"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          {headlineParts.before}
          {headlineParts.emphasis ? (
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(120deg, ${accent}, ${accentWarm})`,
              }}
            >
              {headlineParts.emphasis}
            </span>
          ) : null}
          {headlineParts.after}
        </motion.h1>
      ) : null}

      {subcopy && (
        <motion.p
          className="mt-5 max-w-lg text-sm leading-relaxed text-white/50 sm:mt-6 sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
        >
          {subcopy}
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        {mod && (
          <motion.div
            key={mod.id}
            className="mt-8 border-t border-white/10 pt-8 sm:mt-10"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="text-3xl font-bold tabular-nums sm:text-4xl"
                style={{ color: accent }}
              >
                {moduleIndex(mod, 0)}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/35">
                  {moduleLabel(mod)}
                </p>
                <h2 className="text-lg font-bold text-white sm:text-xl">
                  {trim(mod.title) || moduleLabel(mod)}
                </h2>
              </div>
            </div>

            {description && (
              <p className="max-w-lg text-sm leading-relaxed text-white/55 sm:text-[15px]">
                {description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4 sm:mt-6">
              {metricValue && (
                <motion.div
                  className="flex items-baseline gap-1.5"
                  whileHover={reduceMotion ? undefined : { x: 4 }}
                >
                  <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {metricValue}
                  </span>
                  {metricUnit && (
                    <span className="text-sm font-medium text-white/45">{metricUnit}</span>
                  )}
                  {metricLabel && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-white/35 sm:text-xs">
                      {metricLabel}
                    </span>
                  )}
                </motion.div>
              )}

              {link && (
                <motion.a
                  href={link}
                  className="group inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: accentWarm }}
                  whileHover={reduceMotion ? undefined : { gap: 10 }}
                >
                  <span className="border-b border-current pb-0.5">Explore module</span>
                  <motion.span
                    className="inline-block"
                    animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Minimal index strip (not pills) ─── */

function IndexStrip({
  modules,
  activeId,
  accent,
  accentWarm,
  reduceMotion,
  onSelect,
}: {
  modules: DeckModule[]
  activeId: string
  accent: string
  accentWarm: string
  reduceMotion: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div className="mt-10 flex items-center gap-1 border-t border-white/8 pt-6 sm:mt-12 lg:col-span-2">
      {modules.map((mod, i) => {
        const isActive = mod.id === activeId
        return (
          <motion.button
            key={mod.id}
            type="button"
            onClick={() => onSelect(mod.id)}
            className="relative px-3 py-2 text-sm font-medium tabular-nums sm:px-4"
            style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.3)' }}
            whileHover={reduceMotion ? undefined : { color: '#fff' }}
            aria-current={isActive ? 'true' : undefined}
            aria-label={moduleLabel(mod)}
          >
            {moduleIndex(mod, i)}
            {isActive && (
              <motion.span
                className="absolute bottom-0 left-3 right-3 h-0.5 sm:left-4 sm:right-4"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accentWarm})` }}
                layoutId="index-underline"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
          </motion.button>
        )
      })}
      <span className="ml-auto hidden text-[10px] uppercase tracking-widest text-white/25 sm:inline">
        Tap stack or index to switch
      </span>
    </div>
  )
}

/* ─── Main: NovaDeck (single component) ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false

  const theme = data?.theme ?? {}
  const deck = data?.novaDeck ?? {}

  const accent = safeColor(theme.accent, '#3B82F6')
  const accentWarm = safeColor(theme.accentWarm, '#F97316')
  const accentGlow = safeColor(theme.accentGlow, 'rgba(59, 130, 246, 0.25)')
  const surface = safeColor(theme.surface, '#030712')
  const glass = safeColor(theme.glass, 'rgba(255, 255, 255, 0.06)')

  const modules = safeModules(deck.modules)
  const defaultId = resolveDefault(modules, deck.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(0, modules.findIndex((m) => m.id === activeId))
  const activeModule = modules[activeIndex] ?? modules[0] ?? null

  const autoCycle = deck.autoCycle !== false
  const cycleMs = safeMs(deck.autoCycleMs, 7200)

  const kicker = trim(deck.kicker)
  const headline = trim(deck.headline)
  const subcopy = trim(deck.subcopy)
  const headlineParts = splitHeadline(headline, trim(deck.headlineEmphasis))

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
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
      <div
        className="flex min-h-[50vh] items-center justify-center px-6"
        style={{ background: surface }}
      >
        <p className="text-sm text-white/40">No modules available.</p>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-[100svh] overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:px-14 lg:py-20"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <MeshField
        accent={accent}
        accentWarm={accentWarm}
        accentGlow={accentGlow}
        reduceMotion={reduceMotion}
      />

      {/* Asymmetric editorial grid — NOT centered card layout */}
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <EditorialPanel
            mod={activeModule}
            kicker={kicker}
            headlineParts={headlineParts}
            subcopy={subcopy}
            accent={accent}
            accentWarm={accentWarm}
            reduceMotion={reduceMotion}
          />

          <div className="hidden lg:block">
            <ModuleStack
              modules={modules}
              activeIndex={activeIndex}
              accent={accent}
              accentWarm={accentWarm}
              glass={glass}
              reduceMotion={reduceMotion}
              onSelect={selectModule}
            />
          </div>
        </div>

        <MobileStrip
          modules={modules}
          activeId={activeId}
          accent={accent}
          accentWarm={accentWarm}
          reduceMotion={reduceMotion}
          onSelect={selectModule}
        />

        <IndexStrip
          modules={modules}
          activeId={activeId}
          accent={accent}
          accentWarm={accentWarm}
          reduceMotion={reduceMotion}
          onSelect={selectModule}
        />
      </div>
    </div>
  )
}
