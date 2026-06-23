import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'ArrowForward'

interface HeroData {
  left?: { heading?: string; description?: string }
  right?: {
    description?: string
    image?: string
    alt?: string
    cta?: { text?: string; link?: string; icon?: string }
  }
  theme?: {
    dark?: string
    accent?: string
    accentHover?: string
    border?: string
    overlay?: string
  }
}

interface DesignPageData {
  hero?: HeroData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  ArrowForward,
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
}

const fadeRight = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
}

function safeText(value?: string | null, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function resolveIcon(name?: string | null, fallback: IconName = 'ArrowForward'): SvgIconComponent {
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

export default function Design() {
  const hero = data?.hero ?? null

  const dark = safeText(hero?.theme?.dark, '#050a14')
  const accent = safeText(hero?.theme?.accent, '#f9a825')
  const accentHover = safeText(hero?.theme?.accentHover, '#f57f17')
  const borderColor = safeText(hero?.theme?.border, '#c08e4c')
  const overlay = safeText(hero?.theme?.overlay, 'rgba(25, 55, 109, 0.65)')

  const leftHeading = safeText(hero?.left?.heading)
  const leftDescription = safeText(hero?.left?.description)
  const rightDescription = safeText(hero?.right?.description)
  const imageUrl = safeText(hero?.right?.image)
  const imageAlt = safeText(hero?.right?.alt, 'Construction site')
  const ctaText = safeText(hero?.right?.cta?.text, 'Learn More About Us')
  const ctaLink = safeText(hero?.right?.cta?.link, '#')
  const CtaIcon = resolveIcon(hero?.right?.cta?.icon, 'ArrowForward')

  const hasContent =
    Boolean(hero) &&
    (leftHeading || leftDescription || rightDescription || imageUrl || ctaText)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  const imageFallback =
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&h=900&fit=crop&q=80'

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto">
      <div className="flex min-h-[min(100%,640px)] flex-col lg:min-h-[520px] lg:flex-row">
        {/* Left panel */}
        <motion.div
          className="relative flex w-full flex-col justify-center px-6 py-12 sm:px-10 sm:py-14 lg:w-1/2 lg:px-14 lg:py-16 xl:px-20"
          style={{ backgroundColor: dark }}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {leftHeading && (
            <motion.h2
              variants={fadeLeft}
              className="max-w-xl text-xl font-bold uppercase leading-snug tracking-wide text-white sm:text-2xl md:text-3xl lg:text-[2rem] lg:leading-tight"
            >
              {leftHeading}
            </motion.h2>
          )}
          {leftDescription && (
            <motion.p
              variants={fadeLeft}
              className="mt-5 max-w-lg text-sm leading-relaxed text-white/90 sm:mt-6 sm:text-base md:text-[1.05rem] md:leading-7"
            >
              {leftDescription}
            </motion.p>
          )}
        </motion.div>

        {/* Right panel */}
        <div className="relative w-full lg:w-1/2">
          {imageUrl && (
            <SafeImage
              src={imageUrl}
              alt={imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
              fallback={imageFallback}
            />
          )}
          <div className="absolute inset-0" style={{ backgroundColor: overlay }} aria-hidden />

          <motion.div
            className="relative z-10 flex min-h-[360px] flex-col justify-center px-6 py-12 sm:min-h-[400px] sm:px-10 sm:py-14 lg:min-h-full lg:px-12 lg:py-16 xl:px-16"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Overlapping gold border frame */}
            <div
              className="pointer-events-none absolute inset-y-8 left-[-12%] right-6 hidden border-2 sm:inset-y-10 sm:right-8 lg:block xl:left-[-18%] xl:right-10"
              style={{ borderColor }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-6 left-4 border-2 sm:inset-8 sm:left-6 lg:hidden"
              style={{ borderColor }}
              aria-hidden
            />

            <div className="relative z-10 max-w-lg lg:ml-4 xl:ml-8">
              {rightDescription && (
                <motion.p
                  variants={fadeRight}
                  className="text-sm leading-relaxed text-white sm:text-base md:text-[1.05rem] md:leading-7"
                >
                  {rightDescription}
                </motion.p>
              )}

              {ctaText && (
                <motion.a
                  href={ctaLink}
                  variants={fadeUp}
                  className="mt-8 inline-flex w-full items-center justify-between gap-4 rounded-full px-5 py-3.5 text-sm font-semibold text-gray-900 shadow-md sm:mt-10 sm:w-auto sm:min-w-[260px] sm:px-6 sm:py-4 sm:text-base"
                  style={{ backgroundColor: accent }}
                  whileHover={{ scale: 1.04, y: -2, backgroundColor: accentHover }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.22, ease }}
                >
                  <span>{ctaText}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900/10 sm:h-10 sm:w-10">
                    <CtaIcon className="!text-[20px] text-gray-900" />
                  </span>
                </motion.a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
