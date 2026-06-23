import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  paper?: string
  surface?: string
  ink?: string
  muted?: string
  line?: string
  amber?: string
  amberSoft?: string
  teal?: string
  tealSoft?: string
  rose?: string
  roseSoft?: string
  slate?: string
  shadow?: string
}

interface UrgencyFilter {
  id: string
  label?: string
}

interface HeroConfig {
  heroImage?: string
  videoId?: string
  gradient?: string[]
  overlay?: number
}

interface Ticket {
  id: string
  title?: string
  sector?: string
  blockerType?: string
  urgency?: string
  postedBy?: string
  role?: string
  timeOpen?: string
  bounty?: string
  coverImage?: string
  imageSeed?: number
  gradient?: string[]
  description?: string
  tags?: string[]
  replies?: number
  topReply?: string
  respondents?: string[]
}

interface DeskMetric {
  id: string
  value?: string
  label?: string
}

interface DeskAction {
  id: string
  label?: string
  primary?: boolean
}

interface RelayDeskData {
  eyebrow?: string
  title?: string
  subtitle?: string
  openNow?: number
  resolvedToday?: number
  defaultActive?: string
  autoRotate?: boolean
  autoRotateMs?: number
  hero?: HeroConfig
  urgencyFilters?: UrgencyFilter[]
  tickets?: Ticket[]
  metrics?: DeskMetric[]
  actions?: DeskAction[]
}

interface DesignPageData {
  theme?: ThemeData
  relayDesk?: RelayDeskData
}

/* ─── Helpers ─── */

const trim = (v?: string | null): string => (typeof v === 'string' ? v.trim() : '')

const safeText = (v?: string | null, fallback = ''): string => {
  const t = trim(v)
  return t || fallback
}

const safeNum = (v?: number | null, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback

const safeList = <T,>(arr?: T[] | null): T[] => (Array.isArray(arr) ? arr : [])

const capitalize = (v?: string): string => {
  const t = trim(v)
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

const urgencyLabel = (u?: string): string => {
  const v = trim(u).toLowerCase()
  if (v === 'critical' || v === 'high' || v === 'normal') return capitalize(v)
  return safeText(u, 'Normal')
}

const picsum = (w: number, h: number, seed = 2): string =>
  `https://picsum.photos/${w}/${h}?random=${seed}`

const buildGradient = (colors?: string[], fallback = ['#1C1917', '#44403C']): string => {
  const list = safeList(colors).filter(Boolean)
  return `linear-gradient(135deg, ${(list.length >= 2 ? list : fallback).join(', ')})`
}

const urgencyRank = (u?: string): number => {
  const v = trim(u).toLowerCase()
  if (v === 'critical') return 0
  if (v === 'high') return 1
  return 2
}

const urgencyColor = (u?: string, theme?: ThemeData): string => {
  const v = trim(u).toLowerCase()
  if (v === 'critical') return theme?.rose ?? '#E11D48'
  if (v === 'high') return theme?.amber ?? '#D97706'
  return theme?.teal ?? '#0D9488'
}

const blockerLabel = (t?: string): string => {
  const v = trim(t).toLowerCase()
  const map: Record<string, string> = {
    bug: 'Bug',
    concept: 'Concept',
    career: 'Career',
    architecture: 'Architecture',
    research: 'Research',
  }
  return map[v] ?? (trim(t) || 'Blocker')
}

const youtubeEmbed = (id?: string): string => {
  const vid = trim(id)
  if (!vid) return ''
  const p = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: '0',
    playsinline: '1',
    rel: '0',
    playlist: vid,
  })
  return `https://www.youtube-nocookie.com/embed/${vid}?${p}`
}

/* ─── Sub-components ─── */

function TicketImage({
  src,
  alt,
  seed,
  gradient,
  className = '',
}: {
  src?: string
  alt?: string
  seed?: number
  gradient?: string[]
  className?: string
}) {
  const [attempt, setAttempt] = useState(0)
  const primary = trim(src)
  const fallback = picsum(800, 500, safeNum(seed, 2))
  const url = attempt === 0 ? primary || fallback : attempt === 1 ? fallback : ''

  if (!url || attempt > 1) {
    return (
      <div className={`h-full w-full ${className}`} style={{ background: buildGradient(gradient) }} />
    )
  }

  return (
    <img
      src={url}
      alt={trim(alt) || 'Ticket context'}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      onError={() => setAttempt((n) => n + 1)}
    />
  )
}

