import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import AssignmentTurnedIn from '@mui/icons-material/AssignmentTurnedIn'
import Public from '@mui/icons-material/Public'
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined'
import { AnimatePresence, motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'ArrowForward' | 'WorkOutlineOutlined' | 'Public' | 'AssignmentTurnedIn'

interface HeroSlide {
  id?: string
  heading?: string
  headingBold?: string
  description?: string
  backgroundImage?: string
  backgroundAlt?: string
}

interface FeatureItem {
  title?: string
  description?: string
  icon?: string
}

interface NewsItem {
  title?: string
  excerpt?: string
}

interface PageData {
  hero?: { slides?: HeroSlide[] }
  services?: {
    image?: string
    imageAlt?: string
    heading?: string
    description?: string
    links?: { text?: string; link?: string; icon?: string }[]
  }
  features?: FeatureItem[]
  news?: {
    title?: string
    backgroundImage?: string
    items?: NewsItem[]
    viewMore?: { text?: string; link?: string }
  }
  theme?: { primary?: string; primaryHover?: string; dark?: string; darkAlt?: string }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

/** ~5° diagonal on the full bottom edge: rise ≈ tan(5°) × viewport width */
const HERO_DIAGONAL_CLIP =
  'polygon(0 0, 100% 0, 100% calc(100% - min(8.75vw, 14%)), 0 100%)'

const iconMap: Record<IconName, SvgIconComponent> = {
  ArrowForward,
  WorkOutlineOutlined,
  Public,
  AssignmentTurnedIn,
}

const fadeLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease } },
  exit: { opacity: 0, x: 16, transition: { duration: 0.28, ease } },
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
  const services = page?.services ?? null
  const features = safeArray(page?.features)
  const news = page?.news ?? null

  const primary = safeText(page?.theme?.primary, '#FF5722')
  const dark = safeText(page?.theme?.dark, '#1a1a1a')

  const slides = safeArray(hero?.slides).filter((s) => safeText(s?.id))
  const [activeSlideId, setActiveSlideId] = useState(safeText(slides[0]?.id, '01'))

  const activeSlide = slides.find((s) => safeText(s?.id) === activeSlideId) ?? slides[0]
  const slideHeading = safeText(activeSlide?.heading)
  const slideHeadingBold = safeText(activeSlide?.headingBold)
  const slideDescription = safeText(activeSlide?.description)
  const slideBg = safeText(activeSlide?.backgroundImage)
  const slideBgAlt = safeText(activeSlide?.backgroundAlt, 'Industrial background')

  const serviceImage = safeText(services?.image)
  const serviceImageAlt = safeText(services?.imageAlt, 'Welder at work')
  const serviceHeading = safeText(services?.heading)
  const serviceDescription = safeText(services?.description)
  const serviceLinks = safeArray(services?.links).filter((l) => safeText(l?.text))

  const newsTitle = safeText(news?.title)
  const newsBg = safeText(news?.backgroundImage)
  const newsItems = safeArray(news?.items).filter((n) => safeText(n?.title))
  const viewMoreText = safeText(news?.viewMore?.text, 'VIEW MORE')
  const viewMoreLink = safeText(news?.viewMore?.link, '#news')

  const hasContent = Boolean(page) && (slides.length > 0 || serviceHeading || features.length > 0)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <p className="text-gray-500">No content available.</p>
      </section>
    )
  }

  const heroFallback =
    'https://images.unsplash.com/photo-1518709766631-a5c7d8ec546b?w=1600&h=900&fit=crop&q=80'
  const welderFallback =
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=700&h=700&fit=crop&q=80'
  const newsFallback =
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop&q=80'

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white">
      {/* Hero + diagonal transition into services */}
      <div className="relative">
        {/* Hero — bottom edge slopes up toward the right */}
        <div
          className="relative min-h-[340px] overflow-hidden pb-4 sm:min-h-[380px] sm:pb-5 md:min-h-[420px]"
          style={{ clipPath: HERO_DIAGONAL_CLIP }}
        >
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
          <div className="absolute inset-0 bg-black/55" aria-hidden />

          <div className="relative z-10 mx-auto flex min-h-[340px] max-w-6xl items-center px-4 py-10 sm:min-h-[380px] sm:px-5 sm:py-11 md:min-h-[420px] lg:px-6">
            <div className="max-w-md text-left pr-12 sm:pr-16 lg:pr-20">
              <AnimatePresence mode="wait">
                <motion.div key={activeSlideId} initial="hidden" animate="visible" exit="exit" variants={stagger}>
                  {(slideHeading || slideHeadingBold) && (
                    <motion.h1
                      variants={fadeLeft}
                      className="text-2xl font-light leading-tight text-white sm:text-3xl md:text-4xl"
                    >
                      {slideHeading && (
                        <span className="block font-light">{slideHeading}</span>
                      )}
                      {slideHeadingBold && (
                        <span className="mt-1 block font-extrabold uppercase tracking-wide">
                          {slideHeadingBold}
                        </span>
                      )}
                    </motion.h1>
                  )}
                  {slideDescription && (
                    <motion.p
                      variants={fadeLeft}
                      className="mt-3 max-w-sm text-xs leading-relaxed text-white/80 sm:mt-4 sm:text-sm"
                    >
                      {slideDescription}
                    </motion.p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Slide navigator — spans diagonal boundary on the right */}
        {slides.length > 0 && (
          <div className="pointer-events-none absolute right-3 top-[22%] z-30 flex flex-col items-center sm:right-5 lg:right-8">
            <span
              className="absolute top-0 h-[240px] w-px sm:h-[280px]"
              style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
              aria-hidden
            />
            <span
              className="absolute -right-5 top-2 h-20 w-20 rounded-full border border-white/20 sm:-right-6 sm:h-24 sm:w-24"
              aria-hidden
            />
            <div className="pointer-events-auto relative flex flex-col items-center">
              {slides.map((slide, index) => {
                const slideId = safeText(slide?.id)
                const isActive = slideId === activeSlideId
                return (
                  <div key={slideId} className="relative z-10 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setActiveSlideId(slideId)}
                      className="flex items-center justify-center rounded-full font-bold transition-all"
                      style={{
                        width: isActive ? 44 : 26,
                        height: isActive ? 44 : 26,
                        backgroundColor: isActive ? primary : 'transparent',
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                        fontSize: isActive ? '0.85rem' : '0.6rem',
                      }}
                      aria-label={`Slide ${slideId}`}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      {slideId}
                    </button>
                    {index < slides.length - 1 && (
                      <span className="my-2 h-6 w-px bg-transparent" aria-hidden />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Services — white section tucked under the 5° diagonal */}
        <div className="relative -mt-5 bg-white pb-10 pt-1 sm:-mt-6 sm:pb-12 md:-mt-8">
          {/* Ghost circle decorations */}
          <span
            className="pointer-events-none absolute -left-12 bottom-6 h-48 w-48 rounded-full border border-gray-200/80 sm:h-56 sm:w-56"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-[18%] top-8 h-28 w-28 rounded-full border border-gray-200/60 sm:h-36 sm:w-36"
            aria-hidden
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 sm:px-5 lg:grid-cols-2 lg:gap-10 lg:px-6">
            {serviceImage && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease }}
                className="relative -mt-14 sm:-mt-16 md:-mt-20 lg:-mt-24"
              >
                <span
                  className="absolute bottom-0 left-0 top-0 z-10 w-1.5 sm:w-2"
                  style={{ backgroundColor: primary }}
                  aria-hidden
                />
                <SafeImage
                  src={serviceImage}
                  alt={serviceImageAlt}
                  className="relative z-0 ml-2 aspect-[4/5] w-full max-w-[220px] object-cover shadow-lg sm:ml-3 sm:max-w-[260px]"
                  fallback={welderFallback}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease, delay: 0.08 }}
              className="relative lg:pt-6"
            >
              {serviceHeading && (
                <div className="flex items-center gap-3">
                  <span
                    className="hidden h-px w-8 shrink-0 sm:block lg:w-12"
                    style={{ backgroundColor: primary }}
                    aria-hidden
                  />
                  <h2 className="text-lg font-bold uppercase tracking-wide text-gray-900 sm:text-xl md:text-2xl">
                    {serviceHeading}
                  </h2>
                </div>
              )}
              {serviceDescription && (
                <p className="mt-3 text-xs leading-relaxed text-gray-600 sm:mt-4 sm:text-sm lg:pl-[3.25rem]">
                  {serviceDescription}
                </p>
              )}
              {serviceLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4 sm:mt-5 lg:pl-[3.25rem]">
                  {serviceLinks.map((link, index) => {
                    const LinkIcon = resolveIcon(link?.icon, 'ArrowForward')
                    return (
                      <a
                        key={index}
                        href={safeText(link?.link, '#')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-900 transition-opacity hover:opacity-70 sm:text-xs"
                      >
                        {safeText(link?.text)}
                        <LinkIcon className="!text-[12px]" />
                      </a>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features + News */}
      <div className="relative mx-auto max-w-6xl px-4 pb-10 sm:px-5 sm:pb-12 lg:px-6">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Dark features column */}
          {features.length > 0 && (
            <div className="px-5 py-7 sm:px-7 sm:py-8" style={{ backgroundColor: dark }}>
              <div className="space-y-5 sm:space-y-6">
                {features.map((feature, index) => {
                  const Icon = resolveIcon(feature?.icon, 'WorkOutlineOutlined')
                  const title = safeText(feature?.title)
                  const desc = safeText(feature?.description)
                  if (!title) return null
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, ease, delay: index * 0.08 }}
                      className="flex gap-4"
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12"
                        style={{ borderColor: primary, color: primary }}
                      >
                        <Icon className="!text-[20px] sm:!text-[22px]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-white sm:text-sm">
                          {title}
                        </h3>
                        {desc && (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 sm:text-xs">{desc}</p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Orange news box — overlaps left */}
          {(newsTitle || newsItems.length > 0) && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease }}
              className="relative -mt-0 lg:-ml-10 lg:-mt-8"
            >
              <div
                className="relative overflow-hidden px-6 py-7 sm:px-7 sm:py-8"
                style={{ backgroundColor: primary }}
              >
                {newsBg && (
                  <SafeImage
                    src={newsBg}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-20"
                    fallback={newsFallback}
                  />
                )}
                <div className="pointer-events-none absolute inset-3 border border-white/40 sm:inset-4" aria-hidden />

                <div className="relative z-10 pr-6">
                  {newsTitle && (
                    <h3 className="text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                      {newsTitle}
                    </h3>
                  )}
                  {newsItems.length > 0 && (
                    <ul className="mt-4 space-y-3 sm:mt-5">
                      {newsItems.map((item, index) => (
                        <li key={index} className="border-b border-white/20 pb-3 last:border-0 last:pb-0">
                          {safeText(item?.title) && (
                            <p className="text-xs font-semibold text-white sm:text-sm">
                              {safeText(item?.title)}
                            </p>
                          )}
                          {safeText(item?.excerpt) && (
                            <p className="mt-0.5 text-[10px] leading-relaxed text-white/80 sm:text-xs">
                              {safeText(item?.excerpt)}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {viewMoreText && (
                  <a
                    href={viewMoreLink}
                    className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center justify-center bg-white px-1.5 py-4 text-[9px] font-bold uppercase tracking-widest text-gray-900 [writing-mode:vertical-rl] sm:px-2 sm:text-[10px]"
                    style={{ color: primary }}
                  >
                    {viewMoreText}
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
