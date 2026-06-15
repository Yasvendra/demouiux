import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import raw from './data.json'

type Theme = Record<string, string | undefined>

type Message = {
  id?: string
  role?: string
  author?: string
  text?: string
  time?: string
  state?: string
  citations?: number
}

type Kpi = { label?: string; value?: string; delta?: string; trend?: string }

type BarPoint = { label?: string; value?: number }
type FlowData = { label?: string; steps?: string[]; active?: number }
type Charts = {
  sparkline?: number[]
  sparklineLabel?: string
  bars?: BarPoint[]
  barsLabel?: string
  flow?: FlowData
}

type Thread = {
  title?: string
  code?: string
  group?: string
  status?: string
  confidence?: number
  hue?: string
  icon?: string
  unread?: number
  participants?: number
  lastActivity?: string
  context?: string
  suggestedAction?: string
  tags?: string[]
  kpis?: Kpi[]
  messages?: Message[]
  charts?: Charts
}

type PortfolioGroup = { name?: string; share?: number; hue?: string }
type ActivityDay = { day?: string; resolved?: number; opened?: number }
type LatencyBand = { label?: string; pct?: number; hue?: string }
type ChatStateSlice = { state?: string; pct?: number }

type Portfolio = {
  title?: string
  subtitle?: string
  healthScore?: number
  groups?: PortfolioGroup[]
  activityWeek?: ActivityDay[]
  latencyBands?: LatencyBand[]
  chatStates?: ChatStateSlice[]
}

type Workspace = {
  brand?: string
  edition?: string
  org?: string
  summary?: string
  status?: string
  metrics?: Record<string, string | number | undefined>
  cta?: { primary?: string; secondary?: string }
}

type Somm = {
  theme?: Theme
  workspace?: Workspace
  portfolio?: Portfolio
  activeThread?: string
  rotation?: number
  sequence?: string[]
  threads?: Record<string, Thread>
}

const obj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const txt = (v: unknown, fb = '') => (typeof v === 'string' ? v.trim() : fb) || fb
const num = (v: unknown, fb = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fb)
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [])

function parseNums(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
}

function parseBars(v: unknown): BarPoint[] {
  if (!Array.isArray(v)) return []
  return v.filter(obj).map((b) => ({ label: txt(b.label), value: num(b.value) }))
}

function parseMessages(v: unknown): Message[] {
  if (!Array.isArray(v)) return []
  return v.filter(obj).map((m) => ({
    id: txt(m.id),
    role: txt(m.role),
    author: txt(m.author),
    text: txt(m.text),
    time: txt(m.time),
    state: txt(m.state),
    citations: typeof m.citations === 'number' ? m.citations : undefined,
  }))
}

function parseKpis(v: unknown): Kpi[] {
  if (!Array.isArray(v)) return []
  return v.filter(obj).map((k) => ({
    label: txt(k.label),
    value: txt(k.value),
    delta: txt(k.delta),
    trend: txt(k.trend),
  }))
}

function parseCharts(v: unknown): Charts | undefined {
  if (!obj(v)) return undefined
  const flow = obj(v.flow) ? v.flow : null
  return {
    sparkline: parseNums(v.sparkline),
    sparklineLabel: txt(v.sparklineLabel),
    bars: parseBars(v.bars),
    barsLabel: txt(v.barsLabel),
    flow: flow
      ? { label: txt(flow.label), steps: arr(flow.steps), active: num(flow.active) }
      : undefined,
  }
}

function parsePortfolio(v: unknown): Portfolio {
  if (!obj(v)) return {}
  return {
    title: txt(v.title, 'Vertical Portfolio'),
    subtitle: txt(v.subtitle),
    healthScore: num(v.healthScore, 85),
    groups: Array.isArray(v.groups)
      ? v.groups.filter(obj).map((g) => ({ name: txt(g.name), share: num(g.share), hue: txt(g.hue) }))
      : [],
    activityWeek: Array.isArray(v.activityWeek)
      ? v.activityWeek.filter(obj).map((d) => ({
          day: txt(d.day),
          resolved: num(d.resolved),
          opened: num(d.opened),
        }))
      : [],
    latencyBands: Array.isArray(v.latencyBands)
      ? v.latencyBands.filter(obj).map((b) => ({
          label: txt(b.label),
          pct: num(b.pct),
          hue: txt(b.hue),
        }))
      : [],
    chatStates: Array.isArray(v.chatStates)
      ? v.chatStates.filter(obj).map((c) => ({ state: txt(c.state), pct: num(c.pct) }))
      : [],
  }
}

