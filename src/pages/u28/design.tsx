import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  parchment?: string
  surface?: string
  ink?: string
  muted?: string
  line?: string
  forest?: string
  forestSoft?: string
  terracotta?: string
  terracottaSoft?: string
  gold?: string
  goldSoft?: string
  shadow?: string
}

interface CategoryFilter {
  id: string
  label?: string
}

interface HeroConfig {
  heroImage?: string
  videoId?: string
  gradient?: string[]
  overlay?: number
}

interface Proposal {
  id: string
  title?: string
  sector?: string
  category?: string
  team?: string
  teamSize?: number
  fundingGoal?: number
  votes?: number
  votePercent?: number
  backers?: number
  daysLeft?: number
  coverImage?: string
  imageSeed?: number
  gradient?: string[]
  impact?: string
  summary?: string
  milestones?: string[]
  ask?: string
}

interface GrantMetric {
  id: string
  value?: string
  label?: string
}

interface FaqItem {
  id: string
  q?: string
  a?: string
}

interface GrantAction {
  id: string
  label?: string
  primary?: boolean
}

interface GrantHallData {
  eyebrow?: string
  title?: string
  subtitle?: string
  totalBallots?: number
  fundedAllTime?: number
  defaultActive?: string
  autoRotate?: boolean
  autoRotateMs?: number
  hero?: HeroConfig
  categoryFilters?: CategoryFilter[]
  proposals?: Proposal[]
  metrics?: GrantMetric[]
  faqs?: FaqItem[]
  actions?: GrantAction[]
}

interface DesignPageData {
  theme?: ThemeData
  grantHall?: GrantHallData
}

/* ─── Helpers ─── */

const trim = (v?: string | null): string => (typeof v === 'string' ? v.trim() : '')

const safeText = (v?: string | null, fb = ''): string => trim(v) || fb

