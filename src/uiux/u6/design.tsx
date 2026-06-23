import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'ArrowForward'

interface BrandSection {
  title?: string
  intro?: string
  paragraphs?: string[]
  cta?: { text?: string; link?: string; icon?: string }
  image?: { url?: string; alt?: string }
}

interface BioSection {
  name?: string
  title?: string
  tagline?: string
  intro?: string
  paragraphs?: string[]
  mainImage?: { url?: string; alt?: string }
  secondaryImage?: { url?: string; alt?: string }
}

interface PageData {
  brand?: BrandSection
  bio?: BioSection
  theme?: {
    beige?: string
    tan?: string
    tanHover?: string
    headingTan?: string
    border?: string
  }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  ArrowForward,
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
}

const fadeLeft = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
}

const fadeRight = {
  hidden: { opacity: 0, x: 28 },
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
  const brand = page?.brand ?? null
  const bio = page?.bio ?? null

  const beige = safeText(page?.theme?.beige, '#D2C7BC')
  const tan = safeText(page?.theme?.tan, '#B09B82')
  const tanHover = safeText(page?.theme?.tanHover, '#9a8670')
  const headingTan = safeText(page?.theme?.headingTan, '#C6B6A5')
  const borderColor = safeText(page?.theme?.border, '#d1cdc8')

  const brandTitle = safeText(brand?.title)
  const brandIntro = safeText(brand?.intro)
  const brandParagraphs = safeArray(brand?.paragraphs).map((p) => safeText(p)).filter(Boolean)
  const ctaText = safeText(brand?.cta?.text, 'WORK WITH US')
  const ctaLink = safeText(brand?.cta?.link, '#')
  const CtaIcon = resolveIcon(brand?.cta?.icon, 'ArrowForward')
  const brandImage = safeText(brand?.image?.url)
  const brandImageAlt = safeText(brand?.image?.alt, 'Brand portrait')

  const bioName = safeText(bio?.name)
  const bioTitle = safeText(bio?.title)
  const bioTagline = safeText(bio?.tagline)
  const bioIntro = safeText(bio?.intro)
  const bioParagraphs = safeArray(bio?.paragraphs).map((p) => safeText(p)).filter(Boolean)
  const mainImage = safeText(bio?.mainImage?.url)
  const mainAlt = safeText(bio?.mainImage?.alt, 'Founder portrait')
  const secondaryImage = safeText(bio?.secondaryImage?.url)
  const secondaryAlt = safeText(bio?.secondaryImage?.alt, 'Lifestyle detail')

  const hasContent =
    Boolean(page) &&
    (brandTitle ||
      brandIntro ||
      brandParagraphs.length > 0 ||
      brandImage ||
      bioName ||
      mainImage)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  const brandImageFallback =
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&h=900&fit=crop&q=80'
  const mainImageFallback =
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=700&h=950&fit=crop&q=80'
  const secondaryImageFallback =
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=380&fit=crop&q=80'

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white">
      {/* Brand section */}
      <div className="grid lg:grid-cols-2">
        <motion.div
          className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-14 md:px-14 md:py-16 lg:px-16 lg:py-20"
          style={{ backgroundColor: beige }}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {brandTitle && (
            <motion.h2
              variants={fadeLeft}
              className="font-display text-2xl font-bold uppercase tracking-wide text-black sm:text-3xl md:text-4xl"
            >
              {brandTitle}
            </motion.h2>
          )}

          {brandIntro && (
            <motion.p
              variants={fadeLeft}
              className="mt-4 max-w-md text-xs leading-relaxed text-black sm:mt-5 sm:text-sm"
            >
              {brandIntro}
            </motion.p>
          )}

          {brandParagraphs.length > 0 && (
            <motion.div variants={stagger} className="mt-5 space-y-4 sm:mt-6">
              {brandParagraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  variants={fadeUp}
                  className="max-w-md text-xs leading-relaxed text-black/85 sm:text-sm sm:leading-7"
                >
                  {paragraph}
                </motion.p>
              ))}
            </motion.div>
          )}

          {ctaText && (
            <motion.a
              href={ctaLink}
              variants={fadeUp}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white sm:mt-10 sm:w-auto sm:px-8 sm:py-3.5 sm:text-sm"
              style={{ backgroundColor: tan }}
              whileHover={{ scale: 1.03, y: -2, backgroundColor: tanHover }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.22, ease }}
            >
              {ctaText}
              <CtaIcon className="!text-[16px]" />
            </motion.a>
          )}
        </motion.div>

        {brandImage && (
          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-16"
          >
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.4, ease }}>
              <SafeImage
                src={brandImage}
                alt={brandImageAlt}
                className="mx-auto aspect-[3/4] w-full max-w-sm object-cover sm:max-w-md"
                fallback={brandImageFallback}
              />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Bio section */}
      <div className="bg-white px-6 py-12 sm:px-10 sm:py-16 md:px-14 lg:px-16 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
          {/* Images */}
          {(mainImage || secondaryImage) && (
            <motion.div
              className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
            >
              <div
                className="pointer-events-none absolute -bottom-6 -left-6 z-0 h-[85%] w-[75%] border border-gray-300/80 sm:-bottom-8 sm:-left-8"
                style={{ borderColor }}
                aria-hidden
              />

              {mainImage && (
                <motion.div variants={fadeLeft} className="relative z-10">
                  <SafeImage
                    src={mainImage}
                    alt={mainAlt}
                    className="aspect-[3/4] w-full max-w-sm object-cover sm:max-w-md"
                    fallback={mainImageFallback}
                  />
                </motion.div>
              )}

              {secondaryImage && (
                <motion.div
                  variants={fadeUp}
                  className="absolute bottom-0 right-0 z-20 w-[55%] max-w-[220px] border-4 border-white shadow-lg sm:max-w-[260px]"
                >
                  <SafeImage
                    src={secondaryImage}
                    alt={secondaryAlt}
                    className="aspect-[4/3] w-full object-cover"
                    fallback={secondaryImageFallback}
                  />
                </motion.div>
              )}

              <div className="h-16 sm:h-20" aria-hidden />
            </motion.div>
          )}

          {/* Bio content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            className="lg:-ml-8 xl:-ml-12"
          >
            {(bioName || bioTitle || bioTagline) && (
              <motion.div
                variants={fadeRight}
                className="relative z-30 border bg-white px-6 py-8 sm:px-8 sm:py-10 lg:-mt-16 lg:px-10 lg:py-12"
                style={{ borderColor }}
              >
                {bioName && (
                  <h3
                    className="font-display text-2xl font-semibold uppercase leading-tight sm:text-3xl md:text-4xl"
                    style={{ color: headingTan }}
                  >
                    {bioName}
                  </h3>
                )}
                {bioTitle && (
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.18em] text-black sm:text-xs">
                    {bioTitle}
                  </p>
                )}
                {bioTagline && (
                  <p className="font-display mt-4 text-lg leading-snug text-black sm:text-xl md:text-2xl">
                    {bioTagline}
                  </p>
                )}
              </motion.div>
            )}

            <div className="mt-8 space-y-4 sm:mt-10 sm:space-y-5">
              {bioIntro && (
                <motion.p variants={fadeUp} className="text-sm text-black sm:text-base">
                  {bioIntro}
                </motion.p>
              )}
              {bioParagraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  variants={fadeUp}
                  className="text-xs leading-relaxed text-black/85 sm:text-sm sm:leading-7"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