function load(input: unknown) {
  const root = obj(input) ? (input as { somm?: Somm }) : {}
  const s = obj(root.somm) ? root.somm! : {}
  const T: Theme = obj(s.theme) ? s.theme! : {}
  const w = obj(s.workspace) ? s.workspace! : {}
  const cta = obj(w.cta) ? w.cta! : {}
  const metrics = obj(w.metrics) ? w.metrics! : {}
  const P = parsePortfolio(s.portfolio)

  const threads: Record<string, Thread> = {}
  const rawThreads = obj(s.threads) ? s.threads! : {}
  for (const [id, val] of Object.entries(rawThreads)) {
    if (!obj(val) || !id.trim()) continue
    threads[id.trim()] = {
      title: txt(val.title),
      code: txt(val.code),
      group: txt(val.group),
      status: txt(val.status, 'idle'),
      confidence: num(val.confidence),
      hue: txt(val.hue),
      icon: txt(val.icon),
      unread: num(val.unread),
      participants: num(val.participants),
      lastActivity: txt(val.lastActivity),
      context: txt(val.context),
      suggestedAction: txt(val.suggestedAction),
      tags: arr(val.tags),
      kpis: parseKpis(val.kpis),
      messages: parseMessages(val.messages),
      charts: parseCharts(val.charts),
    }
  }

  const keys = Object.keys(threads)
  const seen = new Set<string>()
  const seq: string[] = []
  for (const id of arr(s.sequence)) {
    if (keys.includes(id) && !seen.has(id)) {
      seen.add(id)
      seq.push(id)
    }
  }
  for (const k of keys) {
    if (!seen.has(k)) seq.push(k)
  }

  const active = txt(s.activeThread)
  const start = seq.includes(active) ? active : seq[0] ?? ''

  return {
    T,
    P,
    W: {
      brand: txt(w.brand, 'Somm'),
      edition: txt(w.edition),
      org: txt(w.org),
      summary: txt(w.summary),
      status: txt(w.status),
      metrics,
      cta: { primary: txt(cta.primary), secondary: txt(cta.secondary) },
    },
    seq,
    threads,
    active: start,
    rotation: num(s.rotation, 9000),
  }
}

const { T, P, W, seq, threads, active: defaultActive, rotation } = load(raw)

function thread(id: string) {
  return threads[id] ?? null
}

const STATE_HUES = ['#8B5CF6', '#3B82F6', '#F59E0B', '#8B95A8']

function defaultCharts(t: Thread): Charts {
  const c = num(t.confidence, 75)
  const status = txt(t.status, 'idle')
  const activeStep = status === 'resolved' ? 5 : status === 'escalated' ? 4 : status === 'active' ? 3 : 1
  const spark = Array.from({ length: 7 }, (_, i) => Math.min(100, Math.max(20, c - 8 + i * 2 + (i % 2))))
  return {
    sparkline: spark,
    sparklineLabel: 'Confidence trend · 7d',
    bars: (t.kpis ?? []).slice(0, 4).map((k) => ({
      label: txt(k.label).slice(0, 8),
      value: parseInt(txt(k.value).replace(/[^\d]/g, ''), 10) || c,
    })),
    barsLabel: 'Signal mix',
    flow: {
      label: 'Thread lifecycle',
      steps: ['Open', 'Analyze', 'Act', 'Review', 'Close'],
      active: activeStep,
    },
  }
}

