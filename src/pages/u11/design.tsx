import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  accentGlow?: string
  surface?: string
  node?: string
}

interface LatticeBadge {
  text?: string
  pulse?: boolean
}

interface LatticeMetric {
  value?: string
  unit?: string
  label?: string
}

interface LatticeNode {
  id: string
  icon?: string
  tag?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: LatticeMetric
  x?: number
  y?: number
}

interface SynapseLatticeData {
  badge?: LatticeBadge
  eyebrow?: string
  heading?: string
  headingAccent?: string
  defaultActive?: string
  autoPulse?: boolean
  autoPulseMs?: number
  nodes?: LatticeNode[]
}

interface DesignPageData {
  theme?: ThemeData
  synapseLattice?: SynapseLatticeData
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

const DEFAULT_POSITIONS: { x: number; y: number }[] = [
  { x: 30, y: 20 },
  { x: 70, y: 20 },
  { x: 85, y: 50 },
  { x: 70, y: 80 },
  { x: 30, y: 80 },
  { x: 15, y: 50 },
]

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeNodes(nodes?: LatticeNode[]): LatticeNode[] {
  return (nodes ?? []).filter((n): n is LatticeNode => Boolean(trim(n?.id)))
}

function resolveDefault(nodes: LatticeNode[], preferred?: string): string {
  const id = trim(preferred)
  if (id && nodes.some((n) => n.id === id)) return id
  return nodes[0]?.id ?? ''
}

function nodeLabel(node?: LatticeNode | null): string {
  return trim(node?.tag) || trim(node?.title) || trim(node?.id) || 'Node'
}

function nodeAlt(node?: LatticeNode | null): string {
  return trim(node?.alt) || trim(node?.title) || nodeLabel(node)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'synapse'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 6200): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 2500)
}

function safeCoord(value?: number | null, fallback = 50): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(5, Math.min(value, 95))
}

function splitHeadline(headline: string, accent?: string) {
  if (!accent) return { before: headline, accent: '', after: '' }
  const index = headline.toLowerCase().indexOf(accent.toLowerCase())
  if (index === -1) return { before: headline, accent: '', after: '' }
  return {
    before: headline.slice(0, index),
    accent: headline.slice(index, index + accent.length),
    after: headline.slice(index + accent.length),
  }
}

function nodePosition(node: LatticeNode, index: number) {
  const fallback = DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length] ?? { x: 50, y: 50 }
  return {
    x: safeCoord(node.x, fallback.x),
    y: safeCoord(node.y, fallback.y),
  }
}

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w < 640) return 'mobile'
    if (w < 1024) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 640) setBp('mobile')
      else if (w < 1024) setBp('tablet')
      else setBp('desktop')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return bp
}

/* ─── Icons ─── */

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ─── Hex clip path ─── */

function HexShape({
  size,
  accent,
  accentSecondary,
  nodeBg,
  isActive,
  reduceMotion,
}: {
  size: number
  accent: string
  accentSecondary: string
  nodeBg: string
  isActive: boolean
  reduceMotion: boolean
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="absolute inset-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accentSecondary} />
        </linearGradient>
      </defs>
      <motion.polygon
        points="50,4 96,27 96,73 50,96 4,73 4,27"
        fill={isActive ? 'url(#hexGrad)' : nodeBg}
        stroke={isActive ? accent : 'rgba(255,255,255,0.12)'}
        strokeWidth={isActive ? 2.5 : 1.5}
        animate={
          reduceMotion
            ? undefined
            : isActive
              ? { opacity: [0.85, 1, 0.85] }
              : { opacity: 1 }
        }
        transition={isActive ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    </svg>
  )
}

/* ─── Synapse lines ─── */

function SynapseLines({
  nodes,
  activeId,
  accent,
  accentSecondary,
  reduceMotion,
}: {
  nodes: LatticeNode[]
  activeId: string
  accent: string
  accentSecondary: string
  reduceMotion: boolean
}) {
  const activeIndex = nodes.findIndex((n) => n.id === activeId)
  if (activeIndex === -1) return null

  const activePos = nodePosition(nodes[activeIndex]!, activeIndex)

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.1" />
          <stop offset="50%" stopColor={accentSecondary} stopOpacity="0.7" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {nodes.map((node, i) => {
        if (node.id === activeId) return null
        const pos = nodePosition(node, i)
        const isNeighbor =
          Math.abs(i - activeIndex) === 1 ||
          Math.abs(i - activeIndex) === nodes.length - 1

        return (
          <g key={node.id}>
            <motion.line
              x1={activePos.x}
              y1={activePos.y}
              x2={pos.x}
              y2={pos.y}
              stroke="url(#lineGrad)"
              strokeWidth={isNeighbor ? 0.35 : 0.2}
              strokeDasharray={isNeighbor ? '2 1.5' : '1 2'}
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isNeighbor ? 0.85 : 0.35 }}
              transition={{ duration: 0.6, ease }}
            />
            {!reduceMotion && isNeighbor && (
              <motion.circle
                r="0.6"
                fill={accentSecondary}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  cx: [activePos.x, pos.x],
                  cy: [activePos.y, pos.y],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.15,
                }}
              />
            )}
          </g>
        )
      })}

      {/* Hub ring */}
      <motion.circle
        cx={activePos.x}
        cy={activePos.y}
        r="8"
        fill="none"
        stroke={accent}
        strokeWidth="0.25"
        strokeOpacity="0.4"
        initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.15, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: `${activePos.x}% ${activePos.y}%` }}
      />
    </svg>
  )
}

