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
  stage?: string
  panel?: string
  card?: string
  ink?: string
  muted?: string
  line?: string
  pink?: string
  pinkSoft?: string
  violet?: string
  violetSoft?: string
  live?: string
  liveSoft?: string
  shadow?: string
}

interface StatusFilter {
  id: string
  label?: string
}

interface HeroConfig {
  heroImage?: string
  videoId?: string
  gradient?: string[]
  overlay?: number
}

interface Broadcast {
  id: string
  channel?: string
  status?: string
  title?: string
  host?: string
  hostRole?: string
  liveIn?: string
  viewers?: number
  questions?: number
  duration?: string
  coverImage?: string
  imageSeed?: number
  previewVideoId?: string
  gradient?: string[]
  description?: string
  topics?: string[]
}

interface StageMetric {
  id: string
  value?: string
  label?: string
}

interface StageAction {
  id: string
  label?: string
  primary?: boolean
}

interface GuildStageData {
  eyebrow?: string
  title?: string
  subtitle?: string
  liveNow?: number
  viewersTotal?: number
  defaultActive?: string
  autoSwitch?: boolean
  autoSwitchMs?: number
  hero?: HeroConfig
  statusFilters?: StatusFilter[]
  broadcasts?: Broadcast[]
  metrics?: StageMetric[]
  actions?: StageAction[]
}

interface DesignPageData {
  theme?: ThemeData
  guildStage?: GuildStageData
}

/* ─── Helpers ─── */

const trim = (v?: string | null): string => (typeof v === 'string' ? v.trim() : '')

const safeText = (v?: string | null, fb = ''): string => trim(v) || fb

const safeNum = (v?: number | null, fb = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fb

const safeList = <T,>(arr?: T[] | null): T[] => (Array.isArray(arr) ? arr : [])

const picsum = (w: number, h: number, seed = 2): string =>
  `https://picsum.photos/${w}/${h}?random=${seed}`

const buildGradient = (colors?: string[], fb = ['#0E0618', '#4c1d95']): string => {
  const list = safeList(colors).filter(Boolean)
  return `linear-gradient(135deg, ${(list.length >= 2 ? list : fb).join(', ')})`
}

const statusLabel = (s?: string): string => {
  const v = trim(s).toLowerCase()
  if (v === 'live') return 'Live'
  if (v === 'upcoming') return 'Upcoming'
  if (v === 'replay') return 'Replay'
  return safeText(s, 'Room')
}

const statusColor = (s?: string, theme?: ThemeData): string => {
  const v = trim(s).toLowerCase()
  if (v === 'live') return theme?.live ?? '#FF3B3B'
  if (v === 'upcoming') return theme?.violet ?? '#8B5CF6'
  return theme?.muted ?? '#9B8AB8'
}

const youtubeEmbed = (id?: string, autoplay = false): string => {
  const vid = trim(id)
  if (!vid) return ''
  const p = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: '1',
    loop: '1',
    controls: '1',
    playsinline: '1',
    rel: '0',
    playlist: vid,
  })
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
  const fallback = picsum(900, 600, safeNum(seed, 112))
  const url = attempt === 0 ? primary || fallback : attempt === 1 ? fallback : ''

  if (!url || attempt > 1) {
    return <div className={`h-full w-full ${className}`} style={{ background: buildGradient(gradient) }} />
  }

  return (
    <img
      src={url}
      alt={safeText(alt, 'Broadcast')}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      onError={() => setAttempt((n) => n + 1)}
    />
  )
}

function LiveBadge({ theme }: { theme: ThemeData }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ background: theme.live }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: '#fff' }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
      </span>
      Live
    </span>
  )
}

/* ─── Main ─── */

