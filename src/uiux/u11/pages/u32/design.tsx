import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import raw from './data.json'

type Finish = Record<string, string | undefined>

type Tile = {
  sector?: string
  glyph?: string
  progress?: number
  cohort?: number
  accent?: string
  summary?: string
  skills?: string[]
  step?: string
}

type Pathfinder = {
  brand?: string
  intent?: string
  stats?: { builders?: string; domains?: number; stepsWeek?: string }
  entry?: string
  advance?: number
  cta?: { primary?: string; secondary?: string }
  trail?: string[]
  tiles?: Record<string, Tile>
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const txt = (v: unknown, fb = ''): string => (typeof v === 'string' ? v.trim() : fb) || fb

const num = (v: unknown, fb = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fb

const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : []

function parse(input: unknown): { F: Finish; P: Pathfinder } {
  const root = isObj(input) ? (input as { finish?: Finish; pathfinder?: Pathfinder }) : {}
  const F: Finish = isObj(root.finish) ? root.finish! : {}
  const p = isObj(root.pathfinder) ? root.pathfinder! : {}
  const rawTiles = isObj(p.tiles) ? p.tiles! : {}
  const tiles: Record<string, Tile> = {}

  for (const [id, val] of Object.entries(rawTiles)) {
    if (!isObj(val) || !id.trim()) continue
    tiles[id.trim()] = {
      sector: txt(val.sector),
      glyph: txt(val.glyph),
      progress: num(val.progress),
      cohort: num(val.cohort),
      accent: txt(val.accent),
      summary: txt(val.summary),
      skills: arr(val.skills),
      step: txt(val.step),
    }
  }

  const st = isObj(p.stats) ? p.stats! : {}
  const cta = isObj(p.cta) ? p.cta! : {}

  return {
    F,
    P: {
      brand: txt(p.brand),
      intent: txt(p.intent),
      stats: { builders: txt(st.builders), domains: num(st.domains), stepsWeek: txt(st.stepsWeek) },
      entry: txt(p.entry),
      advance: num(p.advance, 6500),
      cta: { primary: txt(cta.primary), secondary: txt(cta.secondary) },
      trail: arr(p.trail),
      tiles,
    },
  }
}

const { F, P } = parse(raw)

function trailOrder(): string[] {
  const trail = P.trail ?? []
  const keys = Object.keys(P.tiles ?? {})
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of trail) {
    if (keys.includes(id) && !seen.has(id)) { seen.add(id); out.push(id) }
  }
  for (const k of keys) { if (!seen.has(k)) out.push(k) }
  return out
}

function getTile(id: string): Tile | null {
  return P.tiles?.[id] ?? null
}

function ProgressRing({ value, color, size = 40 }: { value: number; color: string; size?: number }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={F.line ?? '#E2E8F0'} strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
    </svg>
  )
}

function HeroTile({ id, data, reduced, cta }: { id: string; data: Tile; reduced: boolean; cta: { primary?: string; secondary?: string } }) {
  const accent = txt(data.accent, F.accent ?? '#4F46E5')
  return (
    <motion.article
      key={id}
      layout
      initial={reduced ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="col-span-1 row-span-2 flex flex-col overflow-hidden rounded-2xl border sm:col-span-2 lg:col-span-2 lg:row-span-2"
      style={{ borderColor: F.line, background: F.card, boxShadow: `0 8px 32px ${F.shadowLg ?? F.shadow}` }}
    >
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">{txt(data.glyph, '◆')}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>Featured path</p>
              <h2 className="text-xl font-bold sm:text-2xl" style={{ color: F.ink }}>{txt(data.sector)}</h2>
            </div>
          </div>
          <div className="relative">
            <ProgressRing value={num(data.progress)} color={accent} size={48} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums" style={{ color: F.ink }}>{num(data.progress)}%</span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: F.subtle }}>{txt(data.summary)}</p>
        <div className="mt-5 rounded-xl p-4" style={{ background: F.canvasAlt ?? '#F1F5F9', borderLeft: `4px solid ${accent}` }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>Today&apos;s step</p>
          <p className="mt-1.5 text-sm font-medium leading-snug sm:text-base" style={{ color: F.ink }}>{txt(data.step)}</p>
          <p className="mt-2 text-xs" style={{ color: F.subtle }}>{num(data.cohort).toLocaleString()} builders on this path</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {arr(data.skills).map((skill, i) => (
            <motion.span key={`${skill}-${i}`} whileHover={reduced ? undefined : { y: -2 }} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: `${accent}14`, color: accent }}>{skill}</motion.span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <motion.button type="button" whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.98 }} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ background: accent }}>{txt(cta.primary, "Start today's step")}</motion.button>
          <motion.button type="button" whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.98 }} className="rounded-xl border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: F.line, color: F.subtle }}>{txt(cta.secondary, 'View cohort')}</motion.button>
        </div>
      </div>
    </motion.article>
  )
}

