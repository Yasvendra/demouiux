import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  canvas?: string
  ink?: string
  muted?: string
  line?: string
  board?: string
  boardLine?: string
  amber?: string
  cream?: string
  signal?: string
  rust?: string
  violet?: string
  sky?: string
}

interface SectorRef {
  code?: string
  label?: string
  color?: string
}

interface TransitRoute {
  id: string
  from?: SectorRef
  to?: SectorRef
  inTransit?: number
  avgWeeks?: number
  audiences?: string[]
  persona?: string
  insight?: string
  paths?: string[]
}

interface TransitTotal {
  id: string
  value?: string
  label?: string
}

interface TransitAction {
  id: string
  label?: string
  primary?: boolean
}

interface TransitNexusData {
  badge?: string
  heading?: string
  subheading?: string
  liveJourneys?: number
  refreshLabel?: string
  defaultActive?: string
  autoFlip?: boolean
  autoFlipMs?: number
  personas?: string[]
  routes?: TransitRoute[]
  totals?: TransitTotal[]
  actions?: TransitAction[]
}

interface DesignPageData {
  theme?: ThemeData
  transitNexus?: TransitNexusData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeRoutes(routes?: TransitRoute[]): TransitRoute[] {
  return (routes ?? []).filter((r): r is TransitRoute => Boolean(trim(r?.id)))
}

function safeTotals(totals?: TransitTotal[]): TransitTotal[] {
  return (totals ?? []).filter((t): t is TransitTotal => Boolean(trim(t?.id)))
}

function safeActions(actions?: TransitAction[]): TransitAction[] {
  return (actions ?? []).filter((a): a is TransitAction => Boolean(trim(a?.id)))
}

function safePersonas(personas?: string[]): string[] {
  return (personas ?? []).map((p) => trim(p)).filter(Boolean)
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 7200): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function resolveDefault(routes: TransitRoute[], preferred?: string): string {
  const id = trim(preferred)
  if (id && routes.some((r) => r.id === id)) return id
  return routes[0]?.id ?? ''
}

function formatCount(n?: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString('en-US')
}

function padCode(code?: string, fallback = '---'): string {
  const c = trim(code).toUpperCase()
  return c || fallback
}

function safeAudiences(audiences?: string[]): string[] {
  return (audiences ?? []).map((a) => trim(a)).filter(Boolean)
}

function routeMatchesPersona(route: TransitRoute, persona: string): boolean {
  const needle = trim(persona).toLowerCase()
  if (!needle) return true
  const tags = safeAudiences(route.audiences)
  if (tags.some((tag) => tag.toLowerCase() === needle)) return true
  return trim(route.persona).toLowerCase().includes(needle)
}

/* ─── Flip cell for departure board digits ─── */

function FlipCell({
  char,
  active,
  reduceMotion,
}: {
  char: string
  active: boolean
  reduceMotion: boolean
}) {
  return (
    <span
      className="relative inline-flex h-[1.35em] w-[0.72em] items-center justify-center overflow-hidden font-mono text-[0.95em] font-bold tabular-nums sm:text-base"
      aria-hidden
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${char}-${active}`}
          initial={reduceMotion ? false : { y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: '100%', opacity: 0 }}
          transition={{ duration: 0.22, ease }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function BoardNumber({
  value,
  active,
  reduceMotion,
}: {
  value: number
  active: boolean
  reduceMotion: boolean
}) {
  const digits = formatCount(value).split('')
  return (
    <span className="inline-flex items-center gap-px" aria-label={formatCount(value)}>
      {digits.map((d, i) => (
        <FlipCell key={`${i}-${d}`} char={d} active={active} reduceMotion={reduceMotion} />
      ))}
    </span>
  )
}

/* ─── Single component: Transit Nexus ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const theme = data.theme ?? {}
  const nexus = data.transitNexus ?? {}
  const routes = safeRoutes(nexus.routes)
  const totals = safeTotals(nexus.totals)
  const actions = safeActions(nexus.actions)
  const personas = safePersonas(nexus.personas)

  const canvas = safeColor(theme.canvas, '#F4F1EA')
  const ink = safeColor(theme.ink, '#14213D')
  const muted = safeColor(theme.muted, '#5C6478')
  const line = safeColor(theme.line, '#D4CFC4')
  const board = safeColor(theme.board, '#0F2A1E')
  const boardLine = safeColor(theme.boardLine, '#1E4D38')
  const cream = safeColor(theme.cream, '#F8F4E8')
  const amber = safeColor(theme.amber, '#F4A261')
  const signal = safeColor(theme.signal, '#2A9D8F')

  const [activeId, setActiveId] = useState(() => resolveDefault(routes, nexus.defaultActive))
  const [personaFilter, setPersonaFilter] = useState<string | null>(null)
  const pausedRef = useRef(false)

  const filteredRoutes = useMemo(() => {
    if (!personaFilter) return routes
    return routes.filter((r) => routeMatchesPersona(r, personaFilter))
  }, [routes, personaFilter])

  const displayRoutes = filteredRoutes

  const activeRoute =
    displayRoutes.find((r) => r.id === activeId) ?? displayRoutes[0] ?? routes[0] ?? null

  const activeFromColor = safeColor(activeRoute?.from?.color, signal)
  const activeToColor = safeColor(activeRoute?.to?.color, amber)

  const handleSelect = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
  }, [])

  const handlePersonaFilter = useCallback((persona: string | null) => {
    pausedRef.current = true
    setPersonaFilter(persona)
  }, [])

  useEffect(() => {
    if (displayRoutes.length === 0) return
    if (!displayRoutes.some((r) => r.id === activeId)) {
      setActiveId(resolveDefault(displayRoutes, nexus.defaultActive))
    }
  }, [displayRoutes, activeId, nexus.defaultActive])

  useEffect(() => {
    if (!nexus.autoFlip || displayRoutes.length < 2 || pausedRef.current) return
    const ms = safeMs(nexus.autoFlipMs)
    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = displayRoutes.findIndex((r) => r.id === prev)
        const next = displayRoutes[idx + 1]
        return next?.id ?? displayRoutes[0]?.id ?? prev
      })
    }, ms)
    return () => window.clearInterval(timer)
  }, [nexus.autoFlip, nexus.autoFlipMs, displayRoutes])

  if (routes.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: canvas, color: muted }}
      >
        Mobility board unavailable.
      </div>
    )
  }

  const paths = (activeRoute?.paths ?? []).map((p) => trim(p)).filter(Boolean)

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-14"
      style={{ background: canvas, color: ink }}
    >
      <motion.article
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease }}
        className="mx-auto w-full max-w-7xl"
        aria-label="Cross-sector skill transit board"
      >
        {/* Asymmetric split: editorial left, board right */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,380px)_1fr]">
          {/* ── Editorial rail ── */}
          <header className="flex flex-col lg:sticky lg:top-10 lg:self-start">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease }}
              className="mb-5 flex items-center gap-2"
            >
              <span
                className="inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ borderColor: line, color: muted, background: cream }}
              >
                {!reduceMotion && (
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: signal }}
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    aria-hidden
                  />
                )}
                {trim(nexus.badge) || 'Live board'}
              </span>
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease }}
              className="text-[1.65rem] font-bold leading-[1.15] tracking-tight sm:text-3xl lg:text-[2.1rem]"
            >
              {trim(nexus.heading) || 'Skills in transit'}
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease }}
              className="mt-3 text-sm leading-relaxed sm:text-[0.95rem]"
              style={{ color: muted }}
            >
              {trim(nexus.subheading)}
            </motion.p>

            {/* Live journeys ticker */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease }}
              className="mt-6 rounded-lg border-l-4 px-4 py-3"
              style={{ borderColor: signal, background: cream }}
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
                Journeys in flow
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: ink }}>
                {formatCount(nexus.liveJourneys)}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: muted }}>
                {trim(nexus.refreshLabel)}
              </p>
            </motion.div>

            {/* Persona ticket stubs */}
            {personas.length > 0 && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease }}
                className="mt-6"
              >
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
                  Filter by traveler
                </p>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    onClick={() => handlePersonaFilter(null)}
                    className="relative overflow-hidden rounded-sm border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      borderColor: personaFilter === null ? ink : line,
                      background: personaFilter === null ? ink : cream,
                      color: personaFilter === null ? cream : muted,
                    }}
                    whileHover={reduceMotion ? undefined : { y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={personaFilter === null}
                  >
                    All
                  </motion.button>
                  {personas.map((persona) => {
                    const active = personaFilter === persona
                    return (
                      <motion.button
                        key={persona}
                        type="button"
                        onClick={() => handlePersonaFilter(active ? null : persona)}
                        className="relative overflow-hidden rounded-sm border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          borderColor: active ? ink : line,
                          background: active ? ink : cream,
                          color: active ? cream : muted,
                        }}
                        whileHover={reduceMotion ? undefined : { y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        aria-pressed={active}
                      >
                        {persona}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Active route detail — desktop sidebar */}
            <AnimatePresence mode="wait">
              {activeRoute && (
                <motion.aside
                  key={activeRoute.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease }}
                  className="mt-8 hidden rounded-lg border p-4 lg:block"
                  style={{ borderColor: line, background: cream }}
                >
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
                    Active departure
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-snug">
                    {trim(activeRoute.persona)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: muted }}>
                    {trim(activeRoute.insight)}
                  </p>
                  {paths.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {paths.map((path) => (
                        <li
                          key={path}
                          className="rounded-sm px-2 py-0.5 font-mono text-[10px] font-medium"
                          style={{ background: `${signal}18`, color: signal }}
                        >
                          {path}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.aside>
              )}
            </AnimatePresence>
          </header>

          {/* ── Departure board ── */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="relative overflow-hidden rounded-sm shadow-2xl"
            style={{ background: board, color: cream }}
            aria-label="Departure board"
          >
            {/* Scan-line atmosphere */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
                }}
                animate={{ backgroundPositionY: ['0px', '8px'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                aria-hidden
              />
            )}

            {/* Board header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
              style={{ borderColor: boardLine }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#8FBF9F]">
                  Transit Nexus
                </span>
                <span className="hidden font-mono text-[10px] text-[#5A8A72] sm:inline">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#8FBF9F]">
                {!reduceMotion && (
                  <motion.span
                    className="inline-block h-2 w-2 rounded-full bg-[#F4A261]"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    aria-hidden
                  />
                )}
                Live
              </div>
            </div>

            {/* Column headers */}
            <div
              className="hidden grid-cols-[1fr_auto_1fr_auto_auto] gap-3 border-b px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#5A8A72] sm:grid sm:px-5"
              style={{ borderColor: boardLine }}
            >
              <span>Origin</span>
              <span aria-hidden />
              <span>Destination</span>
              <span className="text-right">In transit</span>
              <span className="text-right">ETA</span>
            </div>

            {/* Route rows */}
            <ul className="divide-y" style={{ borderColor: boardLine }}>
              {displayRoutes.length === 0 && (
                <li className="px-4 py-10 text-center sm:px-5">
                  <p className="font-mono text-sm text-[#8FBF9F]">
                    No departures for this traveler type.
                  </p>
                  <button
                    type="button"
                    onClick={() => handlePersonaFilter(null)}
                    className="mt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#F4A261] underline-offset-2 hover:underline"
                  >
                    Clear filter
                  </button>
                </li>
              )}
              {displayRoutes.map((route, i) => {
                const isActive = route.id === activeId
                const fromColor = safeColor(route.from?.color, signal)
                const toColor = safeColor(route.to?.color, amber)
                const fromCode = padCode(route.from?.code)
                const toCode = padCode(route.to?.code)
                const fromLabel = trim(route.from?.label) || fromCode
                const toLabel = trim(route.to?.label) || toCode

                return (
                  <motion.li key={route.id}>
                    <motion.button
                      type="button"
                      onClick={() => handleSelect(route.id)}
                      className="group relative w-full text-left transition-colors"
                      style={{
                        background: isActive ? `${fromColor}12` : 'transparent',
                      }}
                      initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 + i * 0.04, ease }}
                      whileHover={reduceMotion ? undefined : { backgroundColor: `${fromColor}0A` }}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      {/* Active row indicator */}
                      {isActive && (
                        <motion.span
                          layoutId="board-active-bar"
                          className="absolute left-0 top-0 h-full w-1"
                          style={{ background: `linear-gradient(180deg, ${fromColor}, ${toColor})` }}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          aria-hidden
                        />
                      )}

                      <div className="grid grid-cols-1 gap-2 px-4 py-3.5 sm:grid-cols-[1fr_auto_1fr_auto_auto] sm:items-center sm:gap-3 sm:px-5 sm:py-3">
                        {/* Origin */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-xs font-bold"
                            style={{
                              background: `${fromColor}22`,
                              color: fromColor,
                              boxShadow: isActive ? `0 0 12px ${fromColor}44` : undefined,
                            }}
                          >
                            {fromCode}
                          </span>
                          <span
                            className="truncate font-mono text-xs font-medium sm:text-sm"
                            style={{ color: isActive ? cream : '#A8C4B4' }}
                          >
                            {fromLabel}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div className="hidden items-center justify-center sm:flex" aria-hidden>
                          <motion.span
                            className="font-mono text-lg"
                            style={{ color: isActive ? amber : '#4A7A62' }}
                            animate={isActive && !reduceMotion ? { x: [0, 4, 0] } : undefined}
                            transition={{ duration: 1.6, repeat: Infinity, ease }}
                          >
                            →
                          </motion.span>
                        </div>

                        {/* Destination */}
                        <div className="flex items-center gap-2 min-w-0 sm:col-start-auto">
                          <span className="font-mono text-[10px] text-[#5A8A72] sm:hidden">→</span>
                          <span
                            className="shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-xs font-bold"
                            style={{
                              background: `${toColor}22`,
                              color: toColor,
                              boxShadow: isActive ? `0 0 12px ${toColor}44` : undefined,
                            }}
                          >
                            {toCode}
                          </span>
                          <span
                            className="truncate font-mono text-xs font-medium sm:text-sm"
                            style={{ color: isActive ? cream : '#A8C4B4' }}
                          >
                            {toLabel}
                          </span>
                        </div>

                        {/* In transit count */}
                        <div className="flex items-center justify-between sm:block sm:text-right">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#5A8A72] sm:hidden">
                            In transit
                          </span>
                          <span
                            className="font-mono text-sm font-bold tabular-nums sm:text-base"
                            style={{ color: isActive ? amber : '#C9D9CE' }}
                          >
                            <BoardNumber
                              value={route.inTransit ?? 0}
                              active={isActive}
                              reduceMotion={reduceMotion}
                            />
                          </span>
                        </div>

                        {/* ETA weeks */}
                        <div className="flex items-center justify-between sm:block sm:text-right">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#5A8A72] sm:hidden">
                            ETA
                          </span>
                          <span
                            className="font-mono text-sm font-bold tabular-nums"
                            style={{ color: isActive ? cream : '#8FAF9A' }}
                          >
                            {typeof route.avgWeeks === 'number' ? `${route.avgWeeks}w` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Mobile expanded detail */}
                      {isActive && (
                        <motion.div
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="overflow-hidden border-t px-4 pb-4 pt-3 lg:hidden"
                          style={{ borderColor: boardLine }}
                        >
                          <p className="text-xs leading-relaxed text-[#A8C4B4]">
                            {trim(route.insight)}
                          </p>
                          {paths.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {paths.map((path) => (
                                <span
                                  key={path}
                                  className="rounded-sm px-1.5 py-0.5 font-mono text-[9px]"
                                  style={{ background: `${signal}22`, color: signal }}
                                >
                                  {path}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.button>
                  </motion.li>
                )
              })}
            </ul>

            {/* Board footer strip */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 font-mono text-[10px] sm:px-5"
              style={{ borderColor: boardLine, color: '#5A8A72' }}
            >
              <span>
                {displayRoutes.length} departures ·{' '}
                <span style={{ color: amber }}>
                  {padCode(activeRoute?.from?.code)} → {padCode(activeRoute?.to?.code)}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: activeFromColor }}
                  aria-hidden
                />
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: activeToColor }}
                  aria-hidden
                />
                Bridge active
              </span>
            </div>
          </motion.section>
        </div>

        {/* Community totals + actions */}
        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          {totals.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25, ease }}
              className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {totals.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="rounded-sm border px-4 py-4"
                  style={{ borderColor: line, background: cream }}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.28 + i * 0.04, ease }}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: -2, boxShadow: `0 6px 20px ${ink}0A` }
                  }
                >
                  <p className="font-mono text-xl font-bold tabular-nums sm:text-2xl">
                    {trim(item.value) || '—'}
                  </p>
                  <p
                    className="mt-1 font-mono text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: muted }}
                  >
                    {trim(item.label) || item.id}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {actions.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.32, ease }}
              className="flex flex-col gap-2 sm:flex-row lg:flex-col"
            >
              {actions.map((action) => {
                const label = trim(action.label) || trim(action.id)
                const primary = action.primary === true
                return (
                  <motion.button
                    key={action.id}
                    type="button"
                    className="rounded-sm px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest"
                    style={
                      primary
                        ? { background: board, color: cream }
                        : { background: cream, color: ink, border: `1px solid ${line}` }
                    }
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {label}
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </div>
      </motion.article>
    </div>
  )
}
