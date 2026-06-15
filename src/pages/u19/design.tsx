import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

type TrendDir = 'up' | 'down' | 'flat'

interface ThemeData {
  accent?: string
  accentSoft?: string
  accentOk?: string
  accentWarn?: string
  surface?: string
  panel?: string
  ink?: string
  muted?: string
  line?: string
}

interface SkillBand {
  id: string
  label?: string
  short?: string
  demand?: number
  learners?: number
  roles?: number
  trend?: string
  trendDir?: TrendDir
  color?: string
  insight?: string
}

interface SpectrumAction {
  id: string
  label?: string
  primary?: boolean
}

interface SkillSpectrumData {
  title?: string
  subtitle?: string
  indexLabel?: string
  liveIndex?: number
  updatedAt?: string
  defaultActive?: string
  autoAdvance?: boolean
  autoAdvanceMs?: number
  personas?: string[]
  bands?: SkillBand[]
  actions?: SpectrumAction[]
}

interface DesignPageData {
  theme?: ThemeData
  skillSpectrum?: SkillSpectrumData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeBands(bands?: SkillBand[]): SkillBand[] {
  return (bands ?? []).filter((b): b is SkillBand => Boolean(trim(b?.id)))
}

function safePersonas(personas?: string[]): string[] {
  return (personas ?? []).map((p) => trim(p)).filter(Boolean)
}

function safeActions(actions?: SpectrumAction[]): SpectrumAction[] {
  return (actions ?? []).filter((a): a is SpectrumAction => Boolean(trim(a?.id)))
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 7500): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function bandLabel(b: SkillBand): string {
  return trim(b.label) || trim(b.short) || trim(b.id) || 'Skill'
}

function bandShort(b: SkillBand): string {
  return trim(b.short) || bandLabel(b).slice(0, 3).toUpperCase()
}

function demandValue(b: SkillBand): number {
  const d = b.demand
  if (typeof d !== 'number' || Number.isNaN(d)) return 0
  return Math.min(Math.max(d, 0), 100)
}

function trendDir(b: SkillBand): TrendDir {
  const d = trim(b.trendDir)
  if (d === 'up' || d === 'down' || d === 'flat') return d
  return 'flat'
}

function resolveDefault(bands: SkillBand[], preferred?: string): string {
  const id = trim(preferred)
  if (id && bands.some((b) => b.id === id)) return id
  return bands.reduce((best, b) => (demandValue(b) > demandValue(best) ? b : best), bands[0])?.id ?? ''
}

function formatCount(n?: number): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return n.toLocaleString('en-US')
}

/* ─── Single spectrum bar ─── */

