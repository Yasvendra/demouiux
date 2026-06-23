import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Check from '@mui/icons-material/Check'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'ArrowForward' | 'Check'

interface ServiceItem {
  id?: string
  number?: string
  title?: string
  description?: string
  features?: string[]
  image?: { url?: string; alt?: string }
  layout?: 'text-left' | 'image-left'
  cta?: {
    readMore?: { text?: string; link?: string }
    bookNow?: { text?: string; link?: string; icon?: string }
  }
}

interface PageData {
  hero?: {
    label?: string
    headline?: string
    headlineAccents?: string[]
    subheadline?: string
  }
  servicesTitle?: string
  services?: ServiceItem[]
  theme?: {
    background?: string
    sectionAlt?: string
    accent?: string
    accentHover?: string
    text?: string
  }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  ArrowForward,
  Check,
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

function resolveIcon(name?: string | null, fallback: IconName = 'Check'): SvgIconComponent {
  if (!name?.trim()) return iconMap[fallback]
  const key = name.trim() as IconName
  return iconMap[key] ?? iconMap[fallback]
}

function renderAccentHeadline(headline: string, accents: string[], accentColor: string) {
  if (!accents.length) return headline

  const parts: Array<{ text: string; accent: boolean }> = []
  let remaining = headline

  for (const accent of accents) {
    const trimmed = accent.trim()
    if (!trimmed) continue

    const index = remaining.toLowerCase().indexOf(trimmed.toLowerCase())
    if (index === -1) continue

    if (index > 0) parts.push({ text: remaining.slice(0, index), accent: false })
    parts.push({ text: remaining.slice(index, index + trimmed.length), accent: true })
    remaining = remaining.slice(index + trimmed.length)
  }

  if (remaining) parts.push({ text: remaining, accent: false })

  return parts.map((part, index) =>
    part.accent ? (
      <span
        key={index}
        className="font-display italic"
        style={{ color: accentColor }}
      >
        {part.text}
      </span>
    ) : (
      <span key={index}>{part.text}</span>
    ),
  )
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

function ServiceBlock({
  service,
  accent,
  accentHover,
  textColor,
  sectionBg,
}: {
  service: ServiceItem
  accent: string
  accentHover: string
  textColor: string
  sectionBg: string
}) {
  const number = safeText(service?.number)
  const title = safeText(service?.title)
  const description = safeText(service?.description)
  const features = safeArray(service?.features).map((f) => safeText(f)).filter(Boolean)
  const imageUrl = safeText(service?.image?.url)
  const imageAlt = safeText(service?.image?.alt, title)
  const imageLeft = service?.layout === 'image-left'

  const readMoreText = safeText(service?.cta?.readMore?.text, 'Read More')
  const readMoreLink = safeText(service?.cta?.readMore?.link, '#')
  const bookNowText = safeText(service?.cta?.bookNow?.text, 'Book Now')
  const bookNowLink = safeText(service?.cta?.bookNow?.link, '#')
  const BookIcon = resolveIcon(service?.cta?.bookNow?.icon, 'ArrowForward')

  const imageFallback =
    'https://images.unsplash.com/photo-1614252239476-9dfdb3a50b8f?w=700&h=850&fit=crop&q=80'

  if (!title && !description && !imageUrl) return null

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      className="grid items-center gap-8 py-12 sm:gap-10 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20"
      style={{ backgroundColor: sectionBg }}
    >
      <div className={`${imageLeft ? 'lg:order-2' : 'lg:order-1'}`}>
        <div className="flex items-start gap-4 sm:gap-6">
          {number && (
            <span
              className="font-display text-4xl leading-none sm:text-5xl md:text-6xl"
              style={{ color: textColor }}
            >
              {number}.
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && (
              <h3
                className="font-display text-xl font-semibold sm:text-2xl md:text-3xl"
                style={{ color: textColor }}
              >
                {title}
              </h3>
            )}
            <div className="mt-3 h-px w-full max-w-md bg-gray-300/80" aria-hidden />
            {description && (
              <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                {description}
              </p>
            )}
            {features.length > 0 && (
              <ul className="mt-5 space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <Check className="!mt-0.5 !text-[16px] shrink-0" style={{ color: accent }} />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
              {readMoreText && (
                <motion.a
                  href={readMoreLink}
                  className="inline-flex items-center border px-5 py-2.5 text-xs font-medium uppercase tracking-wider sm:px-6 sm:py-3 sm:text-sm"
                  style={{ borderColor: accent, color: accent }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease }}
                >
                  {readMoreText}
                </motion.a>
              )}
              {bookNowText && (
                <motion.a
                  href={bookNowLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-white sm:px-6 sm:py-3 sm:text-sm"
                  style={{ backgroundColor: accent }}
                  whileHover={{ scale: 1.03, y: -1, backgroundColor: accentHover }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease }}
                >
                  {bookNowText}
                  <BookIcon className="!text-[16px]" />
                </motion.a>
              )}
            </div>
          </div>
        </div>
      </div>

      {imageUrl && (
        <motion.div
          variants={fadeUp}
          className={`${imageLeft ? 'lg:order-1' : 'lg:order-2'}`}
        >
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.35, ease }}>
            <SafeImage
              src={imageUrl}
              alt={imageAlt}
              className="aspect-[4/5] w-full border-4 border-white object-cover shadow-sm sm:max-w-md lg:ml-auto lg:max-w-none"
              fallback={imageFallback}
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function Design() {
  const page = data?.page ?? null
  const hero = page?.hero ?? null
  const services = safeArray(page?.services)

  const background = safeText(page?.theme?.background, '#F9F7F4')
  const sectionAlt = safeText(page?.theme?.sectionAlt, '#FFFFFF')
  const accent = safeText(page?.theme?.accent, '#C4A882')
  const accentHover = safeText(page?.theme?.accentHover, '#b09470')
  const textColor = safeText(page?.theme?.text, '#2d2a26')

  const heroLabel = safeText(hero?.label)
  const heroHeadline = safeText(hero?.headline)
  const heroAccents = safeArray(hero?.headlineAccents).map((a) => safeText(a)).filter(Boolean)
  const heroSubheadline = safeText(hero?.subheadline)
  const servicesTitle = safeText(page?.servicesTitle, 'SERVICES')

  const hasContent =
    Boolean(page) && (heroHeadline || services.length > 0 || heroLabel)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  return (
    <section
      className="h-full min-h-0 overflow-x-hidden overflow-y-auto"
      style={{ backgroundColor: background }}
    >
      {/* Hero */}
      <motion.div
        className="mx-auto max-w-4xl px-6 py-14 text-center sm:px-8 sm:py-16 md:py-20"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {heroLabel && (
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-600 sm:text-xs"
          >
            {heroLabel}
          </motion.p>
        )}
        {heroHeadline && (
          <motion.h1
            variants={fadeUp}
            className="font-display mt-5 text-2xl font-semibold leading-snug sm:mt-6 sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-tight"
            style={{ color: textColor }}
          >
            {renderAccentHeadline(heroHeadline, heroAccents, accent)}
          </motion.h1>
        )}
        {heroSubheadline && (
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-gray-600 sm:mt-6 sm:text-base"
          >
            {heroSubheadline}
          </motion.p>
        )}
      </motion.div>

      {/* Services title */}
      {servicesTitle && (
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="font-display text-center text-3xl font-semibold uppercase tracking-[0.12em] sm:text-4xl md:text-5xl"
          style={{ color: textColor }}
        >
          {servicesTitle}
        </motion.h2>
      )}

      {/* Service blocks */}
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        {services.map((service, index) => (
          <ServiceBlock
            key={safeText(service?.id) || index}
            service={service}
            accent={accent}
            accentHover={accentHover}
            textColor={textColor}
            sectionBg={index % 2 === 0 ? sectionAlt : background}
          />
        ))}
      </div>

      <div className="h-10 sm:h-14" aria-hidden />
    </section>
  )
}
