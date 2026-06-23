import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import AppSettingsAlt from '@mui/icons-material/AppSettingsAlt'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Campaign from '@mui/icons-material/Campaign'
import Close from '@mui/icons-material/Close'
import Computer from '@mui/icons-material/Computer'
import Groups from '@mui/icons-material/Groups'
import Settings from '@mui/icons-material/Settings'
import South from '@mui/icons-material/South'
import TrendingUp from '@mui/icons-material/TrendingUp'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName =
  | 'Computer'
  | 'Close'
  | 'TrendingUp'
  | 'AppSettingsAlt'
  | 'Campaign'
  | 'Settings'
  | 'Groups'
  | 'ArrowForward'

interface ServiceItem {
  id?: string
  title?: string
  description?: string
  icon?: string
  variant?: 'light' | 'dark'
  backgroundImage?: string
  link?: string
}

interface FeatureItem {
  title?: string
  description?: string
  icon?: string
}

interface PageData {
  hero?: {
    label?: string
    heading?: string
    scrollText?: string
    backgroundImage?: string
    backgroundAlt?: string
  }
  services?: ServiceItem[]
  solutions?: {
    label?: string
    heading?: string
    description?: string
    mainImage?: { url?: string; alt?: string }
    secondaryImage?: { url?: string; alt?: string }
    features?: FeatureItem[]
    founder?: { name?: string; title?: string; avatar?: string; avatarAlt?: string }
    experience?: { value?: string; label?: string }
  }
  cta?: {
    image?: string
    imageAlt?: string
    text?: string
    icon?: string
    button?: { text?: string; link?: string }
  }
  theme?: { primary?: string; primaryHover?: string; dark?: string; darkAlt?: string }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  Computer,
  Close,
  TrendingUp,
  AppSettingsAlt,
  Campaign,
  Settings,
  Groups,
  ArrowForward,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

function safeText(value?: string | null, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function safeArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : []
}

function resolveIcon(name?: string | null, fallback: IconName = 'Computer'): SvgIconComponent {
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

function ServiceCard({
  service,
  primary,
}: {
  service: ServiceItem
  primary: string
}) {
  const title = safeText(service?.title)
  const description = safeText(service?.description)
  const link = safeText(service?.link, '#')
  const isDark = service?.variant === 'dark'
  const Icon = resolveIcon(service?.icon, 'Computer')
  const bgImage = safeText(service?.backgroundImage)

  if (!title) return null

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease }}
      className={`relative flex flex-col p-6 shadow-lg sm:p-8 ${
        isDark ? 'min-h-[280px] overflow-hidden text-white' : 'bg-white text-gray-900'
      }`}
    >
      {isDark && bgImage && (
        <>
          <SafeImage
            src={bgImage}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            fallback="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=700&fit=crop&q=80"
          />
          <div className="absolute inset-0 bg-black/70" aria-hidden />
        </>
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center text-center">
        <Icon className="!text-[36px] sm:!text-[40px]" style={{ color: primary }} />
        {title && (
          <h3 className="mt-4 text-sm font-bold uppercase tracking-wide sm:text-base">{title}</h3>
        )}
        {description && (
          <p className={`mt-3 flex-1 text-xs leading-relaxed sm:text-sm ${isDark ? 'text-white/80' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
        <a
          href={link}
          className={`mt-5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          Read More
          <ArrowForward className="!text-[14px]" />
        </a>
      </div>
    </motion.article>
  )
}

export default function Design() {
  const page = data?.page ?? null
  const hero = page?.hero ?? null
  const services = safeArray(page?.services)
  const solutions = page?.solutions ?? null
  const cta = page?.cta ?? null

  const primary = safeText(page?.theme?.primary, '#FF3D3D')
  const primaryHover = safeText(page?.theme?.primaryHover, '#e63535')
  const darkAlt = safeText(page?.theme?.darkAlt, '#111111')

  const heroLabel = safeText(hero?.label)
  const heroHeading = safeText(hero?.heading)
  const scrollText = safeText(hero?.scrollText)
  const heroBg = safeText(hero?.backgroundImage)
  const heroBgAlt = safeText(hero?.backgroundAlt, 'Office team')

  const solutionsLabel = safeText(solutions?.label)
  const solutionsHeading = safeText(solutions?.heading)
  const solutionsDesc = safeText(solutions?.description)
  const mainImage = safeText(solutions?.mainImage?.url)
  const mainAlt = safeText(solutions?.mainImage?.alt, 'Team meeting')
  const secondaryImage = safeText(solutions?.secondaryImage?.url)
  const secondaryAlt = safeText(solutions?.secondaryImage?.alt, 'Team at laptop')
  const solutionFeatures = safeArray(solutions?.features).filter(
    (f) => safeText(f?.title) || safeText(f?.description),
  )
  const founderName = safeText(solutions?.founder?.name)
  const founderTitle = safeText(solutions?.founder?.title)
  const founderAvatar = safeText(solutions?.founder?.avatar)
  const founderAvatarAlt = safeText(solutions?.founder?.avatarAlt, founderName)
  const expValue = safeText(solutions?.experience?.value)
  const expLabel = safeText(solutions?.experience?.label)

  const ctaImage = safeText(cta?.image)
  const ctaImageAlt = safeText(cta?.imageAlt, 'Team')
  const ctaText = safeText(cta?.text)
  const CtaIcon = resolveIcon(cta?.icon, 'Groups')
  const ctaButtonText = safeText(cta?.button?.text, 'DISCOVER MORE')
  const ctaButtonLink = safeText(cta?.button?.link, '#')

  const hasContent = Boolean(page) && (heroHeading || services.length > 0 || solutionsHeading)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <p className="text-gray-500">No content available.</p>
      </section>
    )
  }

  const heroFallback =
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&h=900&fit=crop&q=80'

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white">
      {/* Hero */}
      <div className="relative min-h-[420px] sm:min-h-[480px] md:min-h-[520px]">
        {heroBg && (
          <SafeImage
            src={heroBg}
            alt={heroBgAlt}
            className="absolute inset-0 h-full w-full object-cover"
            fallback={heroFallback}
          />
        )}
        <div className="absolute inset-0 bg-black/65" aria-hidden />

        <motion.div
          className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-6 py-20 text-center sm:min-h-[480px] md:min-h-[520px]"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {heroLabel && (
            <motion.p
              variants={fadeUp}
              className="text-xs font-bold uppercase tracking-[0.15em] sm:text-sm"
              style={{ color: primary }}
            >
              {heroLabel}
            </motion.p>
          )}
          {heroHeading && (
            <motion.h1
              variants={fadeUp}
              className="mt-4 max-w-4xl text-2xl font-bold uppercase leading-tight tracking-wide text-white sm:mt-5 sm:text-3xl md:text-4xl lg:text-5xl"
            >
              {heroHeading}
            </motion.h1>
          )}
          {scrollText && (
            <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-2 sm:mt-12">
              <South className="!text-[28px] text-white/90" />
              <p className="text-sm text-white/90 sm:text-base">{scrollText}</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Service cards */}
      {services.length > 0 && (
        <div className="relative z-20 mx-auto -mt-16 max-w-7xl px-4 sm:-mt-20 sm:px-6 lg:-mt-24 lg:px-8">
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {services.map((service) => (
              <ServiceCard
                key={safeText(service?.id) || safeText(service?.title)}
                service={service}
                primary={primary}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Solutions */}
      {(solutionsHeading || mainImage) && (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {(mainImage || secondaryImage) && (
              <motion.div
                className="relative mx-auto w-full max-w-lg lg:mx-0"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.12 }}
              >
                <div
                  className="pointer-events-none absolute -left-4 top-8 z-0 h-48 w-48 border-2 sm:h-56 sm:w-56 lg:h-64 lg:w-64"
                  style={{ borderColor: primary }}
                  aria-hidden
                />
                {mainImage && (
                  <motion.div variants={fadeUp} className="relative z-10">
                    <SafeImage
                      src={mainImage}
                      alt={mainAlt}
                      className="aspect-[4/5] w-full object-cover"
                      fallback={heroFallback}
                    />
                  </motion.div>
                )}
                {secondaryImage && (
                  <motion.div
                    variants={fadeUp}
                    className="absolute -bottom-6 -right-2 z-20 w-[55%] border-4 border-white shadow-lg sm:-bottom-8 sm:right-0"
                  >
                    <SafeImage
                      src={secondaryImage}
                      alt={secondaryAlt}
                      className="aspect-[5/4] w-full object-cover"
                      fallback="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&h=400&fit=crop&q=80"
                    />
                  </motion.div>
                )}
                <div className="h-12 sm:h-16" aria-hidden />
              </motion.div>
            )}

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
            >
              {solutionsLabel && (
                <motion.p
                  variants={fadeUp}
                  className="text-xs font-bold uppercase tracking-[0.12em] sm:text-sm"
                  style={{ color: primary }}
                >
                  {solutionsLabel}
                </motion.p>
              )}
              {solutionsHeading && (
                <motion.h2
                  variants={fadeUp}
                  className="mt-3 text-2xl font-bold uppercase leading-tight tracking-wide text-gray-900 sm:mt-4 sm:text-3xl md:text-4xl"
                >
                  {solutionsHeading}
                </motion.h2>
              )}
              {solutionsDesc && (
                <motion.p
                  variants={fadeUp}
                  className="mt-5 text-sm leading-relaxed text-gray-500 sm:mt-6 sm:text-base"
                >
                  {solutionsDesc}
                </motion.p>
              )}

              {solutionFeatures.length > 0 && (
                <div className="mt-8 space-y-6 sm:mt-10">
                  {solutionFeatures.map((feature, index) => {
                    const Icon = resolveIcon(feature?.icon, 'Campaign')
                    const title = safeText(feature?.title)
                    const desc = safeText(feature?.description)
                    if (!title && !desc) return null
                    return (
                      <motion.div
                        key={index}
                        variants={fadeUp}
                        className="flex gap-4 sm:gap-5"
                      >
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white sm:h-14 sm:w-14"
                          style={{ backgroundColor: primary }}
                        >
                          <Icon className="!text-[22px] sm:!text-[24px]" />
                        </div>
                        <div>
                          {title && (
                            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900 sm:text-base">
                              {title}
                            </h4>
                          )}
                          {desc && (
                            <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                              {desc}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-wrap items-center justify-between gap-6 sm:mt-12"
              >
                {founderName && (
                  <div className="flex items-center gap-3">
                    {founderAvatar && (
                      <div className="h-12 w-12 overflow-hidden rounded-full sm:h-14 sm:w-14">
                        <SafeImage
                          src={founderAvatar}
                          alt={founderAvatarAlt}
                          className="h-full w-full object-cover"
                          fallback="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&q=80"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold uppercase sm:text-base" style={{ color: primary }}>
                        {founderName}
                      </p>
                      {founderTitle && (
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 sm:text-xs">
                          {founderTitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(expValue || expLabel) && (
                  <div className="border border-gray-200 bg-white px-6 py-4 sm:px-8 sm:py-5">
                    <div className="flex items-stretch gap-4">
                      <div>
                        {expValue && (
                          <p className="text-3xl font-bold text-gray-900 sm:text-4xl">{expValue}</p>
                        )}
                        {expLabel && (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
                            {expLabel}
                          </p>
                        )}
                      </div>
                      <div className="w-1 shrink-0" style={{ backgroundColor: primary }} aria-hidden />
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      {/* CTA bar */}
      {(ctaText || ctaButtonText) && (
        <motion.div
          className="flex flex-col items-stretch gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-10 lg:px-12"
          style={{ backgroundColor: darkAlt }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
        >
          {ctaImage && (
            <SafeImage
              src={ctaImage}
              alt={ctaImageAlt}
              className="h-24 w-full object-cover sm:h-28 sm:w-40 sm:shrink-0"
              fallback="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=280&fit=crop&q=80"
            />
          )}

          {ctaText && (
            <div className="flex flex-1 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white sm:h-14 sm:w-14">
                <CtaIcon className="!text-[24px]" style={{ color: primary }} />
              </div>
              <p className="text-xs font-bold uppercase leading-snug tracking-wide text-white sm:text-sm md:text-base">
                {ctaText}
              </p>
            </div>
          )}

          {ctaButtonText && (
            <motion.a
              href={ctaButtonLink}
              className="inline-flex shrink-0 items-center justify-center px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white sm:px-10 sm:py-4 sm:text-sm"
              style={{ backgroundColor: primary }}
              whileHover={{ scale: 1.04, backgroundColor: primaryHover }}
              whileTap={{ scale: 0.98 }}
            >
              {ctaButtonText}
            </motion.a>
          )}
        </motion.div>
      )}
    </section>
  )
}
