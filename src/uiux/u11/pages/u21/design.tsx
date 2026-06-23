import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  void?: string
  deck?: string
  panel?: string
  bezel?: string
  ink?: string
  muted?: string
  line?: string
  phosphor?: string
  phosphorSoft?: string
  amber?: string
  scan?: string
}

interface Channel {
  id: string
  code?: string
  label?: string
  cluster?: string
  signal?: number
  learners?: number
  mentors?: number
  velocity?: number
  color?: string
  audiences?: string[]
  headline?: string
  insight?: string
  paths?: string[]
}

interface ConsoleTotal {
  id: string
  value?: string
  label?: string
}

interface ConsoleAction {
  id: string
  label?: string
  primary?: boolean
}

interface RelayConsoleData {
  badge?: string
  heading?: string
  subheading?: string
  liveTuned?: number
  refreshLabel?: string
  defaultActive?: string
  autoScan?: boolean
  autoScanMs?: number
  personas?: string[]
  channels?: Channel[]
  totals?: ConsoleTotal[]
  actions?: ConsoleAction[]
}

interface DesignPageData {
  theme?: ThemeData
  relayConsole?: RelayConsoleData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeChannels(items?: Channel[]): Channel[] {
  return (items ?? []).filter((c): c is Channel => Boolean(trim(c?.id)))
}

function safeTotals(totals?: ConsoleTotal[]): ConsoleTotal[] {
  return (totals ?? []).filter((t): t is ConsoleTotal => Boolean(trim(t?.id)))
}

function safeActions(actions?: ConsoleAction[]): ConsoleAction[] {
  return (actions ?? []).filter((a): a is ConsoleAction => Boolean(trim(a?.id)))
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

function safeMs(value?: number | null, fallback = 7000): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function safeSignal(value?: number | null, fallback = 50): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 100), 8)
}

function resolveDefault(items: Channel[], preferred?: string): string {
  const id = trim(preferred)
  if (id && items.some((c) => c.id === id)) return id
  return items[0]?.id ?? ''
}

function formatCount(n?: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString('en-US')
}

function channelMatchesPersona(channel: Channel, persona: string): boolean {
  const needle = trim(persona).toLowerCase()
  if (!needle) return true
  return safeAudiences(channel.audiences).some((tag) => tag.toLowerCase() === needle)
}

/* ─── Waveform bars (decorative signal) ─── */

function WaveformBars({
  color,
  active,
  reduceMotion,
}: {
  color: string
  active: boolean
  reduceMotion: boolean
}) {
  const heights = [0.35, 0.65, 0.45, 0.85, 0.55, 0.75, 0.4, 0.9, 0.5, 0.7, 0.6, 0.8]
  return (
    <div className="flex h-8 items-end gap-[2px]" aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-sm"
          style={{ background: color, opacity: active ? 0.9 : 0.35 }}
          initial={{ height: `${h * 100}%` }}
          animate={
            reduceMotion || !active
              ? { height: `${h * 100}%` }
              : { height: [`${h * 70}%`, `${h * 100}%`, `${h * 60}%`, `${h * 90}%`] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1.2 + i * 0.08, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      ))}
    </div>
  )
}

