import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type PanInfo,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  accentGlow?: string
  surface?: string
  panel?: string
}

interface ScopeBadge {
  text?: string
  pulse?: boolean
}

interface ScopeMetric {
  value?: string
  unit?: string
  label?: string
}

interface ScopeLayer {
  id: string
  tag?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: ScopeMetric
  position?: number
}

interface MeridianScopeData {
  badge?: ScopeBadge
  eyebrow?: string
  heading?: string
  headingAccent?: string
  defaultActive?: string
  autoDrift?: boolean
  autoDriftMs?: number
  hint?: string
  layers?: ScopeLayer[]
}

interface DesignPageData {
  theme?: ThemeData
  meridianScope?: MeridianScopeData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeLayers(layers?: ScopeLayer[]): ScopeLayer[] {
  return (layers ?? []).filter((l): l is ScopeLayer => Boolean(trim(l?.id)))
}

function resolveDefault(layers: ScopeLayer[], preferred?: string): string {
  const id = trim(preferred)
  if (id && layers.some((l) => l.id === id)) return id
  return layers[0]?.id ?? ''
}

function layerLabel(layer?: ScopeLayer | null): string {
  return trim(layer?.tag) || trim(layer?.title) || trim(layer?.id) || 'Layer'
}

function layerAlt(layer?: ScopeLayer | null): string {
  return trim(layer?.alt) || trim(layer?.title) || layerLabel(layer)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'meridian'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 6500): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 2500)
}

function safePosition(value?: number | null, index = 0, total = 1): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return Math.max(0, Math.min(value, 100))
  }
  if (total <= 1) return 50
  return (index / (total - 1)) * 100
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

function layerPositions(layers: ScopeLayer[]): number[] {
  return layers.map((l, i) => safePosition(l.position, i, layers.length))
}

function nearestIndex(positions: number[], value: number): number {
  if (!positions.length) return 0
  let best = 0
  let minDist = Infinity
  positions.forEach((p, i) => {
    const d = Math.abs(p - value)
    if (d < minDist) {
      minDist = d
      best = i
    }
  })
  return best
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

function DragIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ─── Crossfade viewport images ─── */

function ScopeImageLayer({
  layer,
  target,
  progress,
  layerCount,
  mouseX,
  mouseY,
  isDragging,
  reduceMotion,
}: {
  layer: ScopeLayer
  target: number
  progress: ReturnType<typeof useSpring>
  layerCount: number
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  isDragging: boolean
  reduceMotion: boolean
}) {
  const img = trim(layer.image) || imageFallback(layer.id)
  const opacity = useTransform(progress, (v) => {
    const dist = Math.abs(v - target)
    const maxDist = layerCount > 1 ? 100 / (layerCount - 1) : 100
    return Math.max(0, 1 - dist / (maxDist * 0.85))
  })

  const parallaxX = useTransform(mouseX, [0, 100], reduceMotion ? [0, 0] : [-18, 18])
  const parallaxY = useTransform(mouseY, [0, 100], reduceMotion ? [0, 0] : [-12, 12])
  const scale = useTransform(progress, (v) => {
    const dist = Math.abs(v - target)
    const maxDist = layerCount > 1 ? 100 / (layerCount - 1) : 100
    const t = Math.max(0, 1 - dist / (maxDist * 0.85))
    const dragBoost = isDragging ? 0.04 : 0
    return 1.06 + t * 0.06 + dragBoost
  })

  return (
    <motion.img
      src={img}
      alt={layerAlt(layer)}
      className="absolute inset-0 h-full w-full object-cover"
      style={{
        opacity,
        x: parallaxX,
        y: parallaxY,
        scale,
      }}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = imageFallback(layer.id)
      }}
    />
  )
}

function CursorSpotlight({
  mouseX,
  mouseY,
  accent,
  isDragging,
  reduceMotion,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  accent: string
  isDragging: boolean
  reduceMotion: boolean
}) {
  if (reduceMotion) return null

  const left = useTransform(mouseX, (v) => `${v}%`)
  const top = useTransform(mouseY, (v) => `${v}%`)
  const size = isDragging ? 220 : 160

  return (
    <motion.div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left,
        top,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
      }}
      animate={{ opacity: isDragging ? 0.9 : 0.55 }}
      transition={{ duration: 0.25 }}
      aria-hidden
    />
  )
}

