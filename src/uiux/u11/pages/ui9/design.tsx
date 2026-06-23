import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentSecondary?: string
  accentWarm?: string
  surface?: string
  stage?: string
}

interface PipelineBadge {
  text?: string
  pulse?: boolean
}

interface PipelineMetric {
  value?: string
  unit?: string
  label?: string
}

interface PipelineStage {
  id: string
  step?: number
  icon?: string
  label?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
  metric?: PipelineMetric
}

interface FluxPipelineData {
  badge?: PipelineBadge
  eyebrow?: string
  heading?: string
  headingAccent?: string
  defaultActive?: string
  flowSpeed?: number
  autoAdvance?: boolean
  autoAdvanceMs?: number
  stages?: PipelineStage[]
}

interface DesignPageData {
  theme?: ThemeData
  fluxPipeline?: FluxPipelineData
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeStages(stages?: PipelineStage[]): PipelineStage[] {
  return (stages ?? [])
    .filter((s): s is PipelineStage => Boolean(trim(s?.id)))
    .sort((a, b) => (a.step ?? 0) - (b.step ?? 0))
}

function resolveDefault(stages: PipelineStage[], preferred?: string): string {
  const id = trim(preferred)
  if (id && stages.some((s) => s.id === id)) return id
  return stages[0]?.id ?? ''
}

function stageLabel(stage?: PipelineStage | null): string {
  return trim(stage?.label) || trim(stage?.title) || trim(stage?.id) || 'Stage'
}

function stageAlt(stage?: PipelineStage | null): string {
  return trim(stage?.alt) || trim(stage?.title) || stageLabel(stage)
}

function imageFallback(id?: string): string {
  return `https://picsum.photos/seed/${trim(id) || 'pipeline'}/1200/800`
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 6000): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 2500)
}

function safeStep(value?: number | null, index = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return index + 1
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

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w < 640) return 'mobile'
    if (w < 1024) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 640) setBp('mobile')
      else if (w < 1024) setBp('tablet')
      else setBp('desktop')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return bp
}

/* ─── Icons ─── */

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

/* ─── Flowing data packets along pipeline ─── */

function FlowPackets({
  count,
  accent,
  accentSecondary,
  reduceMotion,
  vertical,
  duration,
}: {
  count: number
  accent: string
  accentSecondary: string
  reduceMotion: boolean
  vertical: boolean
  duration: number
}) {
  if (reduceMotion || count < 2) return null

  const packets = Array.from({ length: 3 }, (_, i) => i)

  return (
    <>
      {packets.map((i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute z-10 h-2 w-2 rounded-full shadow-lg"
          style={{
            background: i % 2 === 0 ? accent : accentSecondary,
            boxShadow: `0 0 8px ${i % 2 === 0 ? accent : accentSecondary}`,
            ...(vertical
              ? { left: '50%', x: '-50%' }
              : { top: '50%', y: '-50%' }),
          }}
          animate={
            vertical
              ? { top: ['0%', '100%'], opacity: [0, 1, 1, 0] }
              : { left: ['0%', '100%'], opacity: [0, 1, 1, 0] }
          }
          transition={{
            duration,
            repeat: Infinity,
            ease: 'linear',
            delay: i * (duration / 3),
          }}
        />
      ))}
    </>
  )
}

/* ─── Track line (centered on icon row / icon column) ─── */

function TrackLine({
  progress,
  accent,
  accentSecondary,
  horizontal,
}: {
  progress: number
  accent: string
  accentSecondary: string
  horizontal: boolean
}) {
  if (horizontal) {
    return (
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center" aria-hidden>
        <div className="h-0.5 w-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accent}, ${accentSecondary})`,
              width: `${progress * 100}%`,
            }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="h-full w-full bg-white/[0.08]">
        <motion.div
          className="w-full rounded-full"
          style={{
            background: `linear-gradient(180deg, ${accent}, ${accentSecondary})`,
            height: `${progress * 100}%`,
          }}
          animate={{ height: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease }}
        />
      </div>
    </div>
  )
}

/* ─── Stage node ─── */

