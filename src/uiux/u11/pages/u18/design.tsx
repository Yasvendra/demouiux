import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

type TransitMode = 'walk' | 'subway' | 'bus' | 'bike'
type LegKind = 'segment' | 'hub'
type LegStatus = 'done' | 'active' | 'pending'
type Lane = 'main' | 'left' | 'right'

interface ThemeData {
  accent?: string
  subway?: string
  bus?: string
  walk?: string
  bike?: string
  accentLive?: string
  surface?: string
  panel?: string
  spine?: string
  muted?: string
}

interface TripLeg {
  id: string
  kind?: LegKind
  mode?: TransitMode
  lane?: Lane
  from?: string
  to?: string
  name?: string
  line?: string
  duration?: string
  distance?: string
  status?: LegStatus
  crowding?: string
  platform?: string
  delayMin?: number
  transfer?: boolean
  note?: string
}

interface TripAction {
  id: string
  label?: string
  primary?: boolean
}

interface TransitHopData {
  tripId?: string
  title?: string
  origin?: string
  destination?: string
  departure?: string
  arrival?: string
  duration?: string
  fare?: string
  liveStatus?: string
  delayMin?: number
  defaultActive?: string
  autoAdvance?: boolean
  autoAdvanceMs?: number
  legs?: TripLeg[]
  actions?: TripAction[]
}

interface DesignPageData {
  theme?: ThemeData
  transitHop?: TransitHopData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

const MODE_ICON: Record<TransitMode, string> = {
  walk: '◇',
  subway: '◈',
  bus: '▣',
  bike: '◎',
}

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeLegs(legs?: TripLeg[]): TripLeg[] {
  return (legs ?? []).filter((l): l is TripLeg => Boolean(trim(l?.id)))
}

function safeActions(actions?: TripAction[]): TripAction[] {
  return (actions ?? []).filter((a): a is TripAction => Boolean(trim(a?.id)))
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 8500): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function legStatus(leg: TripLeg): LegStatus {
  const s = trim(leg.status)
  if (s === 'done' || s === 'active' || s === 'pending') return s
  return 'pending'
}

function legKind(leg: TripLeg): LegKind {
  return trim(leg.kind) === 'hub' ? 'hub' : 'segment'
}

function legLane(leg: TripLeg): Lane {
  const lane = trim(leg.lane)
  if (lane === 'left' || lane === 'right') return lane
  return 'main'
}

function legMode(leg: TripLeg): TransitMode {
  const m = trim(leg.mode)
  if (m === 'walk' || m === 'subway' || m === 'bus' || m === 'bike') return m
  return 'walk'
}

function resolveDefault(legs: TripLeg[], preferred?: string): string {
  const id = trim(preferred)
  if (id && legs.some((l) => l.id === id)) return id
  return legs.find((l) => legStatus(l) === 'active')?.id ?? legs[0]?.id ?? ''
}

function modeColor(mode: TransitMode, theme: ThemeData): string {
  const map: Record<TransitMode, string> = {
    walk: safeColor(theme.walk, '#059669'),
    subway: safeColor(theme.subway, '#2563EB'),
    bus: safeColor(theme.bus, '#D97706'),
    bike: safeColor(theme.bike, '#7C3AED'),
  }
  return map[mode]
}

function crowdingLabel(level?: string): string {
  const v = trim(level)
  if (!v) return ''
  return v.charAt(0).toUpperCase() + v.slice(1)
}

function laneOffset(lane: Lane): string {
  if (lane === 'left') return '0%'
  if (lane === 'right') return '58%'
  return '29%'
}

function segmentTitle(leg: TripLeg): string {
  if (legKind(leg) === 'hub') return trim(leg.name) || 'Transfer'
  return trim(leg.line) || trim(leg.to) || trim(leg.from) || 'Segment'
}

/* ─── Mode badge ─── */

function ModeBadge({
  mode,
  color,
  active,
  done,
}: {
  mode: TransitMode
  color: string
  active: boolean
  done: boolean
}) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold sm:h-9 sm:w-9"
      style={{
        background: done ? `${color}18` : active ? color : `${color}12`,
        color: active ? '#fff' : done ? color : color,
        boxShadow: active ? `0 4px 14px ${color}44` : undefined,
      }}
    >
      {MODE_ICON[mode]}
    </span>
  )
}

