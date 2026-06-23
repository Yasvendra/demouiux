import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import pageData from './data.json'

interface HeroCtaItem {
  text?: string
  link?: string
}

interface HeroCta {
  primary?: HeroCtaItem
  secondary?: HeroCtaItem
  text?: string
  link?: string
}

interface HeroBadge {
  text?: string
  pulse?: boolean
}

interface HeroHighlight {
  label?: string
}

interface HeroStat {
  value?: string
  label?: string
}

interface HeroImageOverlay {
  quote?: string
  caption?: string
}

interface HeroFloatingCard {
  value?: string
  label?: string
  suffix?: string
}

interface HeroImageScroll {
  enabled?: boolean
  sectionHeight?: string
  expandToFullWidth?: boolean
}

interface HeroImage {
  url?: string
  alt?: string
  scroll?: HeroImageScroll
  overlay?: HeroImageOverlay
  floatingCard?: HeroFloatingCard
}

interface HeroData {
  badge?: HeroBadge
  headline?: string
  headlineAccent?: string
  description?: string
  highlights?: HeroHighlight[]
  cta?: HeroCta
  stats?: HeroStat[]
  image?: HeroImage
}

interface DesignPageData {
  hero?: HeroData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
}

function splitHeadline(headline: string, accent?: string) {
  if (!accent?.trim()) return { before: headline, accent: '', after: '' }

  const index = headline.toLowerCase().indexOf(accent.toLowerCase())
  if (index === -1) return { before: headline, accent: '', after: '' }

  return {
    before: headline.slice(0, index),
    accent: headline.slice(index, index + accent.length),
    after: headline.slice(index + accent.length),
  }
}

function ArrowIcon() {
  return (
    <svg
      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

interface ImageMetrics {
  width: number
  height: number
  left: number
  top: number
}

function useHeroScrollMotion() {
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    mass: 0.35,
    restDelta: 0.001,
  })

  const textOpacity = useTransform(progress, [0, 0.22, 0.42], [1, 0.55, 0])
  const textY = useTransform(progress, [0, 0.45], [0, -56])
  const textX = useTransform(progress, [0, 0.45], [0, -40])
  const textScale = useTransform(progress, [0, 0.45], [1, 0.96])
  const contentGap = useTransform(progress, [0, 0.5], ['4rem', '0rem'])
  const backdropOpacity = useTransform(progress, [0.5, 0.9], [0, 0.4])

  return {
    sectionRef,
    progress,
    textOpacity,
    textY,
    textX,
    textScale,
    contentGap,
    backdropOpacity,
  }
}

function useImageExpandMotion(progress: MotionValue<number>, metrics: ImageMetrics) {
  const expandProgress = useTransform(progress, [0.04, 1], [0, 1])

  const width = useTransform(expandProgress, (value) => {
    if (!metrics.width) return metrics.width
    return metrics.width + (window.innerWidth - metrics.width) * value
  })

  const height = useTransform(expandProgress, (value) => {
    if (!metrics.height) return metrics.height
    return metrics.height + (window.innerHeight - metrics.height) * value
  })

  const left = useTransform(expandProgress, (value) => metrics.left * (1 - value))
  const top = useTransform(expandProgress, (value) => metrics.top * (1 - value))
  const borderRadius = useTransform(expandProgress, [0, 0.45, 1], [32, 14, 0])
  const zIndex = useTransform(progress, [0, 0.25, 1], [1, 30, 60])
  const inFlowOpacity = useTransform(progress, [0, 0.03, 0.07], [1, 1, 0])
  const fixedOpacity = useTransform(progress, [0, 0.03, 0.07], [0, 1, 1])
  const overlayOpacity = useTransform(expandProgress, [0, 0.3, 0.55], [1, 0.55, 0])
  const floatingOpacity = useTransform(expandProgress, [0, 0.2, 0.38], [1, 0.35, 0])
  const shadowOpacity = useTransform(expandProgress, [0, 0.6, 1], [0.18, 0.1, 0])
  const boxShadow = useTransform(
    shadowOpacity,
    (value) => `0 28px 70px rgba(15, 23, 42, ${value})`,
  )

  return {
    width,
    height,
    left,
    top,
    borderRadius,
    zIndex,
    inFlowOpacity,
    fixedOpacity,
    overlayOpacity,
    floatingOpacity,
    boxShadow,
  }
}

