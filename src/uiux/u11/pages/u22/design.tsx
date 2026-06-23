import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  desk?: string
  paper?: string
  ink?: string
  muted?: string
  line?: string
  tape?: string
  pin?: string
  shadow?: string
}

interface Snapshot {
  id: string
  code?: string
  label?: string
  cluster?: string
  learners?: number
  mentors?: number
  growth?: number
  color?: string
  tilt?: number
  audiences?: string[]
  caption?: string
  insight?: string
  paths?: string[]
}

interface StudioTotal {
  id: string
  value?: string
  label?: string
}

interface StudioAction {
  id: string
  label?: string
  primary?: boolean
}

interface OpenStudioData {
  badge?: string
  heading?: string
  subheading?: string
  liveInside?: number
  refreshLabel?: string
  defaultActive?: string
  autoCycle?: boolean
  autoCycleMs?: number
  personas?: string[]
  snapshots?: Snapshot[]
  totals?: StudioTotal[]
  actions?: StudioAction[]
}

interface DesignPageData {
  theme?: ThemeData
  openStudio?: OpenStudioData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeSnapshots(items?: Snapshot[]): Snapshot[] {
  return (items ?? []).filter((s): s is Snapshot => Boolean(trim(s?.id)))
}

function safeTotals(totals?: StudioTotal[]): StudioTotal[] {
  return (totals ?? []).filter((t): t is StudioTotal => Boolean(trim(t?.id)))
}

function safeActions(actions?: StudioAction[]): StudioAction[] {
  return (actions ?? []).filter((a): a is StudioAction => Boolean(trim(a?.id)))
}

function safePersonas(personas?: string[]): string[] {
  return (personas ?? []).map((p) => trim(p)).filter(Boolean)
}

function safeAudiences(audiences?: string[]): string[] {
  return (audiences ?? []).map((a) => trim(a)).filter(Boolean)
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 8000): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function safeTilt(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(Math.min(value, 12), -12)
}

function resolveDefault(items: Snapshot[], preferred?: string): string {
  const id = trim(preferred)
  if (id && items.some((s) => s.id === id)) return id
  return items[0]?.id ?? ''
}

function formatCount(n?: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString('en-US')
}

function snapshotMatchesPersona(snapshot: Snapshot, persona: string): boolean {
  const needle = trim(persona).toLowerCase()
  if (!needle) return true
  return safeAudiences(snapshot.audiences).some((tag) => tag.toLowerCase() === needle)
}

/* ─── Single component: Open Studio ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const theme = data.theme ?? {}
  const studio = data.openStudio ?? {}
  const snapshots = safeSnapshots(studio.snapshots)
  const totals = safeTotals(studio.totals)
  const actions = safeActions(studio.actions)
  const personas = safePersonas(studio.personas)

  const desk = safeColor(theme.desk, '#E5D9CC')
  const paper = safeColor(theme.paper, '#FFFDF8')
  const ink = safeColor(theme.ink, '#2A2118')
  const muted = safeColor(theme.muted, '#7A6E62')
  const line = safeColor(theme.line, '#C9BAA8')
  const tape = safeColor(theme.tape, '#F2E4A0')
  const pin = safeColor(theme.pin, '#D45B5B')
  const shadow = theme.shadow ?? 'rgba(42, 33, 24, 0.14)'

  const [activeId, setActiveId] = useState(() => resolveDefault(snapshots, studio.defaultActive))
  const [personaFilter, setPersonaFilter] = useState<string | null>(null)
  const pausedRef = useRef(false)

  const filteredSnapshots = useMemo(() => {
    if (!personaFilter) return snapshots
    return snapshots.filter((s) => snapshotMatchesPersona(s, personaFilter))
  }, [snapshots, personaFilter])

  const activeSnapshot =
    filteredSnapshots.find((s) => s.id === activeId) ??
    filteredSnapshots[0] ??
    snapshots[0] ??
    null

  const activeColor = safeColor(activeSnapshot?.color, '#5B5BD6')

  const handleSelect = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
  }, [])

  const handlePersonaFilter = useCallback((persona: string | null) => {
    pausedRef.current = true
    setPersonaFilter(persona)
  }, [])

  useEffect(() => {
    if (filteredSnapshots.length === 0) return
    if (!filteredSnapshots.some((s) => s.id === activeId)) {
      setActiveId(resolveDefault(filteredSnapshots, studio.defaultActive))
    }
  }, [filteredSnapshots, activeId, studio.defaultActive])

  useEffect(() => {
    if (!studio.autoCycle || filteredSnapshots.length < 2 || pausedRef.current) return
    const ms = safeMs(studio.autoCycleMs)
    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = filteredSnapshots.findIndex((s) => s.id === prev)
        const next = filteredSnapshots[idx + 1]
        return next?.id ?? filteredSnapshots[0]?.id ?? prev
      })
    }, ms)
    return () => window.clearInterval(timer)
  }, [studio.autoCycle, studio.autoCycleMs, filteredSnapshots])

  if (snapshots.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: desk, color: muted }}
      >
        Studio floor unavailable.
      </div>
    )
  }

  const paths = (activeSnapshot?.paths ?? []).map((p) => trim(p)).filter(Boolean)

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14"
      style={{
        background: desk,
        color: ink,
        backgroundImage:
          'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(42,33,24,0.03) 39px, rgba(42,33,24,0.03) 40px)',
      }}
    >
      <motion.article
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease }}
        className="mx-auto w-full max-w-6xl"
        aria-label="Open community studio floor"
      >
        {/* ── Top band: headline + live count ── */}
        <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <header className="max-w-xl">
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ background: tape, color: ink }}
            >
              {!reduceMotion && (
                <motion.span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: pin }}
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  aria-hidden
                />
              )}
              {trim(studio.badge) || 'Open studio'}
            </motion.span>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease }}
              className="mt-4 text-[1.75rem] font-bold leading-[1.12] tracking-tight sm:text-4xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {trim(studio.heading) || 'Community studio'}
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease }}
              className="mt-3 text-sm leading-relaxed sm:text-base"
              style={{ color: muted }}
            >
              {trim(studio.subheading)}
            </motion.p>
          </header>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.12, ease }}
            className="relative shrink-0 rounded-sm px-5 py-4 shadow-md"
            style={{ background: paper, boxShadow: `4px 6px 0 ${line}` }}
          >
            <span
              className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 rounded-sm opacity-80"
              style={{ background: tape }}
              aria-hidden
            />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
              On the floor now
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl" style={{ color: activeColor }}>
              {formatCount(studio.liveInside)}
            </p>
            <p className="mt-1 text-[10px]" style={{ color: muted }}>
              {trim(studio.refreshLabel)}
            </p>
          </motion.div>
        </div>

        {/* ── Persona sticky notes ── */}
        {personas.length > 0 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease }}
            className="mb-6 flex flex-wrap gap-2"
          >
            <motion.button
              type="button"
              onClick={() => handlePersonaFilter(null)}
              className="rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-wide shadow-sm"
              style={{
                background: personaFilter === null ? ink : paper,
                color: personaFilter === null ? paper : muted,
                transform: 'rotate(-1deg)',
                boxShadow: `2px 3px 0 ${line}`,
              }}
              whileHover={reduceMotion ? undefined : { y: -2, rotate: 0 }}
              whileTap={{ scale: 0.97 }}
              aria-pressed={personaFilter === null}
            >
              Everyone
            </motion.button>
            {personas.map((persona, i) => {
              const active = personaFilter === persona
              return (
                <motion.button
                  key={persona}
                  type="button"
                  onClick={() => handlePersonaFilter(active ? null : persona)}
                  className="rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-wide shadow-sm"
                  style={{
                    background: active ? ink : paper,
                    color: active ? paper : muted,
                    transform: `rotate(${i % 2 === 0 ? 1.5 : -1.5}deg)`,
                    boxShadow: `2px 3px 0 ${line}`,
                  }}
                  whileHover={reduceMotion ? undefined : { y: -2, rotate: 0 }}
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={active}
                >
                  {persona}
                </motion.button>
              )
            })}
          </motion.div>
        )}

        {/* ── Polaroid desk grid ── */}
        <section aria-label="Sector snapshot cards">
          {filteredSnapshots.length === 0 ? (
            <div
              className="rounded-sm border border-dashed px-6 py-16 text-center"
              style={{ borderColor: line, background: `${paper}88` }}
            >
              <p className="text-sm" style={{ color: muted }}>
                No desks match this traveler type.
              </p>
              <button
                type="button"
                onClick={() => handlePersonaFilter(null)}
                className="mt-3 text-xs font-bold uppercase tracking-widest underline-offset-2 hover:underline"
                style={{ color: ink }}
              >
                Show everyone
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {filteredSnapshots.map((snap, i) => {
                const isActive = snap.id === activeId
                const color = safeColor(snap.color, activeColor)
                const tilt = safeTilt(snap.tilt)
                const code = trim(snap.code) || snap.id.slice(0, 3).toUpperCase()
                const dimmed = personaFilter !== null && !snapshotMatchesPersona(snap, personaFilter)

                return (
                  <motion.li
                    key={snap.id}
                    layout={!reduceMotion}
                    initial={reduceMotion ? false : { opacity: 0, y: 20, rotate: tilt }}
                    animate={{
                      opacity: dimmed ? 0.35 : 1,
                      y: 0,
                      rotate: isActive ? 0 : tilt,
                      scale: isActive ? 1.03 : 1,
                    }}
                    transition={{ duration: 0.4, delay: 0.04 + i * 0.03, ease }}
                    className="list-none"
                  >
                    <motion.button
                      type="button"
                      onClick={() => handleSelect(snap.id)}
                      className="group relative w-full text-left"
                      whileHover={
                        reduceMotion
                          ? undefined
                          : { y: -6, rotate: 0, transition: { duration: 0.2 } }
                      }
                      whileTap={{ scale: 0.98 }}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <div
                        className="relative overflow-hidden rounded-sm p-3 pb-10 shadow-md transition-shadow sm:p-4 sm:pb-12"
                        style={{
                          background: paper,
                          boxShadow: isActive
                            ? `0 12px 32px ${shadow}, 0 0 0 2px ${color}`
                            : `3px 5px 0 ${line}`,
                        }}
                      >
                        {/* Tape strip */}
                        <span
                          className="absolute left-1/2 top-0 h-3 w-12 -translate-x-1/2 -translate-y-px opacity-70"
                          style={{ background: tape }}
                          aria-hidden
                        />

                        {/* Color wash */}
                        <div
                          className="mb-3 mt-1 flex h-16 items-end rounded-sm p-2 sm:h-20"
                          style={{
                            background: `linear-gradient(145deg, ${color}28, ${color}08)`,
                          }}
                        >
                          <span
                            className="text-2xl font-black tracking-tighter opacity-30 sm:text-3xl"
                            style={{ color }}
                          >
                            {code}
                          </span>
                        </div>

                        <p className="text-xs font-bold leading-tight sm:text-sm">
                          {trim(snap.label) || snap.id}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-snug" style={{ color: muted }}>
                          {trim(snap.caption)}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold tabular-nums" style={{ color }}>
                            {formatCount(snap.learners)}
                          </span>
                          {typeof snap.growth === 'number' && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: `${color}18`, color }}
                            >
                              +{snap.growth}%
                            </span>
                          )}
                        </div>

                        {isActive && !reduceMotion && (
                          <motion.span
                            layoutId="studio-pin"
                            className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full"
                            style={{ background: pin }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            aria-hidden
                          />
                        )}
                      </div>
                    </motion.button>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </section>

        {/* ── Active snapshot detail — pinned note ── */}
        <AnimatePresence mode="wait">
          {activeSnapshot && filteredSnapshots.length > 0 && (
            <motion.section
              key={activeSnapshot.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease }}
              className="relative mt-8 rounded-sm p-5 shadow-md sm:p-7"
              style={{
                background: paper,
                boxShadow: `5px 7px 0 ${line}`,
                transform: 'rotate(0.4deg)',
              }}
              aria-label="Active sector detail"
            >
              <span
                className="absolute -left-1 top-8 h-3 w-3 rounded-full"
                style={{ background: pin }}
                aria-hidden
              />

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: `${activeColor}18`, color: activeColor }}
                    >
                      {trim(activeSnapshot.code) || activeSnapshot.id}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: muted }}>
                      {trim(activeSnapshot.cluster)}
                    </span>
                  </div>

                  <h2
                    className="mt-2 text-xl font-bold sm:text-2xl"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {trim(activeSnapshot.label) || 'Sector desk'}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed" style={{ color: muted }}>
                    {trim(activeSnapshot.insight)}
                  </p>

                  {paths.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {paths.map((path) => (
                        <li
                          key={path}
                          className="rounded-sm border px-2.5 py-1 text-[10px] font-semibold"
                          style={{ borderColor: line, color: ink, background: `${activeColor}0A` }}
                        >
                          {path}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex shrink-0 gap-6 sm:gap-8">
                  <div>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: activeColor }}>
                      {formatCount(activeSnapshot.learners)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: muted }}>
                      Learners
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{formatCount(activeSnapshot.mentors)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: muted }}>
                      Mentors
                    </p>
                  </div>
                  {typeof activeSnapshot.growth === 'number' && (
                    <div>
                      <p className="text-2xl font-bold tabular-nums">+{activeSnapshot.growth}%</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: muted }}>
                        Growth
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Totals + actions ── */}
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {totals.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease }}
              className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {totals.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="rounded-sm px-4 py-3"
                  style={{ background: paper, boxShadow: `2px 3px 0 ${line}` }}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.22 + i * 0.04, ease }}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                >
                  <p className="text-lg font-bold tabular-nums sm:text-xl">{trim(item.value) || '—'}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ color: muted }}>
                    {trim(item.label) || item.id}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {actions.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28, ease }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              {actions.map((action) => {
                const label = trim(action.label) || trim(action.id)
                const primary = action.primary === true
                return (
                  <motion.button
                    key={action.id}
                    type="button"
                    className="rounded-sm px-6 py-3 text-xs font-bold uppercase tracking-widest"
                    style={
                      primary
                        ? { background: ink, color: paper, boxShadow: `3px 4px 0 ${line}` }
                        : { background: paper, color: ink, boxShadow: `2px 3px 0 ${line}` }
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
