import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  surface?: string
}

interface OrbitNode {
  id: string
  label?: string
  icon?: string
  title?: string
  description?: string
  metric?: { value?: string; label?: string }
  image?: string
  alt?: string
}

interface OrbitData {
  label?: string
  sublabel?: string
  heading?: string
  subheading?: string
  defaultActive?: string
  nodes?: OrbitNode[]
}

interface DesignPageData {
  theme?: ThemeData
  orbit?: OrbitData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease, staggerChildren: 0.08, delayChildren: 0.06 },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease } },
}

const panelItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
}

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeNodes(nodes?: OrbitNode[]): OrbitNode[] {
  return (nodes ?? []).filter((node): node is OrbitNode => Boolean(trim(node?.id)))
}

function resolveDefaultActive(nodes: OrbitNode[], preferred?: string): string {
  const id = trim(preferred)
  if (id && nodes.some((node) => node.id === id)) return id
  return nodes[0]?.id ?? ''
}

function nodeLabel(node?: OrbitNode): string {
  return trim(node?.label) || trim(node?.title) || trim(node?.id) || 'Capability'
}

function nodeImageAlt(node?: OrbitNode): string {
  return trim(node?.alt) || trim(node?.title) || nodeLabel(node)
}

function imageFallback(id: string): string {
  const safeId = trim(id) || 'orbit'
  return `https://picsum.photos/seed/${safeId}/1200/800`
}

/* ─── Responsive hook ─── */

function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('mobile')
      else if (width < 1024) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return breakpoint
}

/* ─── Mobile / tablet chip navigator ─── */

