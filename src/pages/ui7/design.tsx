import { useCallback, useEffect, useState } from 'react'
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
  tile?: string
}

interface MorphBadge {
  text?: string
  pulse?: boolean
}

interface MorphMetric {
  value?: string
  unit?: string
  label?: string
}

type TileSpan = 'large' | 'medium' | 'small'

interface MorphTile {
  id: string
  icon?: string
  label?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: MorphMetric
  span?: TileSpan
}

interface MorphBentoData {
  badge?: MorphBadge
  eyebrow?: string
  heading?: string
  headingAccent?: string
  defaultActive?: string
  tiles?: MorphTile[]
}

interface DesignPageData {
  theme?: ThemeData
  morphBento?: MorphBentoData
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeTiles(tiles?: MorphTile[]): MorphTile[] {
  return (tiles ?? []).filter((tile): tile is MorphTile => Boolean(trim(tile?.id)))
}

function resolveDefault(tiles: MorphTile[], preferred?: string): string {
  const id = trim(preferred)
  if (id && tiles.some((tile) => tile.id === id)) return id
  return tiles[0]?.id ?? ''
}

function tileLabel(tile?: MorphTile | null): string {
  return trim(tile?.label) || trim(tile?.title) || trim(tile?.id) || 'Module'
}

function tileAlt(tile?: MorphTile | null): string {
  return trim(tile?.alt) || trim(tile?.title) || tileLabel(tile)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'bento'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeSpan(span?: string | null): TileSpan {
  const s = trim(span)
  if (s === 'large' || s === 'medium' || s === 'small') return s
  return 'small'
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

/* ─── Grid span classes ─── */

function tileGridClass(span: TileSpan, isActive: boolean, bp: Breakpoint): string {
  if (bp === 'mobile') {
    return isActive ? 'col-span-2 row-span-2 min-h-[200px]' : 'col-span-1 row-span-1 min-h-[100px]'
  }
  if (bp === 'tablet') {
    if (isActive) return 'col-span-2 row-span-2 min-h-[240px]'
    if (span === 'large') return 'col-span-2 row-span-1 min-h-[120px]'
    return 'col-span-1 row-span-1 min-h-[110px]'
  }
  // desktop bento mosaic
  if (isActive) return 'col-span-2 row-span-2 min-h-[320px] lg:min-h-[380px]'
  switch (span) {
    case 'large':
      return 'col-span-2 row-span-1 min-h-[140px] lg:min-h-[160px]'
    case 'medium':
      return 'col-span-1 row-span-1 min-h-[140px] lg:min-h-[160px]'
    default:
      return 'col-span-1 row-span-1 min-h-[120px] lg:min-h-[140px]'
  }
}

/* ─── Icons ─── */

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

/* ─── Bento tile ─── */

function BentoTile({
  tile,
  isActive,
  onSelect,
  accent,
  accentSecondary,
  tileBg,
  reduceMotion,
  bp,
}: {
  tile: MorphTile
  isActive: boolean
  onSelect: () => void
  accent: string
  accentSecondary: string
  tileBg: string
  reduceMotion: boolean
  bp: Breakpoint
}) {
  const span = safeSpan(tile.span)
  const label = tileLabel(tile)
  const icon = trim(tile.icon) || '◆'
  const metricValue = trim(tile.metric?.value)
  const metricUnit = trim(tile.metric?.unit)
  const fallback = imageFallback(tile.id)
  const imageUrl = trim(tile.image) || fallback
  const [src, setSrc] = useState(imageUrl)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  return (
    <motion.button
      type="button"
      layout
      layoutId={`tile-${tile.id}`}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-xl border text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:rounded-2xl ${tileGridClass(span, isActive, bp)}`}
      style={{
        background: tileBg,
        borderColor: isActive ? `${accent}66` : 'rgba(255,255,255,0.07)',
      }}
      transition={{ layout: { duration: 0.5, ease } }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              scale: isActive ? 1 : 1.02,
              borderColor: `${accent}44`,
              boxShadow: `0 8px 32px ${accent}22`,
            }
      }
      whileTap={{ scale: 0.98 }}
      aria-current={isActive ? 'true' : undefined}
      aria-label={label}
    >
      {/* Background image on active */}
      {isActive && (
        <motion.img
          src={src}
          alt={tileAlt(tile)}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setSrc((c) => (c === fallback ? c : fallback))}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease }}
        />
      )}

      {/* Gradient overlays */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isActive
            ? 'bg-gradient-to-t from-black/90 via-black/50 to-black/20'
            : 'bg-gradient-to-br from-white/[0.04] to-transparent opacity-100 group-hover:from-white/[0.07]'
        }`}
      />

      {/* Active glow ring */}
      {isActive && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ boxShadow: `inset 0 0 0 1px ${accent}55, 0 0 40px ${accent}22` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Tile content */}
      <div className="relative flex h-full flex-col justify-between p-3 sm:p-4 lg:p-5">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`flex items-center justify-center rounded-lg font-medium transition-all ${
              isActive
                ? 'h-9 w-9 text-lg sm:h-10 sm:w-10'
                : 'h-8 w-8 text-base sm:h-9 sm:w-9'
            }`}
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${accent}, ${accentSecondary})`
                : 'rgba(255,255,255,0.06)',
            }}
          >
            {icon}
          </span>

          {metricValue && isActive && (
            <motion.div
              className="rounded-lg border border-white/15 bg-black/40 px-2.5 py-1.5 backdrop-blur-sm sm:px-3 sm:py-2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease }}
            >
              <p className="text-sm font-bold text-white sm:text-base">
                {metricValue}
                {metricUnit && (
                  <span className="ml-0.5 text-[10px] font-medium text-white/55 sm:text-xs">
                    {metricUnit}
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </div>

        <div>
          <p
            className={`font-semibold leading-snug text-white transition-all ${
              isActive ? 'text-sm sm:text-base lg:text-lg' : 'text-xs sm:text-sm'
            }`}
          >
            {label}
          </p>

          {isActive && trim(tile.title) && (
            <motion.p
              className="mt-1 text-[11px] font-medium text-white/50 sm:text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {tile.title}
            </motion.p>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accentSecondary})` }}
        animate={{ scaleX: isActive ? 1 : 0 }}
        transition={{ duration: 0.4, ease }}
      />
    </motion.button>
  )
}

