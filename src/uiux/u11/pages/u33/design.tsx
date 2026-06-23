import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import raw from './data.json'

type Ambient = Record<string, string | undefined>
type Station = {
  name?: string
  code?: string
  mile?: number
  riders?: number
  color?: string
  platform?: string
  highlights?: string[]
  board?: string
}
type Journey = {
  line?: string
  purpose?: string
  ridership?: { travelers?: string; stations?: number; boardsWeek?: string }
  departure?: string
  interval?: number
  buttons?: { board?: string; join?: string }
  sequence?: string[]
  stations?: Record<string, Station>
}

const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const txt = (v: unknown, fb = '') => (typeof v === 'string' ? v.trim() : fb) || fb
const num = (v: unknown, fb = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fb)
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [])

function load(input: unknown): { A: Ambient; J: Journey } {
  const root = obj(input) ? (input as { ambient?: Ambient; journey?: Journey }) : {}
  const A: Ambient = obj(root.ambient) ? root.ambient! : {}
  const j = obj(root.journey) ? root.journey! : {}
  const stations: Record<string, Station> = {}
  const rawSt = obj(j.stations) ? j.stations! : {}
  for (const [id, val] of Object.entries(rawSt)) {
    if (!obj(val) || !id.trim()) continue
    stations[id.trim()] = {
      name: txt(val.name), code: txt(val.code), mile: num(val.mile), riders: num(val.riders),
      color: txt(val.color), platform: txt(val.platform), highlights: list(val.highlights), board: txt(val.board),
    }
  }
  const rid = obj(j.ridership) ? j.ridership! : {}
  const btn = obj(j.buttons) ? j.buttons! : {}
  return {
    A,
    J: {
      line: txt(j.line), purpose: txt(j.purpose),
      ridership: { travelers: txt(rid.travelers), stations: num(rid.stations), boardsWeek: txt(rid.boardsWeek) },
      departure: txt(j.departure), interval: num(j.interval, 6200),
      buttons: { board: txt(btn.board), join: txt(btn.join) },
      sequence: list(j.sequence), stations,
    },
  }
}

const { A, J } = load(raw)

function sequence(): string[] {
  const seq = J.sequence ?? []
  const keys = Object.keys(J.stations ?? {})
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of seq) { if (keys.includes(id) && !seen.has(id)) { seen.add(id); out.push(id) } }
  for (const k of keys) { if (!seen.has(k)) out.push(k) }
  return out
}

function getStation(id: string) { return J.stations?.[id] ?? null }

function MileTrack({ mile, color }: { mile: number; color: string }) {
  const pct = Math.min(100, Math.max(0, mile))
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-wider" style={{ color: A.muted }}>
        <span>Mile marker</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: A.rail }}>
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
      </div>
    </div>
  )
}

function StationCard({ id, data, active, onSelect, reduced }: { id: string; data: Station; active: boolean; onSelect: () => void; reduced: boolean }) {
  const color = txt(data.color, '#4F46E5')
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      animate={{ scale: active ? 1 : 0.88, opacity: active ? 1 : 0.55, y: active ? 0 : 12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      whileHover={reduced ? undefined : { y: active ? -4 : 0 }}
      className="relative flex w-[min(88vw,320px)] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border text-left sm:w-[300px]"
      style={{ borderColor: active ? color : A.rail, background: A.card, boxShadow: active ? `0 20px 48px ${A.glow}` : '0 4px 16px rgba(20,24,36,0.06)' }}
    >
      <div className="h-1.5 w-full" style={{ background: color }} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-3xl font-black" style={{ color }}>{txt(data.code)}</span>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase" style={{ background: `${color}18`, color }}>Mile {num(data.mile)}</span>
        </div>
        <h3 className="mt-2 text-lg font-bold sm:text-xl" style={{ color: A.ink }}>{txt(data.name)}</h3>
        {active ? (
          <motion.div initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <MileTrack mile={num(data.mile)} color={color} />
            <p className="mt-4 text-sm" style={{ color: A.muted }}>
              Platform: <span className="font-medium" style={{ color: A.ink }}>{txt(data.platform)}</span> · {num(data.riders).toLocaleString()} riders
            </p>
            <div className="mt-4 rounded-xl p-4" style={{ background: A.bgAlt, borderLeft: `4px solid ${color}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>Board action</p>
              <p className="mt-1.5 text-sm font-medium" style={{ color: A.ink }}>{txt(data.board)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {list(data.highlights).map((h, i) => (
                <span key={`${h}-${i}`} className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${color}12`, color }}>{h}</span>
              ))}
            </div>
          </motion.div>
        ) : (
          <p className="mt-2 text-xs" style={{ color: A.muted }}>{num(data.riders).toLocaleString()} riders · tap to board</p>
        )}
      </div>
    </motion.button>
  )
}