function SpectrumBar({
  band,
  isActive,
  maxDemand,
  reduceMotion,
  onSelect,
}: {
  band: SkillBand
  isActive: boolean
  maxDemand: number
  reduceMotion: boolean
  onSelect: () => void
}) {
  const color = safeColor(band.color, '#0A66C2')
  const demand = demandValue(band)
  const heightPct = maxDemand > 0 ? (demand / maxDemand) * 100 : demand
  const minH = 28

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      className="group flex min-w-[2.4rem] flex-1 flex-col items-center gap-1.5 sm:min-w-0 sm:gap-2"
      whileHover={reduceMotion ? undefined : { y: -3 }}
      whileTap={{ scale: 0.97 }}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`${bandLabel(band)}, demand ${demand}`}
    >
      <div className="relative flex h-36 w-full items-end justify-center sm:h-44">
        <motion.div
          className="w-[72%] max-w-[2.5rem] rounded-t-md sm:max-w-[3rem]"
          style={{
            background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
            boxShadow: isActive ? `0 0 20px ${color}55` : '0 2px 8px rgba(0,0,0,0.06)',
            outline: isActive ? `2px solid ${color}` : '2px solid transparent',
            outlineOffset: 2,
          }}
          initial={false}
          animate={{
            height: `${Math.max(minH, heightPct)}%`,
            opacity: isActive ? 1 : 0.72,
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          {!reduceMotion && (
            <motion.div
              className="h-full w-full rounded-t-md opacity-40"
              style={{
                background: `repeating-linear-gradient(180deg, transparent 0 4px, rgba(255,255,255,0.15) 4px 8px)`,
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.2 + demand * 0.01, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
        <span
          className="absolute -top-1 font-mono text-[9px] font-bold tabular-nums opacity-0 transition-opacity group-hover:opacity-100 sm:text-[10px]"
          style={{ color }}
        >
          {demand}
        </span>
      </div>
      <span
        className="text-center text-[9px] font-bold uppercase tracking-wide sm:text-[10px]"
        style={{ color: isActive ? color : '#666666' }}
      >
        {bandShort(band)}
      </span>
    </motion.button>
  )
}

/* ─── Spectrum analyzer canvas ─── */

function SpectrumCanvas({
  bands,
  activeId,
  reduceMotion,
  onSelect,
}: {
  bands: SkillBand[]
  activeId: string
  reduceMotion: boolean
  onSelect: (id: string) => void
}) {
  const maxDemand = Math.max(...bands.map(demandValue), 1)

  return (
    <div className="flex items-end gap-1 overflow-x-auto px-1 pb-1 sm:gap-2 sm:px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {bands.map((band) => (
        <SpectrumBar
          key={band.id}
          band={band}
          isActive={band.id === activeId}
          maxDemand={maxDemand}
          reduceMotion={reduceMotion}
          onSelect={() => onSelect(band.id)}
        />
      ))}
    </div>
  )
}

/* ─── Band insight panel ─── */

function BandInsight({
  band,
  theme,
  reduceMotion,
}: {
  band: SkillBand | null
  theme: ThemeData
  reduceMotion: boolean
}) {
  const panel = safeColor(theme.panel, '#FFFFFF')
  const ink = safeColor(theme.ink, '#191919')
  const muted = safeColor(theme.muted, '#666666')
  const line = safeColor(theme.line, '#E0E0E0')
  const ok = safeColor(theme.accentOk, '#057642')
  const warn = safeColor(theme.accentWarn, '#B24020')

  if (!band) return null

  const color = safeColor(band.color, '#0A66C2')
  const dir = trendDir(band)
  const trendColor = dir === 'down' ? warn : ok

  return (
    <motion.div
      key={band.id}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease }}
      className="rounded-2xl border p-4 shadow-sm sm:p-5"
      style={{ background: panel, borderColor: line }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
            Skill cluster
          </p>
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: ink }}>
            {bandLabel(band)}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-bold tabular-nums sm:text-4xl" style={{ color }}>
            {demandValue(band)}
          </p>
          <p className="text-xs font-semibold" style={{ color: trendColor }}>
            {trim(band.trend) || '—'} demand
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl px-3 py-2" style={{ background: `${color}10` }}>
          <p className="text-[9px] font-semibold uppercase" style={{ color: muted }}>
            Learners
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: ink }}>
            {formatCount(band.learners)}
          </p>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: '#F8FAFC' }}>
          <p className="text-[9px] font-semibold uppercase" style={{ color: muted }}>
            Open roles
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: ink }}>
            {formatCount(band.roles)}
          </p>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: '#F8FAFC' }}>
          <p className="text-[9px] font-semibold uppercase" style={{ color: muted }}>
            Audience
          </p>
          <p className="text-sm font-bold" style={{ color: ink }}>
            All personas
          </p>
        </div>
      </div>

      {trim(band.insight) && (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: muted }}>
          {trim(band.insight)}
        </p>
      )}
    </motion.div>
  )
}