function StageNode({
  stage,
  index,
  isActive,
  isPast,
  onSelect,
  accent,
  accentSecondary,
  stageBg,
  accentWarm,
  reduceMotion,
  vertical,
  part = 'both',
}: {
  stage: PipelineStage
  index: number
  isActive: boolean
  isPast: boolean
  onSelect: () => void
  accent: string
  accentSecondary: string
  stageBg: string
  accentWarm: string
  reduceMotion: boolean
  vertical: boolean
  part?: 'icon' | 'label' | 'both'
}) {
  const icon = trim(stage.icon) || '●'
  const label = stageLabel(stage)
  const step = safeStep(stage.step, index)

  const iconButton = (
    <motion.button
      type="button"
      onClick={onSelect}
      className="relative z-20 flex shrink-0 items-center justify-center rounded-full font-semibold outline-none focus-visible:ring-2 focus-visible:ring-violet-400 h-11 w-11 text-base sm:h-12 sm:w-12 sm:text-lg"
      whileHover={reduceMotion ? undefined : { scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`Step ${step}: ${label}`}
    >
      <motion.span
        className="relative flex h-full w-full items-center justify-center rounded-full"
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${accent}, ${accentSecondary})`
            : isPast
              ? `${accent}44`
              : stageBg,
          border: isActive ? 'none' : `2px solid ${isPast ? accent : 'rgba(255,255,255,0.12)'}`,
          boxShadow: isActive ? `0 0 24px ${accent}66` : 'none',
        }}
        animate={
          isActive && !reduceMotion
            ? { boxShadow: [`0 0 12px ${accent}44`, `0 0 28px ${accent}88`, `0 0 12px ${accent}44`] }
            : undefined
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}

        {/* Step number badge */}
        <span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white sm:h-5 sm:w-5 sm:text-[10px]"
          style={{ background: isActive ? accentWarm : 'rgba(255,255,255,0.15)' }}
        >
          {step}
        </span>
      </motion.span>
    </motion.button>
  )

  const labelEl = (
    <button
      type="button"
      onClick={onSelect}
      className={`bg-transparent text-left outline-none focus-visible:underline ${
        vertical ? 'min-w-0 flex-1 text-sm' : 'w-full text-center text-[10px] sm:text-xs'
      } font-medium leading-snug ${
        isActive ? 'text-white' : isPast ? 'text-white/60' : 'text-white/35'
      }`}
      aria-hidden={vertical}
      tabIndex={vertical ? -1 : 0}
    >
      {label}
    </button>
  )

  if (part === 'icon') return <div className="flex justify-center">{iconButton}</div>
  if (part === 'label') return labelEl

  if (vertical) {
    return (
      <div className="relative z-10 flex w-full items-center gap-3 sm:gap-4">
        <div className="flex w-11 shrink-0 justify-center sm:w-12">{iconButton}</div>
        {labelEl}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 px-0.5 sm:gap-2.5">
      <div className="flex justify-center">{iconButton}</div>
      {labelEl}
    </div>
  )
}

/* ─── Stepper layout ─── */

function PipelineStepper({
  stages,
  activeIndex,
  activeId,
  onSelect,
  accent,
  accentSecondary,
  stageBg,
  accentWarm,
  reduceMotion,
  vertical,
  flowDuration,
}: {
  stages: PipelineStage[]
  activeIndex: number
  activeId: string
  onSelect: (id: string) => void
  accent: string
  accentSecondary: string
  stageBg: string
  accentWarm: string
  reduceMotion: boolean
  vertical: boolean
  flowDuration: number
}) {
  const count = stages.length
  const progress = count > 1 ? activeIndex / (count - 1) : 0
  const edgeInset = `${50 / count}%`
  const gridCols = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }

  const nodeProps = (stage: PipelineStage, index: number) => ({
    stage,
    index,
    isActive: stage.id === activeId,
    isPast: index < activeIndex,
    onSelect: () => onSelect(stage.id),
    accent,
    accentSecondary,
    stageBg,
    accentWarm,
    reduceMotion,
    vertical,
  })

  if (vertical) {
    return (
      <div className="relative px-3 py-5 sm:px-4 sm:py-6">
        {/* Vertical line — centered on icon column */}
        <div
          className="pointer-events-none absolute bottom-6 left-0 top-6 flex w-11 justify-center sm:w-12"
          aria-hidden
        >
          <div className="relative h-full w-0.5">
            <TrackLine progress={progress} accent={accent} accentSecondary={accentSecondary} horizontal={false} />
          </div>
          <div className="absolute inset-0">
            <FlowPackets
              count={count}
              accent={accent}
              accentSecondary={accentSecondary}
              reduceMotion={reduceMotion}
              vertical
              duration={flowDuration}
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
          {stages.map((stage, index) => (
            <StageNode key={stage.id} {...nodeProps(stage, index)} part="both" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="relative mx-auto min-w-[640px] sm:min-w-[720px] md:min-w-0">
        {/* Icon row — line vertically centered through icons */}
        <div className="relative mb-3 h-11 sm:mb-4 sm:h-12">
          <div
            className="pointer-events-none absolute inset-y-0"
            style={{ left: edgeInset, right: edgeInset }}
          >
            <TrackLine progress={progress} accent={accent} accentSecondary={accentSecondary} horizontal />
            <div className="absolute inset-0">
              <FlowPackets
                count={count}
                accent={accent}
                accentSecondary={accentSecondary}
                reduceMotion={reduceMotion}
                vertical={false}
                duration={flowDuration}
              />
            </div>
          </div>

          <div className="relative z-10 grid h-full items-center gap-x-1 sm:gap-x-2 md:gap-x-3" style={gridCols}>
            {stages.map((stage, index) => (
              <StageNode key={`${stage.id}-icon`} {...nodeProps(stage, index)} part="icon" />
            ))}
          </div>
        </div>

        {/* Label row */}
        <div className="relative z-10 grid gap-x-1 sm:gap-x-2 md:gap-x-3" style={gridCols}>
          {stages.map((stage, index) => (
            <StageNode key={`${stage.id}-label`} {...nodeProps(stage, index)} part="label" />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Detail panel ─── */

function StageDetail({
  stage,
  accent,
  accentSecondary,
  panelBg,
  reduceMotion,
}: {
  stage: PipelineStage
  accent: string
  accentSecondary: string
  panelBg: string
  reduceMotion: boolean
}) {
  const fallback = imageFallback(stage.id)
  const imageUrl = trim(stage.image) || fallback
  const [src, setSrc] = useState(imageUrl)
  const title = trim(stage.title)
  const description = trim(stage.description)
  const link = trim(stage.link) || '#'
  const metricValue = trim(stage.metric?.value)
  const metricUnit = trim(stage.metric?.unit)
  const metricLabel = trim(stage.metric?.label)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  return (
    <motion.div
      key={stage.id}
      className="overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl"
      style={{ background: panelBg }}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.45, ease }}
      whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.16)' }}
    >
      <div className="grid md:grid-cols-5">
        <div className="relative aspect-[16/9] overflow-hidden md:col-span-2 md:aspect-auto md:min-h-[220px]">
          <motion.img
            src={src}
            alt={stageAlt(stage)}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setSrc((c) => (c === fallback ? c : fallback))}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, ease }}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/40" />

          {metricValue && (
            <motion.div
              className="absolute bottom-3 left-3 rounded-lg border border-white/20 bg-black/55 px-3 py-2 backdrop-blur-sm sm:bottom-4 sm:left-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease }}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            >
              <p className="text-lg font-bold text-white sm:text-xl">
                {metricValue}
                {metricUnit && <span className="ml-0.5 text-xs text-white/55">{metricUnit}</span>}
              </p>
              {metricLabel && <p className="text-[10px] text-white/50 sm:text-xs">{metricLabel}</p>}
            </motion.div>
          )}
        </div>

        <div className="flex flex-col justify-center p-4 sm:p-5 md:col-span-3 md:p-6 lg:p-7">
          {trim(stage.label) && (
            <span
              className="mb-2 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-xs"
              style={{ background: `${accent}22`, color: accent }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentSecondary }} />
              {stage.label}
            </span>
          )}

          {title && (
            <h3 className="text-base font-bold text-white sm:text-lg md:text-xl">{title}</h3>
          )}

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-white/55 sm:mt-3 sm:text-base">
              {description}
            </p>
          )}

          <motion.a
            href={link}
            className="group mt-4 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white sm:mt-5"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accentSecondary})` }}
            whileHover={reduceMotion ? undefined : { scale: 1.03, boxShadow: `0 8px 28px ${accent}44` }}
            whileTap={{ scale: 0.97 }}
          >
            Explore stage
            <ArrowIcon />
          </motion.a>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main: FluxPipeline ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const bp = useBreakpoint()
  const vertical = bp === 'mobile'

  const theme = data?.theme ?? {}
  const pipeline = data?.fluxPipeline ?? {}

  const accent = safeColor(theme.accent, '#8B5CF6')
  const accentSecondary = safeColor(theme.accentSecondary, '#67E8F9')
  const accentWarm = safeColor(theme.accentWarm, '#F472B6')
  const surface = safeColor(theme.surface, '#0D0B1A')
  const stageBg = safeColor(theme.stage, '#16132A')

  const stages = safeStages(pipeline.stages)
  const defaultId = resolveDefault(stages, pipeline.defaultActive)
  const [activeId, setActiveId] = useState(defaultId)
  const [paused, setPaused] = useState(false)

  const autoAdvance = pipeline.autoAdvance !== false
  const advanceMs = safeMs(pipeline.autoAdvanceMs, 6000)
  const flowDuration = Math.max(pipeline.flowSpeed ?? 3, 1.5)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeIndex = Math.max(0, stages.findIndex((s) => s.id === activeId))
  const activeStage = stages[activeIndex] ?? stages[0] ?? null

  useEffect(() => {
    setActiveId((current) =>
      stages.some((s) => s.id === current) ? current : defaultId,
    )
  }, [stages, defaultId])

  const selectStage = useCallback(
    (id: string) => {
      if (!trim(id) || !stages.some((s) => s.id === id)) return
      setActiveId(id)
    },
    [stages],
  )

  const advance = useCallback(() => {
    if (stages.length < 2) return
    setActiveId((current) => {
      const idx = stages.findIndex((s) => s.id === current)
      const next = stages[(idx + 1) % stages.length]
      return next?.id ?? current
    })
  }, [stages])

  useEffect(() => {
    if (!autoAdvance || paused || stages.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(advance, advanceMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeId, advance, autoAdvance, advanceMs, paused, reduceMotion, stages.length])

  const badgeText = trim(pipeline.badge?.text)
  const showPulse = pipeline.badge?.pulse !== false
  const eyebrow = trim(pipeline.eyebrow)
  const heading = trim(pipeline.heading)
  const headingParts = splitHeadline(heading, trim(pipeline.headingAccent))

  if (!stages.length) {
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
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute right-1/4 top-0 h-[450px] w-[450px] rounded-full blur-[120px]"
          style={{ background: `${accent}14` }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[350px] w-[350px] rounded-full blur-[100px]"
          style={{ background: `${accentSecondary}10` }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
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
                  <span className="relative h-2 w-2 rounded-full" style={{ background: accentSecondary }} />
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

        {/* Single FluxPipeline component */}
        <motion.div
          className="rounded-2xl border border-white/10 p-4 sm:rounded-3xl sm:p-6 md:p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
          whileHover={reduceMotion ? undefined : { borderColor: 'rgba(255,255,255,0.14)' }}
        >
          <PipelineStepper
            stages={stages}
            activeIndex={activeIndex}
            activeId={activeId}
            onSelect={selectStage}
            accent={accent}
            accentSecondary={accentSecondary}
            stageBg={stageBg}
            accentWarm={accentWarm}
            reduceMotion={reduceMotion}
            vertical={vertical}
            flowDuration={flowDuration}
          />

          {/* Nav controls */}
          <div className="mt-4 flex items-center justify-center gap-3 border-t border-white/[0.06] pt-4 sm:mt-5 sm:pt-5">
            <motion.button
              type="button"
              onClick={() => {
                const prev = stages[((activeIndex - 1) % stages.length + stages.length) % stages.length]
                if (prev?.id) selectStage(prev.id)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Previous stage"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <span className="text-xs text-white/35">
              Stage {activeIndex + 1} / {stages.length}
            </span>

            <motion.button
              type="button"
              onClick={advance}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60"
              whileHover={reduceMotion ? undefined : { scale: 1.08, color: '#fff' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Next stage"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          {/* Detail panel */}
          <div className="mt-5 sm:mt-6 md:mt-8">
            <AnimatePresence mode="wait">
              {activeStage && (
                <StageDetail
                  key={activeStage.id}
                  stage={activeStage}
                  accent={accent}
                  accentSecondary={accentSecondary}
                  panelBg={stageBg}
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
