import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import Brush from '@mui/icons-material/Brush'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'ArrowForward' | 'AutoAwesome' | 'Brush'

interface ServiceItem {
  title?: string
  description?: string
  cta?: { text?: string; link?: string; icon?: string }
}

interface BrandImage {
  src?: string
  alt?: string
}

interface PageData {
  hero?: {
    brand?: string
    tagline?: string
    backgroundImage?: string
    backgroundAlt?: string
    portraitImage?: string
    portraitAlt?: string
    cta?: { prefix?: string; emphasis?: string; suffix?: string }
    intro?: string
  }
  brand?: {
    heading?: string
    box?: { title?: string; description?: string }
    images?: BrandImage[]
  }
  services?: {
    image?: string
    imageAlt?: string
    items?: ServiceItem[]
  }
  theme?: {
    beige?: string
    beigeLight?: string
    beigeSection?: string
    tan?: string
    tanHover?: string
    ink?: string
    muted?: string
  }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  ArrowForward,
  AutoAwesome,
  Brush,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

function safeText(value?: string | null, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function safeArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : []
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
  const page = data?.page ?? null
  const hero = page?.hero ?? null
  const brand = page?.brand ?? null
  const services = page?.services ?? null

  const beige = safeText(page?.theme?.beige, '#D2C4B5')
  const beigeLight = safeText(page?.theme?.beigeLight, '#E8E0D5')
  const beigeSection = safeText(page?.theme?.beigeSection, '#E0D8CC')
  const tan = safeText(page?.theme?.tan, '#A89F91')
  const tanHover = safeText(page?.theme?.tanHover, '#968d80')
  const ink = safeText(page?.theme?.ink, '#14120f')
  const muted = safeText(page?.theme?.muted, '#5c574f')

  const brandName = safeText(hero?.brand)
  const tagline = safeText(hero?.tagline)
  const heroBg = safeText(hero?.backgroundImage)
  const portrait = safeText(hero?.portraitImage)
  const portraitAlt = safeText(hero?.portraitAlt, 'Portrait')
  const ctaPrefix = safeText(hero?.cta?.prefix)
  const ctaEmphasis = safeText(hero?.cta?.emphasis)
  const ctaSuffix = safeText(hero?.cta?.suffix)
  const heroIntro = safeText(hero?.intro)

  const brandHeading = safeText(brand?.heading)
  const boxTitle = safeText(brand?.box?.title)
  const boxDescription = safeText(brand?.box?.description)
  const brandImages = safeArray(brand?.images).filter((i) => safeText(i?.src))

  const serviceImage = safeText(services?.image)
  const serviceImageAlt = safeText(services?.imageAlt, 'Services')
  const serviceItems = safeArray(services?.items).filter((s) => safeText(s?.title))

  const hasContent = Boolean(page) && brandName

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <p className="text-gray-500">No content available.</p>
      </section>
    )
  }

  const heroBgFallback =
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600&h=700&fit=crop&q=80'
  const portraitFallback =
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=750&fit=crop&q=80'
  const serviceFallback =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=750&fit=crop&q=80'

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white font-sans">
      {/* ── Hero ── */}
      <div className="relative">
        <div className="relative h-[220px] overflow-hidden sm:h-[260px] md:h-[300px]">
          {heroBg && (
            <SafeImage
              src={heroBg}
              alt={safeText(hero?.backgroundAlt, 'Palm leaves')}
              className="absolute inset-0 h-full w-full object-cover"
              fallback={heroBgFallback}
            />
          )}
          <div className="absolute inset-0 bg-black/25" aria-hidden />

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            {brandName && (
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease }}
                className="font-display text-3xl font-light tracking-[0.2em] text-white sm:text-4xl md:text-5xl"
              >
                {brandName}
              </motion.h1>
            )}
            {tagline && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease, delay: 0.1 }}
                className="font-display mt-3 text-sm italic text-white/95 sm:text-base"
              >
                {tagline}
              </motion.p>
            )}
          </div>
        </div>

        {/* Portrait + CTA overlap */}
        <div className="relative bg-white px-5 pb-14 pt-0 sm:px-8 sm:pb-16 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
            {portrait && (
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease, delay: 0.15 }}
                className="relative -mt-24 mx-auto w-full max-w-[280px] sm:-mt-28 sm:max-w-[320px] lg:mx-0 lg:-mt-36"
              >
                <span
                  className="absolute -left-3 top-6 h-[88%] w-[78%] sm:-left-4"
                  style={{ backgroundColor: beigeLight }}
                  aria-hidden
                />
                <SafeImage
                  src={portrait}
                  alt={portraitAlt}
                  className="relative z-10 aspect-[3/4] w-full object-cover shadow-lg"
                  fallback={portraitFallback}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.25 }}
              className="lg:pt-16"
            >
              {(ctaPrefix || ctaEmphasis || ctaSuffix) && (
                <h2 className="text-xs font-medium uppercase leading-relaxed tracking-[0.18em] sm:text-sm" style={{ color: ink }}>
                  {ctaPrefix}{' '}
                  {ctaEmphasis && <em className="font-display not-italic">{ctaEmphasis}</em>}{' '}
                  {ctaSuffix}
                </h2>
              )}
            </motion.div>
          </div>

          {heroIntro && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease, delay: 0.35 }}
              className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed tracking-wide sm:text-sm"
              style={{ color: muted }}
            >
              {heroIntro}
            </motion.p>
          )}
        </div>
      </div>

      {/* ── Brand values ── */}
      {(brandHeading || boxTitle || brandImages.length > 0) && (
        <div className="bg-white px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              {brandHeading && (
                <motion.h2
                  variants={fadeUp}
                  className="font-display text-2xl italic leading-snug sm:text-3xl md:text-4xl"
                  style={{ color: ink }}
                >
                  {brandHeading}
                </motion.h2>
              )}

              {(boxTitle || boxDescription) && (
                <motion.div
                  variants={fadeUp}
                  className="mt-8 px-7 py-8 sm:mt-10 sm:px-9 sm:py-10"
                  style={{ backgroundColor: beigeLight }}
                >
                  {boxTitle && (
                    <h3
                      className="text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-xs"
                      style={{ color: ink }}
                    >
                      {boxTitle}
                    </h3>
                  )}
                  {boxDescription && (
                    <p className="mt-4 text-xs leading-relaxed tracking-wide sm:text-sm" style={{ color: muted }}>
                      {boxDescription}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>

            {brandImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="relative flex justify-center gap-4 sm:gap-5 lg:justify-end"
              >
                {brandImages.map((img, index) => (
                  <SafeImage
                    key={index}
                    src={safeText(img?.src)}
                    alt={safeText(img?.alt, `Brand image ${index + 1}`)}
                    className={`w-[42%] max-w-[180px] object-cover shadow-md sm:max-w-[200px] ${
                      index === 1 ? 'mt-12 sm:mt-16' : ''
                    } aspect-[3/5]`}
                    fallback={heroBgFallback}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ── Services ── */}
      {(serviceImage || serviceItems.length > 0) && (
        <div className="px-5 py-14 sm:px-8 sm:py-20 lg:px-12" style={{ backgroundColor: beigeSection }}>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
            {serviceImage && (
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="mx-auto w-full max-w-sm lg:mx-0"
              >
                <SafeImage
                  src={serviceImage}
                  alt={serviceImageAlt}
                  className="aspect-[3/4] w-full object-cover shadow-lg"
                  fallback={serviceFallback}
                />
              </motion.div>
            )}

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="space-y-10 sm:space-y-12 lg:pt-8"
            >
              {serviceItems.map((item, index) => {
                const CtaIcon = resolveIcon(item?.cta?.icon, 'ArrowForward')
                const title = safeText(item?.title)
                const desc = safeText(item?.description)
                const ctaText = safeText(item?.cta?.text)

                return (
                  <motion.div key={index} variants={fadeUp}>
                    {title && (
                      <h3
                        className="font-display text-lg tracking-[0.12em] sm:text-xl"
                        style={{ color: ink }}
                      >
                        {title}
                      </h3>
                    )}
                    {desc && (
                      <p className="mt-4 text-xs leading-relaxed tracking-wide sm:text-sm" style={{ color: muted }}>
                        {desc}
                      </p>
                    )}
                    {ctaText && (
                      <a
                        href={safeText(item?.cta?.link, '#')}
                        className="mt-5 inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-xs font-medium tracking-wider text-white transition-colors"
                        style={{ backgroundColor: tan }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = tanHover
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = tan
                        }}
                      >
                        {ctaText}
                        <CtaIcon className="!text-[14px]" />
                      </a>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      )}

      {/* Footer accent */}
      <div className="flex items-center justify-center gap-6 bg-white px-5 py-10 sm:py-12">
        <AutoAwesome className="!text-[20px]" style={{ color: beige }} />
        <Brush className="!text-[20px]" style={{ color: tan }} />
        <AutoAwesome className="!text-[20px]" style={{ color: beige }} />
      </div>
    </section>
  )
}
