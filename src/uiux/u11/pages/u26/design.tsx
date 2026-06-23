import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  cream?: string
  surface?: string
  ink?: string
  muted?: string
  line?: string
  coral?: string
  coralSoft?: string
  indigo?: string
  indigoSoft?: string
  sage?: string
  sageSoft?: string
  shadow?: string
}

interface DemoFilter {
  id: string
  label?: string
}

interface HeroConfig {
  heroImage?: string
  videoId?: string
  gradient?: string[]
  overlay?: number
}

interface Demo {
  id: string
  title?: string
  sector?: string
  demoType?: string
  builder?: string
  builderRole?: string
  shipped?: string
  viewers?: number
  likes?: number
  size?: string
  coverImage?: string
  imageSeed?: number
  previewVideoId?: string
  gradient?: string[]
  description?: string
  highlight?: string
  stack?: string[]
}

interface MosaicMetric {
  id: string
  value?: string
  label?: string
}

interface MosaicAction {
  id: string
  label?: string
  primary?: boolean
}

interface GuildMosaicData {
  eyebrow?: string
  title?: string
  subtitle?: string
  demosLive?: number
  viewersWeek?: number
  defaultActive?: string
  autoCycle?: boolean
  autoCycleMs?: number
  hero?: HeroConfig
  demoFilters?: DemoFilter[]
  demos?: Demo[]
  metrics?: MosaicMetric[]
  actions?: MosaicAction[]
}

interface DesignPageData {
  theme?: ThemeData
  guildMosaic?: GuildMosaicData
}

/* ─── Helpers ─── */

const trim = (v?: string | null): string => (typeof v === 'string' ? v.trim() : '')

const safeText = (v?: string | null, fb = ''): string => trim(v) || fb

const safeNum = (v?: number | null, fb = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fb

const safeList = <T,>(arr?: T[] | null): T[] => (Array.isArray(arr) ? arr : [])

const picsum = (w: number, h: number, seed = 2): string =>
  `https://picsum.photos/${w}/${h}?random=${seed}`

const buildGradient = (colors?: string[], fb = ['#2D2A32', '#4F46E5']): string => {
  const list = safeList(colors).filter(Boolean)
  return `linear-gradient(135deg, ${(list.length >= 2 ? list : fb).join(', ')})`
}

const demoTypeLabel = (t?: string): string => {
  const v = trim(t).toLowerCase()
  const map: Record<string, string> = { app: 'App', api: 'API', design: 'Design', research: 'Research' }
  return map[v] ?? safeText(t, 'Demo')
}

const sizeClass = (size?: string): string => {
  const v = trim(size).toLowerCase()
  if (v === 'hero') return 'col-span-2 row-span-2 sm:min-h-[420px]'
  if (v === 'tall') return 'row-span-2 sm:min-h-[380px]'
  if (v === 'wide') return 'col-span-2 sm:min-h-[220px]'
  return 'sm:min-h-[240px]'
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
  const fallback = picsum(600, 500, safeNum(seed, 92))
  const url = attempt === 0 ? primary || fallback : attempt === 1 ? fallback : ''

  if (!url || attempt > 1) {
    return <div className={`h-full w-full ${className}`} style={{ background: buildGradient(gradient) }} />
  }

  return (
    <img
      src={url}
      alt={safeText(alt, 'Demo cover')}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      onError={() => setAttempt((n) => n + 1)}
    />
  )
}

function HeroBackdrop({ hero }: { hero?: HeroConfig }) {
  const [fail, setFail] = useState(false)
  const img = fail ? picsum(1920, 900, 91) : trim(hero?.heroImage) || picsum(1920, 900, 91)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFail(true)} />
      {trim(hero?.videoId) && (
        <iframe
          title="Ambient"
          src={youtubeEmbed(hero?.videoId, true)}
          className="absolute inset-0 h-full w-full border-0 opacity-20"
          allow="autoplay; encrypted-media"
          tabIndex={-1}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: buildGradient(safeList(hero?.gradient).length ? hero?.gradient : undefined),
          opacity: hero?.overlay ?? 0.5,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FBF8F4]" />
    </div>
  )
}

/* ─── Main ─── */