/* ─── Single component: Relay Console ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const theme = data.theme ?? {}
  const console = data.relayConsole ?? {}
  const channels = safeChannels(console.channels)
  const totals = safeTotals(console.totals)
  const actions = safeActions(console.actions)
  const personas = safePersonas(console.personas)

  const voidBg = safeColor(theme.void, '#060A12')
  const deck = safeColor(theme.deck, '#0C1422')
  const panel = safeColor(theme.panel, '#111D30')
  const bezel = safeColor(theme.bezel, '#1A2A42')
  const ink = safeColor(theme.ink, '#E8F0FA')
  const muted = safeColor(theme.muted, '#6B8299')
  const line = safeColor(theme.line, '#243752')
  const phosphor = safeColor(theme.phosphor, '#3DFFA8')
  const phosphorSoft = theme.phosphorSoft ?? '#3DFFA822'
  const amber = safeColor(theme.amber, '#FFB84D')
  const scan = theme.scan ?? 'rgba(61, 255, 168, 0.04)'

  const [activeId, setActiveId] = useState(() => resolveDefault(channels, console.defaultActive))
  const [personaFilter, setPersonaFilter] = useState<string | null>(null)
  const pausedRef = useRef(false)

  const filteredChannels = useMemo(() => {
    if (!personaFilter) return channels
    return channels.filter((c) => channelMatchesPersona(c, personaFilter))
  }, [channels, personaFilter])

  const activeChannel =
    filteredChannels.find((c) => c.id === activeId) ??
    filteredChannels[0] ??
    channels[0] ??
    null

  const activeColor = safeColor(activeChannel?.color, phosphor)
  const activeSignal = safeSignal(activeChannel?.signal)

  const handleSelect = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
  }, [])

  const handlePersonaFilter = useCallback((persona: string | null) => {
    pausedRef.current = true
    setPersonaFilter(persona)
  }, [])

  useEffect(() => {
    if (filteredChannels.length === 0) return
    if (!filteredChannels.some((c) => c.id === activeId)) {
      setActiveId(resolveDefault(filteredChannels, console.defaultActive))
    }
  }, [filteredChannels, activeId, console.defaultActive])

  useEffect(() => {
    if (!console.autoScan || filteredChannels.length < 2 || pausedRef.current) return
    const ms = safeMs(console.autoScanMs)
    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = filteredChannels.findIndex((c) => c.id === prev)
        const next = filteredChannels[idx + 1]
        return next?.id ?? filteredChannels[0]?.id ?? prev
      })
    }, ms)
    return () => window.clearInterval(timer)
  }, [console.autoScan, console.autoScanMs, filteredChannels])

  if (channels.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ background: voidBg, color: muted }}
      >
        Relay console offline.
      </div>
    )
  }

  const paths = (activeChannel?.paths ?? []).map((p) => trim(p)).filter(Boolean)

  return (
    <div
      className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12"
      style={{ background: voidBg, color: ink }}
    >
      {/* CRT scanlines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${scan} 0px, transparent 2px, transparent 4px)`,
        }}
        aria-hidden
      />

      <motion.article
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="relative mx-auto w-full max-w-6xl"
        aria-label="Community sector relay console"
      >
        {/* ── Hero band: left-aligned editorial + live readout ── */}
        <div className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-start lg:justify-between">
          <header className="max-w-2xl">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease }}
              className="mb-3 inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.28em]"
              style={{ borderColor: line, color: phosphor, background: deck }}
            >
              {!reduceMotion && (
                <motion.span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: phosphor }}
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  aria-hidden
                />
              )}
              {trim(console.badge) || 'Live relay'}
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease }}
              className="text-[1.65rem] font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.75rem]"
            >
              {trim(console.heading) || 'Sector relay'}
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease }}
              className="mt-3 max-w-lg text-sm leading-relaxed sm:text-base"
              style={{ color: muted }}
            >
              {trim(console.subheading)}
            </motion.p>
          </header>

          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease }}
            className="shrink-0 rounded-lg border p-4 sm:p-5"
            style={{ borderColor: bezel, background: deck }}
            aria-label="Live tuned count"
          >
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: muted }}>
              Tuned in
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums sm:text-4xl" style={{ color: phosphor }}>
              {formatCount(console.liveTuned)}
            </p>
            <WaveformBars color={phosphor} active={!reduceMotion} reduceMotion={reduceMotion} />
            <p className="mt-2 font-mono text-[9px]" style={{ color: muted }}>
              {trim(console.refreshLabel)}
            </p>
          </motion.aside>
        </div>

        {/* ── Persona filter strip ── */}
        {personas.length > 0 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease }}
            className="mb-6 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by persona"
          >
            <motion.button
              type="button"
              onClick={() => handlePersonaFilter(null)}
              className="rounded border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider"
              style={{
                borderColor: personaFilter === null ? phosphor : line,
                background: personaFilter === null ? phosphorSoft : 'transparent',
                color: personaFilter === null ? phosphor : muted,
              }}
              whileHover={reduceMotion ? undefined : { borderColor: phosphor }}
              whileTap={{ scale: 0.97 }}
              aria-pressed={personaFilter === null}
            >
              All signals
            </motion.button>
            {personas.map((persona) => {
              const active = personaFilter === persona
              return (
                <motion.button
                  key={persona}
                  type="button"
                  onClick={() => handlePersonaFilter(active ? null : persona)}
                  className="rounded border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    borderColor: active ? phosphor : line,
                    background: active ? phosphorSoft : 'transparent',
                    color: active ? phosphor : muted,
                  }}
                  whileHover={reduceMotion ? undefined : { borderColor: phosphor }}
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={active}
                >
                  {persona}
                </motion.button>
              )
            })}
          </motion.div>
        )}

        {filteredChannels.length === 0 && (
          <p className="mb-6 font-mono text-sm" style={{ color: muted }}>
            No channels match this persona.{' '}
            <button
              type="button"
              onClick={() => handlePersonaFilter(null)}
              className="underline underline-offset-2"
              style={{ color: phosphor }}
            >
              Reset filter
            </button>
          </p>
        )}

        {/* ── Console deck: EQ channels + monitor ── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-5">
          {/* Frequency EQ strip */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease }}
            className="rounded-xl border p-3 sm:p-4"
            style={{ borderColor: bezel, background: deck }}
            aria-label="Sector frequency channels"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: muted }}>
                Frequency deck
              </p>
              <p className="font-mono text-[9px]" style={{ color: phosphor }}>
                {filteredChannels.length} ch
              </p>
            </div>

            <div className="flex items-end justify-between gap-1 overflow-x-auto pb-1 sm:gap-1.5">
              {filteredChannels.map((channel, i) => {
                const isActive = channel.id === activeId
                const color = safeColor(channel.color, phosphor)
                const signal = safeSignal(channel.signal)
                const label = trim(channel.code) || trim(channel.id).slice(0, 3).toUpperCase()

                return (
                  <motion.button
                    key={channel.id}
                    type="button"
                    onClick={() => handleSelect(channel.id)}
                    className="group relative flex min-w-[2.25rem] flex-1 flex-col items-center gap-1.5 sm:min-w-[2.5rem]"
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.18 + i * 0.025, ease }}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    aria-current={isActive ? 'true' : undefined}
                    aria-label={`${trim(channel.label) || channel.id}, signal ${signal}`}
                  >
                    {/* Signal meter */}
                    <div
                      className="relative flex h-28 w-full items-end justify-center rounded-sm sm:h-36"
                      style={{ background: panel }}
                    >
                      <motion.div
                        className="w-[72%] rounded-t-sm"
                        style={{
                          background: isActive
                            ? `linear-gradient(180deg, ${color}, ${color}88)`
                            : `${color}55`,
                          boxShadow: isActive ? `0 0 14px ${color}66` : undefined,
                        }}
                        initial={reduceMotion ? false : { height: 0 }}
                        animate={{ height: `${signal}%` }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 120, damping: 20 }
                        }
                      />
                      {isActive && !reduceMotion && (
                        <motion.div
                          className="absolute inset-x-0 top-0 h-px"
                          style={{ background: color }}
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          aria-hidden
                        />
                      )}
                    </div>

                    <span
                      className="font-mono text-[8px] font-bold uppercase tracking-wide sm:text-[9px]"
                      style={{ color: isActive ? color : muted }}
                    >
                      {label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.section>

          {/* Monitor panel — product showcase + learning detail */}
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
            className="relative overflow-hidden rounded-xl border"
            style={{ borderColor: bezel, background: panel }}
            aria-label="Active channel monitor"
          >
            {/* Bezel header */}
            <div
              className="flex items-center justify-between border-b px-4 py-2.5 sm:px-5"
              style={{ borderColor: line, background: deck }}
            >
              <div className="flex items-center gap-2">
                <span className="flex gap-1" aria-hidden>
                  <span className="h-2 w-2 rounded-full" style={{ background: '#FF5F57' }} />
                  <span className="h-2 w-2 rounded-full" style={{ background: amber }} />
                  <span className="h-2 w-2 rounded-full" style={{ background: phosphor }} />
                </span>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: muted }}>
                  Monitor · sector relay
                </p>
              </div>
              <p className="font-mono text-[9px] tabular-nums" style={{ color: phosphor }}>
                SIG {activeSignal}%
              </p>
            </div>

            <AnimatePresence mode="wait">
              {activeChannel && filteredChannels.length > 0 ? (
                <motion.div
                  key={activeChannel.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease }}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest"
                          style={{ background: `${activeColor}22`, color: activeColor }}
                        >
                          {trim(activeChannel.code)}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wide" style={{ color: muted }}>
                          {trim(activeChannel.cluster)}
                        </span>
                      </div>

                      <h2 className="mt-2 text-xl font-bold leading-tight sm:text-2xl">
                        {trim(activeChannel.label)}
                      </h2>

                      <p
                        className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-wide"
                        style={{ color: activeColor }}
                      >
                        {trim(activeChannel.headline)}
                      </p>
                    </div>

                    <WaveformBars
                      color={activeColor}
                      active={!reduceMotion}
                      reduceMotion={reduceMotion}
                    />
                  </div>

                  <p className="mt-4 text-sm leading-relaxed" style={{ color: muted }}>
                    {trim(activeChannel.insight)}
                  </p>

                  {paths.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Learning paths">
                      {paths.map((path) => (
                        <motion.li
                          key={path}
                          className="rounded border px-3 py-1.5 font-mono text-[10px] font-medium"
                          style={{
                            borderColor: line,
                            color: ink,
                            background: `${activeColor}0A`,
                          }}
                          whileHover={
                            reduceMotion
                              ? undefined
                              : { borderColor: activeColor, background: `${activeColor}18` }
                          }
                        >
                          {path}
                        </motion.li>
                      ))}
                    </ul>
                  )}

                  {/* Stats row inside monitor */}
                  <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5" style={{ borderColor: line }}>
                    <div>
                      <p className="font-mono text-xl font-bold tabular-nums sm:text-2xl" style={{ color: activeColor }}>
                        {formatCount(activeChannel.learners)}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wide" style={{ color: muted }}>
                        Learners
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-xl font-bold tabular-nums sm:text-2xl">
                        {formatCount(activeChannel.mentors)}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wide" style={{ color: muted }}>
                        Mentors
                      </p>
                    </div>
                    {typeof activeChannel.velocity === 'number' && (
                      <div>
                        <p className="font-mono text-xl font-bold tabular-nums sm:text-2xl" style={{ color: amber }}>
                          +{activeChannel.velocity}%
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wide" style={{ color: muted }}>
                          Velocity
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Signal strength bar */}
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between font-mono text-[9px]" style={{ color: muted }}>
                      <span>Signal strength</span>
                      <span>{activeSignal}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: line }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${activeColor}, ${phosphor})` }}
                        initial={reduceMotion ? false : { width: 0 }}
                        animate={{ width: `${activeSignal}%` }}
                        transition={{ duration: 0.55, ease }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center font-mono text-sm" style={{ color: muted }}>
                  No signal locked.
                </div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        {/* ── Platform totals + CTAs ── */}
        <div className="mt-8 flex flex-col gap-6 lg:mt-10 lg:flex-row lg:items-end lg:justify-between">
          {totals.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28, ease }}
              className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
            >
              {totals.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="rounded-lg border px-3 py-3.5 sm:px-4 sm:py-4"
                  style={{ borderColor: line, background: deck }}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.3 + i * 0.04, ease }}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { borderColor: phosphor, boxShadow: `0 0 20px ${phosphorSoft}` }
                  }
                >
                  <p className="font-mono text-lg font-bold tabular-nums sm:text-xl" style={{ color: phosphor }}>
                    {trim(item.value) || '—'}
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] font-medium uppercase leading-snug tracking-wide sm:text-[9px]" style={{ color: muted }}>
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
              className="flex flex-col gap-2 sm:flex-row"
            >
              {actions.map((action) => {
                const label = trim(action.label) || trim(action.id)
                const primary = action.primary === true
                return (
                  <motion.button
                    key={action.id}
                    type="button"
                    className="rounded-lg px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider sm:text-sm"
                    style={
                      primary
                        ? { background: phosphor, color: voidBg }
                        : { background: 'transparent', color: ink, border: `1px solid ${line}` }
                    }
                    whileHover={reduceMotion ? undefined : { y: -2, boxShadow: primary ? `0 6px 24px ${phosphorSoft}` : undefined }}
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
