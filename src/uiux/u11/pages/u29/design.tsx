import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  leather?: string
  leatherDark?: string
  page?: string
  pageAlt?: string
  ink?: string
  muted?: string
  line?: string
  stampRed?: string
  stampRedSoft?: string
  stampBlue?: string
  stampBlueSoft?: string
  stampGreen?: string
  stampGold?: string
  shadow?: string
}

interface TierFilter {
  id: string
  label?: string
}

interface HeroConfig {
  heroImage?: string
  videoId?: string
  gradient?: string[]
  overlay?: number
}

interface Stamp {
  id: string
  code?: string
  title?: string
  sector?: string
  tier?: string
  issuer?: string
  earnedGlobally?: number
  duration?: string
  coverImage?: string
  imageSeed?: number
  color?: string
  skills?: string[]
  requirement?: string
  unlocks?: string
}

interface PassportMetric {
  id: string
  value?: string
  label?: string
}

interface PassportFeature {
  id: string
  title?: string
  detail?: string
}

interface PassportAction {
  id: string
  label?: string
  primary?: boolean
}

interface GuildPassportData {
  eyebrow?: string
  title?: string
  subtitle?: string
  stampsIssued?: number
  holdersActive?: number
  defaultActive?: string
  autoTurn?: boolean
  autoTurnMs?: number
  hero?: HeroConfig
  tierFilters?: TierFilter[]
  stamps?: Stamp[]
  metrics?: PassportMetric[]
  features?: PassportFeature[]
  actions?: PassportAction[]
}

interface DesignPageData {
  theme?: ThemeData
  guildPassport?: GuildPassportData
}

/* ─── Helpers ─── */

const trim = (v?: string | null): string => (typeof v === 'string' ? v.trim() : '')

const safeText = (v?: string | null, fb = ''): string => trim(v) || fb