function HeroImageCard({
  imageUrl,
  imageAlt,
  overlayQuote,
  overlayCaption,
  floatingValue,
  floatingLabel,
  floatingSuffix,
  overlayOpacity,
  floatingOpacity,
  boxShadow,
}: {
  imageUrl: string
  imageAlt: string
  overlayQuote?: string
  overlayCaption?: string
  floatingValue?: string
  floatingLabel?: string
  floatingSuffix: string
  overlayOpacity?: MotionValue<number>
  floatingOpacity?: MotionValue<number>
  boxShadow?: MotionValue<string>
}) {
  return (
    <>
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-[inherit] shadow-2xl shadow-gray-200/80 ring-1 ring-black/5"
        style={boxShadow ? { boxShadow } : undefined}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className="aspect-[4/3] h-full w-full object-cover lg:aspect-[5/4]"
          loading="lazy"
        />

        {(overlayQuote || overlayCaption) && (
          <motion.div
            style={overlayOpacity ? { opacity: overlayOpacity } : undefined}
            className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/75 px-5 py-4 text-white backdrop-blur-md sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-xs"
          >
            {overlayQuote && (
              <p className="text-xs font-bold uppercase leading-relaxed tracking-[0.18em]">
                {overlayQuote}
              </p>
            )}
            {overlayCaption && (
              <p className="mt-2 text-sm text-white/75">{overlayCaption}</p>
            )}
          </motion.div>
        )}
      </motion.div>

      {floatingValue && floatingLabel && (
        <motion.div
          style={floatingOpacity ? { opacity: floatingOpacity } : undefined}
          className="absolute -right-2 top-6 rounded-2xl border border-white/70 bg-white/95 px-5 py-4 shadow-xl backdrop-blur-sm sm:-right-6"
        >
          <p className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-black">{floatingValue}</span>
            <span className="text-sm font-medium text-gray-400">{floatingSuffix}</span>
          </p>
          <p className="mt-0.5 text-sm text-gray-500">{floatingLabel}</p>
        </motion.div>
      )}
    </>
  )
}

