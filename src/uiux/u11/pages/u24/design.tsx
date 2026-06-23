import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  night?: string
  deep?: string
  surface?: string
  card?: string
  ink?: string
  muted?: string
  line?: string
  gold?: string
  goldSoft?: string
  mint?: string
  mintSoft?: string
  coral?: string
  coralSoft?: string
  shadow?: string
}

interface DifficultyFilter {
  id: string
  label?: string
}

interface HeroConfig {
  heroImage?: string
  videoId?: string
  gradient?: string[]
  overlay?: number
}

interface PlaybookStep {
  title?: string
  detail?: string
}

interface Playbook {
  id: string
  title?: string
  sector?: string
  format?: string
  difficulty?: string
  curator?: string
  curatorRole?: string
  duration?: string
  completions?: number
  rating?: number
  coverImage?: string
  imageSeed?: number
  gradient?: string[]
  outcome?: string
  summary?: string
  tools?: string[]
  steps?: PlaybookStep[]
}

interface ForgeMetric {
  id: string
  value?: string
  label?: string
}

interface ForgeAction {
  id: string
  label?: string
  primary?: boolean
}

interface PlaybookForgeData {
  eyebrow?: string
  title?: string
  subtitle?: string
  pathsCompleted?: number
  activePaths?: number
  defaultActive?: string
  autoAdvance?: boolean
  autoAdvanceMs?: number
  hero?: HeroConfig
  difficultyFilters?: DifficultyFilter[]
  playbooks?: Playbook[]
  metrics?: ForgeMetric[]
  actions?: ForgeAction[]
}