const safeNum = (v?: number | null, fb = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fb

const safeList = <T,>(arr?: T[] | null): T[] => (Array.isArray(arr) ? arr : [])

const picsum = (w: number, h: number, seed = 2): string =>
  `https://picsum.photos/${w}/${h}?random=${seed}`

const tierLabel = (t?: string): string => {
  const v = trim(t).toLowerCase()
  if (v === 'gold') return 'Gold'
  if (v === 'silver') return 'Silver'
  if (v === 'bronze') return 'Bronze'
  return safeText(t, 'Stamp')
}

const tierRing = (t?: string, theme?: ThemeData): string => {
  const v = trim(t).toLowerCase()
  if (v === 'gold') return theme?.stampGold ?? '#B8860B'
  if (v === 'silver') return theme?.muted ?? '#7A6558'
  return theme?.stampRed ?? '#C41E3A'
}

const youtubeEmbed = (id?: string): string => {
  const vid = trim(id)
  if (!vid) return ''
  const p = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', controls: '0', playsinline: '1', rel: '0', playlist: vid })
  return `https://www.youtube-nocookie.com/embed/${vid}?${p}`
}

/* ─── Stamp seal ─── */

function StampSeal({
  stamp,
  isActive,
  onClick,
  theme,
  reduced,
}: {
  stamp: Stamp
  isActive: boolean
  onClick: () => void
  theme: ThemeData
  reduced: boolean
}) {
  const ring = tierRing(stamp.tier, theme)
  const color = trim(stamp.color) || theme.stampBlue || '#1E4D8C'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduced ? undefined : { scale: 1.08, rotate: isActive ? 0 : 3 }}
      whileTap={reduced ? undefined : { scale: 0.95 }}
      className="relative flex flex-col items-center"
      aria-current={isActive ? 'true' : undefined}
      aria-label={safeText(stamp.title)}
    >
      <div
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] sm:h-20 sm:w-20"
        style={{
          borderColor: ring,
          background: isActive ? `${color}22` : theme.pageAlt,
          boxShadow: isActive ? `0 4px 16px ${theme.shadow}` : 'none',
          transform: `rotate(${isActive ? 0 : -6 + (safeNum(stamp.imageSeed) % 12)}deg)`,
        }}
      >
        <div
          className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full border-2 border-dashed sm:h-16 sm:w-16"
          style={{ borderColor: color, color }}
        >
          <span className="text-[9px] font-black leading-none tracking-tighter sm:text-[10px]">
            {safeText(stamp.code, 'GUILD')}
          </span>
        </div>
        {isActive && (
          <motion.span
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full"
            style={{ background: theme.stampGreen }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <p className="mt-1.5 max-w-[80px] line-clamp-2 text-center text-[10px] font-semibold leading-tight" style={{ color: theme.ink }}>
        {safeText(stamp.title)}
      </p>
    </motion.button>
  )
}

/* ─── Main ─── */

export default function Design() {
  const reduced = useReducedMotion()
  const data = pageData as DesignPageData
  const theme = data.theme ?? {}
  const passport = data.guildPassport ?? {}

  const stamps = useMemo(() => safeList(passport.stamps), [passport.stamps])
  const filters = useMemo(() => safeList(passport.tierFilters), [passport.tierFilters])
  const metrics = useMemo(() => safeList(passport.metrics), [passport.metrics])
  const features = useMemo(() => safeList(passport.features), [passport.features])
  const actions = useMemo(() => safeList(passport.actions), [passport.actions])

  const defaultId = useMemo(() => {
    const d = trim(passport.defaultActive)
    if (d && stamps.some((s) => s.id === d)) return d
    return stamps[0]?.id ?? ''
  }, [passport.defaultActive, stamps])

  const [activeId, setActiveId] = useState(defaultId)
  const [tierFilter, setTierFilter] = useState('all')
  const pausedRef = useRef(false)

  const filtered = useMemo(() => {
    if (tierFilter === 'all') return stamps
    return stamps.filter((s) => trim(s.tier).toLowerCase() === tierFilter)
  }, [stamps, tierFilter])

  const active = useMemo(
    () => stamps.find((s) => s.id === activeId) ?? stamps[0],
    [stamps, activeId],
  )

  const selectStamp = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
    window.setTimeout(() => { pausedRef.current = false }, 12000)
  }, [])

  useEffect(() => {
    if (!passport.autoTurn || reduced || pausedRef.current) return
    const pool = filtered.length > 0 ? filtered : stamps
    if (pool.length < 2) return
    const ms = safeNum(passport.autoTurnMs, 6500)
    const timer = setInterval(() => {
      if (pausedRef.current) return
      setActiveId((prev) => {
        const i = pool.findIndex((s) => s.id === prev)
        return pool[(i + 1) % pool.length]?.id ?? prev
      })
    }, ms)
    return () => clearInterval(timer)
  }, [passport.autoTurn, passport.autoTurnMs, filtered, stamps, reduced])

  useEffect(() => {
    if (filtered.length && !filtered.some((s) => s.id === activeId)) {
      setActiveId(filtered[0]?.id ?? '')
    }
  }, [filtered, activeId])

  const heroImg = trim(passport.hero?.heroImage) || picsum(1920, 900, 201)

  return (
    <div
      className="min-h-screen w-full break-words [overflow-wrap:anywhere]"
      style={{ background: theme.leatherDark ?? '#3D2817', color: theme.ink ?? '#2C1810' }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden py-10 sm:py-14">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" aria-hidden />
        {trim(passport.hero?.videoId) && (
          <iframe
            title="Ambient"
            src={youtubeEmbed(passport.hero?.videoId)}
            className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-12"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden
          />
        )}
        <div className="absolute inset-0" style={{ background: 'rgba(61,40,23,0.75)' }} />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: theme.page }}>
              {safeText(passport.eyebrow, 'Credential passport')}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl" style={{ color: theme.page }}>
              {safeText(passport.title, 'Collect stamps. Prove you shipped.')}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: theme.pageAlt }}>
              {safeText(passport.subtitle, 'Micro-credentials across every sector for the whole guild community.')}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {metrics.map((m, i) => (
                <div
                  key={m.id || i}
                  className="rounded-lg px-4 py-2"
                  style={{ background: 'rgba(245,230,211,0.15)', border: `1px solid ${theme.line}` }}
                >
                  <span className="font-bold" style={{ color: theme.page }}>{safeText(m.value, '—')}</span>
                  <span className="ml-2 text-xs" style={{ color: theme.pageAlt }}>{safeText(m.label)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {/* Tier filters */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {filters.map((f) => {
            const id = trim(f.id) || 'all'
            const on = tierFilter === id
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => setTierFilter(id)}
                whileHover={reduced ? undefined : { scale: 1.04 }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: on ? theme.page : 'transparent',
                  color: on ? theme.ink : theme.page,
                  border: `1px solid ${theme.page}`,
                }}
              >
                {safeText(f.label, id)}
              </motion.button>
            )
          })}
        </div>

        {/* Open passport booklet */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: theme.leather ?? '#5C3D2E',
            boxShadow: `0 24px 60px ${theme.shadow}`,
          }}
        >
          <div className="border-b px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.4em]" style={{ borderColor: theme.leatherDark, color: theme.pageAlt }}>
            Guild Passport · Community Credentials
          </div>

          <div className="grid lg:grid-cols-2">
            {/* Left page — stamp grid */}
            <div
              className="border-b p-5 sm:p-6 lg:border-b-0 lg:border-r"
              style={{ background: theme.page, borderColor: theme.line }}
            >
              <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: theme.muted }}>
                Visa stamps · {filtered.length}
              </p>
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: theme.muted }}>No stamps in this tier.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
                  {filtered.map((s) => (
                    <StampSeal
                      key={s.id}
                      stamp={s}
                      isActive={s.id === activeId}
                      onClick={() => selectStamp(s.id)}
                      theme={theme}
                      reduced={!!reduced}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right page — stamp detail */}
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id}
                  initial={reduced ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? undefined : { opacity: 0, x: -8 }}
                  className="flex min-w-0 flex-col p-5 sm:p-6"
                  style={{ background: theme.pageAlt }}
                >
                  <div className="mb-4 overflow-hidden rounded-xl">
                    <img
                      src={trim(active.coverImage) || picsum(500, 500, safeNum(active.imageSeed, 202))}
                      alt={safeText(active.title)}
                      className="h-32 w-full object-cover sm:h-36"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = picsum(500, 500, safeNum(active.imageSeed, 202))
                      }}
                    />
                  </div>

                  <span
                    className="inline-block w-fit rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                    style={{ background: tierRing(active.tier, theme) }}
                  >
                    {tierLabel(active.tier)}
                  </span>
                  <h2 className="mt-2 text-xl font-bold leading-snug">{safeText(active.title)}</h2>
                  <p className="mt-1 text-sm font-medium" style={{ color: trim(active.color) || theme.stampBlue }}>
                    {safeText(active.sector)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: theme.muted }}>
                    Issued by {safeText(active.issuer)} · {safeText(active.duration)}
                  </p>

                  <div className="mt-4 rounded-lg border p-3" style={{ borderColor: theme.line, background: theme.page }}>
                    <p className="text-[10px] font-bold uppercase" style={{ color: theme.stampRed }}>Requirement</p>
                    <p className="mt-1 text-sm leading-relaxed">{safeText(active.requirement)}</p>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase" style={{ color: theme.stampBlue }}>Unlocks</p>
                    <p className="mt-1 text-sm">{safeText(active.unlocks)}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {safeList(active.skills).map((sk, i) => (
                      <span
                        key={`${sk}-${i}`}
                        className="rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{ background: theme.stampBlueSoft, color: theme.stampBlue }}
                      >
                        {safeText(sk)}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-xs" style={{ color: theme.muted }}>
                    {safeNum(active.earnedGlobally).toLocaleString()} guild members earned this stamp
                  </p>

                  <div className="mt-auto flex flex-wrap gap-3 pt-5">
                    {actions.map((a) => (
                      <motion.button
                        key={a.id}
                        type="button"
                        whileHover={reduced ? undefined : { scale: 1.04 }}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        className="rounded-full px-5 py-2.5 text-sm font-semibold"
                        style={
                          a.primary
                            ? { background: theme.stampRed, color: '#FFFFFF' }
                            : { background: 'transparent', border: `1.5px solid ${theme.line}`, color: theme.ink }
                        }
                      >
                        {safeText(a.label, 'Action')}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Features */}
        <section className="mt-12">
          <h2 className="text-xl font-bold" style={{ color: theme.page }}>Why the passport matters</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.id || i}
                whileHover={reduced ? undefined : { y: -3 }}
                className="rounded-xl border p-5"
                style={{ background: theme.page, borderColor: theme.line }}
              >
                <h3 className="font-bold" style={{ color: theme.stampRed }}>{safeText(f.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.muted }}>{safeText(f.detail)}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