/* ─── Hub node ─── */

function HubNode({
  leg,
  accent,
  spine,
  isActive,
  reduceMotion,
  onSelect,
}: {
  leg: TripLeg
  accent: string
  spine: string
  isActive: boolean
  reduceMotion: boolean
  onSelect: () => void
}) {
  const name = trim(leg.name) || 'Station'
  const transfer = leg.transfer === true

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="group relative z-10 flex w-full max-w-[11rem] flex-col items-center gap-1 sm:max-w-[13rem]"
      style={{ marginLeft: '29%' }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-current={isActive ? 'true' : undefined}
      aria-label={name}
    >
      <motion.span
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-[10px] font-bold uppercase tracking-wide sm:h-11 sm:w-11"
        style={{
          borderColor: isActive ? accent : transfer ? '#A78BFA' : spine,
          background: isActive ? accent : '#fff',
          color: isActive ? '#fff' : transfer ? '#7C3AED' : '#64748B',
        }}
        animate={isActive && !reduceMotion ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 2.2, repeat: isActive ? Infinity : 0 }}
      >
        {transfer ? '⇄' : '●'}
      </motion.span>
      <span
        className="text-center text-[10px] font-semibold leading-tight text-slate-700 sm:text-[11px]"
        style={{ color: isActive ? accent : undefined }}
      >
        {name}
      </span>
      {trim(leg.platform) && (
        <span className="text-center text-[9px] text-slate-400">{trim(leg.platform)}</span>
      )}
    </motion.button>
  )
}

/* ─── Segment row ─── */

function SegmentRow({
  leg,
  theme,
  spine,
  isActive,
  isDone,
  reduceMotion,
  onSelect,
}: {
  leg: TripLeg
  theme: ThemeData
  spine: string
  isActive: boolean
  isDone: boolean
  reduceMotion: boolean
  onSelect: () => void
}) {
  const mode = legMode(leg)
  const color = modeColor(mode, theme)
  const lane = legLane(leg)
  const offset = laneOffset(lane)
  const title = segmentTitle(leg)
  const duration = trim(leg.duration)
  const delay = typeof leg.delayMin === 'number' && leg.delayMin > 0 ? leg.delayMin : 0

  return (
    <div className="relative py-1">
      {/* diagonal connector to spine */}
      {lane !== 'main' && (
        <div
          className="pointer-events-none absolute top-1/2 h-px w-[29%] -translate-y-1/2"
          style={{
            left: lane === 'left' ? '29%' : '29%',
            width: '29%',
            background: `linear-gradient(${lane === 'left' ? '90deg' : '270deg'}, ${isDone || isActive ? color : spine}, ${spine})`,
            transform: lane === 'left' ? 'translateY(-50%) rotate(-8deg)' : 'translateY(-50%) rotate(8deg)',
            transformOrigin: lane === 'left' ? 'left center' : 'right center',
          }}
          aria-hidden
        />
      )}

      <motion.button
        type="button"
        onClick={onSelect}
        className="group relative z-10 flex w-[42%] items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors sm:gap-3 sm:px-3 sm:py-2.5"
        style={{
          marginLeft: offset,
          borderColor: isActive ? color : isDone ? `${color}55` : '#E2E8F0',
          background: isActive ? `${color}08` : '#fff',
          boxShadow: isActive ? `0 8px 24px ${color}22` : '0 1px 3px rgba(15,23,42,0.06)',
        }}
        whileHover={reduceMotion ? undefined : { y: -2, boxShadow: `0 12px 28px ${color}28` }}
        whileTap={{ scale: 0.99 }}
        aria-current={isActive ? 'true' : undefined}
        aria-label={title}
      >
        <ModeBadge mode={mode} color={color} active={isActive} done={isDone} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">{title}</p>
          <p className="truncate text-[10px] text-slate-500 sm:text-[11px]">
            {trim(leg.from) && trim(leg.to) ? `${trim(leg.from)} → ${trim(leg.to)}` : trim(leg.to) || trim(leg.from)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {duration && (
              <span className="text-[9px] font-medium tabular-nums text-slate-400 sm:text-[10px]">{duration}</span>
            )}
            {delay > 0 && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">
                +{delay} min
              </span>
            )}
            {trim(leg.crowding) && (
              <span className="text-[9px] text-slate-400">{crowdingLabel(leg.crowding)} crowd</span>
            )}
          </div>
        </div>
        {isActive && !reduceMotion && (
          <motion.span
            className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
            style={{ background: safeColor(theme.accentLive, '#EF4444') }}
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            aria-hidden
          />
        )}
      </motion.button>
    </div>
  )
}