function CompactTile({ id, data, onSelect, reduced }: { id: string; data: Tile; onSelect: () => void; reduced: boolean }) {
  const accent = txt(data.accent, F.accent ?? '#4F46E5')
  return (
    <motion.button
      type="button"
      layout
      onClick={onSelect}
      whileHover={reduced ? undefined : { y: -4, boxShadow: `0 12px 28px ${F.shadowLg ?? F.shadow}` }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      className="flex flex-col rounded-2xl border p-4 text-left sm:p-5"
      style={{ borderColor: F.line, background: F.card, boxShadow: `0 2px 8px ${F.shadow}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xl">{txt(data.glyph, '◆')}</span>
        <div className="relative">
          <ProgressRing value={num(data.progress)} color={accent} size={36} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums" style={{ color: F.ink }}>{num(data.progress)}</span>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug" style={{ color: F.ink }}>{txt(data.sector)}</p>
      <p className="mt-1 text-[11px]" style={{ color: F.subtle }}>{num(data.cohort).toLocaleString()} builders</p>
    </motion.button>
  )
}

export default function Design() {
  const reduced = useReducedMotion()
  const order = useMemo(() => trailOrder(), [])
  const entry = order.includes(txt(P.entry)) ? txt(P.entry) : order[0] ?? ''
  const [active, setActive] = useState(entry)
  const paused = useRef(false)
  const activeTile = getTile(active)
  const others = order.filter((id) => id !== active)

  const select = useCallback((id: string) => {
    if (!order.includes(id)) return
    paused.current = true
    setActive(id)
    window.setTimeout(() => { paused.current = false }, 10000)
  }, [order])

  useEffect(() => {
    const ms = num(P.advance, 6500)
    if (reduced || order.length < 2 || ms <= 0) return
    const t = window.setInterval(() => {
      if (paused.current) return
      setActive((prev) => { const i = order.indexOf(prev); return order[(i + 1) % order.length] ?? prev })
    }, ms)
    return () => window.clearInterval(t)
  }, [order, reduced])

  return (
    <div className="min-h-screen w-full" style={{ background: F.canvas ?? '#F8FAFC', color: F.ink ?? '#0F172A' }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8">
          <p className="text-sm font-semibold" style={{ color: F.accent ?? '#4F46E5' }}>{txt(P.brand, 'Guild Pathfinder')}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Domain learning paths</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: F.subtle }}>{txt(P.intent)}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {[txt(P.stats?.builders), `${num(P.stats?.domains)} domains`, txt(P.stats?.stepsWeek)].map((chip) => (
              <span key={chip} className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: F.line, background: F.card, color: F.subtle }}>{chip}</span>
            ))}
          </div>
        </header>

        <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(120px,auto)]">
          <AnimatePresence mode="popLayout">
            {activeTile && <HeroTile key={`hero-${active}`} id={active} data={activeTile} reduced={!!reduced} cta={P.cta ?? {}} />}
          </AnimatePresence>
          {others.map((id) => {
            const t = getTile(id)
            if (!t) return null
            return <CompactTile key={id} id={id} data={t} onSelect={() => select(id)} reduced={!!reduced} />
          })}
        </motion.div>

        <nav className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="All domain paths">
          {order.map((id) => {
            const t = getTile(id)
            const on = id === active
            const accent = txt(t?.accent, F.accent ?? '#4F46E5')
            return (
              <motion.button key={id} type="button" onClick={() => select(id)} aria-current={on ? 'true' : undefined} whileTap={reduced ? undefined : { scale: 0.97 }} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: on ? accent : F.card, color: on ? '#FFF' : F.subtle, border: `1px solid ${on ? accent : F.line}` }}>
                {txt(t?.sector).split(' ')[0]}
              </motion.button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
