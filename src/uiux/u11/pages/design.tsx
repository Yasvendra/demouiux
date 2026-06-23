import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import Extension from '@mui/icons-material/Extension'
import Hub from '@mui/icons-material/Hub'
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined'
import Psychology from '@mui/icons-material/Psychology'
import { AnimatePresence, motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'Hub' | 'Extension' | 'Psychology' | 'PlayCircleOutlined'

interface FeatureCard {
  id?: string
  title?: string
  description?: string
  icon?: string
  image?: string
}

interface SlideItem {
  id?: string
  label?: string
  heading?: string
  headingLine2?: string
  description?: string
  backgroundImage?: string
  backgroundAlt?: string
}

interface PageData {
  hero?: {
    cta?: {
      primary?: { text?: string; link?: string }
      video?: { text?: string; link?: string; icon?: string }
    }
    slides?: SlideItem[]
  }
  features?: {
    label?: string
    heading?: string
    description?: string
    cards?: FeatureCard[]
  }
  theme?: { primary?: string; primaryHover?: string; text?: string; muted?: string }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  Hub,
  Extension,
  Psychology,
  PlayCircleOutlined,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

const fadeLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.3, ease } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
}

function safeText(value?: string | null, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function safeArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : []
}

function resolveIcon(name?: string | null, fallback: IconName = 'Hub'): SvgIconComponent {
  if (!name?.trim()) return iconMap[fallback]
  const key = name.trim() as IconName
  return iconMap[key] ?? iconMap[fallback]
}

function SafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string
  alt: string
  className?: string
  fallback: string
}) {
  const [failed, setFailed] = useState(false)
  const resolved = failed || !src ? fallback : src

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function FeatureCardItem({
  card,
  primary,
}: {
  card: FeatureCard
  primary: string
}) {
  const title = safeText(card?.title)
  const description = safeText(card?.description)
  const imageUrl = safeText(card?.image)
  const Icon = resolveIcon(card?.icon, 'Hub')

  if (!title) return null

  const imageFallback =
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&q=80'

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease }}
      className="relative overflow-hidden bg-white shadow-md"
      style={{ borderBottom: `3px solid ${primary}` }}
    >
      {imageUrl && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <SafeImage
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover grayscale"
            fallback={imageFallback}
          />
        </div>
      )}

      <div className="relative z-10 p-6 sm:p-8">
        <Icon className="!text-[36px] sm:!text-[40px]" style={{ color: primary }} />
        <h3 className="font-display mt-4 text-lg font-bold text-gray-900 sm:text-xl">{title}</h3>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-gray-500">{description}</p>
        )}
      </div>
    </motion.article>
  )
}

