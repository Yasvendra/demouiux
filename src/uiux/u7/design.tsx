import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import Check from '@mui/icons-material/Check'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'Check'

interface HeroData {
  overline?: string
  headline?: string
  headlineScript?: string
  description?: string
  cta?: { text?: string; link?: string }
  images?: {
    left?: { url?: string; alt?: string }
    right?: { url?: string; alt?: string }
  }
}

interface QuestionData {
  overline?: string
  headline?: string
  headlineScript?: string
}

interface FeatureItem {
  text?: string
  icon?: string
}

interface LandingData {
  hero?: HeroData
  question?: QuestionData
  features?: {
    image?: { url?: string; alt?: string }
    cta?: { text?: string; link?: string }
    items?: FeatureItem[]
  }
  theme?: { background?: string; accent?: string; accentHover?: string }
}

interface DesignPageData {
  landing?: LandingData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const
const scriptFont = "'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive"

const iconMap: Record<IconName, SvgIconComponent> = {
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

function renderScriptHeadline(
  headline: string,
  scriptWord?: string,
  accent?: string,
  underline = false,
) {
  const word = safeText(scriptWord)
  if (!word) return <span>{headline}</span>

  const index = headline.toLowerCase().indexOf(word.toLowerCase())
  if (index === -1) return <span>{headline}</span>

  const before = headline.slice(0, index)
  const match = headline.slice(index, index + word.length)
  const after = headline.slice(index + word.length)

  return (
    <>
      {before}
      <span className="relative inline-block" style={{ fontFamily: scriptFont, color: accent }}>
        {match}
        {underline && (
          <span
            className="absolute -bottom-1 left-0 right-0 h-px"
            style={{ backgroundColor: accent }}
            aria-hidden
          />
        )}
      </span>
      {after}
    </>
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

function EnrollButton({
  text,
  link,
  accent,
  accentHover,
  className = '',
}: {
  text: string
  link: string
  accent: string
  accentHover: string
  className?: string
}) {
  return (
    <motion.a
      href={link}
      className={`inline-flex items-center justify-center px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white sm:px-10 sm:py-3.5 sm:text-sm ${className}`}
      style={{ backgroundColor: accent }}
      whileHover={{ scale: 1.03, y: -2, backgroundColor: accentHover }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.22, ease }}
    >
      {text}
    </motion.a>
  )
}

export default function Design() {
  const landing = data?.landing ?? null
  const hero = landing?.hero ?? null
  const question = landing?.question ?? null
  const features = landing?.features ?? null

  const background = safeText(landing?.theme?.background, '#FDF8F3')
  const accent = safeText(landing?.theme?.accent, '#A67C52')
  const accentHover = safeText(landing?.theme?.accentHover, '#8f6844')

  const heroOverline = safeText(hero?.overline)
  const heroHeadline = safeText(hero?.headline)
  const heroScript = safeText(hero?.headlineScript)
  const heroDescription = safeText(hero?.description)
  const heroCtaText = safeText(hero?.cta?.text, 'ENROLL NOW')
  const heroCtaLink = safeText(hero?.cta?.link, '#enroll')
  const heroLeftImage = safeText(hero?.images?.left?.url)
  const heroLeftAlt = safeText(hero?.images?.left?.alt, 'Lifestyle image')
  const heroRightImage = safeText(hero?.images?.right?.url)
  const heroRightAlt = safeText(hero?.images?.right?.alt, 'Workspace image')

  const questionOverline = safeText(question?.overline)
  const questionHeadline = safeText(question?.headline)
  const questionScript = safeText(question?.headlineScript)

  const featureImage = safeText(features?.image?.url)
  const featureImageAlt = safeText(features?.image?.alt, 'Feature image')
  const featureCtaText = safeText(features?.cta?.text, 'ENROLL NOW')
  const featureCtaLink = safeText(features?.cta?.link, '#enroll')
  const featureItems = safeArray(features?.items).filter((item) => safeText(item?.text))

  const hasContent =
    Boolean(landing) &&
    (heroHeadline || questionHeadline || featureItems.length > 0 || featureImage)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  const heroLeftFallback =
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=600&fit=crop&q=80'
  const heroRightFallback =
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop&q=80'
  const featureImageFallback =
    'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=700&h=900&fit=crop&q=80'

  return (
    <section
      className="h-full min-h-0 overflow-x-hidden overflow-y-auto"
      style={{ backgroundColor: background }}
    >
      {/* Hero */}
      <div className="relative px-4 pt-6 sm:px-6 sm:pt-8 md:px-10">
        {(heroLeftImage || heroRightImage) && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {heroLeftImage && (
              <SafeImage
                src={heroLeftImage}
                alt={heroLeftAlt}
                className="aspect-[4/3] w-full object-cover sm:aspect-[5/4]"
                fallback={heroLeftFallback}
              />
            )}
            {heroRightImage && (
              <SafeImage
                src={heroRightImage}
                alt={heroRightAlt}
                className="aspect-[4/3] w-full object-cover sm:aspect-[5/4]"
                fallback={heroRightFallback}
              />
            )}
          </div>
        )}

        <motion.div
          className="relative z-10 mx-auto -mt-16 max-w-2xl bg-white px-6 py-10 text-center shadow-sm sm:-mt-20 sm:px-10 sm:py-12 md:-mt-24"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {heroOverline && (
            <motion.p
              variants={fadeUp}
              className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-600 sm:text-xs"
            >
              {heroOverline}
            </motion.p>
          )}

          {heroHeadline && (
            <motion.h1
              variants={fadeUp}
              className="font-display mt-4 text-2xl font-semibold leading-snug text-gray-800 sm:mt-5 sm:text-3xl md:text-4xl"
            >
              {renderScriptHeadline(heroHeadline, heroScript, accent)}
            </motion.h1>
          )}

          {heroDescription && (
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-5 max-w-lg text-xs leading-relaxed text-gray-600 sm:mt-6 sm:text-sm sm:leading-7"
            >
              {heroDescription}
            </motion.p>
          )}

          {heroCtaText && (
            <motion.div variants={fadeUp} className="mt-8 sm:mt-10">
              <EnrollButton
                text={heroCtaText}
                link={heroCtaLink}
                accent={accent}
                accentHover={accentHover}
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Question section */}
      {(questionOverline || questionHeadline) && (
        <motion.div
          className="mx-auto max-w-3xl px-6 py-14 text-center sm:px-8 sm:py-16 md:py-20"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {questionOverline && (
            <motion.p
              variants={fadeUp}
              className="text-[10px] font-medium uppercase tracking-[0.22em] text-gray-600 sm:text-xs"
            >
              {questionOverline}
            </motion.p>
          )}
          {questionHeadline && (
            <motion.h2
              variants={fadeUp}
              className="font-display mt-4 text-xl font-semibold leading-snug text-gray-800 sm:mt-5 sm:text-2xl md:text-3xl"
            >
              {renderScriptHeadline(questionHeadline, questionScript, accent, true)}
            </motion.h2>
          )}
        </motion.div>
      )}

      {/* Features section */}
      {(featureImage || featureItems.length > 0) && (
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 sm:px-8 sm:pb-20 lg:grid-cols-2 lg:items-start lg:gap-14">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {featureImage && (
              <motion.div variants={fadeUp} whileHover={{ scale: 1.02 }} transition={{ duration: 0.35, ease }}>
                <SafeImage
                  src={featureImage}
                  alt={featureImageAlt}
                  className="aspect-[4/5] w-full object-cover sm:max-w-md"
                  fallback={featureImageFallback}
                />
              </motion.div>
            )}
            {featureCtaText && (
              <motion.div variants={fadeUp} className="mt-6 sm:mt-8">
                <EnrollButton
                  text={featureCtaText}
                  link={featureCtaLink}
                  accent={accent}
                  accentHover={accentHover}
                />
              </motion.div>
            )}
          </motion.div>

          {featureItems.length > 0 && (
            <motion.ul
              className="divide-y divide-gray-200"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              {featureItems.map((item, index) => {
                const text = safeText(item?.text)
                const Icon = resolveIcon(item?.icon, 'Check')
                if (!text) return null

                return (
                  <motion.li
                    key={`${index}-${text.slice(0, 20)}`}
                    variants={fadeUp}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2, ease }}
                    className="flex gap-4 py-6 first:pt-0 sm:gap-5 sm:py-7"
                  >
                    <Icon className="!mt-0.5 !text-[20px] shrink-0" style={{ color: accent }} />
                    <p className="text-xs leading-relaxed text-gray-600 sm:text-sm sm:leading-7">
                      {text}
                    </p>
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </div>
      )}
    </section>
  )
}