/* ─── Branching spine ─── */

function BranchingSpine({
  legs,
  activeId,
  theme,
  accent,
  spine,
  reduceMotion,
  onSelect,
}: {
  legs: TripLeg[]
  activeId: string
  theme: ThemeData
  accent: string
  spine: string
  reduceMotion: boolean
  onSelect: (id: string) => void
}) {
  const activeIndex = Math.max(0, legs.findIndex((l) => l.id === activeId))

  return (
    <div className="relative px-2 py-2 sm:px-4">
      {/* central vertical spine */}
      <div
        className="pointer-events-none absolute bottom-4 left-[calc(29%+1.1rem)] top-4 w-0.5 rounded-full sm:left-[calc(29%+1.25rem)]"
        style={{ background: spine }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute left-[calc(29%+1.1rem)] top-4 w-0.5 rounded-full sm:left-[calc(29%+1.25rem)]"
        style={{
          background: `linear-gradient(180deg, ${safeColor(theme.subway, '#2563EB')}, ${safeColor(theme.bus, '#D97706')})`,
        }}
        initial={false}
        animate={{
          height: legs.length > 1 ? `${(activeIndex / (legs.length - 1)) * 100}%` : '0%',
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 22 }}
        aria-hidden
      />

      <div className="flex flex-col gap-3 sm:gap-4">
        {legs.map((leg, i) => {
          const status = legStatus(leg)
          const isActive = leg.id === activeId
          const isDone = status === 'done' || i < activeIndex

          if (legKind(leg) === 'hub') {
            return (
              <HubNode
                key={leg.id}
                leg={leg}
                accent={accent}
                spine={spine}
                isActive={isActive}
                reduceMotion={reduceMotion}
                onSelect={() => onSelect(leg.id)}
              />
            )
          }

          return (
            <SegmentRow
              key={leg.id}
              leg={leg}
              theme={theme}
              spine={spine}
              isActive={isActive}
              isDone={isDone}
              reduceMotion={reduceMotion}
              onSelect={() => onSelect(leg.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ─── Detail panel ─── */

function LegDetail({
  leg,
  theme,
  accent,
  muted,
}: {
  leg: TripLeg | null
  theme: ThemeData
  accent: string
  muted: string
}) {
  if (!leg) {
    return (
      <div className="flex h-full min-h-[8rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-400">
        Select a leg to view live details
      </div>
    )
  }

  const isHub = legKind(leg) === 'hub'
  const mode = legMode(leg)
  const color = isHub ? accent : modeColor(mode, theme)
  const title = segmentTitle(leg)
  const note = trim(leg.note)
  const platform = trim(leg.platform)
  const delay = typeof leg.delayMin === 'number' && leg.delayMin > 0 ? leg.delayMin : 0

  return (
    <motion.div
      key={leg.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease }}
      className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
            {isHub ? 'Transfer hub' : `${mode} segment`}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">{title}</h3>
        </div>
        {!isHub && (
          <ModeBadge mode={mode} color={color} active={legStatus(leg) === 'active'} done={legStatus(leg) === 'done'} />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {trim(leg.duration) && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-semibold uppercase text-slate-400">Duration</p>
            <p className="text-sm font-bold tabular-nums text-slate-800">{trim(leg.duration)}</p>
          </div>
        )}
        {trim(leg.distance) && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-semibold uppercase text-slate-400">Distance</p>
            <p className="text-sm font-bold text-slate-800">{trim(leg.distance)}</p>
          </div>
        )}
        {delay > 0 && (
          <div className="rounded-xl bg-red-50 px-3 py-2">
            <p className="text-[9px] font-semibold uppercase text-red-400">Delay</p>
            <p className="text-sm font-bold text-red-600">+{delay} min</p>
          </div>
        )}
        {platform && (
          <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2 sm:col-span-1">
            <p className="text-[9px] font-semibold uppercase text-slate-400">Platform</p>
            <p className="text-sm font-bold text-slate-800">{platform}</p>
          </div>
        )}
      </div>

      {note && (
        <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
          {note}
        </p>
      )}
    </motion.div>
  )
}

/* ─── Main export ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const theme = data.theme ?? {}
  const hop = data.transitHop ?? {}
  const legs = safeLegs(hop.legs)
  const actions = safeActions(hop.actions)

  const accent = safeColor(theme.accent, '#0F172A')
  const surface = safeColor(theme.surface, '#F1F5F9')
  const panel = safeColor(theme.panel, '#FFFFFF')
  const spine = safeColor(theme.spine, '#CBD5E1')
  const muted = safeColor(theme.muted, '#64748B')
  const live = safeColor(theme.accentLive, '#EF4444')

  const [activeId, setActiveId] = useState(() => resolveDefault(legs, hop.defaultActive))
  const pausedRef = useRef(false)

  const activeLeg = legs.find((l) => l.id === activeId) ?? null
  const tripDelay = typeof hop.delayMin === 'number' && hop.delayMin > 0 ? hop.delayMin : 0

  const handleSelect = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
  }, [])

  useEffect(() => {
    if (!hop.autoAdvance || legs.length < 2 || pausedRef.current) return
    const ms = safeMs(hop.autoAdvanceMs)
    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = legs.findIndex((l) => l.id === prev)
        const next = legs[idx + 1]
        return next?.id ?? legs[0]?.id ?? prev
      })
    }, ms)
    return () => window.clearInterval(timer)
  }, [hop.autoAdvance, hop.autoAdvanceMs, legs])

  if (legs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-500">
        No trip data available.
      </div>
    )
  }

  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{ background: surface, color: accent }}
    >
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Trip header — compact transit pass strip */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="overflow-hidden rounded-2xl shadow-md"
          style={{ background: accent }}
        >
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {trim(hop.tripId) || 'Live trip'}
                </span>
                {trim(hop.liveStatus) && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    {!reduceMotion && (
                      <motion.span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: live }}
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                    {trim(hop.liveStatus)}
                  </span>
                )}
                {tripDelay > 0 && (
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-200">
                    +{tripDelay} min system-wide
                  </span>
                )}
              </div>
              <h1 className="mt-2 truncate text-lg font-bold text-white sm:text-xl">
                {trim(hop.title) || 'Transit trip'}
              </h1>
              <p className="mt-0.5 truncate text-xs text-white/60 sm:text-sm">
                {trim(hop.origin)} → {trim(hop.destination)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase text-white/50">Depart</p>
                <p className="text-lg font-bold tabular-nums text-white">{trim(hop.departure) || '—'}</p>
              </div>
              <div className="h-8 w-px bg-white/15" aria-hidden />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase text-white/50">Arrive</p>
                <p className="text-lg font-bold tabular-nums text-white">{trim(hop.arrival) || '—'}</p>
              </div>
              <div className="h-8 w-px bg-white/15" aria-hidden />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase text-white/50">Fare</p>
                <p className="text-lg font-bold text-white">{trim(hop.fare) || trim(hop.duration) || '—'}</p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Split layout: branching spine + detail */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.05 }}
            className="overflow-hidden rounded-2xl border shadow-sm"
            style={{ background: panel, borderColor: '#E2E8F0' }}
          >
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Branching route</p>
              <p className="text-sm font-semibold text-slate-700">Tap any leg or transfer hub</p>
            </div>
            <BranchingSpine
              legs={legs}
              activeId={activeId}
              theme={theme}
              accent={accent}
              spine={spine}
              reduceMotion={reduceMotion}
              onSelect={handleSelect}
            />
          </motion.section>

          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <AnimatePresence mode="wait">
              <LegDetail leg={activeLeg} theme={theme} accent={accent} muted={muted} />
            </AnimatePresence>

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                  const label = trim(action.label) || trim(action.id)
                  const primary = action.primary === true
                  return (
                    <motion.button
                      key={action.id}
                      type="button"
                      className="rounded-xl px-4 py-2.5 text-xs font-semibold sm:text-sm"
                      style={
                        primary
                          ? { background: accent, color: '#fff' }
                          : { background: panel, color: accent, border: `1px solid ${spine}` }
                      }
                      whileHover={reduceMotion ? undefined : { y: -1 }}
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
      </div>
    </div>
  )
}
