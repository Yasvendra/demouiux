import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

type StoryType = 'ship' | 'learn' | 'build' | 'connect'

interface ThemeData {
  paper?: string
  surface?: string
  rule?: string
  ink?: string
  muted?: string
  faint?: string
  accent?: string
  accentSoft?: string
  blue?: string
  blueSoft?: string
  green?: string
  greenSoft?: string
  amber?: string
  amberSoft?: string
}

interface ContentFilter {
  id: string
  label?: string
}

interface SectorIndex {
  id: string
  label?: string
  count?: number
}

interface Story {
  id: string
  type?: string
  sector?: string
  sectorGroup?: string
  size?: string
  title?: string
  dek?: string
  author?: string
  authorMeta?: string
  publishedAgo?: string
  readMin?: number
  saves?: number
  replies?: number
  tags?: string[]
  takeaway?: string | null
}

interface TrendingItem {
  id: string
  label?: string
  heat?: number
}

interface WireMetric {
  id: string
  value?: string
  label?: string
}

interface WireAction {
  id: string
  label?: string
  primary?: boolean
}

interface GuildWireData {
  edition?: string
  masthead?: string
  tagline?: string
  liveReaders?: number
  storiesToday?: number
  defaultActive?: string
  autoRotate?: boolean
  autoRotateMs?: number
  contentFilters?: ContentFilter[]
  sectorIndex?: SectorIndex[]
  stories?: Story[]
  trending?: TrendingItem[]
  metrics?: WireMetric[]
  actions?: WireAction[]
}