interface DesignPageData {
  theme?: ThemeData
  playbookForge?: PlaybookForgeData
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

const picsum = (w: number, h: number, seed = 2): string =>
  `https://picsum.photos/${w}/${h}?random=${seed}`

const buildGradient = (colors?: string[], fallback = ['#0A1628', '#1C2D45']): string => {
  const list = safeList(colors).filter(Boolean)
  return `linear-gradient(135deg, ${(list.length >= 2 ? list : fallback).join(', ')})`
}

const capitalize = (v?: string): string => {
  const t = trim(v)
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

const formatLabel = (f?: string): string => {
  const v = trim(f).toLowerCase()
  const map: Record<string, string> = { guide: 'Guide', checklist: 'Checklist', sprint: 'Sprint' }
  return map[v] ?? (capitalize(v) || 'Playbook')
}

const difficultyColor = (d?: string, theme?: ThemeData): string => {
  const v = trim(d).toLowerCase()
  if (v === 'beginner') return theme?.mint ?? '#3ECFAD'
  if (v === 'advanced') return theme?.coral ?? '#FF6B6B'
  return theme?.gold ?? '#F5B942'
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

function CoverImg({
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
  const fallback = picsum(700, 480, safeNum(seed, 52))
  const url = attempt === 0 ? primary || fallback : attempt === 1 ? fallback : ''

  if (!url || attempt > 1) {
    return <div className={`h-full w-full ${className}`} style={{ background: buildGradient(gradient) }} />
  }

  return (
    <img
      src={url}
      alt={safeText(alt, 'Playbook cover')}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
      onError={() => setAttempt((n) => n + 1)}
    />
  )
}

function HeroBackdrop({ hero, theme }: { hero?: HeroConfig; theme: ThemeData }) {
  const [fail, setFail] = useState(false)
  const img = fail ? picsum(1920, 900, 51) : trim(hero?.heroImage) || picsum(1920, 900, 51)
  const vid = trim(hero?.videoId)

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFail(true)} />
      {vid && (
        <iframe
          title="Ambient"
          src={youtubeEmbed(vid)}
          className="absolute inset-0 h-full w-full border-0 opacity-25"
          allow="autoplay; encrypted-media"
          tabIndex={-1}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: buildGradient(safeList(hero?.gradient).length ? hero?.gradient : undefined),
          opacity: hero?.overlay ?? 0.68,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, transparent 20%, ${theme.night ?? '#0A1628'} 95%)`,
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
  const forge = data.playbookForge ?? {}

  const playbooks = useMemo(() => safeList(forge.playbooks), [forge.playbooks])
  const filters = useMemo(() => safeList(forge.difficultyFilters), [forge.difficultyFilters])
  const metrics = useMemo(() => safeList(forge.metrics), [forge.metrics])
  const actions = useMemo(() => safeList(forge.actions), [forge.actions])

  const defaultId = useMemo(() => {
    const d = trim(forge.defaultActive)
    if (d && playbooks.some((p) => p.id === d)) return d
    return playbooks[0]?.id ?? ''
  }, [forge.defaultActive, playbooks])

  const [activeId, setActiveId] = useState(defaultId)
  const [diffFilter, setDiffFilter] = useState('all')
  const pausedRef = useRef(false)

  const filtered = useMemo(() => {
    if (diffFilter === 'all') return playbooks
    return playbooks.filter((p) => trim(p.difficulty).toLowerCase() === diffFilter)
  }, [playbooks, diffFilter])

  const active = useMemo(
    () => playbooks.find((p) => p.id === activeId) ?? playbooks[0],
    [playbooks, activeId],
  )

  const selectPlaybook = useCallback((id: string) => {
    pausedRef.current = true
    setActiveId(id)
    window.setTimeout(() => { pausedRef.current = false }, 14000)
  }, [])

  useEffect(() => {
    if (!forge.autoAdvance || reduced || pausedRef.current) return
    const pool = filtered.length > 0 ? filtered : playbooks
    if (pool.length < 2) return
    const ms = safeNum(forge.autoAdvanceMs, 7200)
    const timer = setInterval(() => {
      if (pausedRef.current) return
      setActiveId((prev) => {
        const i = pool.findIndex((p) => p.id === prev)
        return pool[(i + 1) % pool.length]?.id ?? prev
      })
    }, ms)
    return () => clearInterval(timer)
  }, [forge.autoAdvance, forge.autoAdvanceMs, filtered, playbooks, reduced])

  useEffect(() => {
    if (filtered.length && !filtered.some((p) => p.id === activeId)) {
      setActiveId(filtered[0]?.id ?? '')
    }
  }, [filtered, activeId])

  const pathsCompleted = safeNum(forge.pathsCompleted)
  const activePaths = safeNum(forge.activePaths)

  return (
    <div
      className="min-h-screen w-full break-words [overflow-wrap:anywhere]"
      style={{ background: theme.night ?? '#0A1628', color: theme.ink ?? '#F0F4FA' }}
    >
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-10 pt-16 sm:pb-14 sm:pt-20">
        <HeroBackdrop hero={forge.hero} theme={theme} />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: theme.gold }}>
              {safeText(forge.eyebrow, 'Guild playbooks')}
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {safeText(forge.title, 'Follow paths others have already proven.')}
            </h1>
            <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: theme.muted }}>
              {safeText(
                forge.subtitle,
                'Step-by-step playbooks tested by students, coders, professionals, and educators across every sector.',
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
              {activePaths > 0 && (
                <span className="rounded-full px-3 py-1.5" style={{ background: theme.goldSoft, color: theme.gold }}>
                  {activePaths.toLocaleString()} active paths
                </span>
              )}
              {pathsCompleted > 0 && (
                <span className="rounded-full px-3 py-1.5" style={{ background: theme.mintSoft, color: theme.mint }}>
                  {pathsCompleted.toLocaleString()} completed
                </span>
              )}
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.id || i}
                  whileHover={reduced ? undefined : { y: -3 }}
                  className="min-w-0 rounded-xl border px-4 py-3 sm:min-w-[110px]"
                  style={{ background: theme.surface, borderColor: theme.line }}
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

      {/* ── Filters ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {filters.map((f) => {
            const id = trim(f.id) || 'all'
            const on = diffFilter === id
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => setDiffFilter(id)}
                whileHover={reduced ? undefined : { scale: 1.04 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className="rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: on ? theme.gold : theme.surface,
                  color: on ? theme.night : theme.ink,
                  border: `1px solid ${on ? theme.gold : theme.line}`,
                }}
              >
                {safeText(f.label, id)}
              </motion.button>
            )
          })}
        </div>

        {/* ── Zigzag timeline ── */}
        <div className="relative pb-8">
          <div
            className="absolute left-4 top-0 hidden h-full w-0.5 sm:left-1/2 sm:block sm:-translate-x-px"
            style={{ background: `linear-gradient(to bottom, ${theme.gold}, ${theme.mint}, ${theme.line})` }}
            aria-hidden
          />

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: theme.muted }}>
              No playbooks match this level. Try another filter.
            </p>
          ) : (
            filtered.map((pb, index) => {
              const isActive = pb.id === activeId
              const isLeft = index % 2 === 0
              const dColor = difficultyColor(pb.difficulty, theme)

              return (
                <motion.div
                  key={pb.id}
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.04 }}
                  className={`relative mb-10 flex sm:mb-14 ${isLeft ? 'sm:justify-start' : 'sm:justify-end'}`}
                >
                  <div
                    className="absolute left-4 top-8 z-10 hidden h-4 w-4 rounded-full border-2 sm:left-1/2 sm:block sm:-translate-x-1/2"
                    style={{
                      borderColor: isActive ? theme.gold : theme.line,
                      background: isActive ? theme.gold : theme.deep,
                      boxShadow: isActive ? `0 0 16px ${theme.goldSoft}` : 'none',
                    }}
                    aria-hidden
                  />

                  <motion.button
                    type="button"
                    onClick={() => selectPlaybook(pb.id)}
                    whileHover={reduced ? undefined : { scale: 1.02, y: -4 }}
                    className="relative w-full text-left sm:w-[calc(50%-2.5rem)]"
                    style={{
                      marginLeft: isLeft ? 0 : undefined,
                      marginRight: isLeft ? undefined : 0,
                    }}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <div
                      className="overflow-hidden rounded-2xl border transition-shadow"
                      style={{
                        background: theme.card,
                        borderColor: isActive ? theme.gold : theme.line,
                        boxShadow: isActive ? `0 16px 48px ${theme.shadow}` : `0 4px 20px ${theme.shadow}`,
                      }}
                    >
                      <div className="relative h-36 overflow-hidden sm:h-40">
                        <CoverImg
                          src={pb.coverImage}
                          alt={pb.title}
                          seed={pb.imageSeed}
                          gradient={pb.gradient}
                          className="transition-transform duration-500 hover:scale-105"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.9), transparent 50%)' }}
                        />
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                            style={{ background: dColor }}
                          >
                            {capitalize(pb.difficulty) || 'Open'}
                          </span>
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{ background: theme.goldSoft, color: theme.gold }}
                          >
                            {formatLabel(pb.format)}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.mint }}>
                          {safeText(pb.sector, 'Cross-sector')}
                        </p>
                        <h3 className="mt-1 text-base font-bold leading-snug sm:text-lg">
                          {safeText(pb.title, 'Untitled playbook')}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed sm:text-sm" style={{ color: theme.muted }}>
                          {safeText(pb.summary)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: theme.muted }}>
                          <span>{safeText(pb.duration)}</span>
                          {safeNum(pb.rating) > 0 && (
                            <span style={{ color: theme.gold }}>★ {pb.rating}</span>
                          )}
                          {safeNum(pb.completions) > 0 && (
                            <span>{safeNum(pb.completions).toLocaleString()} completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              )
            })
          )}
        </div>

        {/* ── Active playbook detail (step path) ── */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.section
              key={active.id}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="mb-14 overflow-hidden rounded-3xl border"
              style={{ background: theme.surface, borderColor: theme.line, boxShadow: `0 24px 60px ${theme.shadow}` }}
            >
              <div className="grid lg:grid-cols-2">
                <div className="relative min-h-[200px] lg:min-h-full">
                  <CoverImg src={active.coverImage} alt={active.title} seed={active.imageSeed} gradient={active.gradient} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.85), transparent 40%)' }} />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.gold }}>
                      Outcome
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-snug sm:text-base">
                      {safeText(active.outcome, 'Ship a validated result by the end of this path.')}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col p-5 sm:p-7">
                  <h2 className="text-xl font-bold leading-snug sm:text-2xl">
                    {safeText(active.title, 'Playbook')}
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: theme.muted }}>
                    Curated by {safeText(active.curator, 'Guild')}{' '}
                    {safeText(active.curatorRole) && `· ${safeText(active.curatorRole)}`}
                  </p>

                  <div className="mt-6">
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: theme.mint }}>
                      Step path
                    </p>
                    <ol className="space-y-4">
                      {safeList(active.steps).map((step, i) => (
                        <motion.li
                          key={`${step.title}-${i}`}
                          initial={reduced ? false : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08 + i * 0.1 }}
                          className="flex gap-4"
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                            style={{ background: theme.goldSoft, color: theme.gold }}
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold leading-snug">{safeText(step.title, `Step ${i + 1}`)}</p>
                            <p className="mt-1 text-sm leading-relaxed" style={{ color: theme.muted }}>
                              {safeText(step.detail)}
                            </p>
                          </div>
                        </motion.li>
                      ))}
                    </ol>
                  </div>

                  {safeList(active.tools).length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {safeList(active.tools).map((tool, i) => (
                        <span
                          key={`${tool}-${i}`}
                          className="rounded-lg px-2.5 py-1 text-xs font-medium"
                          style={{ background: theme.mintSoft, color: theme.mint }}
                        >
                          {safeText(tool)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    {actions.map((a) => (
                      <motion.button
                        key={a.id}
                        type="button"
                        whileHover={reduced ? undefined : { scale: 1.04, y: -2 }}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold"
                        style={
                          a.primary
                            ? { background: theme.gold, color: theme.night, boxShadow: `0 6px 20px ${theme.goldSoft}` }
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
