import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Phone from '@mui/icons-material/Phone'
import PlayArrow from '@mui/icons-material/PlayArrow'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'CheckCircle' | 'Phone' | 'PlayArrow' | 'ArrowForward'

interface FeatureItem {
  text?: string
  icon?: string
}

interface AboutData {
  label?: string
  heading?: string
  description?: string
  features?: FeatureItem[]
  contact?: { phone?: string; phoneLabel?: string; icon?: string }
  founder?: { name?: string; title?: string; avatar?: string; avatarAlt?: string }
  video?: { thumbnail?: string; alt?: string; videoUrl?: string }
  highlight?: {
    image?: string
    alt?: string
    description?: string
    cta?: { text?: string; link?: string; icon?: string }
  }
  theme?: { primary?: string; primaryHover?: string; background?: string }
}

interface DesignPageData {
  about?: AboutData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  CheckCircle,
  Phone,
  PlayArrow,
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
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
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

function FeatureRow({ feature, primary }: { feature: FeatureItem; primary: string }) {
  const text = safeText(feature?.text)
  if (!text) return null

  const Icon = resolveIcon(feature?.icon, 'CheckCircle')

  return (
    <motion.li
      variants={fadeUp}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2, ease }}
      className="flex items-start gap-3"
    >
      <Icon className="!mt-0.5 !text-[20px] shrink-0" style={{ color: primary }} />
      <span className="text-sm leading-relaxed text-gray-600 sm:text-[0.9375rem]">{text}</span>
    </motion.li>
  )
}