function threadCharts(t: Thread | null): Charts {
  if (!t) return defaultCharts({ confidence: 75 })
  const c = t.charts
  if (c?.sparkline?.length && c?.bars?.length && c?.flow?.steps?.length) return c
  const d = defaultCharts(t)
  return {
    sparkline: c?.sparkline?.length ? c.sparkline : d.sparkline,
    sparklineLabel: txt(c?.sparklineLabel, d.sparklineLabel),
    bars: c?.bars?.length ? c.bars : d.bars,
    barsLabel: txt(c?.barsLabel, d.barsLabel),
    flow: c?.flow?.steps?.length ? c.flow : d.flow,
  }
}

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: T.success ?? '#22C55E' },
  idle: { label: 'Idle', color: T.muted ?? '#8B95A8' },
  escalated: { label: 'Escalated', color: T.danger ?? '#EF4444' },
  resolved: { label: 'Resolved', color: T.accent ?? '#3B82F6' },
}

function ChartCard({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ borderColor: T.borderSubtle, background: T.elevated }}
    >
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>{title}</p>
      {children}
    </div>
  )
}

function DonutChart({ slices, size = 120 }: { slices: { label: string; value: number; hue: string }[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1
  const r = size / 2 - 8
  const cx = size / 2
  const cy = size / 2
  let angle = -90

  const arcs = slices.map((sl) => {
    const sweep = (sl.value / total) * 360
    const start = angle
    angle += sweep
    const rad = (deg: number) => (deg * Math.PI) / 180
    const x1 = cx + r * Math.cos(rad(start))
    const y1 = cy + r * Math.sin(rad(start))
    const x2 = cx + r * Math.cos(rad(start + sweep))
    const y2 = cy + r * Math.sin(rad(start + sweep))
    const large = sweep > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    return { ...sl, d }
  })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a) => (
          <path key={a.label} d={a.d} fill={a.hue} opacity={0.9} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill={T.elevated} />
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {slices.map((sl) => (
          <div key={sl.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 truncate" style={{ color: T.muted }}>
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: sl.hue }} />
              {sl.label}
            </span>
            <span className="font-semibold tabular-nums" style={{ color: T.ink }}>{sl.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivityChart({ data, reduced }: { data: ActivityDay[]; reduced: boolean }) {
  const w = 280
  const h = 100
  const pad = { t: 8, r: 8, b: 24, l: 8 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const max = Math.max(...data.flatMap((d) => [num(d.resolved), num(d.opened)]), 1)

  const line = (key: 'resolved' | 'opened', color: string) => {
    const pts = data.map((d, i) => {
      const x = pad.l + (i / Math.max(data.length - 1, 1)) * innerW
      const y = pad.t + innerH - (num(d[key]) / max) * innerH
      return `${x},${y}`
    })
    const area = `${pad.l},${pad.t + innerH} ${pts.join(' ')} ${pad.l + innerW},${pad.t + innerH}`
    return { pts: pts.join(' '), area, color }
  }

  const resolved = line('resolved', T.success ?? '#22C55E')
  const opened = line('opened', T.accent ?? '#3B82F6')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad.l}
          y1={pad.t + innerH * (1 - f)}
          x2={w - pad.r}
          y2={pad.t + innerH * (1 - f)}
          stroke={T.borderSubtle}
          strokeWidth="0.5"
        />
      ))}
      <motion.polygon
        fill={resolved.color}
        fillOpacity={0.12}
        points={resolved.area}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      <motion.polyline
        fill="none"
        stroke={resolved.color}
        strokeWidth="2"
        strokeLinecap="round"
        points={resolved.pts}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
      />
      <motion.polyline
        fill="none"
        stroke={opened.color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"
        points={opened.pts}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.15 }}
      />
      {data.map((d, i) => (
        <text
          key={txt(d.day, String(i))}
          x={pad.l + (i / Math.max(data.length - 1, 1)) * innerW}
          y={h - 4}
          textAnchor="middle"
          fontSize="8"
          fill={T.muted}
        >
          {txt(d.day)}
        </text>
      ))}
      <text x={pad.l + 4} y={pad.t + 10} fontSize="8" fill={resolved.color}>Resolved</text>
      <text x={pad.l + 52} y={pad.t + 10} fontSize="8" fill={opened.color}>Opened</text>
    </svg>
  )
}

function StackedBar({ bands }: { bands: LatencyBand[] }) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        {bands.map((b) => (
          <motion.div
            key={txt(b.label)}
            className="h-full"
            style={{ background: txt(b.hue, T.accent), width: `${num(b.pct)}%` }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {bands.map((b) => (
          <span key={txt(b.label)} className="text-xs" style={{ color: T.muted }}>
            <span className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: txt(b.hue) }} />
            {txt(b.label)} · {num(b.pct)}%
          </span>
        ))}
      </div>
    </div>
  )
}

function HealthRing({ score, reduced }: { score: number; reduced: boolean }) {
  const r = 36
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score)) / 100
  return (
    <div className="flex items-center gap-4">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke={T.borderSubtle} strokeWidth="6" />
        <motion.circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={T.success}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          transform="rotate(-90 44 44)"
          initial={reduced ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 0.8 }}
        />
        <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="bold" fill={T.ink}>{score}</text>
      </svg>
      <div>
        <p className="text-sm font-semibold" style={{ color: T.ink }}>Portfolio health</p>
        <p className="text-xs" style={{ color: T.muted }}>Weighted across 32 verticals</p>
      </div>
    </div>
  )
}

