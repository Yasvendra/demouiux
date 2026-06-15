import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'

import rawData from './data.json'

/* ─── Schema: object-map channels (not array-of-items) ─── */

type Palette = Record<string, string | undefined>

type Channel = {
  label?: string
  callsign?: string
  band?: number
  gain?: number
  crew?: number
  vertical?: string
  segments?: string[]
  transmission?: string
  relay?: string
}

type SignalBlock = {
  reach?: string
  bandsLive?: number
  sessionsNow?: string
}

type Tuning = {
  startOn?: string
  cycleMs?: number
}

type CtaPair = {
  transmit?: string
  crew?: string
}

type Broadcast = {
  stationId?: string
  motto?: string
  manifesto?: string
  signal?: SignalBlock
  tuning?: Tuning
  bandOrder?: string[]
  cta?: CtaPair
  channels?: Record<string, Channel>
}

type PagePayload = {
  palette?: Palette
  broadcast?: Broadcast
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown, fb = ''): string => (typeof v === 'string' ? v.trim() : fb) || fb

const num = (v: unknown, fb = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fb

const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : []

const slugList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : []

const parseChannel = (v: unknown): Channel | null => {
  if (!isRecord(v)) return null
  return {
    label: str(v.label),
    callsign: str(v.callsign),
    band: num(v.band),
    gain: num(v.gain),
    crew: num(v.crew),
    vertical: str(v.vertical),
    segments: strList(v.segments),
    transmission: str(v.transmission),
    relay: str(v.relay),
  }
}

const parsePayload = (input: unknown): { palette: Palette; broadcast: Broadcast } => {
  const root = isRecord(input) ? (input as PagePayload) : {}
  const palette = isRecord(root.palette) ? root.palette : {}
  const b = isRecord(root.broadcast) ? root.broadcast : {}
  const channelsRaw = isRecord(b.channels) ? b.channels : {}
  const channels: Record<string, Channel> = {}

  for (const [key, val] of Object.entries(channelsRaw)) {
    const ch = parseChannel(val)
    if (ch && key.trim()) channels[key.trim()] = ch
  }

  const signal = isRecord(b.signal) ? b.signal : {}
  const tuning = isRecord(b.tuning) ? b.tuning : {}
  const cta = isRecord(b.cta) ? b.cta : {}

  return {
    palette,
    broadcast: {
      stationId: str(b.stationId),
      motto: str(b.motto),
      manifesto: str(b.manifesto),
      signal: {
        reach: str(signal.reach),
        bandsLive: num(signal.bandsLive),
        sessionsNow: str(signal.sessionsNow),
      },
      tuning: {
        startOn: str(tuning.startOn),
        cycleMs: num(tuning.cycleMs, 6600),
      },
      bandOrder: slugList(b.bandOrder),
      cta: {
        transmit: str(cta.transmit),
        crew: str(cta.crew),
      },
      channels,
    },
  }
}

const { palette: P, broadcast: B } = parsePayload(rawData)

function orderedSlugs(): string[] {
  const order = B.bandOrder ?? []
  const keys = Object.keys(B.channels ?? {})
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of order) {
    if (keys.includes(s) && !seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  for (const k of keys) {
    if (!seen.has(k)) out.push(k)
  }
  return out
}

function pickChannel(slug: string): Channel | null {
  return B.channels?.[slug] ?? null
}

function resolveSlug(preferred: string, slugs: string[]): string {
  const p = str(preferred)
  if (p && slugs.includes(p)) return p
  return slugs[0] ?? ''
}

function VuColumn({ gain, reduced }: { gain: number; reduced: boolean }) {
  const bars = 12
  const lit = Math.round((Math.min(100, Math.max(0, gain)) / 100) * bars)

  return (
    <div
      className="flex h-full min-h-[200px] flex-col justify-end gap-1 px-2 py-4 sm:min-h-[320px] sm:gap-1.5 sm:px-3"
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => {
        const idx = bars - 1 - i
        const on = idx < lit
        const hot = idx >= bars - 3
        return (
          <motion.div
            key={i}
            className="w-2 rounded-sm sm:w-2.5"
            style={{
              height: `${8 + i * 3}%`,
              background: on ? (hot ? P.tube ?? '#FF6B35' : P.phosphor ?? '#FFAA33') : P.glass ?? '#2A2520',
              boxShadow: on && hot ? `0 0 8px ${P.tubeGlow ?? '#FF6B3540'}` : undefined,
            }}
            animate={
              reduced || !on
                ? undefined
                : { opacity: [0.75, 1, 0.75], scaleX: [1, 1.08, 1] }
            }
            transition={{ duration: 0.35 + i * 0.04, repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      })}
    </div>
  )
}

function FlapRow({ label, value, reduced }: { label: string; value: string; reduced: boolean }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <span
        className="shrink-0 font-mono text-[9px] uppercase tracking-[0.28em] sm:w-28 sm:text-[10px]"
        style={{ color: P.textDim }}
      >
        {label}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={reduced ? false : { rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={reduced ? undefined : { rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="block origin-center font-mono text-sm font-bold leading-snug sm:text-base"
          style={{ color: P.phosphorBright ?? P.phosphor, perspective: 400 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function FlapDeck({
  slug,
  channel,
  reduced,
  cta,
}: {
  slug: string
  channel: Channel
  reduced: boolean
  cta: CtaPair
}) {
  const band = num(channel.band)
  const bandStr = band > 0 ? `${band.toFixed(1)} MHz` : '—'

  return (
    <motion.div
      key={slug}
      initial={reduced ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.99 }}
      className="relative flex flex-1 flex-col overflow-hidden rounded-lg border-2 p-4 sm:p-6"
      style={{
        borderColor: P.bezel ?? '#3D3835',
        background: P.face ?? '#1C1917',
        boxShadow: `inset 0 2px 0 ${P.phosphorDim ?? '#FFAA3344'}, inset 0 -4px 12px rgba(0,0,0,0.4)`,
      }}
    >
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)',
          }}
          animate={{ opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 0.12, repeat: Infinity }}
        />
      )}

      <div className="relative space-y-3 sm:space-y-4">
        <FlapRow label="Band" value={bandStr} reduced={reduced} />
        <FlapRow label="Callsign" value={str(channel.callsign, slug.toUpperCase())} reduced={reduced} />
        <FlapRow label="Vertical" value={str(channel.label)} reduced={reduced} />
        <FlapRow label="Focus" value={str(channel.vertical, '—')} reduced={reduced} />
        <FlapRow label="Gain" value={`${num(channel.gain)} dB`} reduced={reduced} />
        <FlapRow label="Crew" value={num(channel.crew).toLocaleString()} reduced={reduced} />
      </div>

      <div
        className="relative mt-5 rounded border-l-4 p-4 sm:mt-6"
        style={{ borderColor: P.tube ?? '#FF6B35', background: P.glass ?? '#2A2520' }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: P.tube }}>
          On-air script
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={str(channel.transmission)}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            className="mt-2 text-sm leading-relaxed sm:text-base"
            style={{ color: P.text }}
          >
            {str(channel.transmission, 'Stand by for transmission.')}
          </motion.p>
        </AnimatePresence>
        <p className="mt-3 font-mono text-xs" style={{ color: P.textDim }}>
          Relay:{' '}
          <span style={{ color: P.phosphor }}>{str(channel.relay, 'Guild desk')}</span>
        </p>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {strList(channel.segments).map((seg, i) => (
          <motion.span
            key={`${seg}-${i}`}
            whileHover={reduced ? undefined : { scale: 1.05, backgroundColor: P.phosphorDim }}
            className="rounded border px-2.5 py-1 font-mono text-[10px] sm:text-xs"
            style={{ borderColor: P.bezel, color: P.dialMark }}
          >
            {seg}
          </motion.span>
        ))}
      </div>

      <div className="relative mt-5 flex flex-wrap gap-3">
        <motion.button
          type="button"
          whileHover={reduced ? undefined : { scale: 1.03, boxShadow: `0 0 20px ${P.tubeGlow}` }}
          whileTap={reduced ? undefined : { scale: 0.97 }}
          className="rounded px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider sm:text-sm"
          style={{ background: P.phosphor, color: P.cabinet }}
        >
          {str(cta.transmit, 'Transmit')}
        </motion.button>
        <motion.button
          type="button"
          whileHover={reduced ? undefined : { scale: 1.03 }}
          whileTap={reduced ? undefined : { scale: 0.97 }}
          className="rounded border px-5 py-2.5 font-mono text-xs uppercase tracking-wider sm:text-sm"
          style={{ borderColor: P.bezel, color: P.textDim }}
        >
          {str(cta.crew, 'Relay')}
        </motion.button>
      </div>
    </motion.div>
  )
}

function TunerArc({
  slugs,
  active,
  onPick,
  reduced,
}: {
  slugs: string[]
  active: string
  onPick: (slug: string) => void
  reduced: boolean
}) {
  return (
    <div className="relative mt-6 w-full overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max justify-center gap-1 px-2 sm:gap-1.5">
        {slugs.map((slug) => {
          const ch = pickChannel(slug)
          const on = slug === active
          const band = num(ch?.band)
          return (
            <motion.button
              key={slug}
              type="button"
              onClick={() => onPick(slug)}
              aria-current={on ? 'true' : undefined}
              whileHover={reduced ? undefined : { y: -3 }}
              className="flex flex-col items-center rounded-t-lg border-b-0 px-2 py-2 sm:px-3"
              style={{
                border: `2px solid ${on ? P.phosphor ?? '#FFAA33' : P.bezel ?? '#3D3835'}`,
                background: on ? P.glass ?? '#2A2520' : P.face ?? '#1C1917',
                minWidth: '52px',
              }}
            >
              <span
                className="font-mono text-[8px] tabular-nums sm:text-[9px]"
                style={{ color: on ? P.phosphor : P.textDim }}
              >
                {band > 0 ? band.toFixed(0) : '—'}
              </span>
              <span
                className="mt-0.5 max-w-[48px] truncate font-mono text-[7px] uppercase sm:max-w-[56px] sm:text-[8px]"
                style={{ color: on ? P.phosphorBright : P.dialMark }}
              >
                {str(ch?.callsign, slug).slice(0, 6)}
              </span>
              {on && (
                <motion.div
                  layoutId="tuner-needle"
                  className="mt-1 h-1 w-1 rounded-full"
                  style={{ background: P.needle ?? '#E63946', boxShadow: `0 0 6px ${P.needle}` }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
      <div
        className="mx-auto mt-0 h-2 max-w-4xl rounded-b-full border-2 border-t-0"
        style={{ borderColor: P.bezel, background: `linear-gradient(180deg, ${P.face}, ${P.cabinet})` }}
      />
    </div>
  )
}

export default function Design() {
  const reduced = useReducedMotion()
  const slugs = useMemo(() => orderedSlugs(), [])
  const startSlug = resolveSlug(B.tuning?.startOn ?? '', slugs)

  const [active, setActive] = useState(startSlug)
  const paused = useRef(false)

  const channel = pickChannel(active)
  const gain = num(channel?.gain)

  const tune = useCallback(
    (slug: string) => {
      if (!slugs.includes(slug)) return
      paused.current = true
      setActive(slug)
      window.setTimeout(() => {
        paused.current = false
      }, 10000)
    },
    [slugs],
  )

  useEffect(() => {
    const ms = num(B.tuning?.cycleMs, 6600)
    if (reduced || slugs.length < 2 || ms <= 0) return
    const id = window.setInterval(() => {
      if (paused.current) return
      setActive((prev) => {
        const i = slugs.indexOf(prev)
        return slugs[(i + 1) % slugs.length] ?? prev
      })
    }, ms)
    return () => window.clearInterval(id)
  }, [slugs, reduced])

  return (
    <div
      className="flex min-h-screen w-full flex-col break-words [overflow-wrap:anywhere]"
      style={{ background: P.cabinet ?? '#12100E', color: P.text ?? '#F5E6D3' }}
    >
      <header className="border-b px-4 py-6 text-center sm:py-8" style={{ borderColor: P.bezel }}>
        <motion.p
          className="font-mono text-4xl font-black tracking-[0.2em] sm:text-5xl"
          style={{ color: P.phosphor, textShadow: `0 0 24px ${P.phosphorDim}` }}
          animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {str(B.stationId, 'GLD-FM')}
        </motion.p>
        <p className="mx-auto mt-2 max-w-lg text-sm sm:text-base" style={{ color: P.textDim }}>
          {str(B.motto)}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 font-mono text-[10px] uppercase tracking-widest sm:text-xs">
          <span style={{ color: P.phosphor }}>{str(B.signal?.reach, '—')}</span>
          <span style={{ color: P.textDim }}>|</span>
          <span style={{ color: P.dialMark }}>{num(B.signal?.bandsLive)} bands</span>
          <span style={{ color: P.textDim }}>|</span>
          <span style={{ color: P.dialMark }}>{str(B.signal?.sessionsNow, '—')}</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-6 sm:px-6 sm:py-8">
        <p className="mb-4 text-center text-xs leading-relaxed sm:text-sm" style={{ color: P.textDim }}>
          {str(B.manifesto)}
        </p>

        <div
          className="flex min-h-[360px] overflow-hidden rounded-xl border-4 sm:min-h-[420px]"
          style={{
            borderColor: P.bezel,
            background: P.cabinet,
            boxShadow: 'inset 0 8px 24px rgba(0,0,0,0.5), 0 4px 0 #0a0908',
          }}
        >
          <div className="border-r" style={{ borderColor: P.bezel, background: P.face }}>
            <VuColumn gain={gain} reduced={!!reduced} />
          </div>

          <div className="flex flex-1 flex-col p-3 sm:p-4">
            <AnimatePresence mode="wait">
              {channel ? (
                <FlapDeck
                  key={active}
                  slug={active}
                  channel={channel}
                  reduced={!!reduced}
                  cta={B.cta ?? {}}
                />
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-1 items-center justify-center text-sm"
                  style={{ color: P.textDim }}
                >
                  No signal on this band. Adjust tuner below.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div
            className="hidden w-16 flex-col items-center justify-center border-l sm:flex"
            style={{ borderColor: P.bezel, background: P.face }}
            aria-hidden
          >
            <motion.div
              animate={reduced ? undefined : { rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="relative h-12 w-12 rounded-full border-2"
              style={{ borderColor: P.dialMark }}
            >
              <div
                className="absolute left-1/2 top-1 h-5 w-0.5 -translate-x-1/2"
                style={{ background: P.needle }}
              />
            </motion.div>
            <p className="mt-2 font-mono text-[8px]" style={{ color: P.textDim }}>
              FM
            </p>
          </div>
        </div>

        <TunerArc slugs={slugs} active={active} onPick={tune} reduced={!!reduced} />
      </main>
    </div>
  )
}