export default function Design() {
  const about = data?.about ?? null

  const primary = safeText(about?.theme?.primary, '#f97316')
  const primaryHover = safeText(about?.theme?.primaryHover, '#ea580c')
  const background = safeText(about?.theme?.background, '#ffffff')

  const label = safeText(about?.label)
  const heading = safeText(about?.heading)
  const description = safeText(about?.description)
  const features = safeArray(about?.features).filter((item) => safeText(item?.text))

  const phone = safeText(about?.contact?.phone)
  const phoneLabel = safeText(about?.contact?.phoneLabel, 'Call Now')
  const PhoneIcon = resolveIcon(about?.contact?.icon, 'Phone')

  const founderName = safeText(about?.founder?.name)
  const founderTitle = safeText(about?.founder?.title)
  const founderAvatar = safeText(about?.founder?.avatar)
  const founderAvatarAlt = safeText(about?.founder?.avatarAlt, founderName)

  const videoThumb = safeText(about?.video?.thumbnail)
  const videoAlt = safeText(about?.video?.alt, 'Construction video')
  const videoUrl = safeText(about?.video?.videoUrl, '#')

  const highlightImage = safeText(about?.highlight?.image)
  const highlightAlt = safeText(about?.highlight?.alt, 'Construction professional')
  const highlightDesc = safeText(about?.highlight?.description)
  const ctaText = safeText(about?.highlight?.cta?.text, 'Get More Information')
  const ctaLink = safeText(about?.highlight?.cta?.link, '#')
  const CtaIcon = resolveIcon(about?.highlight?.cta?.icon, 'ArrowForward')

  const hasContent =
    Boolean(about) &&
    (label ||
      heading ||
      description ||
      features.length > 0 ||
      phone ||
      founderName ||
      videoThumb ||
      highlightImage)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  const avatarFallback =
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&q=80'
  const videoFallback =
    'https://images.unsplash.com/photo-1581094794329-cd11a4a4b1c0?w=800&h=500&fit=crop&q=80'
  const highlightFallback =
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=700&h=900&fit=crop&q=80'

  return (
    <section
      className="h-full min-h-0 overflow-x-hidden overflow-y-auto px-5 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12"
      style={{ backgroundColor: background }}
    >
      <div className="mx-auto grid max-w-6xl gap-7 sm:gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
        {/* Left column */}
        <motion.div
          className="flex flex-col gap-6 sm:gap-7"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <div>
            {label && (
              <motion.p
                variants={fadeUp}
                className="text-xs font-bold uppercase tracking-[0.14em] sm:text-sm"
                style={{ color: primary }}
              >
                {label}
              </motion.p>
            )}

            {heading && (
              <motion.h2
                variants={fadeUp}
                className="mt-2.5 max-w-lg text-2xl font-bold leading-snug text-gray-900 sm:mt-3 sm:text-[1.75rem] md:text-3xl"
              >
                {heading}
              </motion.h2>
            )}

            {description && (
              <motion.p
                variants={fadeUp}
                className="mt-3 max-w-lg text-sm leading-relaxed text-gray-500 sm:mt-4 sm:text-[0.9375rem] md:text-base"
              >
                {description}
              </motion.p>
            )}

            {features.length > 0 && (
              <motion.ul className="mt-5 space-y-3 sm:mt-6" variants={stagger}>
                {features.map((feature, index) => (
                  <FeatureRow
                    key={`${safeText(feature?.text)}-${index}`}
                    feature={feature}
                    primary={primary}
                  />
                ))}
              </motion.ul>
            )}

            {(phone || founderName) && (
              <motion.div
                variants={fadeUp}
                className="mt-6 flex flex-wrap items-center gap-5 sm:mt-7 sm:gap-7"
              >
                {phone && (
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <motion.div
                      className="flex h-11 w-11 items-center justify-center rounded-md text-white sm:h-12 sm:w-12"
                      style={{ backgroundColor: primary }}
                      whileHover={{ scale: 1.06 }}
                      transition={{ duration: 0.2, ease }}
                    >
                      <PhoneIcon className="!text-[20px] sm:!text-[22px]" />
                    </motion.div>
                    <div>
                      <p className="text-base font-bold text-gray-900 sm:text-lg">{phone}</p>
                      {phoneLabel && (
                        <p className="text-xs text-gray-500 sm:text-sm">{phoneLabel}</p>
                      )}
                    </div>
                  </div>
                )}

                {founderName && (
                  <div className="flex items-center gap-3">
                    {founderAvatar && (
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full sm:h-12 sm:w-12">
                        <SafeImage
                          src={founderAvatar}
                          alt={founderAvatarAlt}
                          className="h-full w-full object-cover"
                          fallback={avatarFallback}
                        />
                      </div>
                    )}
                    <div>
                      <p
                        className="text-lg text-gray-900 sm:text-xl"
                        style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
                      >
                        {founderName}
                      </p>
                      {founderTitle && (
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
                          {founderTitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {videoThumb && (
            <motion.div variants={fadeLeft} className="relative max-w-lg overflow-hidden rounded-lg">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.35, ease }}>
                <SafeImage
                  src={videoThumb}
                  alt={videoAlt}
                  className="h-44 w-full object-cover sm:h-48 md:h-52"
                  fallback={videoFallback}
                />
              </motion.div>
              {videoUrl && (
                <motion.a
                  href={videoUrl}
                  aria-label="Play video"
                  className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg sm:h-14 sm:w-14"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <PlayArrow className="!text-[28px] sm:!text-[32px]" style={{ color: primary }} />
                </motion.a>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Right column */}
        <motion.div
          className="flex flex-col"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {highlightImage && (
            <motion.div
              variants={fadeRight}
              className="mx-auto w-full max-w-sm overflow-hidden sm:max-w-md lg:mx-0 lg:max-w-none"
              style={{ clipPath: 'polygon(0 0, 85% 0, 100% 12%, 100% 100%, 0 100%)' }}
            >
              <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.45, ease }}>
                <SafeImage
                  src={highlightImage}
                  alt={highlightAlt}
                  className="h-64 w-full object-cover sm:h-72 md:h-80 lg:h-[22rem]"
                  fallback={highlightFallback}
                />
              </motion.div>
            </motion.div>
          )}

          {highlightDesc && (
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-md text-sm leading-relaxed text-gray-500 sm:mt-6 sm:text-[0.9375rem] md:text-base"
            >
              {highlightDesc}
            </motion.p>
          )}

          {ctaText && (
            <motion.a
              href={ctaLink}
              variants={fadeUp}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white sm:mt-6 sm:w-auto sm:px-7 sm:py-3.5"
              style={{ backgroundColor: primary }}
              whileHover={{ scale: 1.04, y: -2, backgroundColor: primaryHover }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease }}
            >
              {ctaText}
              <CtaIcon className="!text-[18px]" />
            </motion.a>
          )}
        </motion.div>
      </div>
    </section>
  )
}