function Sparkline({ values, hue, reduced }: { values: number[]; hue: string; reduced: boolean }) {
  const w = 200
  const h = 48
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w
      const y = h - 4 - ((v - min) / range) * (h - 8)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hue} stopOpacity="0.35" />
          <stop offset="100%" stopColor={hue} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        fill="none"
        stroke={hue}
        strokeWidth="2"
        strokeLinecap="round"
        points={pts}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
      />
      <polygon fill="url(#sparkFill)" points={`0,${h} ${pts} ${w},${h}`} opacity={0.6} />
    </svg>
  )
}

function VerticalBars({ bars, hue, reduced }: { bars: BarPoint[]; hue: string; reduced: boolean }) {
  const max = Math.max(...bars.map((b) => num(b.value)), 1)
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 80 }}>
      {bars.map((b, i) => {
        const pct = (num(b.value) / max) * 100
        return (
          <div key={`${txt(b.label)}-${i}`} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              className="w-full max-w-8 rounded-t"
              style={{ background: hue }}
              initial={reduced ? false : { height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            />
            <span className="text-center text-[9px] leading-tight" style={{ color: T.muted }}>{txt(b.label)}</span>
          </div>
        )
      })}
    </div>
  )
}

function FlowDiagram({ flow, hue, status, reduced }: { flow: FlowData; hue: string; status: string; reduced: boolean }) {
  const steps = flow.steps ?? []
  const active = num(flow.active, status === 'resolved' ? steps.length : 2)
  const n = steps.length

  return (
    <div>
      <p className="mb-3 text-xs font-medium" style={{ color: T.muted }}>{txt(flow.label)}</p>
      <svg viewBox={`0 0 ${Math.max(n * 80, 200)} 56`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {steps.map((step, i) => {
          const x = 20 + i * 80
          const isActive = i + 1 === active
          const isDone = i + 1 < active
          const fill = isDone ? hue : isActive ? `${hue}88` : T.borderSubtle
          const stroke = isActive ? hue : isDone ? hue : T.border
          return (
            <g key={step}>
              {i < n - 1 && (
                <line x1={x + 28} y1={20} x2={x + 52} y2={20} stroke={isDone ? hue : T.border} strokeWidth="2" strokeDasharray={isDone ? undefined : '4 3'} />
              )}
              <motion.circle
                cx={x + 14}
                cy={20}
                r={12}
                fill={fill}
                stroke={stroke}
                strokeWidth="2"
                animate={isActive && !reduced ? { scale: [1, 1.08, 1] } : undefined}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {isDone && (
                <text x={x + 14} y={24} textAnchor="middle" fontSize="10" fill={T.ink}>✓</text>
              )}
              <text x={x + 14} y={48} textAnchor="middle" fontSize="8" fill={isActive ? hue : T.muted}>{step}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ChatStateBars({ states }: { states: ChatStateSlice[] }) {
  return (
    <div className="space-y-2">
      {states.map((s, i) => (
        <div key={txt(s.state)}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span style={{ color: T.muted }}>{txt(s.state)}</span>
            <span className="font-semibold tabular-nums" style={{ color: T.ink }}>{num(s.pct)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: T.borderSubtle }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: STATE_HUES[i % STATE_HUES.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${num(s.pct)}%` }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.idle
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: `${s.color}18`, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2" style={{ borderColor: T.borderSubtle, background: T.elevated }}>
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums" style={{ color: T.ink }}>{value}</p>
    </div>
  )
}

function KpiTile({ kpi, hue }: { kpi: Kpi; hue: string }) {
  const trend = txt(kpi.trend)
  const deltaColor = trend === 'up' ? T.success : trend === 'down' ? T.danger : T.muted
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: T.borderSubtle, background: T.canvas }}>
      <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: T.muted }}>{txt(kpi.label)}</p>
      <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: hue }}>{txt(kpi.value)}</p>
      <p className="mt-0.5 text-xs font-medium" style={{ color: deltaColor }}>{txt(kpi.delta)}</p>
    </div>
  )
}

function StreamingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1 w-1 rounded-full"
          style={{ background: color }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}

function ChatBubble({ msg, hue, reduced }: { msg: Message; hue: string; reduced: boolean }) {
  const role = txt(msg.role)
  const state = txt(msg.state)

  if (role === 'system') {
    return (
      <div className="flex justify-center py-1">
        <p className="rounded-full px-3 py-1 text-[11px]" style={{ background: T.borderSubtle, color: T.muted }}>
          {txt(msg.text)}
        </p>
      </div>
    )
  }

  const isUser = role === 'user'
  const isStreaming = state === 'streaming'
  const isWaiting = state === 'waiting'

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className="max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[75%]"
        style={{
          background: isUser ? T.userBubble : T.assistant,
          border: isUser ? `1px solid ${T.border}` : `1px solid ${hue}33`,
          borderBottomRightRadius: isUser ? 4 : undefined,
          borderBottomLeftRadius: isUser ? undefined : 4,
        }}
      >
        {isUser && txt(msg.author) && (
          <p className="mb-1 text-[10px] font-semibold" style={{ color: hue }}>{txt(msg.author)}</p>
        )}
        {!isUser && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: hue }}>Somm</span>
            {isStreaming && (
              <span className="text-[10px]" style={{ color: T.muted }}>
                generating <StreamingDots color={hue} />
              </span>
            )}
            {isWaiting && (
              <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase" style={{ background: `${T.warning}22`, color: T.warning }}>
                Awaiting input
              </span>
            )}
          </div>
        )}
        <p className="text-sm leading-relaxed" style={{ color: T.ink }}>
          {txt(msg.text)}
          {isStreaming && (
            <motion.span
              className="ml-0.5 inline-block h-4 w-0.5 align-middle"
              style={{ background: hue }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[10px]" style={{ color: T.muted }}>{txt(msg.time)}</span>
          {typeof msg.citations === 'number' && msg.citations > 0 && (
            <span className="text-[10px] font-medium" style={{ color: hue }}>{msg.citations} sources</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ThreadRow({
  data,
  selected,
  onSelect,
  reduced,
}: {
  data: Thread
  selected: boolean
  onSelect: () => void
  reduced: boolean
}) {
  const hue = txt(data.hue, '#3B82F6')
  const unread = num(data.unread)
  const spark = threadCharts(data).sparkline ?? []
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={reduced ? undefined : { backgroundColor: T.elevated }}
      className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors"
      style={{
        borderColor: T.borderSubtle,
        background: selected ? `${hue}12` : 'transparent',
        borderLeft: selected ? `3px solid ${hue}` : '3px solid transparent',
      }}
    >
      <span className="mt-0.5 text-lg">{txt(data.icon, '◆')}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold" style={{ color: selected ? T.ink : T.muted }}>
            {txt(data.title)}
          </span>
          <span className="shrink-0 text-[10px]" style={{ color: T.muted }}>{txt(data.lastActivity)}</span>
        </div>
        {spark.length > 1 && (
          <div className="mt-1 h-6 w-full opacity-70">
            <Sparkline values={spark} hue={hue} reduced={!!reduced} />
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <StatusBadge status={txt(data.status, 'idle')} />
          <span className="text-[10px]" style={{ color: T.muted }}>{txt(data.code)}</span>
        </div>
      </div>
      {unread > 0 && (
        <span
          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ background: hue }}
        >
          {unread}
        </span>
      )}
    </motion.button>
  )
}

function ChatComposer({ hue, reduced }: { hue: string; reduced: boolean }) {
  return (
    <div className="border-t p-4" style={{ borderColor: T.borderSubtle, background: T.surface }}>
      <div
        className="flex items-end gap-2 rounded-xl border px-3 py-2"
        style={{ borderColor: T.border, background: T.canvas }}
      >
        <input
          type="text"
          readOnly
          placeholder="Ask Somm about this vertical…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          style={{ color: T.ink }}
        />
        <motion.button
          type="button"
          whileHover={reduced ? undefined : { scale: 1.05 }}
          whileTap={reduced ? undefined : { scale: 0.95 }}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: hue }}
        >
          Send
        </motion.button>
      </div>
      <p className="mt-2 text-center text-[10px]" style={{ color: T.muted }}>
        Enterprise · End-to-end encrypted · Audit logged
      </p>
    </div>
  )
}

function PortfolioBand({ reduced }: { reduced: boolean }) {
  const groups = P.groups ?? []
  const donutSlices = groups.map((g) => ({
    label: txt(g.name),
    value: num(g.share),
    hue: txt(g.hue, T.accent ?? '#3B82F6'),
  }))

  return (
    <section className="border-b px-4 py-4 sm:px-6" style={{ borderColor: T.borderSubtle, background: T.surface }}>
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold sm:text-base" style={{ color: T.ink }}>{txt(P.title)}</h2>
            <p className="text-xs" style={{ color: T.muted }}>{txt(P.subtitle)}</p>
          </div>
          <HealthRing score={num(P.healthScore, 87)} reduced={!!reduced} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ChartCard title="Vertical allocation">
            {donutSlices.length > 0 ? <DonutChart slices={donutSlices} /> : null}
          </ChartCard>
          <ChartCard title="Weekly throughput">
            <ActivityChart data={P.activityWeek ?? []} reduced={!!reduced} />
          </ChartCard>
          <ChartCard title="Response latency">
            <StackedBar bands={P.latencyBands ?? []} />
          </ChartCard>
          <ChartCard title="Chat state mix">
            <ChatStateBars states={P.chatStates ?? []} />
          </ChartCard>
        </div>
      </div>
    </section>
  )
}

function ThreadAnalytics({ data, hue, reduced }: { data: Thread; hue: string; reduced: boolean }) {
  const charts = threadCharts(data)
  const spark = charts.sparkline ?? []
  const bars = charts.bars ?? []
  const flow = charts.flow

  return (
    <div className="space-y-3">
      <ChartCard title={txt(charts.sparklineLabel, 'Trend')}>
        {spark.length > 1 && <Sparkline values={spark} hue={hue} reduced={reduced} />}
      </ChartCard>
      {bars.length > 0 && (
        <ChartCard title={txt(charts.barsLabel, 'Metrics')}>
          <VerticalBars bars={bars} hue={hue} reduced={reduced} />
        </ChartCard>
      )}
      {flow?.steps?.length ? (
        <ChartCard title="Workflow diagram">
          <FlowDiagram flow={flow} hue={hue} status={txt(data.status)} reduced={reduced} />
        </ChartCard>
      ) : null}
    </div>
  )
}

export default function Design() {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(defaultActive)
  const [view, setView] = useState<'chat' | 'portfolio'>('chat')
  const paused = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)

  const pick = useCallback((id: string) => {
    if (!seq.includes(id)) return
    paused.current = true
    setActive(id)
    setView('chat')
    window.setTimeout(() => { paused.current = false }, 12000)
  }, [])

  useEffect(() => {
    if (reduced || seq.length < 2 || rotation <= 0) return
    const t = window.setInterval(() => {
      if (paused.current) return
      setActive((prev) => seq[(seq.indexOf(prev) + 1) % seq.length] ?? prev)
    }, rotation)
    return () => window.clearInterval(t)
  }, [reduced, rotation])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const row = el.querySelector(`[data-thread="${active}"]`)
    row?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
  }, [active, reduced])

  const current = thread(active)
  const hue = txt(current?.hue, '#3B82F6')
  const messages = current?.messages ?? []

  const statusCounts = useMemo(() => {
    const counts = { active: 0, idle: 0, escalated: 0, resolved: 0 }
    for (const id of seq) {
      const s = txt(thread(id)?.status, 'idle') as keyof typeof counts
      if (s in counts) counts[s]++
    }
    return counts
  }, [])

  const metrics = W.metrics ?? {}

  return (
    <div className="flex min-h-screen flex-col" style={{ background: T.canvas, color: T.ink }}>
      <header
        className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 sm:px-6"
        style={{ borderColor: T.border, background: T.surface }}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black"
              style={{ background: `${T.accent}22`, color: T.accent }}
            >
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold sm:text-lg">{txt(W.brand, 'Somm')}</h1>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: `${T.accent}18`, color: T.accent }}
                >
                  {txt(W.edition, 'Enterprise')}
                </span>
              </div>
              <p className="text-xs" style={{ color: T.muted }}>{txt(W.org)}</p>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <motion.span
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ borderColor: T.borderSubtle, color: T.success }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.success }} />
            {txt(W.status)}
          </motion.span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="hidden h-8 w-8 items-center justify-center rounded-full text-xs font-bold sm:flex"
            style={{ background: T.elevated, color: T.muted }}
          >
            NW
          </div>
        </div>
      </header>

      <section className="border-b px-4 py-3 sm:px-6" style={{ borderColor: T.borderSubtle, background: T.surface }}>
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          <MetricCard label="Threads" value={String(metrics.activeThreads ?? seq.length)} />
          <MetricCard label="Resolved today" value={String(metrics.resolvedToday ?? '—')} />
          <MetricCard label="Avg latency" value={String(metrics.avgLatency ?? '—')} />
          <MetricCard label="Satisfaction" value={String(metrics.satisfaction ?? '—')} />
          <MetricCard label="Active" value={String(statusCounts.active)} />
          <MetricCard label="Escalated" value={String(statusCounts.escalated)} />
          <MetricCard label="Idle" value={String(statusCounts.idle)} />
          <MetricCard label="Resolved" value={String(statusCounts.resolved)} />
        </div>
      </section>

      <PortfolioBand reduced={!!reduced} />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:flex-row">
        <aside
          className="flex max-h-64 flex-col border-b lg:max-h-none lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r"
          style={{ borderColor: T.borderSubtle, background: T.surface }}
        >
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: T.borderSubtle }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: T.muted }}>Threads</p>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>{seq.length} verticals</span>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {seq.map((id) => {
              const t = thread(id)
              if (!t) return null
              return (
                <div key={id} data-thread={id}>
                  <ThreadRow
                    data={t}
                    selected={id === active}
                    onSelect={() => pick(id)}
                    reduced={!!reduced}
                  />
                </div>
              )
            })}
          </div>
        </aside>

        <main className="flex min-h-[420px] flex-1 flex-col" style={{ background: T.canvas }}>
          <div
            className="flex border-b"
            style={{ borderColor: T.borderSubtle, background: T.surface }}
            role="tablist"
          >
            {(['chat', 'portfolio'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={view === tab}
                onClick={() => setView(tab)}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
                style={{
                  color: view === tab ? T.ink : T.muted,
                  borderBottom: view === tab ? `2px solid ${hue}` : '2px solid transparent',
                }}
              >
                {tab === 'chat' ? 'Chat' : 'Portfolio'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {current && view === 'chat' && (
              <motion.div
                key={`chat-${active}`}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                className="flex flex-1 flex-col"
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6"
                  style={{ borderColor: T.borderSubtle, background: T.surface }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-2xl">{txt(current.icon, '◆')}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold sm:text-lg">{txt(current.title)}</h2>
                        <StatusBadge status={txt(current.status, 'idle')} />
                      </div>
                      <p className="text-xs" style={{ color: T.muted }}>
                        {txt(current.group)} · {txt(current.code)} · {num(current.participants)} participants
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: T.muted }}>Confidence</p>
                    <p className="text-lg font-bold tabular-nums" style={{ color: hue }}>{num(current.confidence)}%</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
                  {messages.map((msg, i) => (
                    <ChatBubble key={txt(msg.id, `msg-${i}`)} msg={msg} hue={hue} reduced={!!reduced} />
                  ))}
                </div>

                <ChatComposer hue={hue} reduced={!!reduced} />
              </motion.div>
            )}

            {current && view === 'portfolio' && (
              <motion.div
                key={`portfolio-${active}`}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0 }}
                className="flex-1 overflow-y-auto p-4 sm:p-6"
              >
                <div className="mb-4">
                  <h2 className="text-lg font-bold" style={{ color: T.ink }}>
                    {txt(current.title)} — Portfolio view
                  </h2>
                  <p className="text-sm" style={{ color: T.muted }}>{txt(current.context)}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <ThreadAnalytics data={current} hue={hue} reduced={!!reduced} />
                  <div className="space-y-3">
                    <ChartCard title="Confidence score">
                      <div className="flex justify-center py-2">
                        <HealthRing score={num(current.confidence)} reduced={!!reduced} />
                      </div>
                    </ChartCard>
                    <div className="grid gap-2">
                      {(current.kpis ?? []).map((kpi, i) => (
                        <KpiTile key={`${txt(kpi.label)}-${i}`} kpi={kpi} hue={hue} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <aside
          className="border-t lg:w-80 lg:shrink-0 lg:border-t-0 lg:border-l"
          style={{ borderColor: T.borderSubtle, background: T.surface }}
        >
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={active}
                initial={reduced ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0, x: 12 }}
                className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto p-4 sm:max-h-none sm:p-5"
              >
                <ThreadAnalytics data={current} hue={hue} reduced={!!reduced} />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>Context</p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: T.ink }}>{txt(current.context)}</p>
                </div>

                <div className="rounded-xl border-l-4 p-4" style={{ borderColor: hue, background: `${hue}0D` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: hue }}>Suggested action</p>
                  <p className="mt-1 text-sm font-medium" style={{ color: T.ink }}>{txt(current.suggestedAction)}</p>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {arr(current.tags).map((tag, i) => (
                      <span
                        key={`${tag}-${i}`}
                        className="rounded-md px-2 py-1 text-[11px] font-medium"
                        style={{ background: `${hue}18`, color: hue }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <motion.button
                    type="button"
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    whileTap={reduced ? undefined : { scale: 0.98 }}
                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                    style={{ background: hue }}
                  >
                    {txt(W.cta?.primary, 'Approve & deploy')}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    className="w-full rounded-lg border py-2.5 text-sm font-semibold"
                    style={{ borderColor: T.border, color: T.muted }}
                  >
                    {txt(W.cta?.secondary, 'Escalate to human')}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      <footer
        className="border-t px-4 py-3 text-center text-xs sm:px-6"
        style={{ borderColor: T.borderSubtle, background: T.surface, color: T.muted }}
      >
        {txt(W.summary)}
      </footer>
    </div>
  )
}