/* ─── Expanded detail drawer ─── */

function DetailDrawer({
  tile,
  accent,
  accentSecondary,
  reduceMotion,
  onClose,
}: {
  tile: MorphTile
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  onClose: () => void
}) {
  const title = trim(tile.title)
  const description = trim(tile.description)
  const link = trim(tile.link) || '#'
  const metricValue = trim(tile.metric?.value)
  const metricUnit = trim(tile.metric?.unit)
  const metricLabel = trim(tile.metric?.label)

  return (
    <motion.div
      key={tile.id}
      className="mt-4 overflow-hidden rounded-xl border border-white/10 sm:mt-5 sm:rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.45, ease }}
    >
      <div className="p-4 sm:p-5 md:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            {trim(tile.label) && (
              <span
                className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-xs"
                style={{ background: `${accent}22`, color: accent }}
              >
                {tile.label}
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
                Deploy module
                <ArrowIcon />
              </motion.a>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
              >
                Minimize
              </button>
            </div>
          </div>

          {metricValue && (
            <motion.div
              className="shrink-0 rounded-xl border border-white/10 px-4 py-3 text-center sm:px-5 sm:py-4"
              style={{ background: `linear-gradient(135deg, ${accent}15, ${accentSecondary}10)` }}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            >
              <p className="text-xl font-bold text-white sm:text-2xl">
                {metricValue}
                {metricUnit && (
                  <span className="text-sm font-medium text-white/45"> {metricUnit}</span>
                )}
              </p>
              {metricLabel && (
                <p className="mt-0.5 text-xs text-white/40">{metricLabel}</p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main: MorphBento ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const bp = useBreakpoint()

  const theme = data?.theme ?? {}
  const morphBento = data?.morphBento ?? {}

  const accent = safeColor(theme.accent, '#3B82F6')
  const accentSecondary = safeColor(theme.accentSecondary, '#34D399')
  const surface = safeColor(theme.surface, '#0C1017')
  const tileBg = safeColor(theme.tile, '#151B26')

  const tiles = safeTiles(morphBento.tiles)
  const defaultId = resolveDefault(tiles, morphBento.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [drawerOpen, setDrawerOpen] = useState(true)

  const activeTile = tiles.find((tile) => tile.id === activeId) ?? tiles[0] ?? null

  useEffect(() => {
    setActiveId((current) =>
      tiles.some((tile) => tile.id === current) ? current : defaultId,
    )
  }, [tiles, defaultId])

  const selectTile = useCallback((id: string) => {
    if (!trim(id)) return
    setActiveId((current) => {
      if (current === id) {
        setDrawerOpen((open) => !open)
        return current
      }
      setDrawerOpen(true)
      return id
    })
  }, [])

  const badgeText = trim(morphBento.badge?.text)
  const showPulse = morphBento.badge?.pulse !== false
  const eyebrow = trim(morphBento.eyebrow)
  const heading = trim(morphBento.heading)
  const headingParts = splitHeadline(heading, trim(morphBento.headingAccent))

  if (!tiles.length) {
    return (
      <section
        className="flex min-h-[50vh] items-center justify-center px-4"
        style={{ background: surface }}
      >
        <p className="text-sm text-white/50">No content available.</p>
      </section>
    )
  }

  const gridCols =
    bp === 'mobile' ? 'grid-cols-2' : bp === 'tablet' ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <section
      className="relative w-full overflow-x-hidden px-3 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16 lg:px-14 lg:py-20"
      style={{ background: surface, color: '#fff' }}
    >
      {/* Ambient grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.header
          className="mb-6 text-center sm:mb-8 md:mb-10 md:text-left"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          {badgeText && (
            <motion.div
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/75 sm:mb-4 sm:px-4 sm:py-2 sm:text-sm"
              whileHover={reduceMotion ? undefined : { scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              {showPulse && (
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                    style={{ background: accentSecondary }}
                  />
                  <span
                    className="relative h-2 w-2 rounded-full"
                    style={{ background: accentSecondary }}
                  />
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
            <h1 className="mt-2 text-xl font-bold leading-tight sm:text-2xl md:text-3xl lg:text-4xl xl:text-[2.75rem]">
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

        {/* Single MorphBento component */}
        <motion.div
          className="rounded-2xl border border-white/10 p-3 sm:rounded-3xl sm:p-4 md:p-5 lg:p-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.14)' }}
        >
          <motion.div
            layout
            className={`grid auto-rows-auto gap-2 sm:gap-2.5 md:gap-3 ${gridCols}`}
            transition={{ layout: { duration: 0.5, ease } }}
          >
            {tiles.map((tile) => (
              <BentoTile
                key={tile.id}
                tile={tile}
                isActive={tile.id === activeId}
                onSelect={() => selectTile(tile.id)}
                accent={accent}
                accentSecondary={accentSecondary}
                tileBg={tileBg}
                reduceMotion={reduceMotion}
                bp={bp}
              />
            ))}
          </motion.div>

          {/* Detail drawer */}
          <AnimatePresence>
            {drawerOpen && activeTile && (
              <DetailDrawer
                key={activeTile.id}
                tile={activeTile}
                accent={accent}
                accentSecondary={accentSecondary}
                reduceMotion={reduceMotion}
                onClose={() => setDrawerOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Tile indicator strip */}
          <div className="mt-3 flex justify-center gap-1 sm:mt-4" role="tablist" aria-label="Module selector">
            {tiles.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => {
                  setActiveId(tile.id)
                  setDrawerOpen(true)
                }}
                className="rounded-full p-1"
                aria-label={tileLabel(tile)}
                aria-current={tile.id === activeId ? 'true' : undefined}
              >
                <motion.span
                  className="block rounded-full"
                  animate={{
                    width: tile.id === activeId ? 18 : 6,
                    height: 6,
                    background: tile.id === activeId ? accent : 'rgba(255,255,255,0.18)',
                  }}
                  transition={{ duration: 0.3, ease }}
                />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
