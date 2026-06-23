import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import CheckCircle from '@mui/icons-material/CheckCircle'
import FiberManualRecord from '@mui/icons-material/FiberManualRecord'
import Handshake from '@mui/icons-material/Handshake'
import Speed from '@mui/icons-material/Speed'
import VerifiedUser from '@mui/icons-material/VerifiedUser'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName =
  | 'FiberManualRecord'
  | 'ArrowForward'
  | 'CheckCircle'
  | 'Handshake'
  | 'Speed'
  | 'VerifiedUser'

interface CtaItem {
  text?: string
  link?: string
  variant?: string
}

interface BadgeItem {
  text?: string
  icon?: string
}

interface AboutFeature {
  title?: string
  description?: string
  icon?: string
}

interface StatItem {
  value?: string
  label?: string
}

interface PageData {
  hero?: {
    badge?: BadgeItem
    heading?: string
    description?: string
    ctas?: CtaItem[]
    image?: string
    imageAlt?: string
  }
  featureCards?: {
    update?: {
      title?: string
      description?: string
      placeholder?: string
      button?: { text?: string; link?: string }
    }
    features?: string[]
    help?: {
      title?: string
      description?: string
      link?: { text?: string; link?: string; icon?: string }
    }
  }
  about?: {
    badge?: BadgeItem
    heading?: string
    description?: string
    mainImage?: string
    mainImageAlt?: string
    overlayImage?: string
    overlayImageAlt?: string
    trustedBadge?: { value?: string; label?: string }
    features?: AboutFeature[]
  }
  stats?: StatItem[]
  theme?: {
    primary?: string
    primaryDark?: string
    primaryHover?: string
    lavender?: string
    text?: string
    muted?: string
  }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  FiberManualRecord,
  ArrowForward,
  CheckCircle,
  Handshake,
  Speed,
  VerifiedUser,
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
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

function SectionBadge({
  badge,
  primary,
  muted,
}: {
  badge: BadgeItem
  primary: string
  muted: string
}) {
  const Icon = resolveIcon(badge?.icon, 'FiberManualRecord')
  const text = safeText(badge?.text)
  if (!text) return null

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm" style={{ color: muted }}>
      <Icon className="!text-[10px]" style={{ color: primary }} />
      {text}
    </div>
  )
}