interface DesignPageData {
  theme?: ThemeData
  guildWire?: GuildWireData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

const TYPE_META: Record<
  StoryType,
  { label: string; colorKey: 'accent' | 'blue' | 'green' | 'amber' }
> = {
  ship: { label: 'Shipped', colorKey: 'accent' },
  learn: { label: 'Learning', colorKey: 'blue' },
  build: { label: 'Building', colorKey: 'green' },
  connect: { label: 'Connecting', colorKey: 'amber' },
}

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeStories(items?: Story[]): Story[] {
  return (items ?? []).filter((s): s is Story => Boolean(trim(s?.id)))
}

function safeFilters(filters?: ContentFilter[]): ContentFilter[] {
  return (filters ?? []).filter((f): f is ContentFilter => Boolean(trim(f?.id)))
}

function safeSectors(sectors?: SectorIndex[]): SectorIndex[] {
  return (sectors ?? []).filter((s): s is SectorIndex => Boolean(trim(s?.id)))
}

function safeTrending(items?: TrendingItem[]): TrendingItem[] {
  return (items ?? []).filter((t): t is TrendingItem => Boolean(trim(t?.id)))
}

function safeMetrics(metrics?: WireMetric[]): WireMetric[] {
  return (metrics ?? []).filter((m): m is WireMetric => Boolean(trim(m?.id)))
}

function safeActions(actions?: WireAction[]): WireAction[] {
  return (actions ?? []).filter((a): a is WireAction => Boolean(trim(a?.id)))
}

function safeStrings(items?: string[]): string[] {
  return (items ?? []).map((s) => trim(s)).filter(Boolean)
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 7000): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function resolveDefault(items: Story[], preferred?: string): string {
  const id = trim(preferred)
  if (id && items.some((s) => s.id === id)) return id
  return items[0]?.id ?? ''
}

function parseType(value?: string): StoryType {
  const t = trim(value).toLowerCase()
  if (t === 'ship' || t === 'learn' || t === 'build' || t === 'connect') return t
  return 'learn'
}

function formatCount(n?: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString('en-US')
}

function storyPassesFilters(
  story: Story,
  contentFilter: string,
  sectorFilter: string | null,
): boolean {
  if (sectorFilter && trim(story.sectorGroup) !== sectorFilter) return false
  if (contentFilter === 'all') return true
  return parseType(story.type) === contentFilter
}

function typeColors(
  type: StoryType,
  theme: ThemeData,
): { color: string; soft: string; label: string } {
  const meta = TYPE_META[type]
  const map = {
    accent: { color: safeColor(theme.accent, '#C41E3A'), soft: theme.accentSoft ?? '#C41E3A12' },
    blue: { color: safeColor(theme.blue, '#1D4ED8'), soft: theme.blueSoft ?? '#1D4ED812' },
    green: { color: safeColor(theme.green, '#047857'), soft: theme.greenSoft ?? '#04785712' },
    amber: { color: safeColor(theme.amber, '#B45309'), soft: theme.amberSoft ?? '#B4530912' },
  }
  const c = map[meta.colorKey]
  return { ...c, label: meta.label }
}

/* ─── Single component: Guild Wire (editorial newspaper) ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const theme = data.theme ?? {}
  const wire = data.guildWire ?? {}
  const stories = safeStories(wire.stories)
  const contentFilters = safeFilters(wire.contentFilters)
  const sectorIndex = safeSectors(wire.sectorIndex)
  const trending = safeTrending(wire.trending)
  const metrics = safeMetrics(wire.metrics)
  const actions = safeActions(wire.actions)

  const paper = safeColor(theme.paper, '#FFFCF7')
  const surface = safeColor(theme.surface, '#FFFFFF')
  const rule = safeColor(theme.rule, '#E8E2D8')
  const ink = safeColor(theme.ink, '#12100E')
  const muted = safeColor(theme.muted, '#6B6560')
  const faint = safeColor(theme.faint, '#A39E97')
  const accent = safeColor(theme.accent, '#C41E3A')

  const [activeId, setActiveId] = useState(() => resolveDefault(stories, wire.defaultActive))
  const [contentFilter, setContentFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState<string | null>(null)
  const pausedRef = useRef(false)

  const filteredStories = useMemo(
    () => stories.filter((s) => storyPassesFilters(s, contentFilter, sectorFilter)),
    [stories, contentFilter, sectorFilter],
  )

  const activeStory =
    filteredStories.find((s) => s.id === activeId) ??
    filteredStories[0] ??
    stories[0] ??
    null

  const sideStories = filteredStories.filter((s) => s.id !== activeStory?.id).slice(0, 6)

  const activeType = parseType(activeStory?.type)
  const activeTypeStyle = typeColors(activeType, theme)

  const handleSelect = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
  }, [])

  const handleContentFilter = useCallback((id: string) => {
    pausedRef.current = true
    setContentFilter(id)
  }, [])

  const handleSectorFilter = useCallback((id: string | null) => {
    pausedRef.current = true
    setSectorFilter(id)
  }, [])

  useEffect(() => {
    if (filteredStories.length === 0) return
    if (!filteredStories.some((s) => s.id === activeId)) {
      setActiveId(resolveDefault(filteredStories, wire.defaultActive))
    }
  }, [filteredStories, activeId, wire.defaultActive])

  useEffect(() => {
    if (!wire.autoRotate || filteredStories.length < 2 || pausedRef.current) return
    const ms = safeMs(wire.autoRotateMs)
    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = filteredStories.findIndex((s) => s.id === prev)
        const next = filteredStories[idx + 1]
        return next?.id ?? filteredStories[0]?.id ?? prev
      })
    }, ms)
    return () => window.clearInterval(timer)
  }, [wire.autoRotate, wire.autoRotateMs, filteredStories])

  if (stories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" style={{ background: paper, color: muted }}>
        Guild Wire offline.
      </div>
    )
  }

  const tags = safeStrings(activeStory?.tags)

  return (
    <div style={{ background: paper, color: ink }}>
      <motion.article
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease }}
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        aria-label="Guild Wire editorial feed"
      >
        {/* ── Masthead hero ── */}
        <header className="mb-6 border-b-2 pb-5 sm:mb-8" style={{ borderColor: ink }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em]" style={{ color: muted }}>
              {trim(wire.edition)}
            </p>
            <p className="text-[10px] font-medium tabular-nums" style={{ color: accent }}>
              {formatCount(wire.liveReaders)} reading · {wire.storiesToday ?? '—'} stories today
            </p>
          </div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="text-center font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {trim(wire.masthead) || 'Guild Wire'}
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.06, ease }}
            className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed sm:text-base"
            style={{ color: muted }}
          >
            {trim(wire.tagline)}
          </motion.p>
        </header>

        {/* ── Content type filters ── */}
        {contentFilters.length > 0 && (
          <motion.nav
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease }}
            className="mb-5 flex flex-wrap justify-center gap-1 border-b pb-4"
            style={{ borderColor: rule }}
            aria-label="Content filters"
          >
            {contentFilters.map((filter) => {
              const active = contentFilter === filter.id
              const type = filter.id !== 'all' ? parseType(filter.id) : null
              const color = type ? typeColors(type, theme).color : ink
              return (
                <motion.button
                  key={filter.id}
                  type="button"
                  onClick={() => handleContentFilter(filter.id)}
                  className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: active ? color : faint,
                    borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
                  }}
                  whileHover={reduceMotion ? undefined : { color: color }}
                  aria-pressed={active}
                >
                  {trim(filter.label) || filter.id}
                </motion.button>
              )
            })}
          </motion.nav>
        )}

        {/* ── 3-column newspaper layout ── */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left rail: sector index */}
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease }}
            className="lg:col-span-2"
            aria-label="Sector index"
          >
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: faint }}
            >
              Sectors
            </p>
            <ul className="space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => handleSectorFilter(null)}
                  className="w-full py-1.5 text-left text-xs font-semibold"
                  style={{ color: sectorFilter === null ? accent : muted }}
                >
                  All sectors
                </button>
              </li>
              {sectorIndex.map((sector) => {
                const active = sectorFilter === sector.id
                return (
                  <li key={sector.id}>
                    <motion.button
                      type="button"
                      onClick={() => handleSectorFilter(active ? null : sector.id)}
                      className="flex w-full items-baseline justify-between gap-2 py-1.5 text-left text-xs"
                      style={{ color: active ? ink : muted }}
                      whileHover={reduceMotion ? undefined : { color: ink, x: 2 }}
                      aria-pressed={active}
                    >
                      <span className={active ? 'font-semibold' : ''}>
                        {trim(sector.label) || sector.id}
                      </span>
                      {typeof sector.count === 'number' && (
                        <span className="shrink-0 tabular-nums" style={{ color: faint }}>
                          {sector.count}
                        </span>
                      )}
                    </motion.button>
                  </li>
                )
              })}
            </ul>
          </motion.aside>

          {/* Center: lead story + grid */}
          <div className="lg:col-span-7">
            {filteredStories.length === 0 ? (
              <p className="py-12 text-center text-sm" style={{ color: muted }}>
                No stories match.{' '}
                <button
                  type="button"
                  onClick={() => {
                    handleContentFilter('all')
                    handleSectorFilter(null)
                  }}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: accent }}
                >
                  Reset
                </button>
              </p>
            ) : (
              <>
                {/* Lead story — hero + product showcase */}
                <AnimatePresence mode="wait">
                  {activeStory && (
                    <motion.section
                      key={activeStory.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.32, ease }}
                      className="mb-6 border-b pb-6"
                      style={{ borderColor: rule }}
                      aria-label="Lead story"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                          style={{ background: activeTypeStyle.soft, color: activeTypeStyle.color }}
                        >
                          {activeTypeStyle.label}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: faint }}>
                          {trim(activeStory.sector)}
                        </span>
                        <span className="text-[10px]" style={{ color: faint }}>
                          · {trim(activeStory.publishedAgo)}
                        </span>
                      </div>

                      <h2
                        className="text-2xl font-bold leading-[1.12] tracking-tight sm:text-3xl lg:text-4xl"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {trim(activeStory.title)}
                      </h2>

                      <p className="mt-3 text-base leading-relaxed sm:text-lg" style={{ color: muted }}>
                        {trim(activeStory.dek)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: faint }}>
                        <span className="font-semibold" style={{ color: ink }}>
                          {trim(activeStory.author)}
                        </span>
                        <span>{trim(activeStory.authorMeta)}</span>
                        {typeof activeStory.readMin === 'number' && (
                          <span>{activeStory.readMin} min read</span>
                        )}
                        {typeof activeStory.saves === 'number' && (
                          <span>{formatCount(activeStory.saves)} saves</span>
                        )}
                        {typeof activeStory.replies === 'number' && (
                          <span>{activeStory.replies} replies</span>
                        )}
                      </div>

                      {trim(activeStory.takeaway) && (
                        <motion.blockquote
                          className="mt-5 border-l-2 py-1 pl-4 text-sm italic leading-relaxed sm:text-base"
                          style={{ borderColor: activeTypeStyle.color, color: ink }}
                          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.1, ease }}
                        >
                          {trim(activeStory.takeaway)}
                        </motion.blockquote>
                      )}

                      {tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded border px-2 py-0.5 text-[10px] font-medium"
                              style={{ borderColor: rule, color: muted }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Story grid — secondary headlines */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {sideStories.map((story, i) => {
                    const type = parseType(story.type)
                    const style = typeColors(type, theme)
                    const isActive = story.id === activeId

                    return (
                      <motion.button
                        key={story.id}
                        type="button"
                        onClick={() => handleSelect(story.id)}
                        className="rounded-lg border p-4 text-left"
                        style={{
                          borderColor: isActive ? style.color : rule,
                          background: isActive ? style.soft : surface,
                        }}
                        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.12 + i * 0.03, ease }}
                        whileHover={
                          reduceMotion
                            ? undefined
                            : { y: -3, borderColor: style.color, boxShadow: `0 8px 24px ${style.soft}` }
                        }
                        whileTap={{ scale: 0.99 }}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: style.color }}
                          >
                            {style.label}
                          </span>
                          <span className="text-[9px]" style={{ color: faint }}>
                            {trim(story.sector)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold leading-snug sm:text-base">
                          {trim(story.title)}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed" style={{ color: muted }}>
                          {trim(story.dek)}
                        </p>
                        <p className="mt-2 text-[10px]" style={{ color: faint }}>
                          {trim(story.publishedAgo)} · {story.readMin ?? '—'} min
                        </p>
                      </motion.button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right rail: trending + stats */}
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.12, ease }}
            className="lg:col-span-3"
          >
            {trending.length > 0 && (
              <div className="mb-6 rounded-lg border p-4" style={{ borderColor: rule, background: surface }}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: faint }}>
                  Trending topics
                </p>
                <ul className="space-y-2.5">
                  {trending.map((item, i) => (
                    <motion.li
                      key={item.id}
                      className="flex items-center gap-3"
                      initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.14 + i * 0.04, ease }}
                      whileHover={reduceMotion ? undefined : { x: 3 }}
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                        style={{ background: rule, color: muted }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{trim(item.label)}</p>
                        {typeof item.heat === 'number' && (
                          <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: rule }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: accent }}
                              initial={reduceMotion ? false : { width: 0 }}
                              animate={{ width: `${item.heat}%` }}
                              transition={{ duration: 0.6, delay: 0.2 + i * 0.05, ease }}
                            />
                          </div>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {metrics.length > 0 && (
              <div className="rounded-lg border p-4" style={{ borderColor: rule, background: surface }}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: faint }}>
                  Wire stats
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((item) => (
                    <div key={item.id}>
                      <p className="text-lg font-bold tabular-nums">{trim(item.value) || '—'}</p>
                      <p className="text-[9px] font-medium uppercase tracking-wide" style={{ color: faint }}>
                        {trim(item.label) || item.id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {actions.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {actions.map((action) => {
                  const label = trim(action.label) || trim(action.id)
                  const primary = action.primary === true
                  return (
                    <motion.button
                      key={action.id}
                      type="button"
                      className="w-full rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider"
                      style={
                        primary
                          ? { background: ink, color: paper }
                          : { background: 'transparent', color: ink, border: `1.5px solid ${rule}` }
                      }
                      whileHover={reduceMotion ? undefined : { y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {label}
                    </motion.button>
                  )
                })}
              </div>
            )}
          </motion.aside>
        </div>
      </motion.article>
    </div>
  )
}