export default function Design() {
  const reduced = useReducedMotion()
  const stops = useMemo(() => sequence(), [])
  const start = stops.includes(txt(J.departure)) ? txt(J.departure) : stops[0] ?? ''
  const [active, setActive] = useState(start)
  const scrollRef = useRef<HTMLDivElement>(null)
  const paused = useRef(false)

  const scrollToStop = useCallback((id: string) => {
    const el = scrollRef.current
    if (!el) return
    const idx = stops.indexOf(id)
    const child = el.children[idx] as HTMLElement | undefined
    if (!child) return
    el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: reduced ? 'auto' : 'smooth' })
  }, [stops, reduced])

  const select = useCallback((id: string) => {
    if (!stops.includes(id)) return
    paused.current = true
    setActive(id)
    scrollToStop(id)
    window.setTimeout(() => { paused.current = false }, 10000)
  }, [stops, scrollToStop])

  useEffect(() => { scrollToStop(active) }, [active, scrollToStop])

  useEffect(() => {
    const ms = num(J.interval, 6200)
    if (reduced || stops.length < 2 || ms <= 0) return
    const t = window.setInterval(() => {
      if (paused.current) return
      setActive((prev) => {
        const i = stops.indexOf(prev)
        return stops[(i + 1) % stops.length] ?? prev
      })
    }, ms)
    return () => window.clearInterval(t)
  }, [stops, reduced])

  const activeData = getStation(active)

  return (
    <div className="min-h-screen w-full overflow-hidden" style={{ background: A.bg, color: A.ink }}>
      <header className="border-b px-4 py-6 sm:px-8" style={{ borderColor: A.rail, background: A.card }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: A.muted }}>Route navigator</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{txt(J.line, 'Guild Line')}</h1>
            <p className="mt-2 max-w-xl text-sm" style={{ color: A.muted }}>{txt(J.purpose)}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs" style={{ color: A.muted }}>
            <span className="rounded-full px-3 py-1.5" style={{ background: A.bgAlt }}>{txt(J.ridership?.travelers)}</span>
            <span className="rounded-full px-3 py-1.5" style={{ background: A.bgAlt }}>{num(J.ridership?.stations)} stations</span>
            <span className="rounded-full px-3 py-1.5" style={{ background: A.bgAlt }}>{txt(J.ridership?.boardsWeek)}</span>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="pointer-events-none absolute left-4 right-4 top-1/2 hidden h-0.5 -translate-y-1/2 sm:block" style={{ background: A.rail }} />
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden">
          {stops.map((id) => {
            const st = getStation(id)
            if (!st) return null
            return <StationCard key={id} id={id} data={st} active={id === active} onSelect={() => select(id)} reduced={!!reduced} />
          })}
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {stops.map((id) => {
            const on = id === active
            const col = txt(getStation(id)?.color, '#4F46E5')
            return (
              <motion.button key={id} type="button" onClick={() => select(id)} aria-current={on ? 'true' : undefined}
                animate={{ width: on ? 24 : 8, backgroundColor: on ? col : A.rail }} className="h-2 rounded-full" whileHover={reduced ? undefined : { scale: 1.2 }} />
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeData && (
            <motion.div key={active} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0 }}
              className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-3">
              <motion.button type="button" whileHover={reduced ? undefined : { y: -2 }} className="rounded-xl px-6 py-3 text-sm font-semibold text-white" style={{ background: txt(activeData.color) }}>
                {txt(J.buttons?.board, 'Complete board action')}
              </motion.button>
              <motion.button type="button" whileHover={reduced ? undefined : { y: -2 }} className="rounded-xl border px-6 py-3 text-sm font-semibold" style={{ borderColor: A.rail, color: A.muted }}>
                {txt(J.buttons?.join, 'Join platform crew')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
