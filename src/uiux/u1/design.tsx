import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import CalculateOutlined from '@mui/icons-material/CalculateOutlined'
import CheckCircle from '@mui/icons-material/CheckCircle'
import ChevronRight from '@mui/icons-material/ChevronRight'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import SavingsOutlined from '@mui/icons-material/SavingsOutlined'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'Calculate' | 'ReceiptLong' | 'Savings' | 'CheckCircle' | 'ChevronRight'

interface StatCard {
  value?: string
  label?: string
  icon?: string
  variant?: 'light' | 'dark'
}

interface FeatureItem {
  label?: string
  icon?: string
}

interface AboutData {
  badge?: { text?: string }
  heading?: string
  headingAccent?: string
  description?: string[]
  features?: FeatureItem[]
  cta?: { text?: string; link?: string }
  stats?: StatCard[]
  image?: { url?: string; alt?: string }
  theme?: { primary?: string; primaryLight?: string; primaryDark?: string }
}

interface DesignPageData {
  about?: AboutData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  Calculate: CalculateOutlined,
  ReceiptLong: ReceiptLongOutlined,
  Savings: SavingsOutlined,
  CheckCircle,
  ChevronRight,
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease },
  },
}

const fadeInVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease },
  },
}

function safeText(value?: string | null, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function safeArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : []
}

