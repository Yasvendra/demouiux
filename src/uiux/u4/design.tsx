import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import Build from '@mui/icons-material/Build'
import Groups from '@mui/icons-material/Groups'
import MonetizationOn from '@mui/icons-material/MonetizationOn'
import PlayCircleFilled from '@mui/icons-material/PlayCircleFilled'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'MonetizationOn' | 'Build' | 'Groups' | 'PlayCircleFilled'

interface CardItem {
  title?: string
  description?: string
  icon?: string
  iconVariant?: 'primary' | 'dark'
}

interface AboutData {
  badge?: { text?: string }
  heading?: string
  headingAccent?: string
  description?: string[]
  cards?: CardItem[]
  media?: {
    mainImage?: string
    mainAlt?: string
    overlayImage?: string
    overlayAlt?: string
    videoUrl?: string
  }
  theme?: { primary?: string; primaryHover?: string; dark?: string; background?: string }
}

interface DesignPageData {
  about?: AboutData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  MonetizationOn,
  Build,
  Groups,
  PlayCircleFilled,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
}

const fadeRight = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
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

function resolveIcon(name?: string | null, fallback: IconName = 'MonetizationOn'): SvgIconComponent {
  if (!name?.trim()) return iconMap[fallback]
  const key = name.trim() as IconName
  return iconMap[key] ?? iconMap[fallback]
}

function splitHeading(headline: string, accent?: string) {
  const safeAccent = safeText(accent)
  if (!safeAccent) return { before: headline, accent: '', after: '' }

  const index = headline.toLowerCase().indexOf(safeAccent.toLowerCase())
  if (index === -1) return { before: headline, accent: '', after: '' }

  return {
    before: headline.slice(0, index),
    accent: headline.slice(index, index + safeAccent.length),
    after: headline.slice(index + safeAccent.length),
  }
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

function FeatureCard({
  card,
  primary,
  dark,
}: {
  card: CardItem
  primary: string
  dark: string
}) {
  const title = safeText(card?.title)
  const description = safeText(card?.description)
  if (!title && !description) return null

  const Icon = resolveIcon(card?.icon, 'MonetizationOn')
  const iconBg = card?.iconVariant === 'dark' ? dark : primary

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -10, transition: { duration: 0.3, ease } }}
      className="flex gap-4 rounded-2xl bg-white p-5 shadow-lg shadow-gray-200/60 sm:gap-5 sm:p-6"
    >
      <motion.div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white sm:h-14 sm:w-14"
        style={{ backgroundColor: iconBg }}
        whileHover={{ scale: 1.08, rotate: 6 }}
        transition={{ duration: 0.25, ease }}
      >
        <Icon className="!text-[22px] sm:!text-[26px]" />
      </motion.div>
      <div className="min-w-0">
        {title && <h3 className="text-base font-bold text-gray-900 sm:text-lg">{title}</h3>}
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        )}
      </div>
    </motion.article>
  )
}

export default function Design() {
  const about = data?.about ?? null

  const primary = safeText(about?.theme?.primary, '#ef4444')
  const dark = safeText(about?.theme?.dark, '#111827')
  const background = safeText(about?.theme?.background, '#ffffff')

  const badgeText = safeText(about?.badge?.text)
  const heading = safeText(about?.heading)
  const headingParts = splitHeading(heading, about?.headingAccent)
  const paragraphs = safeArray(about?.description).map((p) => safeText(p)).filter(Boolean)
  const cards = safeArray(about?.cards).filter(
    (c) => safeText(c?.title) || safeText(c?.description),
  )

  const mainImage = safeText(about?.media?.mainImage)
  const mainAlt = safeText(about?.media?.mainAlt, 'Team at work')
  const overlayImage = safeText(about?.media?.overlayImage)
  const overlayAlt = safeText(about?.media?.overlayAlt, 'Video preview')
  const videoUrl = safeText(about?.media?.videoUrl, '#')

  const hasContent =
    Boolean(about) &&
    (badgeText || heading || paragraphs.length > 0 || cards.length > 0 || mainImage)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  const mainFallback =
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=700&fit=crop&q=80'
  const overlayFallback =
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=600&fit=crop&q=80'

  return (
    <section
      className="h-full min-h-0 overflow-x-hidden overflow-y-auto px-5 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12"
      style={{ backgroundColor: background }}
    >
      <motion.div
        className="mx-auto max-w-6xl"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {/* Header */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 lg:items-start">
          <div>
            {badgeText && (
              <motion.div
                variants={fadeUp}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 sm:mb-5"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primary }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-700 sm:text-xs">
                  {badgeText}
                </span>
              </motion.div>
            )}

            {heading && (
              <motion.h2
                variants={fadeUp}
                className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
              >
                {headingParts.accent ? (
                  <span style={{ color: primary }}>{headingParts.accent}</span>
                ) : null}
                <span className="text-gray-900">
                  {headingParts.before}
                  {headingParts.after}
                </span>
              </motion.h2>
            )}
          </div>

          {paragraphs.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:pt-10"
            >
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed text-gray-500 sm:text-[0.9375rem]">
                  {paragraph}
                </p>
              ))}
            </motion.div>
          )}
        </div>

        {/* Feature cards */}
        {cards.length > 0 && (
          <motion.div
            variants={stagger}
            className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          >
            {cards.map((card, index) => (
              <FeatureCard
                key={`${safeText(card?.title)}-${index}`}
                card={card}
                primary={primary}
                dark={dark}
              />
            ))}
          </motion.div>
        )}

        {/* Media section */}
        {mainImage && (
          <motion.div variants={fadeUp} className="relative mt-10 sm:mt-12">
            <motion.div variants={fadeLeft} className="overflow-hidden rounded-3xl">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.45, ease }}>
                <SafeImage
                  src={mainImage}
                  alt={mainAlt}
                  className="aspect-[16/9] w-full object-cover sm:aspect-[21/9]"
                  fallback={mainFallback}
                />
              </motion.div>
            </motion.div>

            {overlayImage && (
              <motion.div
                variants={fadeRight}
                className="relative mx-auto mt-6 w-full max-w-[240px] sm:absolute sm:bottom-[-2rem] sm:right-4 sm:mt-0 sm:max-w-[280px] md:right-8 md:max-w-[300px] lg:right-12 lg:max-w-[320px]"
              >
                <div className="overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                  <SafeImage
                    src={overlayImage}
                    alt={overlayAlt}
                    className="aspect-[4/5] w-full object-cover"
                    fallback={overlayFallback}
                  />
                  {videoUrl && (
                    <motion.a
                      href={videoUrl}
                      aria-label="Play video"
                      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      whileHover={{ scale: 1.12 }}
                    >
                      <PlayCircleFilled
                        className="!text-[52px] sm:!text-[60px]"
                        style={{ color: primary }}
                      />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            )}

            {overlayImage && <div className="hidden h-24 sm:block md:h-28" aria-hidden />}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
