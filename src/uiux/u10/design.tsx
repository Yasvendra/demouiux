import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Groups from '@mui/icons-material/Groups'
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined'
import Send from '@mui/icons-material/Send'
import SettingsSuggest from '@mui/icons-material/SettingsSuggest'
import SupportAgent from '@mui/icons-material/SupportAgent'
import WorkspacePremium from '@mui/icons-material/WorkspacePremium'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName =
  | 'SettingsSuggest'
  | 'Groups'
  | 'SupportAgent'
  | 'PlayCircleOutlined'
  | 'WorkspacePremium'
  | 'Send'
  | 'ArrowForward'

interface FeatureItem {
  id?: string
  title?: string
  description?: string
  icon?: string
  variant?: 'light' | 'featured'
  link?: string
}

interface StatItem {
  value?: string
  label?: string
  icon?: string
}

interface PageData {
  hero?: {
    heading?: string
    description?: string
    cta?: { text?: string; link?: string }
    backgroundImage?: string
    backgroundAlt?: string
  }
  features?: FeatureItem[]
  about?: {
    label?: string
    heading?: string
    paragraphs?: string[]
    cta?: { text?: string; link?: string }
    video?: { thumbnail?: string; alt?: string; videoUrl?: string }
    stats?: StatItem[]
  }
  theme?: {
    primary?: string
    primaryHover?: string
    primaryDark?: string
    overlay?: string
    sectionBg?: string
  }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  SettingsSuggest,
  Groups,
  SupportAgent,
  PlayCircleOutlined,
  WorkspacePremium,
  Send,
  ArrowForward,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
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

function resolveIcon(name?: string | null, fallback: IconName = 'SettingsSuggest'): SvgIconComponent {
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

function FeatureCard({
  feature,
  primary,
}: {
  feature: FeatureItem
  primary: string
}) {
  const title = safeText(feature?.title)
  const description = safeText(feature?.description)
  const link = safeText(feature?.link, '#')
  const isFeatured = feature?.variant === 'featured'
  const Icon = resolveIcon(feature?.icon, 'SettingsSuggest')

  if (!title) return null

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease }}
      className={`flex flex-col rounded-lg p-6 shadow-lg sm:p-8 ${
        isFeatured
          ? 'relative z-10 -mt-4 sm:-mt-6 lg:-mt-8'
          : 'bg-white text-gray-900'
      }`}
      style={isFeatured ? { backgroundColor: primary } : undefined}
    >
      <Icon
        className="!text-[40px] sm:!text-[44px]"
        style={{ color: isFeatured ? '#ffffff' : primary }}
      />
      <h3 className={`mt-4 text-lg font-bold sm:text-xl ${isFeatured ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      {description && (
        <p className={`mt-3 flex-1 text-sm leading-relaxed ${isFeatured ? 'text-white/90' : 'text-gray-500'}`}>
          {description}
        </p>
      )}
      <a
        href={link}
        className={`mt-5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide sm:text-sm ${
          isFeatured ? 'text-white' : ''
        }`}
        style={isFeatured ? undefined : { color: primary }}
      >
        Read More
        <ArrowForward className="!text-[14px]" />
      </a>
    </motion.article>
  )
}

export default function Design() {
  const page = data?.page ?? null
  const hero = page?.hero ?? null
  const features = safeArray(page?.features)
  const about = page?.about ?? null

  const primary = safeText(page?.theme?.primary, '#00C853')
  const primaryHover = safeText(page?.theme?.primaryHover, '#00a844')
  const overlay = safeText(page?.theme?.overlay, 'rgba(40, 44, 52, 0.88)')
  const sectionBg = safeText(page?.theme?.sectionBg, '#f8f9fa')

  const heroHeading = safeText(hero?.heading)
  const heroDescription = safeText(hero?.description)
  const heroCtaText = safeText(hero?.cta?.text, 'CONTACT US')
  const heroCtaLink = safeText(hero?.cta?.link, '#contact')
  const heroBg = safeText(hero?.backgroundImage)
  const heroBgAlt = safeText(hero?.backgroundAlt, 'Office')

  const aboutLabel = safeText(about?.label)
  const aboutHeading = safeText(about?.heading)
  const aboutParagraphs = safeArray(about?.paragraphs).map((p) => safeText(p)).filter(Boolean)
  const aboutCtaText = safeText(about?.cta?.text, 'READ MORE')
  const aboutCtaLink = safeText(about?.cta?.link, '#about')
  const videoThumb = safeText(about?.video?.thumbnail)
  const videoAlt = safeText(about?.video?.alt, 'About video')
  const videoUrl = safeText(about?.video?.videoUrl, '#')
  const stats = safeArray(about?.stats).filter(
    (s) => safeText(s?.value) || safeText(s?.label),
  )

  const hasContent =
    Boolean(page) && (heroHeading || features.length > 0 || aboutHeading)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <p className="text-gray-500">No content available.</p>
      </section>
    )
  }

  const heroFallback =
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&h=900&fit=crop&q=80'
  const videoFallback =
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=550&fit=crop&q=80'

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white">
      {/* Hero */}
      <div className="relative min-h-[400px] sm:min-h-[460px] md:min-h-[500px]">
        {heroBg && (
          <SafeImage
            src={heroBg}
            alt={heroBgAlt}
            className="absolute inset-0 h-full w-full object-cover"
            fallback={heroFallback}
          />
        )}

        <div className="relative z-10 mx-auto flex h-full min-h-[400px] max-w-7xl items-center px-4 py-16 sm:min-h-[460px] sm:px-6 md:min-h-[500px] lg:px-8">
          <motion.div
            className="max-w-lg px-6 py-8 sm:px-8 sm:py-10 md:max-w-xl md:px-10 md:py-12"
            style={{ backgroundColor: overlay }}
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {heroHeading && (
              <motion.h1
                variants={fadeUp}
                className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl"
              >
                {heroHeading}
              </motion.h1>
            )}
            {heroDescription && (
              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm leading-relaxed text-white/90 sm:mt-5 sm:text-base"
              >
                {heroDescription}
              </motion.p>
            )}
            {heroCtaText && (
              <motion.a
                href={heroCtaLink}
                variants={fadeUp}
                className="mt-6 inline-flex px-8 py-3 text-xs font-bold uppercase tracking-wider text-white sm:mt-8 sm:px-10 sm:py-3.5 sm:text-sm"
                style={{ backgroundColor: primary }}
                whileHover={{ scale: 1.04, backgroundColor: primaryHover }}
                whileTap={{ scale: 0.98 }}
              >
                {heroCtaText}
              </motion.a>
            )}
          </motion.div>
        </div>
      </div>

      {/* Feature cards */}
      {features.length > 0 && (
        <div className="relative z-20 mx-auto -mt-12 max-w-6xl px-4 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
          <motion.div
            className="grid gap-5 sm:grid-cols-3 sm:items-end lg:gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {features.map((feature) => (
              <FeatureCard
                key={safeText(feature?.id) || safeText(feature?.title)}
                feature={feature}
                primary={primary}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* About section */}
      {(aboutHeading || videoThumb) && (
        <div
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
          style={{ backgroundColor: sectionBg }}
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-start">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
            >
              {videoThumb && (
                <motion.div variants={fadeUp} className="relative overflow-hidden rounded-lg">
                  <SafeImage
                    src={videoThumb}
                    alt={videoAlt}
                    className="aspect-[16/11] w-full object-cover"
                    fallback={videoFallback}
                  />
                  {videoUrl && (
                    <motion.a
                      href={videoUrl}
                      aria-label="Play video"
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PlayCircleOutlined className="!text-[56px] text-white sm:!text-[64px]" />
                    </motion.a>
                  )}
                </motion.div>
              )}

              {stats.length > 0 && (
                <motion.div
                  variants={fadeUp}
                  className="mt-8 flex flex-wrap gap-8 sm:mt-10 sm:gap-12"
                >
                  {stats.map((stat, index) => {
                    const Icon = resolveIcon(stat?.icon, 'WorkspacePremium')
                    const value = safeText(stat?.value)
                    const label = safeText(stat?.label)
                    if (!value && !label) return null
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <Icon className="!text-[36px] sm:!text-[40px]" style={{ color: primary }} />
                        <div>
                          {value && (
                            <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{value}</p>
                          )}
                          {label && (
                            <p className="text-xs text-gray-500 sm:text-sm">{label}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              className="lg:pt-4"
            >
              {aboutLabel && (
                <motion.p
                  variants={fadeUp}
                  className="text-sm font-bold sm:text-base"
                  style={{ color: primary }}
                >
                  {aboutLabel}
                </motion.p>
              )}
              {aboutHeading && (
                <motion.h2
                  variants={fadeUp}
                  className="mt-3 text-2xl font-bold leading-tight text-gray-900 sm:mt-4 sm:text-3xl md:text-4xl"
                >
                  {aboutHeading}
                </motion.h2>
              )}
              {aboutParagraphs.length > 0 && (
                <motion.div variants={stagger} className="mt-5 space-y-4 sm:mt-6">
                  {aboutParagraphs.map((paragraph, index) => (
                    <motion.p
                      key={index}
                      variants={fadeUp}
                      className="text-sm leading-relaxed text-gray-500 sm:text-base"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </motion.div>
              )}
              {aboutCtaText && (
                <motion.a
                  href={aboutCtaLink}
                  variants={fadeUp}
                  className="mt-8 inline-flex px-8 py-3 text-xs font-bold uppercase tracking-wider text-white sm:mt-10 sm:px-10 sm:py-3.5 sm:text-sm"
                  style={{ backgroundColor: primary }}
                  whileHover={{ scale: 1.04, backgroundColor: primaryHover }}
                  whileTap={{ scale: 0.98 }}
                >
                  {aboutCtaText}
                </motion.a>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </section>
  )
}