export default function Design() {
  const reduced = useReducedMotion()
  const data = pageData as DesignPageData
  const theme = data.theme ?? {}
  const stage = data.guildStage ?? {}

  const broadcasts = useMemo(() => safeList(stage.broadcasts), [stage.broadcasts])
  const filters = useMemo(() => safeList(stage.statusFilters), [stage.statusFilters])
  const metrics = useMemo(() => safeList(stage.metrics), [stage.metrics])
  const actions = useMemo(() => safeList(stage.actions), [stage.actions])

  const defaultId = useMemo(() => {
    const d = trim(stage.defaultActive)
    if (d && broadcasts.some((b) => b.id === d)) return d
    return broadcasts[0]?.id ?? ''
  }, [stage.defaultActive, broadcasts])

  const [activeId, setActiveId] = useState(defaultId)
  const [statusFilter, setStatusFilter] = useState('all')
  const pausedRef = useRef(false)

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return broadcasts
    return broadcasts.filter((b) => trim(b.status).toLowerCase() === statusFilter)
  }, [broadcasts, statusFilter])

  const active = useMemo(
    () => broadcasts.find((b) => b.id === activeId) ?? broadcasts[0],
    [broadcasts, activeId],
  )

  const selectBroadcast = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
    window.setTimeout(() => { pausedRef.current = false }, 14000)
  }, [])

  useEffect(() => {
    if (!stage.autoSwitch || reduced || pausedRef.current) return
    const pool = filtered.length > 0 ? filtered : broadcasts
    if (pool.length < 2) return
    const ms = safeNum(stage.autoSwitchMs, 7500)
    const timer = setInterval(() => {
      if (pausedRef.current) return
      setActiveId((prev) => {
        const i = pool.findIndex((b) => b.id === prev)
        return pool[(i + 1) % pool.length]?.id ?? prev
      })
    }, ms)
    return () => clearInterval(timer)
  }, [stage.autoSwitch, stage.autoSwitchMs, filtered, broadcasts, reduced])

  useEffect(() => {
    if (filtered.length && !filtered.some((b) => b.id === activeId)) {
      setActiveId(filtered[0]?.id ?? '')
    }
  }, [filtered, activeId])

  const isLive = trim(active?.status).toLowerCase() === 'live'
  const heroImg = trim(stage.hero?.heroImage) || picsum(1920, 900, 111)

  return (
    <div
      className="min-h-screen w-full break-words [overflow-wrap:anywhere]"
      style={{ background: theme.void ?? '#0E0618', color: theme.ink ?? '#F5EEFA' }}
    >
      {/* Compact hero strip */}
      <header
        className="relative overflow-hidden border-b px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
        style={{ borderColor: theme.line }}
      >
        <img
          src={heroImg}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
          aria-hidden
        />
        {trim(stage.hero?.videoId) && (
          <iframe
            title="Ambient"
            src={youtubeEmbed(stage.hero?.videoId, true)}
            className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-15"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden
          />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: buildGradient(safeList(stage.hero?.gradient).length ? stage.hero?.gradient : undefined),
            opacity: stage.hero?.overlay ?? 0.7,
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: theme.pink }}>
              {safeText(stage.eyebrow, 'Live broadcasts')}
            </p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              {safeText(stage.title, 'Ask builders who have shipped it.')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: theme.muted }}>
              {safeText(
                stage.subtitle,
                'Live AMAs, workshops, and panels from students, coders, professionals, and educators.',
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {metrics.map((m, i) => (
                <div
                  key={m.id || i}
                  className="rounded-lg border px-3 py-2"
                  style={{ background: theme.panel, borderColor: theme.line }}
                >
                  <span className="font-bold" style={{ color: theme.pink }}>{safeText(m.value, '—')}</span>
                  <span className="ml-2 text-xs" style={{ color: theme.muted }}>{safeText(m.label)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Status filters */}
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const id = trim(f.id) || 'all'
            const on = statusFilter === id
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                whileHover={reduced ? undefined : { scale: 1.04 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="rounded-full px-4 py-1.5 text-sm font-semibold"
                style={{
                  background: on ? theme.pink : theme.panel,
                  color: on ? '#FFFFFF' : theme.muted,
                  border: `1px solid ${on ? theme.pink : theme.line}`,
                }}
              >
                {safeText(f.label, id)}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Streaming layout: channel rail | stage | sidebar */}
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr_260px] lg:px-8">
        {/* Channel rail */}
        <aside
          className="order-2 max-h-[320px] overflow-y-auto rounded-xl border lg:order-1 lg:max-h-[calc(100vh-220px)]"
          style={{ background: theme.panel, borderColor: theme.line }}
        >
          <div
            className="sticky top-0 border-b px-3 py-2.5 text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: theme.line, background: theme.panel, color: theme.muted }}
          >
            Channels · {filtered.length}
          </div>
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs" style={{ color: theme.muted }}>No rooms match.</p>
          ) : (
            <ul>
              {filtered.map((b) => {
                const on = b.id === activeId
                const st = trim(b.status).toLowerCase()
                return (
                  <li key={b.id}>
                    <motion.button
                      type="button"
                      onClick={() => selectBroadcast(b.id)}
                      whileHover={reduced ? undefined : { x: 3 }}
                      className="w-full border-b px-3 py-3 text-left"
                      style={{
                        borderColor: theme.line,
                        background: on ? theme.card : 'transparent',
                        boxShadow: on ? `inset 3px 0 0 ${theme.pink}` : 'none',
                      }}
                      aria-current={on ? 'true' : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {st === 'live' && <LiveBadge theme={theme} />}
                        {st !== 'live' && (
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{ background: `${statusColor(b.status, theme)}22`, color: statusColor(b.status, theme) }}
                          >
                            {statusLabel(b.status)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                        {safeText(b.title)}
                      </p>
                      <p className="mt-0.5 text-[10px]" style={{ color: theme.muted }}>
                        {safeText(b.channel)}
                      </p>
                    </motion.button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        {/* Main stage */}
        <main className="order-1 lg:order-2">
          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key={active.id}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                className="overflow-hidden rounded-xl border"
                style={{ background: theme.stage, borderColor: theme.line, boxShadow: `0 16px 48px ${theme.shadow}` }}
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  {trim(active.previewVideoId) && (isLive || trim(active.status).toLowerCase() === 'replay') ? (
                    <>
                      <CoverImg
                        src={active.coverImage}
                        seed={active.imageSeed}
                        gradient={active.gradient}
                        alt={active.title}
                        className="absolute inset-0 opacity-25"
                      />
                      <iframe
                        title={safeText(active.title, 'Broadcast')}
                        src={youtubeEmbed(active.previewVideoId, isLive)}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        loading="lazy"
                      />
                    </>
                  ) : (
                    <CoverImg src={active.coverImage} seed={active.imageSeed} gradient={active.gradient} alt={active.title} />
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {isLive && <LiveBadge theme={theme} />}
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: 'rgba(0,0,0,0.6)', color: theme.ink }}
                    >
                      {safeText(active.liveIn)}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.violet }}>
                    {safeText(active.channel)}
                  </p>
                  <h2 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">
                    {safeText(active.title, 'Broadcast')}
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: theme.muted }}>
                    {safeText(active.host, 'Host')}{safeText(active.hostRole) && ` · ${safeText(active.hostRole)}`}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: theme.muted }}>
                    {safeText(active.description)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {actions.map((a) => (
                      <motion.button
                        key={a.id}
                        type="button"
                        whileHover={reduced ? undefined : { scale: 1.04 }}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        className="rounded-full px-5 py-2.5 text-sm font-semibold"
                        style={
                          a.primary
                            ? { background: theme.pink, color: '#FFFFFF', boxShadow: `0 4px 16px ${theme.pinkSoft}` }
                            : { background: 'transparent', border: `1px solid ${theme.line}`, color: theme.ink }
                        }
                      >
                        {safeText(a.label, 'Action')}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Questions / meta sidebar */}
        <aside
          className="order-3 rounded-xl border p-4"
          style={{ background: theme.panel, borderColor: theme.line }}
        >
          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key={active.id}
                initial={reduced ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? undefined : { opacity: 0 }}
              >
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>
                  Room info
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span style={{ color: theme.muted }}>Status</span>
                    <span className="font-semibold" style={{ color: statusColor(active.status, theme) }}>
                      {statusLabel(active.status)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span style={{ color: theme.muted }}>Duration</span>
                    <span className="font-semibold">{safeText(active.duration, '—')}</span>
                  </div>
                  {safeNum(active.viewers) > 0 && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: theme.muted }}>Viewers</span>
                      <span className="font-semibold tabular-nums">{safeNum(active.viewers).toLocaleString()}</span>
                    </div>
                  )}
                  {safeNum(active.questions) > 0 && (
                    <div className="flex justify-between gap-2">
                      <span style={{ color: theme.muted }}>Questions queued</span>
                      <span className="font-semibold tabular-nums" style={{ color: theme.pink }}>
                        {safeNum(active.questions)}
                      </span>
                    </div>
                  )}
                </div>

                {safeList(active.topics).length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>
                      Topics
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {safeList(active.topics).map((t, i) => (
                        <span
                          key={`${t}-${i}`}
                          className="rounded-lg px-2 py-1 text-xs font-medium"
                          style={{ background: theme.violetSoft, color: theme.violet }}
                        >
                          {safeText(t)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {isLive && safeNum(active.questions) > 0 && (
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-lg border p-3"
                    style={{ borderColor: theme.line, background: theme.card }}
                  >
                    <p className="text-xs font-bold uppercase" style={{ color: theme.pink }}>
                      Question queue active
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.muted }}>
                      {safeNum(active.questions)} questions waiting. Join the room to upvote or submit yours.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  )
}