function HeroBand({ hero, theme }: { hero?: HeroConfig; theme: ThemeData }) {
  const [imgFail, setImgFail] = useState(false)
  const img = imgFail
    ? picsum(1920, 900, 31)
    : trim(hero?.heroImage) || picsum(1920, 900, 31)
  const vid = trim(hero?.videoId)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img
        src={img}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setImgFail(true)}
      />
      {vid && (
        <iframe
          title="Ambient"
          src={youtubeEmbed(vid)}
          className="absolute inset-0 h-full w-full border-0 opacity-20 mix-blend-multiply"
          allow="autoplay; encrypted-media"
          tabIndex={-1}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: buildGradient(
            safeList(hero?.gradient).length ? hero?.gradient : undefined,
          ),
          opacity: hero?.overlay ?? 0.55,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 30%, ${theme.paper ?? '#FAF7F2'} 100%)`,
        }}
      />
    </div>
  )
}

/* ─── Main ─── */

export default function Design() {
  const reduced = useReducedMotion()
  const data = pageData as DesignPageData
  const theme = data.theme ?? {}
  const desk = data.relayDesk ?? {}

  const tickets = useMemo(() => safeList(desk.tickets), [desk.tickets])
  const filters = useMemo(() => safeList(desk.urgencyFilters), [desk.urgencyFilters])
  const metrics = useMemo(() => safeList(desk.metrics), [desk.metrics])
  const actions = useMemo(() => safeList(desk.actions), [desk.actions])

  const defaultId = useMemo(() => {
    const d = trim(desk.defaultActive)
    if (d && tickets.some((t) => t.id === d)) return d
    return tickets[0]?.id ?? ''
  }, [desk.defaultActive, tickets])

  const [activeId, setActiveId] = useState(defaultId)
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const pausedRef = useRef(false)

  const sorted = useMemo(() => {
    let list = [...tickets]
    if (urgencyFilter !== 'all') {
      list = list.filter((t) => trim(t.urgency).toLowerCase() === urgencyFilter)
    }
    return list.sort((a, b) => urgencyRank(a.urgency) - urgencyRank(b.urgency))
  }, [tickets, urgencyFilter])

  const active = useMemo(
    () => tickets.find((t) => t.id === activeId) ?? tickets[0],
    [tickets, activeId],
  )

  const selectTicket = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
    window.setTimeout(() => {
      pausedRef.current = false
    }, 12000)
  }, [])

  useEffect(() => {
    if (!desk.autoRotate || reduced || pausedRef.current) return
    const pool = sorted.length > 0 ? sorted : tickets
    if (pool.length < 2) return
    const ms = safeNum(desk.autoRotateMs, 6800)
    const timer = setInterval(() => {
      if (pausedRef.current) return
      setActiveId((prev) => {
        const i = pool.findIndex((t) => t.id === prev)
        return pool[(i + 1) % pool.length]?.id ?? prev
      })
    }, ms)
    return () => clearInterval(timer)
  }, [desk.autoRotate, desk.autoRotateMs, sorted, tickets, reduced])

  useEffect(() => {
    if (sorted.length && !sorted.some((t) => t.id === activeId)) {
      setActiveId(sorted[0]?.id ?? '')
    }
  }, [sorted, activeId])

  const openNow = safeNum(desk.openNow)
  const resolvedToday = safeNum(desk.resolvedToday)

  const [isWide, setIsWide] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => setIsWide(e.matches)
    setIsWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const queueHint = isWide
    ? 'Select another ticket on the left'
    : 'Select another ticket above'

  return (
    <div
      className="min-h-screen w-full break-words [overflow-wrap:anywhere]"
      style={{ background: theme.paper ?? '#FAF7F2', color: theme.ink ?? '#1C1917' }}
    >
      {/* ── Hero band ── */}
      <section className="relative overflow-hidden pb-6 pt-16 sm:pb-10 sm:pt-20">
        <HeroBand hero={desk.hero} theme={theme} />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl rounded-2xl border p-5 sm:p-7"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              borderColor: theme.line,
              boxShadow: `0 12px 40px ${theme.shadow}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: theme.amber }}
            >
              {safeText(desk.eyebrow, 'Help exchange')}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {safeText(desk.title, 'Stuck? Someone here has shipped it.')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
              {safeText(
                desk.subtitle,
                'Students, coders, professionals, and educators post real blockers and get community answers across every sector.',
              )}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold">
              {openNow > 0 && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                  style={{ background: theme.roseSoft, color: theme.rose }}
                >
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ background: theme.rose }} />
                  {openNow.toLocaleString()} open now
                </span>
              )}
              {resolvedToday > 0 && (
                <span
                  className="rounded-full px-3 py-1.5"
                  style={{ background: theme.tealSoft, color: theme.teal }}
                >
                  {resolvedToday.toLocaleString()} resolved today
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.id || i}
                  whileHover={reduced ? undefined : { y: -2 }}
                  className="min-w-0 rounded-xl border px-4 py-3 sm:min-w-[120px]"
                  style={{
                    background: theme.surface,
                    borderColor: theme.line,
                    boxShadow: `0 4px 16px ${theme.shadow}`,
                  }}
                >
                  <div className="text-lg font-bold sm:text-xl">{safeText(m.value, '—')}</div>
                  <div className="text-xs leading-snug" style={{ color: theme.muted }}>
                    {safeText(m.label, 'Metric')}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Desk: ticket rail + solution workspace ── */}
      <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((f) => {
            const id = trim(f.id) || 'all'
            const on = urgencyFilter === id
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => setUrgencyFilter(id)}
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold"
                style={{
                  background: on ? theme.slate : theme.surface,
                  color: on ? '#FFFFFF' : theme.ink,
                  border: `1px solid ${on ? theme.slate : theme.line}`,
                }}
              >
                {safeText(f.label, id)}
              </motion.button>
            )
          })}
        </div>

        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            background: theme.surface,
            borderColor: theme.line,
            boxShadow: `0 12px 40px ${theme.shadow}`,
          }}
        >
          <div className="grid min-h-[520px] lg:grid-cols-[minmax(260px,32%)_1fr]">
            {/* Left: urgency ladder */}
            <div
              className="border-b lg:border-b-0 lg:border-r"
              style={{ borderColor: theme.line, background: theme.paper }}
            >
              <div
                className="border-b px-4 py-3 text-xs font-bold uppercase tracking-widest"
                style={{ borderColor: theme.line, color: theme.muted }}
              >
                Ticket queue · {sorted.length}
              </div>
              <ul className="max-h-[420px] overflow-y-auto lg:max-h-[560px]">
                {sorted.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm" style={{ color: theme.muted }}>
                    No tickets match this filter. Try another urgency level.
                  </li>
                ) : (
                  sorted.map((ticket) => {
                    const isActive = ticket.id === activeId
                    const uColor = urgencyColor(ticket.urgency, theme)
                    const title = safeText(ticket.title, 'Untitled ticket')
                    const meta = [safeText(ticket.sector), safeText(ticket.timeOpen)]
                      .filter(Boolean)
                      .join(' · ')
                    return (
                      <li key={ticket.id}>
                        <motion.button
                          type="button"
                          onClick={() => selectTicket(ticket.id)}
                          whileHover={reduced ? undefined : { x: 4 }}
                          className="relative w-full border-b px-4 py-3.5 text-left transition-colors"
                          style={{
                            borderColor: theme.line,
                            background: isActive ? theme.surface : 'transparent',
                            boxShadow: isActive ? `inset 4px 0 0 ${uColor}` : 'none',
                          }}
                          title={title}
                          aria-current={isActive ? 'true' : undefined}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 h-2 w-2 shrink-0 rounded-full"
                              style={{ background: uColor }}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-semibold leading-snug ${isActive ? '' : 'line-clamp-2'}`}
                              >
                                {title}
                              </p>
                              {meta && (
                                <p className="mt-1 line-clamp-2 text-[11px] leading-snug" style={{ color: theme.muted }}>
                                  {meta}
                                </p>
                              )}
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                                  style={{ background: `${uColor}18`, color: uColor }}
                                >
                                  {urgencyLabel(ticket.urgency)}
                                </span>
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ background: theme.amberSoft, color: theme.amber }}
                                >
                                  {blockerLabel(ticket.blockerType)}
                                </span>
                              </div>
                            </div>
                            {safeNum(ticket.replies) > 0 && (
                              <span
                                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                                style={{ background: theme.tealSoft, color: theme.teal }}
                                aria-label={`${ticket.replies} replies`}
                              >
                                {ticket.replies}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>

            {/* Right: solution workspace */}
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id}
                  initial={reduced ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? undefined : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col"
                >
                  <div className="relative h-44 shrink-0 overflow-hidden sm:h-52">
                    <TicketImage
                      src={active.coverImage}
                      alt={active.title}
                      seed={active.imageSeed}
                      gradient={active.gradient}
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, ${theme.surface} 0%, transparent 60%)`,
                      }}
                    />
                    <div className="absolute bottom-3 left-4 right-4">
                      <span
                        className="inline-block max-w-full rounded-md px-2 py-0.5 text-[10px] font-bold uppercase leading-snug text-white"
                        style={{ background: urgencyColor(active.urgency, theme) }}
                      >
                        {urgencyLabel(active.urgency)} · {blockerLabel(active.blockerType)}
                      </span>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-5 sm:p-6">
                    <h2 className="text-xl font-bold leading-snug sm:text-2xl">
                      {safeText(active.title, 'Untitled ticket')}
                    </h2>
                    {safeText(active.sector) && (
                      <p className="mt-1 text-sm font-medium leading-snug" style={{ color: theme.teal }}>
                        {safeText(active.sector)}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
                      {safeText(
                        active.description,
                        'No description provided. Open the thread to learn more from the community.',
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed">
                      <span className="font-semibold">{safeText(active.postedBy, 'Anonymous')}</span>
                      {safeText(active.role) && (
                        <span style={{ color: theme.muted }}>· {safeText(active.role)}</span>
                      )}
                      {safeText(active.bounty) && (
                        <span
                          className="rounded-full px-2 py-0.5 font-bold"
                          style={{ background: theme.amberSoft, color: theme.amber }}
                        >
                          {safeText(active.bounty)}
                        </span>
                      )}
                    </div>

                    {safeList(active.tags).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {safeList(active.tags).map((tag, i) => (
                          <motion.span
                            key={`${tag}-${i}`}
                            whileHover={reduced ? undefined : { scale: 1.04 }}
                            className="rounded-md border px-2 py-1 text-xs font-medium"
                            style={{ borderColor: theme.line, color: theme.slate }}
                          >
                            #{safeText(tag, `tag-${i + 1}`)}
                          </motion.span>
                        ))}
                      </div>
                    )}

                    {safeText(active.topReply) && (
                      <motion.div
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-5 rounded-xl border-l-4 p-4"
                        style={{
                          borderColor: theme.teal,
                          background: theme.tealSoft,
                        }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.teal }}>
                          Top community reply
                        </p>
                        <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.ink }}>
                          {safeText(active.topReply)}
                        </p>
                        {safeList(active.respondents).length > 0 && (
                          <p className="mt-2 text-xs font-medium leading-relaxed" style={{ color: theme.muted }}>
                            — {safeList(active.respondents).map((r) => safeText(r)).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </motion.div>
                    )}

                    <div
                      className="mt-auto flex flex-col gap-3 border-t pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                      style={{ borderColor: theme.line }}
                    >
                      <p className="min-w-0 text-xs leading-relaxed" style={{ color: theme.muted }}>
                        {safeNum(active.replies) > 0
                          ? `${safeNum(active.replies).toLocaleString()} ${safeNum(active.replies) === 1 ? 'reply' : 'replies'} · ${queueHint}`
                          : 'Be the first to reply'}
                      </p>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {actions.map((a) => (
                          <motion.button
                            key={a.id}
                            type="button"
                            whileHover={reduced ? undefined : { scale: 1.04, y: -1 }}
                            whileTap={reduced ? undefined : { scale: 0.97 }}
                            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold"
                            style={
                              a.primary
                                ? {
                                    background: theme.amber,
                                    color: '#FFFFFF',
                                    boxShadow: `0 4px 14px ${theme.amberSoft}`,
                                  }
                                : {
                                    background: 'transparent',
                                    border: `1.5px solid ${theme.line}`,
                                    color: theme.ink,
                                  }
                            }
                          >
                            {safeText(a.label, 'Action')}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