function ScopeHUD({
  currentPct,
  activeLayer,
  accent,
  accentSecondary,
  isDragging,
  reduceMotion,
}: {
  currentPct: number
  activeLayer: ScopeLayer | null
  accent: string
  accentSecondary: string
  isDragging: boolean
  reduceMotion: boolean
}) {
  const tag = activeLayer ? layerLabel(activeLayer) : '—'

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-col gap-2 sm:left-4 sm:top-4">
      <motion.div
        className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-md sm:px-4 sm:py-2.5"
        animate={isDragging && !reduceMotion ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.8, repeat: isDragging ? Infinity : 0 }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 sm:text-[10px]">
          Meridian depth
        </p>
        <p className="text-lg font-bold tabular-nums sm:text-xl" style={{ color: accent }}>
          {currentPct}%
        </p>
      </motion.div>

      <motion.div
        className="rounded-xl border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-md sm:px-4 sm:py-2.5"
        initial={false}
        animate={{ borderColor: isDragging ? `${accent}66` : 'rgba(255,255,255,0.1)' }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 sm:text-[10px]">
          Active layer
        </p>
        <p className="text-sm font-semibold text-white sm:text-base">{tag}</p>
        {isDragging && !reduceMotion && (
          <motion.span
            className="mt-1 inline-block text-[10px] font-bold uppercase tracking-widest"
            style={{ color: accentSecondary }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            Scanning…
          </motion.span>
        )}
      </motion.div>
    </div>
  )
}

function ScopeImages({
  layers,
  positions,
  progress,
  panelBg,
  mouseX,
  mouseY,
  isDragging,
  reduceMotion,
}: {
  layers: ScopeLayer[]
  positions: number[]
  progress: ReturnType<typeof useSpring>
  panelBg: string
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  isDragging: boolean
  reduceMotion: boolean
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {layers.map((layer, i) => (
        <ScopeImageLayer
          key={layer.id}
          layer={layer}
          target={positions[i] ?? 50}
          progress={progress}
          layerCount={layers.length}
          mouseX={mouseX}
          mouseY={mouseY}
          isDragging={isDragging}
          reduceMotion={reduceMotion}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${panelBg}cc 0%, transparent 18%, transparent 82%, ${panelBg}cc 100%),
            linear-gradient(to top, ${panelBg}ee 0%, transparent 45%)`,
        }}
        aria-hidden
      />
    </div>
  )
}

/* ─── Meridian line + handle ─── */

function MeridianHandle({
  progress,
  accent,
  accentSecondary,
  reduceMotion,
  isDragging,
  onDrag,
  onDragEnd,
  onDragStart,
  containerRef,
}: {
  progress: ReturnType<typeof useSpring>
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  isDragging: boolean
  onDrag: (pct: number) => void
  onDragEnd: () => void
  onDragStart: () => void
  containerRef: RefObject<HTMLDivElement | null>
}) {
  const left = useTransform(progress, (v) => `${v}%`)

  const handleDrag = (_: unknown, info: PanInfo) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = info.point.x - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    onDrag(pct)
  }

  return (
    <motion.div
      className="pointer-events-none absolute inset-y-0 z-20"
      style={{ left }}
    >
      {/* Pulse rings when dragging */}
      {isDragging && !reduceMotion && (
        <>
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{ borderColor: `${accent}55` }}
              initial={{ width: 48, height: 48, opacity: 0.6 }}
              animate={{ width: 48 + ring * 36, height: 48 + ring * 36, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, delay: ring * 0.25, ease: 'easeOut' }}
              aria-hidden
            />
          ))}
        </>
      )}

      {/* Vertical beam */}
      <motion.div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2"
        style={{
          width: isDragging ? 3 : 1,
          background: `linear-gradient(to bottom, transparent, ${accent}, ${accentSecondary}, transparent)`,
          boxShadow: `0 0 ${isDragging ? 32 : 20}px ${accent}88, 0 0 ${isDragging ? 56 : 40}px ${accentSecondary}44`,
        }}
        animate={reduceMotion ? undefined : { opacity: isDragging ? 1 : [0.7, 1, 0.7] }}
        transition={{ duration: isDragging ? 0.2 : 2.2, repeat: isDragging ? 0 : Infinity, ease: 'easeInOut' }}
      />

      {/* Draggable handle */}
      <motion.div
        className="pointer-events-auto absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center active:cursor-grabbing"
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDrag={handleDrag}
        onDragEnd={onDragEnd}
        whileHover={reduceMotion ? undefined : { scale: 1.1 }}
        whileTap={{ scale: 0.94 }}
        animate={isDragging ? { scale: 1.14 } : { scale: 1 }}
        aria-label="Drag meridian scope"
      >
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 sm:h-14 sm:w-14"
          style={{
            borderColor: accent,
            background: `linear-gradient(135deg, ${accent}55, ${accentSecondary}44)`,
            boxShadow: `0 0 ${isDragging ? 36 : 24}px ${accent}${isDragging ? '88' : '55'}`,
            color: '#fff',
          }}
          animate={isDragging && !reduceMotion ? { rotate: [0, 8, -8, 0] } : { rotate: 0 }}
          transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0, repeatDelay: 0.2 }}
        >
          <DragIcon />
        </motion.div>
        <div
          className="mt-1 h-3 w-3 rotate-45 border-b-2 border-r-2"
          style={{ borderColor: accent }}
          aria-hidden
        />
      </motion.div>
    </motion.div>
  )
}

/* ─── Scope viewport ─── */

function TrackTick({
  layer,
  pos,
  accent,
  accentSecondary,
  isActive,
  reduceMotion,
  onSelect,
}: {
  layer: ScopeLayer
  pos: number
  accent: string
  accentSecondary: string
  isActive: boolean
  reduceMotion: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const label = layerLabel(layer)
  const title = trim(layer.title) || label

  return (
    <div
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pos}%` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && !reduceMotion && (
          <motion.div
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/80 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm sm:text-xs"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        className="relative h-3.5 w-3.5 rounded-full border-2 sm:h-4 sm:w-4"
        style={{
          borderColor: isActive ? accentSecondary : accent,
          background: isActive ? accent : '#0F1419',
          boxShadow: isActive ? `0 0 12px ${accent}88` : undefined,
        }}
        whileHover={reduceMotion ? undefined : { scale: 1.45 }}
        whileTap={{ scale: 0.88 }}
        onClick={onSelect}
        aria-label={label}
        aria-current={isActive ? 'true' : undefined}
      />
    </div>
  )
}

function ScopeViewport({
  layers,
  positions,
  progress,
  rawProgress,
  activeLayer,
  accent,
  accentSecondary,
  panelBg,
  reduceMotion,
  isDragging,
  onDrag,
  onDragEnd,
  onDragStart,
  onTrackClick,
  currentPct,
}: {
  layers: ScopeLayer[]
  positions: number[]
  progress: ReturnType<typeof useSpring>
  rawProgress: ReturnType<typeof useMotionValue<number>>
  activeLayer: ScopeLayer | null
  accent: string
  accentSecondary: string
  panelBg: string
  reduceMotion: boolean
  isDragging: boolean
  currentPct: number
  onDrag: (pct: number) => void
  onDragEnd: () => void
  onDragStart: () => void
  onTrackClick: (pct: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(50)
  const mouseY = useMotionValue(50)
  const [scrubbing, setScrubbing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [cursorY, setCursorY] = useState(50)
  const dragging = isDragging || scrubbing

  const trackWidth = useTransform(progress, (v) => `${v}%`)

  const pctFromClientX = (clientX: number) => {
    const el = containerRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
  }

  const updateCursor = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
      mouseX.set(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
      mouseY.set(y)
      setCursorY(Math.round(y))
    },
    [mouseX, mouseY],
  )

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    setScrubbing(true)
    onDragStart()
    e.currentTarget.setPointerCapture(e.pointerId)
    onDrag(pctFromClientX(e.clientX))
    updateCursor(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    updateCursor(e.clientX, e.clientY)
    if (!scrubbing) return
    onDrag(pctFromClientX(e.clientX))
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return
    setScrubbing(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    onDragEnd()
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!hovered) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? 8 : -8
    const next = Math.max(0, Math.min(100, rawProgress.get() + delta))
    onDrag(next)
    onDragEnd()
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <motion.div
        ref={containerRef}
        data-scope-viewport
        className="relative aspect-[16/9] w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl"
        style={{ background: panelBg, cursor: scrubbing ? 'grabbing' : 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          setScrubbing(false)
          setHovered(false)
          mouseX.set(50)
          mouseY.set(50)
        }}
        onPointerEnter={() => setHovered(true)}
        onWheel={handleWheel}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={currentPct}
        aria-label="Security layer scope — drag, scroll, or use arrow keys"
        animate={
          reduceMotion
            ? undefined
            : { borderColor: dragging ? `${accent}55` : 'rgba(255,255,255,0.1)' }
        }
        whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.18)' }}
      >
        <ScopeImages
          layers={layers}
          positions={positions}
          progress={progress}
          panelBg={panelBg}
          mouseX={mouseX}
          mouseY={mouseY}
          isDragging={dragging}
          reduceMotion={reduceMotion}
        />

        <CursorSpotlight
          mouseX={mouseX}
          mouseY={mouseY}
          accent={accent}
          isDragging={dragging}
          reduceMotion={reduceMotion}
        />

        <ScopeHUD
          currentPct={currentPct}
          activeLayer={activeLayer}
          accent={accent}
          accentSecondary={accentSecondary}
          isDragging={dragging}
          reduceMotion={reduceMotion}
        />

        {/* Scan lines — speed up while dragging */}
        {!reduceMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: dragging ? 0.14 : 0.07,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.5) 3px, rgba(255,255,255,0.5) 4px)',
            }}
            animate={{ backgroundPositionY: ['0px', '8px'] }}
            transition={{ duration: dragging ? 0.6 : 1.5, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
        )}

        {/* Coordinate grid overlay on hover */}
        {hovered && !reduceMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
            aria-hidden
          />
        )}

        <MeridianHandle
          progress={progress}
          accent={accent}
          accentSecondary={accentSecondary}
          reduceMotion={reduceMotion}
          isDragging={dragging}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          containerRef={containerRef}
        />

        {/* Position markers on viewport */}
        {positions.map((pos, i) => {
          const layer = layers[i]
          if (!layer) return null
          const isNear = Math.abs(currentPct - pos) < 8
          return (
            <motion.button
              key={layer.id}
              type="button"
              className="absolute bottom-3 z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:bottom-4 sm:text-[10px]"
              style={{
                left: `${pos}%`,
                background: isNear ? `${accent}66` : 'rgba(0,0,0,0.5)',
                color: isNear ? '#fff' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${isNear ? accent : 'rgba(255,255,255,0.12)'}`,
              }}
              whileHover={reduceMotion ? undefined : { scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onTrackClick(pos)
              }}
            >
              {layerLabel(layer)}
            </motion.button>
          )
        })}

        {/* Bottom coordinate readout */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-30 rounded-lg border border-white/10 bg-black/45 px-2 py-1 text-[10px] tabular-nums text-white/50 backdrop-blur-sm sm:bottom-4 sm:right-4 sm:text-xs">
          X:{currentPct}% · Y:{cursorY}%
        </div>
      </motion.div>

      {/* Track rail — also draggable */}
      <motion.div
        className="relative h-3 cursor-pointer rounded-full bg-white/8 sm:h-3.5"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
          onTrackClick(pct)
        }}
        whileHover={reduceMotion ? undefined : { scaleY: 1.15 }}
        role="presentation"
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: trackWidth,
            background: `linear-gradient(90deg, ${accent}, ${accentSecondary})`,
            boxShadow: dragging ? `0 0 16px ${accent}66` : undefined,
          }}
        />
        {positions.map((pos, i) => {
          const layer = layers[i]
          if (!layer) return null
          const isActive = layer.id === activeLayer?.id
          return (
            <TrackTick
              key={layer.id}
              layer={layer}
              pos={pos}
              accent={accent}
              accentSecondary={accentSecondary}
              isActive={isActive}
              reduceMotion={reduceMotion}
              onSelect={() => onTrackClick(pos)}
            />
          )
        })}
      </motion.div>
    </div>
  )
}

/* ─── Layer detail panel ─── */

function LayerDetail({
  layer,
  accent,
  accentSecondary,
  panelBg,
  reduceMotion,
  index,
  total,
}: {
  layer: ScopeLayer
  accent: string
  accentSecondary: string
  panelBg: string
  reduceMotion: boolean
  index: number
  total: number
}) {
  const title = trim(layer.title) || layerLabel(layer)
  const description = trim(layer.description)
  const tag = trim(layer.tag)
  const link = trim(layer.link)
  const metric = layer.metric
  const metricValue = trim(metric?.value)
  const metricUnit = trim(metric?.unit)
  const metricLabel = trim(metric?.label)

  return (
    <motion.article
      className="overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl"
      style={{ background: panelBg }}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
      transition={{ duration: 0.38, ease }}
      whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.18)' }}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6 md:p-7">
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-start">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold sm:h-14 sm:w-14"
            style={{
              background: `linear-gradient(135deg, ${accent}44, ${accentSecondary}33)`,
              color: accent,
            }}
            whileHover={reduceMotion ? undefined : { rotate: -6, scale: 1.05 }}
          >
            {String(index + 1).padStart(2, '0')}
          </motion.div>
          <span className="text-xs tabular-nums text-white/30">
            {index + 1} / {total}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {tag && (
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em] sm:text-xs"
              style={{ color: accentSecondary }}
            >
              {tag}
            </span>
          )}
          <h3 className="mt-0.5 text-lg font-bold leading-snug text-white sm:text-xl md:text-2xl">
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-white/55 sm:mt-3 sm:text-[15px]">
              {description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-5">
            {metricValue && (
              <motion.div
                className="rounded-xl border border-white/10 px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                whileHover={reduceMotion ? undefined : { scale: 1.03, borderColor: `${accent}55` }}
              >
                <p className="text-xl font-bold tabular-nums text-white sm:text-2xl">
                  {metricValue}
                  {metricUnit && (
                    <span className="ml-1 text-sm font-medium text-white/50">{metricUnit}</span>
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
                Explore layer
                <ArrowIcon />
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

/* ─── Layer pills ─── */

function LayerPills({
  layers,
  activeId,
  onSelect,
  accent,
  accentSecondary,
  reduceMotion,
}: {
  layers: ScopeLayer[]
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  reduceMotion: boolean
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {layers.map((layer, i) => {
        const isActive = layer.id === activeId
        return (
          <motion.button
            key={layer.id}
            type="button"
            onClick={() => onSelect(layer.id)}
            className="group shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm"
            style={{
              borderColor: isActive ? `${accent}88` : 'rgba(255,255,255,0.1)',
              background: isActive ? `${accent}28` : 'rgba(255,255,255,0.04)',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
            }}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.06,
                    borderColor: `${accentSecondary}66`,
                    y: -2,
                  }
            }
            whileTap={{ scale: 0.97 }}
            aria-current={isActive ? 'true' : undefined}
            aria-keyshortcuts={`${i + 1}`}
          >
            <span className="flex items-center gap-1.5">
              {i < 9 && (
                <span
                  className="hidden rounded bg-white/10 px-1 py-0.5 text-[9px] tabular-nums text-white/35 group-hover:text-white/60 sm:inline"
                  style={{ color: isActive ? accentSecondary : undefined }}
                >
                  {i + 1}
                </span>
              )}
              {layerLabel(layer)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* ─── Main: MeridianScope ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false

  const theme = data?.theme ?? {}
  const scope = data?.meridianScope ?? {}

  const accent = safeColor(theme.accent, '#14B8A6')
  const accentSecondary = safeColor(theme.accentSecondary, '#FB7185')
  const accentGlow = safeColor(theme.accentGlow, 'rgba(20, 184, 166, 0.28)')
  const surface = safeColor(theme.surface, '#0F1419')
  const panelBg = safeColor(theme.panel, '#151C24')

  const layers = safeLayers(scope.layers)
  const positions = layerPositions(layers)
  const defaultId = resolveDefault(layers, scope.defaultActive)
  const defaultIndex = Math.max(0, layers.findIndex((l) => l.id === defaultId))
  const defaultPos = positions[defaultIndex] ?? 0

  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [currentPct, setCurrentPct] = useState(Math.round(defaultPos))
  const sectionRef = useRef<HTMLElement>(null)

  const rawProgress = useMotionValue(defaultPos)
  const progress = useSpring(rawProgress, {
    stiffness: reduceMotion ? 500 : 180,
    damping: reduceMotion ? 50 : 26,
  })

  const autoDrift = scope.autoDrift !== false
  const driftMs = safeMs(scope.autoDriftMs, 6500)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(0, layers.findIndex((l) => l.id === activeId))
  const activeLayer = layers[activeIndex] ?? layers[0] ?? null

  useEffect(() => {
    setActiveId((current) =>
      layers.some((l) => l.id === current) ? current : defaultId,
    )
  }, [layers, defaultId])

  useEffect(() => {
    const onProgress = (v: number) => {
      setCurrentPct(Math.round(v))
      const idx = nearestIndex(positions, v)
      const layer = layers[idx]
      if (layer?.id) setActiveId(layer.id)
    }
    const unsubSpring = progress.on('change', onProgress)
    const unsubRaw = rawProgress.on('change', onProgress)
    return () => {
      unsubSpring()
      unsubRaw()
    }
  }, [layers, positions, progress, rawProgress])

  const snapTo = useCallback(
    (pct: number) => {
      const idx = nearestIndex(positions, pct)
      const pos = positions[idx] ?? pct
      rawProgress.set(pos)
      const layer = layers[idx]
      if (layer?.id) setActiveId(layer.id)
    },
    [layers, positions, rawProgress],
  )

  const goToIndex = useCallback(
    (index: number) => {
      if (!layers.length) return
      const safe = ((index % layers.length) + layers.length) % layers.length
      const pos = positions[safe] ?? 0
      rawProgress.set(pos)
      const layer = layers[safe]
      if (layer?.id) setActiveId(layer.id)
    },
    [layers, positions, rawProgress],
  )

  const goNext = useCallback(() => goToIndex(activeIndex + 1), [activeIndex, goToIndex])
  const goPrev = useCallback(() => goToIndex(activeIndex - 1), [activeIndex, goToIndex])

  const selectLayer = useCallback(
    (id: string) => {
      const idx = layers.findIndex((l) => l.id === id)
      if (idx === -1) return
      goToIndex(idx)
    },
    [layers, goToIndex],
  )

  const handleDrag = useCallback(
    (pct: number) => {
      rawProgress.set(pct)
    },
    [rawProgress],
  )

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    setPaused(true)
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    snapTo(rawProgress.get())
  }, [rawProgress, snapTo])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goToIndex(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goToIndex(layers.length - 1)
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1
        if (idx < layers.length) {
          e.preventDefault()
          goToIndex(idx)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, goToIndex, layers.length])

  useEffect(() => {
    if (!autoDrift || paused || layers.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(goNext, driftMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, autoDrift, driftMs, goNext, layers.length, paused, reduceMotion])

  const badgeText = trim(scope.badge?.text)
  const showPulse = scope.badge?.pulse !== false
  const eyebrow = trim(scope.eyebrow)
  const heading = trim(scope.heading)
  const headingParts = splitHeadline(heading, trim(scope.headingAccent))
  const hint = trim(scope.hint)

  if (!layers.length) {
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
      ref={sectionRef}
      className="relative w-full overflow-x-hidden px-3 py-10 sm:px-6 sm:py-14 md:px-10 md:py-16 lg:px-14 lg:py-20"
      style={{ background: surface, color: '#fff' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false)
        setIsDragging(false)
      }}
      tabIndex={0}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 30%, ${accentGlow} 0%, transparent 70%)`,
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
                    style={{ background: accent }}
                  />
                  <span className="relative h-2 w-2 rounded-full" style={{ background: accent }} />
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

          {hint && (
            <motion.p
              className="mt-3 text-xs text-white/35 sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {hint}
            </motion.p>
          )}
        </motion.header>

        {/* Single MeridianScope component */}
        <motion.div
          className="rounded-2xl border border-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.14)' }}
        >
          <ScopeViewport
            layers={layers}
            positions={positions}
            progress={progress}
            rawProgress={rawProgress}
            activeLayer={activeLayer}
            accent={accent}
            accentSecondary={accentSecondary}
            panelBg={panelBg}
            reduceMotion={reduceMotion}
            isDragging={isDragging}
            currentPct={currentPct}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onTrackClick={snapTo}
          />

          <div className="mt-4 flex items-center justify-center gap-3 sm:mt-5">
            <motion.button
              type="button"
              onClick={goPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous layer"
            >
              <ChevronIcon dir="left" />
            </motion.button>

            <span className="text-xs tabular-nums text-white/35">
              {activeIndex + 1} / {layers.length}
            </span>

            <motion.button
              type="button"
              onClick={goNext}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next layer"
            >
              <ChevronIcon dir="right" />
            </motion.button>
          </div>

          <div className="mt-4 sm:mt-5">
            <LayerPills
              layers={layers}
              activeId={activeId}
              onSelect={selectLayer}
              accent={accent}
              accentSecondary={accentSecondary}
              reduceMotion={reduceMotion}
            />
          </div>

          <div className="mt-5 sm:mt-6 md:mt-8">
            <AnimatePresence mode="wait">
              {activeLayer && (
                <LayerDetail
                  key={activeLayer.id}
                  layer={activeLayer}
                  accent={accent}
                  accentSecondary={accentSecondary}
                  panelBg={panelBg}
                  reduceMotion={reduceMotion}
                  index={activeIndex}
                  total={layers.length}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