/* ─── Lattice node button ─── */

function LatticeNodeButton({
  node,
  index,
  isActive,
  onSelect,
  accent,
  accentSecondary,
  nodeBg,
  reduceMotion,
  size,
}: {
  node: LatticeNode
  index: number
  isActive: boolean
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  nodeBg: string
  reduceMotion: boolean
  size: number
}) {
  const pos = nodePosition(node, index)
  const icon = trim(node.icon) || '◆'
  const label = nodeLabel(node)

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(node.id)}
      className="absolute z-10 flex items-center justify-center"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.1 }}
      whileTap={{ scale: 0.94 }}
      animate={isActive ? { scale: 1.12 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      aria-current={isActive ? 'true' : undefined}
      aria-label={label}
    >
      <HexShape
        size={size}
        accent={accent}
        accentSecondary={accentSecondary}
        nodeBg={nodeBg}
        isActive={isActive}
        reduceMotion={reduceMotion}
      />

      <span
        className="relative z-10 flex flex-col items-center gap-0.5"
        style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' }}
      >
        <span className="text-base leading-none sm:text-lg">{icon}</span>
        <span className="max-w-[4.5rem] truncate text-[8px] font-semibold uppercase tracking-wide sm:max-w-[5.5rem] sm:text-[9px]">
          {label}
        </span>
      </span>

      {isActive && !reduceMotion && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 24px ${accent}66` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      )}
    </motion.button>
  )
}

/* ─── Lattice canvas ─── */

function LatticeCanvas({
  nodes,
  activeId,
  onSelect,
  accent,
  accentSecondary,
  nodeBg,
  reduceMotion,
  bp,
}: {
  nodes: LatticeNode[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  nodeBg: string
  reduceMotion: boolean
  bp: Breakpoint
}) {
  const nodeSize = bp === 'mobile' ? 64 : bp === 'tablet' ? 72 : 80

  return (
    <div
      className="relative mx-auto w-full"
      style={{ height: bp === 'mobile' ? 280 : bp === 'tablet' ? 320 : 360 }}
    >
      {/* Grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, ${accent}18 0%, transparent 55%),
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }}
        aria-hidden
      />

      <SynapseLines
        nodes={nodes}
        activeId={activeId}
        accent={accent}
        accentSecondary={accentSecondary}
        reduceMotion={reduceMotion}
      />

      {nodes.map((node, i) => (
        <LatticeNodeButton
          key={node.id}
          node={node}
          index={i}
          isActive={node.id === activeId}
          onSelect={onSelect}
          accent={accent}
          accentSecondary={accentSecondary}
          nodeBg={nodeBg}
          reduceMotion={reduceMotion}
          size={nodeSize}
        />
      ))}
    </div>
  )
}

/* ─── Mobile swipe card ─── */

function MobileNodeCard({
  node,
  accent,
  accentSecondary,
  panelBg,
  reduceMotion,
}: {
  node: LatticeNode
  accent: string
  accentSecondary: string
  panelBg: string
  reduceMotion: boolean
}) {
  const img = trim(node.image) || imageFallback(node.id)
  const title = trim(node.title) || nodeLabel(node)
  const tag = trim(node.tag)
  const icon = trim(node.icon)

  return (
    <motion.div
      className="overflow-hidden rounded-2xl border border-white/10"
      style={{ background: panelBg }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={img}
          alt={nodeAlt(node)}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = imageFallback(node.id)
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${panelBg}ee 0%, transparent 60%)`,
          }}
        />
        {icon && (
          <span
            className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-lg"
            style={{ background: `${accent}33`, color: accentSecondary }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="p-4">
        {tag && (
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: accentSecondary }}
          >
            {tag}
          </span>
        )}
        <h3 className="mt-1 text-base font-bold text-white">{title}</h3>
      </div>
    </motion.div>
  )
}