function NodeChips({
  nodes,
  activeId,
  onSelect,
  accent,
  accentSecondary,
}: {
  nodes: OrbitNode[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
}) {
  return (
    <div className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-min gap-2 sm:gap-3">
        {nodes.map((node, index) => {
          const isActive = node.id === activeId
          const label = nodeLabel(node)

          return (
            <motion.button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium sm:px-4 sm:py-2.5"
              style={{
                borderColor: isActive ? `${accent}88` : 'rgba(255,255,255,0.12)',
                background: isActive
                  ? `linear-gradient(135deg, ${accent}33, ${accentSecondary}22)`
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                boxShadow: isActive ? `0 4px 20px ${accent}33` : 'none',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35, ease }}
              whileHover={{
                scale: 1.04,
                borderColor: `${accent}66`,
                color: '#fff',
                transition: { duration: 0.2, ease },
              }}
              whileTap={{ scale: 0.97 }}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`${label} capability`}
            >
              {trim(node.icon) && (
                <span className="text-base leading-none" aria-hidden>
                  {node.icon}
                </span>
              )}
              <span>{label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Orbital navigator (desktop / large tablet) ─── */

function OrbitNavigator({
  nodes,
  activeId,
  onSelect,
  accent,
  accentSecondary,
  centerLabel,
  centerSublabel,
  size,
  reduceMotion,
}: {
  nodes: OrbitNode[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  centerLabel: string
  centerSublabel: string
  size: number
  reduceMotion: boolean
}) {
  const count = Math.max(nodes.length, 1)
  const radius = size * 0.39
  const centerSize = size * 0.34

  return (
    <motion.div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size }}
      whileHover={reduceMotion ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.35, ease }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border border-white/10"
        initial={{ scale: 0.85, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
        whileHover={
          reduceMotion
            ? undefined
            : { borderColor: 'rgba(255,255,255,0.22)', transition: { duration: 0.25 } }
        }
      />

      <motion.div
        className="absolute rounded-full border border-dashed border-white/5"
        style={{ inset: size * 0.04 }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center rounded-full border border-white/15 bg-white/5 text-center backdrop-blur-md"
        style={{ width: centerSize, height: centerSize }}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.05,
                borderColor: 'rgba(255,255,255,0.28)',
                boxShadow: `0 0 32px ${accent}33`,
                transition: { duration: 0.3, ease },
              }
        }
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)` }}
          animate={reduceMotion ? undefined : { scale: [1, 1.12, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {centerSublabel && (
          <span className="relative px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/50 sm:text-[10px]">
            {centerSublabel}
          </span>
        )}
        {centerLabel && (
          <span className="relative mt-0.5 px-2 text-[11px] font-semibold leading-tight text-white sm:text-xs">
            {centerLabel}
          </span>
        )}
      </motion.div>

      {nodes.map((node, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const isActive = node.id === activeId
        const label = nodeLabel(node)
        const nodeSize = size < 300 ? 40 : size < 340 ? 44 : 52

        return (
          <motion.button
            key={node.id}
            type="button"
            onClick={() => onSelect(node.id)}
            className="absolute z-20 flex flex-col items-center gap-1"
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, x: '-50%', y: '-50%' }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 + i * 0.07, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={
              reduceMotion
                ? undefined
                : { scale: 1.12, y: -4, transition: { duration: 0.22, ease } }
            }
            whileTap={{ scale: 0.94 }}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`${label} capability`}
          >
            <motion.span
              className="flex items-center justify-center rounded-full"
              style={{
                width: nodeSize,
                height: nodeSize,
                fontSize: nodeSize * 0.38,
                background: isActive
                  ? `linear-gradient(135deg, ${accent}, ${accentSecondary})`
                  : 'rgba(255,255,255,0.08)',
                boxShadow: isActive ? `0 0 24px ${accent}66` : 'none',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.12)',
              }}
              animate={
                isActive && !reduceMotion
                  ? { boxShadow: [`0 0 16px ${accent}44`, `0 0 28px ${accent}88`, `0 0 16px ${accent}44`] }
                  : undefined
              }
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      boxShadow: `0 0 28px ${accent}88`,
                      borderColor: 'rgba(255,255,255,0.35)',
                    }
              }
            >
              {trim(node.icon) || '●'}
            </motion.span>
            <motion.span
              className={`max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:max-w-none sm:text-[11px] ${
                isActive ? 'text-white' : 'text-white/50'
              }`}
              whileHover={reduceMotion ? undefined : { color: '#fff', y: -1 }}
            >
              {label}
            </motion.span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

/* ─── Content panel ─── */

function OrbitPanel({
  node,
  accent,
  accentSecondary,
  reduceMotion,
}: {
  node: OrbitNode
  accent: string
  accentSecondary: string
  reduceMotion: boolean
}) {
  const fallback = imageFallback(node.id)
  const imageUrl = trim(node.image) || fallback
  const [src, setSrc] = useState(imageUrl)
  const metricValue = trim(node.metric?.value)
  const metricLabel = trim(node.metric?.label)
  const title = trim(node.title)
  const description = trim(node.description)
  const label = nodeLabel(node)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  return (
    <motion.div
      key={node.id}
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10"
    >
      <motion.div
        variants={panelItemVariants}
        className="group relative overflow-hidden rounded-xl sm:rounded-2xl"
        whileHover={
          reduceMotion
            ? undefined
            : {
                y: -4,
                boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                transition: { duration: 0.35, ease },
              }
        }
      >
        <motion.img
          src={src}
          alt={nodeImageAlt(node)}
          className="aspect-[4/3] h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setSrc((current) => (current === fallback ? current : fallback))}
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          transition={{ duration: 0.55, ease }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/75" />

        {metricValue && (
          <motion.div
            className="absolute bottom-3 left-3 rounded-lg border border-white/20 bg-black/55 px-3 py-2.5 backdrop-blur-md sm:bottom-4 sm:left-4 sm:rounded-xl sm:px-4 sm:py-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease }}
            whileHover={
              reduceMotion
                ? undefined
                : { scale: 1.05, borderColor: 'rgba(255,255,255,0.4)', y: -2 }
            }
          >
            <p className="text-xl font-bold text-white sm:text-2xl">{metricValue}</p>
            {metricLabel && <p className="text-[11px] text-white/70 sm:text-xs">{metricLabel}</p>}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        variants={panelItemVariants}
        className="flex flex-col justify-center rounded-xl border border-transparent px-0 py-1 sm:rounded-2xl sm:px-2 sm:py-2"
        whileHover={
          reduceMotion
            ? undefined
            : {
                borderColor: 'rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                transition: { duration: 0.3 },
              }
        }
      >
        {label && (
          <motion.span
            className="mb-2 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider sm:mb-3 sm:text-xs"
            style={{ background: `${accent}18`, color: accent }}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.03,
                    backgroundColor: `${accent}28`,
                    transition: { duration: 0.2 },
                  }
            }
          >
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent }}
              animate={reduceMotion ? undefined : { scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {label}
          </motion.span>
        )}

        {title && (
          <motion.h3
            className="text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl"
            whileHover={reduceMotion ? undefined : { x: 2, color: 'rgba(255,255,255,0.95)' }}
            transition={{ duration: 0.25 }}
          >
            {title}
          </motion.h3>
        )}

        {description && (
          <motion.p
            className="mt-3 text-sm leading-relaxed text-white/60 sm:mt-4 sm:text-base"
            whileHover={reduceMotion ? undefined : { color: 'rgba(255,255,255,0.78)' }}
            transition={{ duration: 0.25 }}
          >
            {description}
          </motion.p>
        )}

        <motion.div
          className="mt-5 hidden h-px w-12 origin-left sm:mt-6 sm:block"
          style={{ background: `linear-gradient(90deg, ${accent}, ${accentSecondary})` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
          whileHover={reduceMotion ? undefined : { width: 64, transition: { duration: 0.3 } }}
        />
      </motion.div>
    </motion.div>
  )
}

/* ─── Main ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const breakpoint = useBreakpoint()

  const theme = data?.theme ?? {}
  const orbit = data?.orbit ?? {}

  const accent = trim(theme.accent) || '#FF000F'
  const accentSecondary = trim(theme.accentSecondary) || '#00D4AA'
  const surface = trim(theme.surface) || '#0A0F1C'

  const orbitNodes = safeNodes(orbit.nodes)
  const defaultOrbitId = resolveDefaultActive(orbitNodes, orbit.defaultActive)
  const [activeOrbitId, setActiveOrbitId] = useState(defaultOrbitId)

  useEffect(() => {
    setActiveOrbitId((current) =>
      orbitNodes.some((node) => node.id === current) ? current : defaultOrbitId,
    )
  }, [defaultOrbitId, orbitNodes])

  const activeNode =
    orbitNodes.find((node) => node.id === activeOrbitId) ?? orbitNodes[0] ?? null

  const centerLabel = trim(orbit.label) || 'Core'
  const centerSublabel = trim(orbit.sublabel) || 'Select'
  const subheading = trim(orbit.subheading)
  const heading = trim(orbit.heading)

  const orbitSize =
    breakpoint === 'mobile' ? 0 : breakpoint === 'tablet' ? 300 : 380

  const handleSelect = useCallback((id: string) => {
    if (!trim(id)) return
    setActiveOrbitId(id)
  }, [])

  if (!orbitNodes.length) {
    return (
      <section
        className="flex min-h-[50vh] items-center justify-center px-4 sm:px-6"
        style={{ background: surface }}
      >
        <p className="text-base text-white/50 sm:text-lg">No content available.</p>
      </section>
    )
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: surface, color: '#fff' }}>
      <section
        id="orbit"
        className="relative px-4 py-12 sm:px-6 sm:py-16 md:px-10 lg:px-16 lg:py-24 xl:py-28"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="mx-auto w-full max-w-7xl">
          {(subheading || heading) && (
            <motion.header
              className="mb-8 text-center sm:mb-10 lg:mb-14"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease }}
            >
              {subheading && (
                <motion.p
                  className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35 sm:text-xs sm:tracking-[0.25em]"
                  whileHover={reduceMotion ? undefined : { color: 'rgba(255,255,255,0.55)', letterSpacing: '0.28em' }}
                  transition={{ duration: 0.3 }}
                >
                  {subheading}
                </motion.p>
              )}
              {heading && (
                <motion.h2
                  className="mt-2 text-xl font-bold leading-snug text-white sm:mt-3 sm:text-2xl md:text-3xl lg:text-4xl"
                  whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                  transition={{ duration: 0.25, ease }}
                >
                  {heading}
                </motion.h2>
              )}
            </motion.header>
          )}

          {/* Mobile & tablet: horizontal chips */}
          {breakpoint !== 'desktop' && (
            <div className="mb-6 sm:mb-8">
              <NodeChips
                nodes={orbitNodes}
                activeId={activeOrbitId}
                onSelect={handleSelect}
                accent={accent}
                accentSecondary={accentSecondary}
              />
            </div>
          )}

          <div
            className={`grid items-center gap-8 sm:gap-10 ${
              breakpoint === 'desktop'
                ? 'lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-12 xl:gap-16'
                : 'grid-cols-1'
            }`}
          >
            {/* Orbit ring — hidden on mobile, shown tablet+ */}
            {breakpoint !== 'mobile' && orbitSize > 0 && (
              <div className="flex justify-center lg:justify-center">
                <OrbitNavigator
                  nodes={orbitNodes}
                  activeId={activeOrbitId}
                  onSelect={handleSelect}
                  accent={accent}
                  accentSecondary={accentSecondary}
                  centerLabel={centerLabel}
                  centerSublabel={centerSublabel}
                  size={orbitSize}
                  reduceMotion={reduceMotion}
                />
              </div>
            )}

            <motion.div
              className="min-h-[260px] w-full sm:min-h-[300px] lg:min-h-[340px]"
              layout
              transition={{ duration: 0.4, ease }}
            >
              <AnimatePresence mode="wait">
                {activeNode && (
                  <OrbitPanel
                    key={activeNode.id}
                    node={activeNode}
                    accent={accent}
                    accentSecondary={accentSecondary}
                    reduceMotion={reduceMotion}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