/* ─── Main export ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const theme = data.theme ?? {}
  const spectrum = data.skillSpectrum ?? {}
  const bands = safeBands(spectrum.bands)
  const personas = safePersonas(spectrum.personas)
  const actions = safeActions(spectrum.actions)

  const surface = safeColor(theme.surface, '#F3F2EF')
  const panel = safeColor(theme.panel, '#FFFFFF')
  const ink = safeColor(theme.ink, '#191919')
  const muted = safeColor(theme.muted, '#666666')
  const accent = safeColor(theme.accent, '#0A66C2')
  const line = safeColor(theme.line, '#E0E0E0')

  const [activeId, setActiveId] = useState(() => resolveDefault(bands, spectrum.defaultActive))
  const pausedRef = useRef(false)

  const activeBand = bands.find((b) => b.id === activeId) ?? null
  const liveIndex = typeof spectrum.liveIndex === 'number' ? spectrum.liveIndex : 0

  const handleSelect = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
  }, [])

  useEffect(() => {
    if (!spectrum.autoAdvance || bands.length < 2 || pausedRef.current) return
    const ms = safeMs(spectrum.autoAdvanceMs)
    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = bands.findIndex((b) => b.id === prev)
        const next = bands[idx + 1]
        return next?.id ?? bands[0]?.id ?? prev
      })
    }, ms)
    return () => window.clearInterval(timer)
  }, [spectrum.autoAdvance, spectrum.autoAdvanceMs, bands])

  if (bands.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6" style={{ background: surface, color: muted }}>
        Spectrum data unavailable.
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: surface, color: ink }}>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Header — LinkedIn-scale professional tone */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="rounded-2xl border p-4 sm:p-5"
          style={{ background: panel, borderColor: line, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                Market intelligence
              </p>
              <h1 className="text-xl font-bold sm:text-2xl">{trim(spectrum.title) || 'Skill spectrum'}</h1>
              <p className="mt-0.5 text-sm" style={{ color: muted }}>
                {trim(spectrum.subtitle)}
              </p>
            </div>
            <div
              className="shrink-0 rounded-xl border px-4 py-3 text-center"
              style={{ borderColor: `${accent}33`, background: `${accent}08` }}
            >
              <p className="text-[9px] font-semibold uppercase" style={{ color: muted }}>
                {trim(spectrum.indexLabel) || 'Index'}
              </p>
              <p className="font-mono text-3xl font-bold tabular-nums" style={{ color: accent }}>
                {liveIndex}
              </p>
              <p className="text-[10px]" style={{ color: muted }}>
                {trim(spectrum.updatedAt)}
              </p>
            </div>
          </div>

          {personas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {personas.map((p) => (
                <span
                  key={p}
                  className="rounded-full border px-3 py-1 text-[10px] font-semibold sm:text-[11px]"
                  style={{ borderColor: line, color: muted, background: surface }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </motion.header>

        {/* Spectrum analyzer — core interaction */}
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: 0.05 }}
          className="mt-4 rounded-2xl border p-3 pt-4 sm:p-5 sm:pt-5"
          style={{ background: panel, borderColor: line, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
              Live demand spectrum
            </p>
            <p className="text-[10px] font-medium" style={{ color: muted }}>
              Tap a band
            </p>
          </div>

          {/* baseline grid */}
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col justify-end gap-6 sm:bottom-9"
              aria-hidden
            >
              {[25, 50, 75].map((pct) => (
                <div key={pct} className="flex items-center gap-2">
                  <span className="w-6 text-right font-mono text-[8px]" style={{ color: line }}>
                    {pct}
                  </span>
                  <div className="h-px flex-1" style={{ background: line }} />
                </div>
              ))}
            </div>
            <SpectrumCanvas
              bands={bands}
              activeId={activeId}
              reduceMotion={reduceMotion}
              onSelect={handleSelect}
            />
          </div>
        </motion.section>

        {/* Insight panel */}
        <AnimatePresence mode="wait">
          <div className="mt-4">
            <BandInsight band={activeBand} theme={theme} reduceMotion={reduceMotion} />
          </div>
        </AnimatePresence>

        {actions.length > 0 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.08 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {actions.map((action) => {
              const label = trim(action.label) || trim(action.id)
              const primary = action.primary === true
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  className="rounded-full px-5 py-2.5 text-sm font-semibold"
                  style={
                    primary
                      ? { background: accent, color: '#fff' }
                      : { background: panel, color: ink, border: `1px solid ${line}` }
                  }
                  whileHover={reduceMotion ? undefined : { y: -1, boxShadow: '0 4px 12px rgba(10,102,194,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {label}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