export default function Design() {
  const page = data?.page ?? null
  const hero = page?.hero ?? null
  const featureCards = page?.featureCards ?? null
  const about = page?.about ?? null

  const primary = safeText(page?.theme?.primary, '#8B5CF6')
  const primaryDark = safeText(page?.theme?.primaryDark, '#7C3AED')
  const primaryHover = safeText(page?.theme?.primaryHover, '#7C3AED')
  const lavender = safeText(page?.theme?.lavender, '#F5F3FF')
  const textColor = safeText(page?.theme?.text, '#1F2937')
  const muted = safeText(page?.theme?.muted, '#6B7280')

  const heroHeading = safeText(hero?.heading)
  const heroDescription = safeText(hero?.description)
  const heroImage = safeText(hero?.image)
  const heroImageAlt = safeText(hero?.imageAlt, 'Payment hero')
  const heroCtas = safeArray(hero?.ctas).filter((c) => safeText(c?.text))

  const updateCard = featureCards?.update ?? null
  const featureList = safeArray(featureCards?.features).filter(Boolean)
  const helpCard = featureCards?.help ?? null

  const aboutHeading = safeText(about?.heading)
  const aboutDescription = safeText(about?.description)
  const mainImage = safeText(about?.mainImage)
  const mainImageAlt = safeText(about?.mainImageAlt, 'About main')
  const overlayImage = safeText(about?.overlayImage)
  const overlayImageAlt = safeText(about?.overlayImageAlt, 'About overlay')
  const trustedValue = safeText(about?.trustedBadge?.value)
  const trustedLabel = safeText(about?.trustedBadge?.label)
  const aboutFeatures = safeArray(about?.features).filter((f) => safeText(f?.title))
  const stats = safeArray(page?.stats).filter((s) => safeText(s?.value))

  const hasContent = Boolean(page) && (heroHeading || aboutHeading)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <p className="text-gray-500">No content available.</p>
      </section>
    )
  }

  const heroFallback =
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&h=900&fit=crop&q=80'
  const mainFallback =
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=800&fit=crop&q=80'
  const overlayFallback =
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop&q=80'

  const HelpLinkIcon = resolveIcon(helpCard?.link?.icon, 'ArrowForward')

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white font-sans">
      {/* Hero */}
      <div className="relative pb-6 sm:pb-8" style={{ backgroundColor: lavender }}>
        <div className="relative overflow-hidden pb-28 sm:pb-32 lg:pb-36">
          {/* Lavender left + purple right split */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-0" style={{ backgroundColor: lavender }} />
            <div
              className="absolute bottom-0 right-0 top-0 w-[42%]"
              style={{
                background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
              }}
            />
            <div
              className="absolute right-0 top-0 h-full w-[42%] opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(30deg, transparent 40%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.15) 42%, transparent 42%), linear-gradient(150deg, transparent 50%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.08) 52%, transparent 52%)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-2 lg:gap-10 lg:px-10 lg:py-14">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="relative z-10 max-w-lg"
            >
              {hero?.badge && (
                <motion.div variants={fadeUp}>
                  <SectionBadge badge={hero.badge} primary={primary} muted={muted} />
                </motion.div>
              )}
              {heroHeading && (
                <motion.h1
                  variants={fadeUp}
                  className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl"
                  style={{ color: textColor }}
                >
                  {heroHeading}
                </motion.h1>
              )}
              {heroDescription && (
                <motion.p
                  variants={fadeUp}
                  className="mt-3 text-xs leading-relaxed sm:mt-4 sm:text-sm"
                  style={{ color: muted }}
                >
                  {heroDescription}
                </motion.p>
              )}
              {heroCtas.length > 0 && (
                <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-3 sm:mt-6">
                  {heroCtas.map((cta, index) => {
                    const isPrimary = safeText(cta?.variant) !== 'outline'
                    return (
                      <a
                        key={index}
                        href={safeText(cta?.link, '#')}
                        className="rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors sm:px-6 sm:py-2.5 sm:text-xs"
                        style={
                          isPrimary
                            ? { backgroundColor: primary, color: '#ffffff' }
                            : {
                                backgroundColor: '#ffffff',
                                color: textColor,
                                border: `1px solid ${muted}40`,
                              }
                        }
                        onMouseEnter={(e) => {
                          if (isPrimary) e.currentTarget.style.backgroundColor = primaryHover
                        }}
                        onMouseLeave={(e) => {
                          if (isPrimary) e.currentTarget.style.backgroundColor = primary
                        }}
                      >
                        {safeText(cta?.text)}
                      </a>
                    )
                  })}
                </motion.div>
              )}
            </motion.div>

            {heroImage && (
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease }}
                className="relative z-10 flex justify-center lg:justify-end"
              >
                <SafeImage
                  src={heroImage}
                  alt={heroImageAlt}
                  className="w-full max-w-[220px] object-contain sm:max-w-[260px] lg:max-w-[280px]"
                  fallback={heroFallback}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Overlapping feature cards */}
        {(updateCard || featureList.length > 0 || helpCard) && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease }}
            className="relative z-20 mx-auto -mt-24 w-full max-w-6xl px-5 sm:-mt-28 sm:px-8 lg:-mt-32 lg:px-10"
          >
            <div className="relative flex flex-col lg:flex-row lg:items-stretch">
              {/* Purple card — back layer, content stays in visible left zone */}
              {safeText(updateCard?.title) && (
                <div
                  className="relative z-0 w-full shrink-0 overflow-hidden rounded-3xl px-7 py-8 shadow-lg sm:px-9 sm:py-9 lg:w-[min(100%,400px)] lg:min-h-[220px]"
                  style={{
                    background: `linear-gradient(155deg, ${primary} 0%, ${primaryDark} 100%)`,
                  }}
                >
                  <div className="relative max-w-[300px]">
                    <h3 className="text-base font-bold tracking-tight text-white sm:text-lg">
                      {safeText(updateCard?.title)}
                    </h3>
                    {safeText(updateCard?.description) && (
                      <p className="mt-3 text-xs leading-relaxed text-white/90 sm:text-sm">
                        {safeText(updateCard?.description)}
                      </p>
                    )}
                    <div className="mt-6 flex items-center gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/20">
                      <input
                        type="email"
                        placeholder={safeText(updateCard?.placeholder, 'Your Email')}
                        className="min-w-0 flex-1 bg-transparent py-2.5 pl-4 text-xs text-white placeholder:text-white/55 outline-none sm:text-sm"
                      />
                      <a
                        href={safeText(updateCard?.button?.link, '#request')}
                        className="shrink-0 rounded-full bg-white px-5 py-2.5 text-xs font-bold shadow-sm transition-opacity hover:opacity-90 sm:px-6"
                        style={{ color: primary }}
                      >
                        {safeText(updateCard?.button?.text, 'Request')}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* White card — front layer, overlaps purple right edge only */}
              {(featureList.length > 0 || safeText(helpCard?.title)) && (
                <div className="relative z-10 -mt-8 w-full rounded-3xl border border-gray-100/80 bg-white px-7 py-8 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.18)] sm:-mt-10 sm:px-9 sm:py-9 lg:-ml-24 lg:mt-0 lg:flex-1 lg:min-w-0 lg:self-center lg:px-10 lg:py-10 xl:-ml-32">
                  <div className="grid min-w-0 gap-8 sm:grid-cols-2 sm:gap-10">
                    {featureList.length > 0 && (
                      <ul className="space-y-3">
                        {featureList.map((item, index) => (
                          <li key={index} className="flex items-center gap-2.5">
                            <span
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: `${primary}14` }}
                            >
                              <CheckCircle className="!text-[14px]" style={{ color: primary }} />
                            </span>
                            <span className="text-sm font-medium" style={{ color: textColor }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {safeText(helpCard?.title) && (
                      <div className="flex flex-col justify-center">
                        <h4 className="text-base font-bold tracking-tight sm:text-lg" style={{ color: textColor }}>
                          {safeText(helpCard?.title)}
                        </h4>
                        {safeText(helpCard?.description) && (
                          <p className="mt-3 text-sm leading-relaxed" style={{ color: muted }}>
                            {safeText(helpCard?.description)}
                          </p>
                        )}
                        {safeText(helpCard?.link?.text) && (
                          <a
                            href={safeText(helpCard?.link?.link, '#')}
                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                            style={{ color: primary }}
                          >
                            {safeText(helpCard?.link?.text)}
                            <HelpLinkIcon className="!text-[16px]" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* About Company */}
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="relative mx-auto w-full max-w-sm lg:mx-0"
          >
            {mainImage && (
              <SafeImage
                src={mainImage}
                alt={mainImageAlt}
                className="w-full rounded-2xl object-cover shadow-md sm:rounded-3xl"
                fallback={mainFallback}
              />
            )}
            {overlayImage && (
              <SafeImage
                src={overlayImage}
                alt={overlayImageAlt}
                className="absolute -bottom-4 -left-4 w-28 rounded-xl object-cover shadow-lg sm:-bottom-6 sm:-left-6 sm:w-32 sm:rounded-2xl"
                fallback={overlayFallback}
              />
            )}
            {(trustedValue || trustedLabel) && (
              <div
                className="absolute -right-2 top-1/2 flex h-24 w-24 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center text-white shadow-lg sm:-right-4 sm:h-28 sm:w-28"
                style={{ backgroundColor: primary }}
              >
                {trustedValue && (
                  <span className="text-sm font-extrabold leading-none sm:text-base">{trustedValue}</span>
                )}
                {trustedLabel && (
                  <span className="mt-0.5 px-2 text-[8px] font-medium leading-tight sm:text-[10px]">
                    {trustedLabel}
                  </span>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease, delay: 0.06 }}
          >
            {about?.badge && (
              <SectionBadge badge={about.badge} primary={primary} muted={muted} />
            )}
            {aboutHeading && (
              <h2
                className="mt-3 text-xl font-extrabold leading-tight sm:text-2xl md:text-3xl"
                style={{ color: textColor }}
              >
                {aboutHeading}
              </h2>
            )}
            {aboutDescription && (
              <p className="mt-3 text-xs leading-relaxed sm:mt-4 sm:text-sm" style={{ color: muted }}>
                {aboutDescription}
              </p>
            )}

            {aboutFeatures.length > 0 && (
              <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
                {aboutFeatures.map((feature, index) => {
                  const Icon = resolveIcon(feature?.icon, 'Handshake')
                  const title = safeText(feature?.title)
                  const desc = safeText(feature?.description)
                  return (
                    <div key={index} className="flex gap-3 sm:gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11"
                        style={{ backgroundColor: `${primary}18`, color: primary }}
                      >
                        <Icon className="!text-[20px] sm:!text-[22px]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold sm:text-sm" style={{ color: textColor }}>
                          {title}
                        </h3>
                        {desc && (
                          <p className="mt-1 text-[10px] leading-relaxed sm:text-xs" style={{ color: muted }}>
                            {desc}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Statistics */}
      {stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="border-t border-gray-100"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-4 lg:px-10">
            {stats.map((stat, index) => (
              <div key={index} className="text-center md:text-left">
                <p className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: textColor }}>
                  {safeText(stat?.value)}
                </p>
                <p className="mt-1.5 text-xs uppercase tracking-wider" style={{ color: muted }}>
                  {safeText(stat?.label)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  )
}