function resolveIcon(name?: string | null, fallback: IconName = 'CheckCircle'): SvgIconComponent {
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

function StatCardItem({
  stat,
  index,
  primary,
  primaryLight,
  primaryDark,
}: {
  stat: StatCard
  index: number
  primary: string
  primaryLight: string
  primaryDark: string
}) {
  const isDark = stat?.variant === 'dark'
  const value = safeText(stat?.value)
  const label = safeText(stat?.label)
  const Icon = resolveIcon(stat?.icon, 'Calculate')

  if (!value && !label) return null

  return (
    <motion.article
      variants={fadeUpVariants}
      custom={index}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.25, ease },
      }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-default rounded-2xl shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-purple-900/10"
      style={{
        backgroundColor: isDark ? primary : primaryLight,
        color: isDark ? '#ffffff' : primaryDark,
      }}
    >
      <div className="flex items-center gap-4 px-5 py-6 sm:gap-5 sm:px-6 sm:py-7 md:px-7 md:py-8">
        <motion.div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(99,73,177,0.12)',
            color: isDark ? '#ffffff' : primary,
          }}
          whileHover={{ rotate: 6, scale: 1.08 }}
          transition={{ duration: 0.25, ease }}
        >
          <Icon className="!text-[24px] sm:!text-[28px]" />
        </motion.div>
        <div className="min-w-0">
          {value && (
            <p className="text-2xl font-bold leading-none tracking-tight sm:text-3xl md:text-[2rem]">
              {value}
            </p>
          )}
          {label && (
            <p className="mt-1.5 text-sm font-medium opacity-90 sm:mt-2 sm:text-base">{label}</p>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function FeatureListItem({
  feature,
  index,
  primary,
}: {
  feature: FeatureItem
  index: number
  primary: string
}) {
  const label = safeText(feature?.label)
  if (!label) return null

  const Icon = resolveIcon(feature?.icon, 'CheckCircle')

  return (
    <motion.li
      variants={fadeUpVariants}
      custom={index}
      whileHover={{ x: 6 }}
      transition={{ duration: 0.2, ease }}
      className="group flex items-center gap-3 rounded-lg px-1 py-1"
    >
      <motion.span
        className="flex shrink-0 items-center justify-center"
        whileHover={{ scale: 1.15, rotate: 8 }}
        transition={{ duration: 0.2, ease }}
      >
        <Icon className="!text-[20px] transition-colors sm:!text-[22px]" style={{ color: primary }} />
      </motion.span>
      <span className="text-sm font-medium text-gray-800 transition-colors group-hover:text-gray-900 sm:text-base">
        {label}
      </span>
    </motion.li>
  )
}

export default function Design() {
  const about = data?.about ?? null

  const primary = safeText(about?.theme?.primary, '#6349b1')
  const primaryLight = safeText(about?.theme?.primaryLight, '#f3eff9')
  const primaryDark = safeText(about?.theme?.primaryDark, '#4f3a8f')

  const heading = safeText(about?.heading)
  const headingParts = splitHeading(heading, about?.headingAccent)
  const paragraphs = safeArray(about?.description).map((item) => safeText(item)).filter(Boolean)
  const stats = safeArray(about?.stats).filter(
    (item) => safeText(item?.value) || safeText(item?.label),
  )
  const features = safeArray(about?.features).filter((item) => safeText(item?.label))
  const badgeText = safeText(about?.badge?.text)
  const imageUrl = safeText(about?.image?.url, 'https://picsum.photos/900/1100')
  const imageAlt = safeText(about?.image?.alt, 'Professional consultation')
  const ctaText = safeText(about?.cta?.text, 'Book an Appointment')
  const ctaLink = safeText(about?.cta?.link, '#')

  const [imageFailed, setImageFailed] = useState(false)
  const resolvedImageUrl = imageFailed
    ? 'https://picsum.photos/seed/about-consultation/900/1100'
    : imageUrl

  const hasContent =
    Boolean(about) &&
    (heading ||
      paragraphs.length > 0 ||
      stats.length > 0 ||
      features.length > 0 ||
      badgeText ||
      ctaText)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  return (
    <section className="min-h-screen overflow-y-auto overflow-x-hidden bg-white px-4 py-10 sm:px-6 sm:py-14 md:px-8 md:py-16 lg:px-12 lg:py-20 xl:px-16">
      <motion.div
        className="mx-auto grid max-w-7xl items-center gap-8 sm:gap-10 md:gap-12 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {/* Content — first on mobile for readability */}
        <motion.div
          variants={fadeUpVariants}
          className="order-1 flex flex-col items-start text-left lg:order-3"
        >
          {badgeText && (
            <motion.span
              variants={fadeUpVariants}
              whileHover={{ scale: 1.04 }}
              className="mb-4 inline-block rounded-md px-3.5 py-1.5 text-xs font-semibold sm:mb-5 sm:px-4 sm:text-sm"
              style={{ backgroundColor: primaryLight, color: primary }}
            >
              {badgeText}
            </motion.span>
          )}

          {heading && (
            <motion.h2
              variants={fadeUpVariants}
              className="font-display relative max-w-xl text-[1.75rem] font-semibold leading-[1.15] text-gray-900 sm:text-3xl md:text-4xl lg:text-[2.4rem] xl:text-[2.65rem]"
            >
              {headingParts.before}
              {headingParts.accent ? (
                <span className="relative inline-block">
                  <span
                    className="absolute -top-4 left-1/2 flex -translate-x-1/2 gap-0.5 sm:-top-5 sm:gap-1"
                    aria-hidden
                  >
                    {[3, 4, 3].map((height, i) => (
                      <span
                        key={i}
                        className="block w-[2px] rotate-[28deg] rounded-full"
                        style={{ height: `${height * 4}px`, backgroundColor: primary }}
                      />
                    ))}
                  </span>
                  {headingParts.accent}
                </span>
              ) : null}
              {headingParts.after}
            </motion.h2>
          )}

          {paragraphs.length > 0 && (
            <motion.div variants={fadeUpVariants} className="mt-5 max-w-xl space-y-3 sm:mt-6 sm:space-y-4">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={`paragraph-${index}`}
                  className="text-sm leading-relaxed text-gray-600 sm:text-base md:text-[1.05rem]"
                >
                  {paragraph}
                </p>
              ))}
            </motion.div>
          )}

          {features.length > 0 && (
            <motion.ul
              variants={containerVariants}
              className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4 md:gap-x-6 md:gap-y-5"
            >
              {features.map((feature, index) => (
                <FeatureListItem
                  key={`${safeText(feature?.label)}-${index}`}
                  feature={feature}
                  index={index}
                  primary={primary}
                />
              ))}
            </motion.ul>
          )}

          {ctaText && (
            <motion.a
              href={ctaLink}
              variants={fadeUpVariants}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-purple-900/15 transition-shadow hover:shadow-lg hover:shadow-purple-900/25 sm:mt-10 sm:w-auto sm:gap-4 sm:px-7 sm:py-4 sm:text-base"
              style={{ backgroundColor: primary }}
            >
              {ctaText}
              <motion.span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 sm:h-8 sm:w-8"
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2, ease }}
              >
                <ChevronRight className="!text-[18px] sm:!text-[20px]" />
              </motion.span>
            </motion.a>
          )}
        </motion.div>

        {/* Image — center on all breakpoints */}
        <motion.div
          variants={fadeInVariants}
          className="order-2 mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg lg:order-2 lg:max-w-none"
        >
          <motion.div
            className="overflow-hidden rounded-2xl shadow-lg shadow-purple-900/10"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.35, ease }}
          >
            <motion.img
              src={resolvedImageUrl}
              alt={imageAlt}
              className="aspect-[4/5] w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.5, ease }}
            />
          </motion.div>
        </motion.div>

        {/* Stats — bottom on mobile, left on desktop */}
        {stats.length > 0 && (
          <motion.div
            variants={containerVariants}
            className="order-3 flex flex-col gap-4 sm:gap-5 lg:order-1"
          >
            {stats.map((stat, index) => (
              <StatCardItem
                key={`${safeText(stat?.value)}-${index}`}
                stat={stat}
                index={index}
                primary={primary}
                primaryLight={primaryLight}
                primaryDark={primaryDark}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