export default function Design() {
  const page = data?.page ?? null
  const hero = page?.hero ?? null
  const features = page?.features ?? null

  const primary = safeText(page?.theme?.primary, '#D32F2F')
  const primaryHover = safeText(page?.theme?.primaryHover, '#b71c1c')
  const textColor = safeText(page?.theme?.text, '#1a1a1a')
  const muted = safeText(page?.theme?.muted, '#666666')

  const slides = safeArray(hero?.slides).filter((s) => safeText(s?.id))
  const primaryCtaText = safeText(hero?.cta?.primary?.text, 'GET IN TOUCH')
  const primaryCtaLink = safeText(hero?.cta?.primary?.link, '#contact')
  const videoCtaText = safeText(hero?.cta?.video?.text, 'SEE OUR ACTIVITY')
  const videoCtaLink = safeText(hero?.cta?.video?.link, '#video')
  const VideoIcon = resolveIcon(hero?.cta?.video?.icon, 'PlayCircleOutlined')

  const featuresLabel = safeText(features?.label)
  const featuresHeading = safeText(features?.heading)
  const featuresDescription = safeText(features?.description)
  const featureCards = safeArray(features?.cards).filter((c) => safeText(c?.title))

  const [activeSlideId, setActiveSlideId] = useState(safeText(slides[0]?.id, '1'))
  const [activeDot, setActiveDot] = useState(0)

  const activeSlide =
    slides.find((slide) => safeText(slide?.id) === activeSlideId) ?? slides[0]

  const slideLabel = safeText(activeSlide?.label)
  const slideHeading = safeText(activeSlide?.heading)
  const slideHeadingLine2 = safeText(activeSlide?.headingLine2)
  const slideDescription = safeText(activeSlide?.description)
  const slideBg = safeText(activeSlide?.backgroundImage)
  const slideBgAlt = safeText(activeSlide?.backgroundAlt, 'Hero background')

  const hasContent =
    Boolean(page) && (slides.length > 0 || featuresHeading || featureCards.length > 0)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <p className="text-gray-500">No content available.</p>
      </section>
    )
  }

  const heroFallback =
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1600&h=900&fit=crop&q=80'

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white">
      {/* Hero */}
      <div className="relative min-h-[480px] sm:min-h-[540px] md:min-h-[580px]">
        <AnimatePresence mode="wait">
          {slideBg && (
            <motion.div
              key={activeSlideId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="absolute inset-0"
            >
              <SafeImage
                src={slideBg}
                alt={slideBgAlt}
                className="h-full w-full object-cover"
                fallback={heroFallback}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid min-h-[480px] max-w-7xl grid-cols-1 items-center gap-8 px-4 py-16 sm:min-h-[540px] sm:px-6 md:min-h-[580px] lg:grid-cols-[1fr_auto] lg:gap-12 lg:px-8">
          {/* Left content */}
          <div className="max-w-xl text-left sm:max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlideId}
                variants={stagger}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {slideLabel && (
                  <motion.div variants={fadeLeft} className="flex items-center gap-3">
                    <span className="h-px w-8 sm:w-10" style={{ backgroundColor: primary }} aria-hidden />
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white sm:text-xs">
                      {slideLabel}
                    </p>
                  </motion.div>
                )}

                {(slideHeading || slideHeadingLine2) && (
                  <motion.h1
                    variants={fadeLeft}
                    className="font-display mt-5 text-3xl font-bold leading-tight text-white sm:mt-6 sm:text-4xl md:text-5xl"
                  >
                    {slideHeading && <span className="block">{slideHeading}</span>}
                    {slideHeadingLine2 && <span className="block">{slideHeadingLine2}</span>}
                  </motion.h1>
                )}

                {slideDescription && (
                  <motion.p
                    variants={fadeLeft}
                    className="mt-4 text-sm leading-relaxed text-white/85 sm:mt-5 sm:text-base"
                  >
                    {slideDescription}
                  </motion.p>
                )}

                <motion.div
                  variants={fadeLeft}
                  className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10 sm:gap-6"
                >
                  {primaryCtaText && (
                    <motion.a
                      href={primaryCtaLink}
                      className="inline-flex px-7 py-3 text-xs font-bold uppercase tracking-wider text-white sm:px-8 sm:py-3.5 sm:text-sm"
                      style={{ backgroundColor: primary }}
                      whileHover={{ scale: 1.04, backgroundColor: primaryHover }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {primaryCtaText}
                    </motion.a>
                  )}
                  {videoCtaText && (
                    <motion.a
                      href={videoCtaLink}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white sm:text-sm"
                      whileHover={{ opacity: 0.85 }}
                    >
                      <VideoIcon className="!text-[28px] sm:!text-[32px]" />
                      {videoCtaText}
                    </motion.a>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right slide numbers */}
          {slides.length > 0 && (
            <div className="flex flex-row justify-end gap-2 self-end lg:flex-col lg:justify-center lg:self-center lg:gap-2">
              {slides.map((slide) => {
                const slideId = safeText(slide?.id)
                const isActive = slideId === activeSlideId
                return (
                  <button
                    key={slideId}
                    type="button"
                    onClick={() => setActiveSlideId(slideId)}
                    className="flex h-9 w-9 items-center justify-center text-xs font-bold transition-colors sm:h-10 sm:w-10"
                    style={{
                      backgroundColor: isActive ? primary : '#ffffff',
                      color: isActive ? '#ffffff' : textColor,
                    }}
                    aria-label={`Slide ${slideId}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {slideId}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      {(featuresHeading || featureCards.length > 0) && (
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              {featuresLabel && (
                <motion.div variants={fadeUp} className="flex items-center gap-3">
                  <span className="h-px w-8" style={{ backgroundColor: primary }} aria-hidden />
                  <p
                    className="text-xs font-bold uppercase tracking-[0.18em] sm:text-sm"
                    style={{ color: primary }}
                  >
                    {featuresLabel}
                  </p>
                </motion.div>
              )}
              {featuresHeading && (
                <motion.h2
                  variants={fadeUp}
                  className="font-display mt-4 text-2xl font-bold leading-tight sm:mt-5 sm:text-3xl md:text-4xl"
                  style={{ color: textColor }}
                >
                  {featuresHeading}
                </motion.h2>
              )}
            </motion.div>

            {featuresDescription && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease }}
                className="text-sm leading-relaxed sm:text-base lg:pt-8"
                style={{ color: muted }}
              >
                {featuresDescription}
              </motion.p>
            )}
          </div>

          {featureCards.length > 0 && (
            <>
              <motion.div
                className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                {featureCards.map((card) => (
                  <FeatureCardItem
                    key={safeText(card?.id) || safeText(card?.title)}
                    card={card}
                    primary={primary}
                  />
                ))}
              </motion.div>

              <div className="mt-10 flex items-center justify-center gap-2 sm:mt-12">
                {featureCards.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveDot(index)}
                    className="flex h-3 w-3 items-center justify-center rounded-full transition-colors"
                    style={{
                      backgroundColor: activeDot === index ? primary : '#d1d5db',
                    }}
                    aria-label={`Feature slide ${index + 1}`}
                  >
                    {activeDot === index && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