/* ─── Node detail panel ─── */

function NodeDetail({
  node,
  accent,
  accentSecondary,
  panelBg,
  reduceMotion,
}: {
  node: LatticeNode
  accent: string
  accentSecondary: string
  panelBg: string
  reduceMotion: boolean
}) {
  const img = trim(node.image) || imageFallback(node.id)
  const title = trim(node.title) || nodeLabel(node)
  const description = trim(node.description)
  const tag = trim(node.tag)
  const link = trim(node.link)
  const icon = trim(node.icon)
  const metric = node.metric
  const metricValue = trim(metric?.value)
  const metricUnit = trim(metric?.unit)
  const metricLabel = trim(metric?.label)

  return (
    <motion.article
      className="overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl"
      style={{ background: panelBg }}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease }}
      whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.18)' }}
    >
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[220px]">
          <motion.img
            key={img}
            src={img}
            alt={nodeAlt(node)}
            className="h-full w-full object-cover"
            loading="lazy"
            initial={reduceMotion ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, ease }}
            onError={(e) => {
              e.currentTarget.src = imageFallback(node.id)
            }}
          />
          <div
            className="absolute inset-0 md:hidden"
            style={{
              background: `linear-gradient(to top, ${panelBg} 0%, transparent 50%)`,
            }}
          />
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-6 md:p-7">
          <div className="flex items-start gap-3">
            {icon && (
              <motion.span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg sm:h-11 sm:w-11"
                style={{
                  background: `linear-gradient(135deg, ${accent}44, ${accentSecondary}33)`,
                  color: accentSecondary,
                }}
                whileHover={reduceMotion ? undefined : { rotate: 8, scale: 1.05 }}
              >
                {icon}
              </motion.span>
            )}
            <div className="min-w-0 flex-1">
              {tag && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs"
                  style={{ color: accentSecondary }}
                >
                  {tag}
                </span>
              )}
              <h3 className="mt-0.5 text-lg font-bold leading-snug text-white sm:text-xl">
                {title}
              </h3>
            </div>
          </div>

          {description && (
            <p className="mt-3 text-sm leading-relaxed text-white/55 sm:mt-4 sm:text-[15px]">
              {description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-5">
            {metricValue && (
              <motion.div
                className="rounded-xl border border-white/10 px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                whileHover={reduceMotion ? undefined : { scale: 1.03, borderColor: `${accent}55` }}
              >
                <p className="text-xl font-bold tabular-nums text-white sm:text-2xl">
                  {metricValue}
                  {metricUnit && (
                    <span className="ml-0.5 text-sm font-medium text-white/50">{metricUnit}</span>
                  )}
                </p>
                {metricLabel && (
                  <p className="text-[10px] uppercase tracking-wide text-white/40 sm:text-xs">
                    {metricLabel}
                  </p>
                )}
              </motion.div>
            )}

            {link && (
              <motion.a
                href={link}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accentSecondary})`,
                }}
                whileHover={reduceMotion ? undefined : { scale: 1.04, boxShadow: `0 8px 28px ${accent}44` }}
                whileTap={{ scale: 0.97 }}
              >
                Explore
                <ArrowIcon />
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

/* ─── Node pills ─── */

function NodePills({
  nodes,
  activeId,
  onSelect,
  accent,
  reduceMotion,
}: {
  nodes: LatticeNode[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  reduceMotion: boolean
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {nodes.map((node) => {
        const isActive = node.id === activeId
        return (
          <motion.button
            key={node.id}
            type="button"
            onClick={() => onSelect(node.id)}
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm"
            style={{
              borderColor: isActive ? `${accent}88` : 'rgba(255,255,255,0.1)',
              background: isActive ? `${accent}28` : 'rgba(255,255,255,0.04)',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
            }}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            aria-current={isActive ? 'true' : undefined}
          >
            {nodeLabel(node)}
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Main: SynapseLattice ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const theme = data?.theme ?? {}
  const lattice = data?.synapseLattice ?? {}

  const accent = safeColor(theme.accent, '#A855F7')
  const accentSecondary = safeColor(theme.accentSecondary, '#84CC16')
  const accentGlow = safeColor(theme.accentGlow, 'rgba(168, 85, 247, 0.32)')
  const surface = safeColor(theme.surface, '#0C0C14')
  const nodeBg = safeColor(theme.node, '#16161F')

  const nodes = safeNodes(lattice.nodes)
  const defaultId = resolveDefault(nodes, lattice.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)

  const autoPulse = lattice.autoPulse !== false
  const pulseMs = safeMs(lattice.autoPulseMs, 6200)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(0, nodes.findIndex((n) => n.id === activeId))
  const activeNode = nodes[activeIndex] ?? nodes[0] ?? null

  useEffect(() => {
    setActiveId((current) =>
      nodes.some((n) => n.id === current) ? current : defaultId,
    )
  }, [nodes, defaultId])

  const goTo = useCallback(
    (index: number) => {
      if (!nodes.length) return
      const safe = ((index % nodes.length) + nodes.length) % nodes.length
      const next = nodes[safe]
      if (next?.id) setActiveId(next.id)
    },
    [nodes],
  )

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  const selectNode = useCallback(
    (id: string) => {
      if (!trim(id) || !nodes.some((n) => n.id === id)) return
      setActiveId(id)
    },
    [nodes],
  )

  useEffect(() => {
    if (!autoPulse || paused || nodes.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(goNext, pulseMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, autoPulse, nodes.length, goNext, paused, reduceMotion, pulseMs])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!isMobile) return
    if (info.offset.x < -50) goNext()
    else if (info.offset.x > 50) goPrev()
  }

  const badgeText = trim(lattice.badge?.text)
  const showPulse = lattice.badge?.pulse !== false
  const eyebrow = trim(lattice.eyebrow)
  const heading = trim(lattice.heading)
  const headingParts = splitHeadline(heading, trim(lattice.headingAccent))

  if (!nodes.length) {
    return (
      <section
        className="flex min-h-[50vh] items-center justify-center px-4"
        style={{ background: surface }}
      >
        <p className="text-sm text-white/50">No content available.</p>
      </section>
    )
  }

  return (
    <section
      className="relative w-full overflow-x-hidden px-3 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16 lg:px-14 lg:py-20"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 55% 45% at 50% 35%, ${accentGlow} 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl">
        <motion.header
          className="mb-6 text-center sm:mb-8 md:mb-10"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          {badgeText && (
            <motion.div
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/75 sm:px-4 sm:py-2 sm:text-sm"
              whileHover={reduceMotion ? undefined : { scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              {showPulse && (
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                    style={{ background: accentSecondary }}
                  />
                  <span
                    className="relative h-2 w-2 rounded-full"
                    style={{ background: accentSecondary }}
                  />
                </span>
              )}
              {badgeText}
            </motion.div>
          )}

          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 sm:text-xs">
              {eyebrow}
            </p>
          )}

          {heading && (
            <h1 className="mt-2 text-xl font-bold leading-tight sm:text-2xl md:text-3xl lg:text-4xl">
              {headingParts.before}
              {headingParts.accent ? (
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${accent}, ${accentSecondary})`,
                  }}
                >
                  {headingParts.accent}
                </span>
              ) : null}
              {headingParts.after}
            </h1>
          )}
        </motion.header>

        {/* Single SynapseLattice component */}
        <motion.div
          className="rounded-2xl border border-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.14)' }}
        >
          {isMobile ? (
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              className="mb-5"
            >
              {activeNode && (
                <MobileNodeCard
                  node={activeNode}
                  accent={accent}
                  accentSecondary={accentSecondary}
                  panelBg={nodeBg}
                  reduceMotion={reduceMotion}
                />
              )}
              <p className="mt-2 text-center text-[10px] text-white/30">Swipe to pulse next node</p>
            </motion.div>
          ) : (
            <div className="mb-5 sm:mb-6">
              <LatticeCanvas
                nodes={nodes}
                activeId={activeId}
                onSelect={selectNode}
                accent={accent}
                accentSecondary={accentSecondary}
                nodeBg={nodeBg}
                reduceMotion={reduceMotion}
                bp={bp}
              />
            </div>
          )}

          <div className="mb-4 flex items-center justify-center gap-3 sm:mb-5">
            <motion.button
              type="button"
              onClick={goPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous node"
            >
              <ChevronIcon dir="left" />
            </motion.button>

            <span className="text-xs tabular-nums text-white/35">
              {activeIndex + 1} / {nodes.length}
            </span>

            <motion.button
              type="button"
              onClick={goNext}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next node"
            >
              <ChevronIcon dir="right" />
            </motion.button>
          </div>

          <NodePills
            nodes={nodes}
            activeId={activeId}
            onSelect={selectNode}
            accent={accent}
            reduceMotion={reduceMotion}
          />

          <div className="mt-5 sm:mt-6 md:mt-8">
            <AnimatePresence mode="wait">
              {activeNode && (
                <NodeDetail
                  key={activeNode.id}
                  node={activeNode}
                  accent={accent}
                  accentSecondary={accentSecondary}
                  panelBg={nodeBg}
                  reduceMotion={reduceMotion}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