function HeroScrollImage({
  imageUrl,
  imageAlt,
  overlayQuote,
  overlayCaption,
  floatingValue,
  floatingLabel,
  floatingSuffix,
  progress,
  scrollEnabled,
}: {
  imageUrl: string
  imageAlt: string
  overlayQuote?: string
  overlayCaption?: string
  floatingValue?: string
  floatingLabel?: string
  floatingSuffix: string
  progress: MotionValue<number>
  scrollEnabled: boolean
}) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<ImageMetrics>({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  })

  const measure = useCallback(() => {
    if (!measureRef.current) return
    const rect = measureRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    setMetrics({
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    })
  }, [])

  useLayoutEffect(() => {
    measure()

    const node = measureRef.current
    if (!node) return

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(node)
    window.addEventListener('resize', measure)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  useMotionValueEvent(progress, 'change', (value) => {
    if (value <= 0.01) {
      requestAnimationFrame(measure)
    }
  })

  const expandMotion = useImageExpandMotion(progress, metrics)
  const isReady = metrics.width > 0

  const imageShell = (
    <HeroImageCard
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      overlayQuote={overlayQuote}
      overlayCaption={overlayCaption}
      floatingValue={floatingValue}
      floatingLabel={floatingLabel}
      floatingSuffix={floatingSuffix}
      overlayOpacity={scrollEnabled ? expandMotion.overlayOpacity : undefined}
      floatingOpacity={scrollEnabled ? expandMotion.floatingOpacity : undefined}
      boxShadow={scrollEnabled ? expandMotion.boxShadow : undefined}
    />
  )

  if (!scrollEnabled) {
    return (
      <motion.div
        className="relative w-full max-w-xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.18, ease }}
      >
        <div className="relative overflow-hidden rounded-[2rem]">{imageShell}</div>
      </motion.div>
    )
  }

  return (
    <div className="relative flex w-full items-center justify-center">
      <motion.div
        ref={measureRef}
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem]"
        style={{ opacity: expandMotion.inFlowOpacity }}
      >
        {imageShell}
      </motion.div>

      {isReady && (
        <motion.div
          className="pointer-events-none will-change-[width,height,left,top,border-radius] [&:has(img)]:pointer-events-auto"
          style={{
            position: 'fixed',
            opacity: expandMotion.fixedOpacity,
            width: expandMotion.width,
            height: expandMotion.height,
            left: expandMotion.left,
            top: expandMotion.top,
            zIndex: expandMotion.zIndex,
            borderRadius: expandMotion.borderRadius,
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
            {imageShell}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function Design() {
  const hero = data?.hero
  const scrollEnabled = (hero?.image?.scroll?.enabled ?? true) && !!hero
  const sectionHeight = hero?.image?.scroll?.sectionHeight?.trim() || '260vh'
  const scrollMotion = useHeroScrollMotion()

  if (!hero) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-6">
        <p className="text-lg text-gray-500">No hero content available.</p>
      </section>
    )
  }

  const headline = hero.headline?.trim() || 'Create the career you love'
  const headlineParts = splitHeadline(headline, hero.headlineAccent?.trim())
  const description =
    hero.description?.trim() ||
    'Join the people behind the product to build a more positive internet for Pinterest users worldwide.'

  const primaryCta = hero.cta?.primary ?? (hero.cta?.text ? { text: hero.cta.text, link: hero.cta.link } : undefined)
  const secondaryCta = hero.cta?.secondary
  const primaryText = primaryCta?.text?.trim() || 'Explore jobs'
  const primaryLink = primaryCta?.link?.trim() || '#'
  const secondaryText = secondaryCta?.text?.trim()
  const secondaryLink = secondaryCta?.link?.trim() || '#'

  const imageUrl = hero.image?.url?.trim() || 'https://picsum.photos/800/600'
  const imageAlt = hero.image?.alt?.trim() || 'Team member at work'
  const overlayQuote = hero.image?.overlay?.quote?.trim()
  const overlayCaption = hero.image?.overlay?.caption?.trim()
  const floatingValue = hero.image?.floatingCard?.value?.trim()
  const floatingLabel = hero.image?.floatingCard?.label?.trim()
  const floatingSuffix = hero.image?.floatingCard?.suffix?.trim() || '/ 5'

  const highlights = (hero.highlights ?? []).filter((item) => item?.label?.trim())
  const stats = (hero.stats ?? []).filter((item) => item?.value?.trim() || item?.label?.trim())
  const badgeText = hero.badge?.text?.trim()
  const showBadgePulse = hero.badge?.pulse ?? true

  return (
    <>
    <section
      ref={scrollMotion.sectionRef}
      className="relative bg-white"
      style={scrollEnabled ? { height: sectionHeight } : undefined}
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-rose-100/80 via-orange-50/60 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-gray-100/90 to-transparent blur-3xl"
        aria-hidden
      />

      {scrollEnabled && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 bg-black"
          style={{ opacity: scrollMotion.backdropOpacity }}
          aria-hidden
        />
      )}

      <div
        className={
          scrollEnabled
            ? 'sticky top-0 flex h-screen items-center overflow-hidden'
            : 'relative'
        }
      >
        <div className="relative mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-24 lg:px-16">
          <motion.div
            className="grid min-h-[calc(100vh-8rem)] items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20"
            style={scrollEnabled ? { gap: scrollMotion.contentGap } : undefined}
          >
            <motion.div
              className="flex w-full flex-col items-start justify-center text-left lg:max-w-2xl lg:pr-4"
              variants={stagger}
              initial="hidden"
              animate="visible"
              style={
                scrollEnabled
                  ? {
                      opacity: scrollMotion.textOpacity,
                      y: scrollMotion.textY,
                      x: scrollMotion.textX,
                      scale: scrollMotion.textScale,
                    }
                  : undefined
              }
            >
            {badgeText && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.55, ease }}
                className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm"
              >
                {showBadgePulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                {badgeText}
              </motion.div>
            )}

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6, ease }}
              className="text-4xl font-bold leading-[1.08] tracking-tight text-black sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {headlineParts.before}
              {headlineParts.accent ? (
                <span className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
                  {headlineParts.accent}
                </span>
              ) : null}
              {headlineParts.after}
            </motion.h1>

            {description && (
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.6, ease }}
                className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600"
              >
                {description}
              </motion.p>
            )}

            {highlights.length > 0 && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6, ease }}
                className="mt-6 flex flex-wrap gap-2.5"
              >
                {highlights.map((item, index) => (
                  <span
                    key={`${item.label}-${index}`}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm font-medium text-gray-700"
                  >
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
                    {item.label}
                  </span>
                ))}
              </motion.div>
            )}

            {(primaryText || secondaryText) && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6, ease }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {primaryText && (
                  <a
                    href={primaryLink}
                    className="group inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-base font-bold text-white transition-all duration-300 hover:bg-gray-800 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    {primaryText}
                    <ArrowIcon />
                  </a>
                )}
                {secondaryText && (
                  <a
                    href={secondaryLink}
                    className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-gray-900 transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
                  >
                    {secondaryText}
                  </a>
                )}
              </motion.div>
            )}

            {stats.length > 0 && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.6, ease }}
                className="mt-10 grid grid-cols-2 gap-6 border-t border-gray-100 pt-8 sm:grid-cols-3"
              >
                {stats.map((stat, index) => (
                  <div key={`${stat.value}-${index}`} className="min-w-0">
                    {stat.value && (
                      <p className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
                        {stat.value}
                      </p>
                    )}
                    {stat.label && (
                      <p className="mt-1 text-sm leading-snug text-gray-500">{stat.label}</p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
            </motion.div>

            <div className="flex w-full items-center justify-center lg:justify-center lg:pl-4">
              <HeroScrollImage
                imageUrl={imageUrl}
                imageAlt={imageAlt}
                overlayQuote={overlayQuote}
                overlayCaption={overlayCaption}
                floatingValue={floatingValue}
                floatingLabel={floatingLabel}
                floatingSuffix={floatingSuffix}
                progress={scrollMotion.progress}
                scrollEnabled={scrollEnabled}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {scrollEnabled && (
      <div className="bg-white px-6 py-24 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">Keep scrolling</p>
          <p className="mt-4 text-2xl font-semibold text-gray-900">
            Scroll back up to see the image return to its original size.
          </p>
        </div>
      </div>
    )}
    </>
  )
}