export default function Design() {
  const reduced = useReducedMotion()
  const data = pageData as DesignPageData
  const theme = data.theme ?? {}
  const mosaic = data.guildMosaic ?? {}

  const demos = useMemo(() => safeList(mosaic.demos), [mosaic.demos])
  const filters = useMemo(() => safeList(mosaic.demoFilters), [mosaic.demoFilters])
  const metrics = useMemo(() => safeList(mosaic.metrics), [mosaic.metrics])
  const actions = useMemo(() => safeList(mosaic.actions), [mosaic.actions])

  const defaultId = useMemo(() => {
    const d = trim(mosaic.defaultActive)
    if (d && demos.some((x) => x.id === d)) return d
    return demos[0]?.id ?? ''
  }, [mosaic.defaultActive, demos])

  const [activeId, setActiveId] = useState(defaultId)
  const [typeFilter, setTypeFilter] = useState('all')
  const pausedRef = useRef(false)

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return demos
    return demos.filter((d) => trim(d.demoType).toLowerCase() === typeFilter)
  }, [demos, typeFilter])

  const active = useMemo(
    () => demos.find((d) => d.id === activeId) ?? demos[0],
    [demos, activeId],
  )

  const selectDemo = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
    window.setTimeout(() => { pausedRef.current = false }, 14000)
  }, [])

  useEffect(() => {
    if (!mosaic.autoCycle || reduced || pausedRef.current) return
    const pool = filtered.length > 0 ? filtered : demos
    if (pool.length < 2) return
    const ms = safeNum(mosaic.autoCycleMs, 7000)
    const timer = setInterval(() => {
      if (pausedRef.current) return
      setActiveId((prev) => {
        const i = pool.findIndex((x) => x.id === prev)
        return pool[(i + 1) % pool.length]?.id ?? prev
      })
    }, ms)
    return () => clearInterval(timer)
  }, [mosaic.autoCycle, mosaic.autoCycleMs, filtered, demos, reduced])

  useEffect(() => {
    if (filtered.length && !filtered.some((d) => d.id === activeId)) {
      setActiveId(filtered[0]?.id ?? '')
    }
  }, [filtered, activeId])

  return (
    <div
      className="min-h-screen w-full break-words [overflow-wrap:anywhere]"
      style={{ background: theme.cream ?? '#FBF8F4', color: theme.ink ?? '#2D2A32' }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden pb-8 pt-14 sm:pb-12 sm:pt-18">
        <HeroBackdrop hero={mosaic.hero} />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl rounded-2xl border p-6 sm:p-8"
            style={{ background: 'rgba(255,255,255,0.9)', borderColor: theme.line, backdropFilter: 'blur(12px)' }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: theme.coral }}>
              {safeText(mosaic.eyebrow, 'Community demos')}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {safeText(mosaic.title, 'See what builders shipped this week.')}
            </h1>
            <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
              {safeText(
                mosaic.subtitle,
                'Real project demos from students, coders, professionals, and educators across every sector.',
              )}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.id || i}
                  whileHover={reduced ? undefined : { y: -3 }}
                  className="min-w-0 rounded-xl border px-4 py-3 sm:min-w-[110px]"
                  style={{ background: theme.surface, borderColor: theme.line }}
                >
                  <div className="text-lg font-bold sm:text-xl" style={{ color: theme.indigo }}>
                    {safeText(m.value, '—')}
                  </div>
                  <div className="text-xs leading-snug" style={{ color: theme.muted }}>
                    {safeText(m.label, 'Metric')}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => {
            const id = trim(f.id) || 'all'
            const on = typeFilter === id
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => setTypeFilter(id)}
                whileHover={reduced ? undefined : { scale: 1.04 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: on ? theme.coral : theme.surface,
                  color: on ? '#FFFFFF' : theme.ink,
                  border: `1px solid ${on ? theme.coral : theme.line}`,
                }}
              >
                {safeText(f.label, id)}
              </motion.button>
            )
          })}
        </div>

        {/* Magazine mosaic grid */}
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: theme.muted }}>
            No demos match this filter. Try another type.
          </p>
        ) : (
          <div className="grid auto-rows-[minmax(200px,auto)] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {filtered.map((demo, index) => {
              const isActive = demo.id === activeId
              return (
                <motion.button
                  key={demo.id}
                  type="button"
                  onClick={() => selectDemo(demo.id)}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={reduced ? undefined : { y: -6, scale: 1.01 }}
                  className={`group relative overflow-hidden rounded-2xl text-left ${sizeClass(demo.size)}`}
                  style={{
                    border: `2px solid ${isActive ? theme.coral : theme.line}`,
                    boxShadow: isActive ? `0 20px 50px ${theme.shadow}` : `0 4px 20px ${theme.shadow}`,
                  }}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <CoverImg
                    src={demo.coverImage}
                    seed={demo.imageSeed}
                    gradient={demo.gradient}
                    alt={demo.title}
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(45,42,50,0.92) 0%, rgba(45,42,50,0.2) 55%, transparent 100%)' }}
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase text-white"
                      style={{ background: theme.indigo }}
                    >
                      {demoTypeLabel(demo.demoType)}
                    </span>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase text-white"
                        style={{ background: theme.coral }}
                      >
                        Featured
                      </motion.span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.sage }}>
                      {safeText(demo.sector, 'Cross-sector')}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-white sm:text-lg">
                      {safeText(demo.title, 'Untitled demo')}
                    </h3>
                    <p className="mt-1 text-xs text-white/80">
                      {safeText(demo.builder)} · {safeText(demo.shipped)}
                    </p>
                    <div className="mt-2 flex gap-3 text-xs text-white/70">
                      {safeNum(demo.viewers) > 0 && <span>{safeNum(demo.viewers).toLocaleString()} views</span>}
                      {safeNum(demo.likes) > 0 && <span>♥ {safeNum(demo.likes).toLocaleString()}</span>}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Detail spotlight */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.section
              key={active.id}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="mt-10 overflow-hidden rounded-3xl border"
              style={{ background: theme.surface, borderColor: theme.line, boxShadow: `0 24px 60px ${theme.shadow}` }}
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative min-h-[220px] lg:min-h-[360px]">
                  {trim(active.previewVideoId) ? (
                    <>
                      <CoverImg
                        src={active.coverImage}
                        seed={active.imageSeed}
                        gradient={active.gradient}
                        alt={active.title}
                        className="absolute inset-0 opacity-30"
                      />
                      <iframe
                        title={safeText(active.title, 'Demo preview')}
                        src={youtubeEmbed(active.previewVideoId)}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        loading="lazy"
                      />
                    </>
                  ) : (
                    <CoverImg src={active.coverImage} seed={active.imageSeed} gradient={active.gradient} alt={active.title} />
                  )}
                </div>

                <div className="flex min-w-0 flex-col p-5 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold uppercase text-white"
                      style={{ background: theme.indigo }}
                    >
                      {demoTypeLabel(active.demoType)}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: theme.sageSoft, color: theme.sage }}
                    >
                      {safeText(active.sector)}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
                    {safeText(active.title, 'Demo')}
                  </h2>
                  <p className="mt-1 text-sm font-medium" style={{ color: theme.coral }}>
                    by {safeText(active.builder, 'Guild builder')}
                    {safeText(active.builderRole) && ` · ${safeText(active.builderRole)}`}
                  </p>

                  <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
                    {safeText(active.description, 'Community demo description.')}
                  </p>

                  {safeText(active.highlight) && (
                    <div
                      className="mt-4 rounded-xl border-l-4 p-4"
                      style={{ borderColor: theme.coral, background: theme.coralSoft }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.coral }}>
                        Highlight
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed">{safeText(active.highlight)}</p>
                    </div>
                  )}

                  {safeList(active.stack).length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {safeList(active.stack).map((s, i) => (
                        <span
                          key={`${s}-${i}`}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium"
                          style={{ background: theme.indigoSoft, color: theme.indigo }}
                        >
                          {safeText(s)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-4 text-sm" style={{ color: theme.muted }}>
                    {safeNum(active.viewers) > 0 && (
                      <span><strong style={{ color: theme.ink }}>{safeNum(active.viewers).toLocaleString()}</strong> views</span>
                    )}
                    {safeNum(active.likes) > 0 && (
                      <span><strong style={{ color: theme.ink }}>{safeNum(active.likes).toLocaleString()}</strong> likes</span>
                    )}
                    {safeText(active.shipped) && <span>Shipped {safeText(active.shipped)}</span>}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    {actions.map((a) => (
                      <motion.button
                        key={a.id}
                        type="button"
                        whileHover={reduced ? undefined : { scale: 1.04, y: -2 }}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        className="whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold"
                        style={
                          a.primary
                            ? { background: theme.coral, color: '#FFFFFF', boxShadow: `0 6px 20px ${theme.coralSoft}` }
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
      </div>
    </div>
  )
}