const safeNum = (v?: number | null, fb = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fb

const safeList = <T,>(arr?: T[] | null): T[] => (Array.isArray(arr) ? arr : [])

const picsum = (w: number, h: number, seed = 2): string =>
  `https://picsum.photos/${w}/${h}?random=${seed}`

const buildGradient = (colors?: string[], fb = ['#1F2A1F', '#2D5016']): string => {
  const list = safeList(colors).filter(Boolean)
  return `linear-gradient(135deg, ${(list.length >= 2 ? list : fb).join(', ')})`
}

const categoryLabel = (c?: string): string => {
  const v = trim(c).toLowerCase()
  const map: Record<string, string> = {
    'open-source': 'Open source',
    education: 'Education',
    research: 'Research',
    infrastructure: 'Infrastructure',
  }
  return map[v] ?? safeText(c, 'Proposal')
}

const formatMoney = (n?: number): string => {
  const v = safeNum(n)
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

const youtubeEmbed = (id?: string): string => {
  const vid = trim(id)
  if (!vid) return ''
  const p = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', controls: '0', playsinline: '1', rel: '0', playlist: vid })
  return `https://www.youtube-nocookie.com/embed/${vid}?${p}`
}

/* ─── Sub-components ─── */

function CoverImg({
  src,
  seed,
  gradient,
  alt,
  className = '',
}: {
  src?: string
  seed?: number
  gradient?: string[]
  alt?: string
  className?: string
}) {
  const [attempt, setAttempt] = useState(0)
  const primary = trim(src)
  const fallback = picsum(800, 500, safeNum(seed, 132))
  const url = attempt === 0 ? primary || fallback : attempt === 1 ? fallback : ''

  if (!url || attempt > 1) {
    return <div className={`h-full w-full ${className}`} style={{ background: buildGradient(gradient) }} />
  }

  return (
    <img
      src={url}
      alt={safeText(alt, 'Proposal')}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      onError={() => setAttempt((n) => n + 1)}
    />
  )
}

function Thermometer({ percent, theme }: { percent: number; theme: ThemeData }) {
  const p = Math.min(100, Math.max(0, percent))
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>
        <span>Vote share</span>
        <span style={{ color: theme.forest }}>{p}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full" style={{ background: theme.line }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${theme.forest}, ${theme.terracotta})` }}
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/* ─── Main ─── */

export default function Design() {
  const reduced = useReducedMotion()
  const data = pageData as DesignPageData
  const theme = data.theme ?? {}
  const hall = data.grantHall ?? {}

  const proposals = useMemo(() => safeList(hall.proposals), [hall.proposals])
  const filters = useMemo(() => safeList(hall.categoryFilters), [hall.categoryFilters])
  const metrics = useMemo(() => safeList(hall.metrics), [hall.metrics])
  const faqs = useMemo(() => safeList(hall.faqs), [hall.faqs])
  const actions = useMemo(() => safeList(hall.actions), [hall.actions])

  const defaultId = useMemo(() => {
    const d = trim(hall.defaultActive)
    if (d && proposals.some((p) => p.id === d)) return d
    return proposals[0]?.id ?? ''
  }, [hall.defaultActive, proposals])

  const [activeId, setActiveId] = useState(defaultId)
  const [catFilter, setCatFilter] = useState('all')
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0]?.id ?? null)
  const pausedRef = useRef(false)

  const filtered = useMemo(() => {
    if (catFilter === 'all') return proposals
    return proposals.filter((p) => trim(p.category).toLowerCase() === catFilter)
  }, [proposals, catFilter])

  const active = useMemo(
    () => proposals.find((p) => p.id === activeId) ?? proposals[0],
    [proposals, activeId],
  )

  const selectProposal = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
    window.setTimeout(() => { pausedRef.current = false }, 12000)
  }, [])

  useEffect(() => {
    if (!hall.autoRotate || reduced || pausedRef.current) return
    const pool = filtered.length > 0 ? filtered : proposals
    if (pool.length < 2) return
    const ms = safeNum(hall.autoRotateMs, 6800)
    const timer = setInterval(() => {
      if (pausedRef.current) return
      setActiveId((prev) => {
        const i = pool.findIndex((p) => p.id === prev)
        return pool[(i + 1) % pool.length]?.id ?? prev
      })
    }, ms)
    return () => clearInterval(timer)
  }, [hall.autoRotate, hall.autoRotateMs, filtered, proposals, reduced])

  useEffect(() => {
    if (filtered.length && !filtered.some((p) => p.id === activeId)) {
      setActiveId(filtered[0]?.id ?? '')
    }
  }, [filtered, activeId])

  const heroImg = trim(hall.hero?.heroImage) || picsum(1920, 900, 131)

  return (
    <div
      className="min-h-screen w-full break-words [overflow-wrap:anywhere]"
      style={{ background: theme.parchment ?? '#F5F0E6', color: theme.ink ?? '#1F2A1F' }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden border-b py-12 sm:py-16" style={{ borderColor: theme.line }}>
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden />
        {trim(hall.hero?.videoId) && (
          <iframe
            title="Ambient"
            src={youtubeEmbed(hall.hero?.videoId)}
            className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-15"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: buildGradient(safeList(hall.hero?.gradient).length ? hall.hero?.gradient : undefined),
            opacity: hall.hero?.overlay ?? 0.55,
          }}
        />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-6 sm:p-8"
            style={{ background: 'rgba(255,252,247,0.92)', borderColor: theme.line, backdropFilter: 'blur(10px)' }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: theme.terracotta }}>
              {safeText(hall.eyebrow, 'Community grants')}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              {safeText(hall.title, 'Vote where the guild invests next.')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
              {safeText(hall.subtitle, 'Cross-sector proposals from the whole community — cast your vote.')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.id || i}
                  whileHover={reduced ? undefined : { y: -2 }}
                  className="min-w-0 rounded-xl border px-4 py-3"
                  style={{ background: theme.surface, borderColor: theme.line }}
                >
                  <div className="text-lg font-bold" style={{ color: theme.forest }}>{safeText(m.value, '—')}</div>
                  <div className="text-xs" style={{ color: theme.muted }}>{safeText(m.label, 'Metric')}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => {
            const id = trim(f.id) || 'all'
            const on = catFilter === id
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => setCatFilter(id)}
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: on ? theme.forest : theme.surface,
                  color: on ? '#FFFFFF' : theme.ink,
                  border: `1px solid ${on ? theme.forest : theme.line}`,
                }}
              >
                {safeText(f.label, id)}
              </motion.button>
            )
          })}
        </div>

        {/* Ballot thermometer list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: theme.muted }}>No proposals in this category.</p>
          ) : (
            filtered.map((p, index) => {
              const isActive = p.id === activeId
              const pct = safeNum(p.votePercent)
              return (
                <motion.button
                  key={p.id}
                  type="button"
                  onClick={() => selectProposal(p.id)}
                  initial={reduced ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={reduced ? undefined : { y: -3 }}
                  className="w-full overflow-hidden rounded-2xl border text-left transition-shadow"
                  style={{
                    background: theme.surface,
                    borderColor: isActive ? theme.terracotta : theme.line,
                    boxShadow: isActive ? `0 12px 36px ${theme.shadow}` : `0 2px 12px ${theme.shadow}`,
                  }}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                    <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-28">
                      <CoverImg src={p.coverImage} seed={p.imageSeed} gradient={p.gradient} alt={p.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                          style={{ background: theme.forest }}
                        >
                          {categoryLabel(p.category)}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: theme.muted }}>
                          {safeText(p.sector)}
                        </span>
                        {safeNum(p.daysLeft) > 0 && (
                          <span className="text-[11px] font-semibold" style={{ color: theme.terracotta }}>
                            {p.daysLeft}d left
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-base font-bold leading-snug sm:text-lg">
                        {safeText(p.title, 'Proposal')}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed sm:text-sm" style={{ color: theme.muted }}>
                        {safeText(p.impact)}
                      </p>
                    </div>
                    <div className="w-full shrink-0 sm:w-36">
                      <Thermometer percent={pct} theme={theme} />
                      <p className="mt-2 text-center text-xs tabular-nums" style={{ color: theme.muted }}>
                        {safeNum(p.votes).toLocaleString()} votes
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>

        {/* Selected proposal detail */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.section
              key={active.id}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mt-8 overflow-hidden rounded-2xl border"
              style={{ background: theme.surface, borderColor: theme.line, boxShadow: `0 16px 48px ${theme.shadow}` }}
            >
              <div className="grid md:grid-cols-2">
                <div className="relative min-h-[200px]">
                  <CoverImg src={active.coverImage} seed={active.imageSeed} gradient={active.gradient} alt={active.title} />
                </div>
                <div className="min-w-0 p-5 sm:p-7">
                  <h2 className="text-xl font-bold leading-snug sm:text-2xl">{safeText(active.title)}</h2>
                  <p className="mt-1 text-sm" style={{ color: theme.forest }}>
                    {safeText(active.team)} · {safeNum(active.teamSize)} members
                  </p>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: theme.muted }}>
                    {safeText(active.summary)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3" style={{ borderColor: theme.line }}>
                      <p className="text-[10px] font-bold uppercase" style={{ color: theme.muted }}>Goal</p>
                      <p className="mt-1 font-bold">{formatMoney(active.fundingGoal)}</p>
                    </div>
                    <div className="rounded-lg border p-3" style={{ borderColor: theme.line }}>
                      <p className="text-[10px] font-bold uppercase" style={{ color: theme.muted }}>Backers</p>
                      <p className="mt-1 font-bold">{safeNum(active.backers).toLocaleString()}</p>
                    </div>
                  </div>
                  {safeList(active.milestones).length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.terracotta }}>Milestones</p>
                      <ul className="mt-2 space-y-1">
                        {safeList(active.milestones).map((m, i) => (
                          <li key={`${m}-${i}`} className="flex items-start gap-2 text-sm">
                            <span style={{ color: theme.gold }}>◆</span>
                            {safeText(m)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {safeText(active.ask) && (
                    <p className="mt-4 text-sm font-semibold" style={{ color: theme.terracotta }}>{safeText(active.ask)}</p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {actions.map((a) => (
                      <motion.button
                        key={a.id}
                        type="button"
                        whileHover={reduced ? undefined : { scale: 1.04 }}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        className="rounded-full px-5 py-2.5 text-sm font-semibold"
                        style={
                          a.primary
                            ? { background: theme.forest, color: '#FFFFFF', boxShadow: `0 4px 14px ${theme.forestSoft}` }
                            : { background: 'transparent', border: `1.5px solid ${theme.line}`, color: theme.ink }
                        }
                      >
                        {safeText(a.label, 'Action')}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-xl font-bold sm:text-2xl">How the ballot works</h2>
          <p className="mt-1 text-sm" style={{ color: theme.muted }}>
            Common questions about voting, funding, and eligibility.
          </p>
          <div className="mt-5 space-y-2">
            {faqs.map((faq) => {
              const open = openFaq === faq.id
              return (
                <div
                  key={faq.id}
                  className="overflow-hidden rounded-xl border"
                  style={{ background: theme.surface, borderColor: theme.line }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                  >
                    <span className="font-semibold leading-snug">{safeText(faq.q, 'Question')}</span>
                    <motion.span
                      animate={{ rotate: open ? 45 : 0 }}
                      className="shrink-0 text-xl font-light"
                      style={{ color: theme.terracotta }}
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={reduced ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduced ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="border-t px-4 pb-4 pt-2 text-sm leading-relaxed sm:px-5" style={{ borderColor: theme.line, color: theme.muted }}>
                          {safeText(faq.a, 'Answer coming soon.')}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
