import { useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import PlayArrow from '@mui/icons-material/PlayArrow'
import { AnimatePresence, motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'AutoAwesome' | 'PlayArrow'

interface TabItem {
  id?: string
  label?: string
  heading?: string
  description?: string
  image?: string
  imageAlt?: string
  cta?: { text?: string; link?: string }
}

interface AboutData {
  badge?: { text?: string; icon?: string }
  heading?: string
  headingAccent?: string
  description?: string
  media?: { image?: string; alt?: string; videoUrl?: string }
  tabs?: { defaultActive?: string; items?: TabItem[] }
  theme?: { primary?: string; primaryDark?: string; background?: string }
}

interface DesignPageData {
  about?: AboutData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  AutoAwesome,
  PlayArrow,
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

function resolveIcon(name?: string | null, fallback: IconName = 'AutoAwesome'): SvgIconComponent {
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

function BlobDecor({
  className,
  color,
  delay = 0,
}: {
  className?: string
  color: string
  delay?: number
}) {
  return (
    <motion.span
      className={`absolute rounded-[45%_55%_52%_48%/48%_45%_55%_52%] ${className ?? ''}`}
      style={{ backgroundColor: color }}
      animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
      aria-hidden
    />
  )
}

function MediaBlob({
  imageUrl,
  imageAlt,
  videoUrl,
  primary,
  fallbackUrl,
}: {
  imageUrl: string
  imageAlt: string
  videoUrl: string
  primary: string
  fallbackUrl: string
}) {
  const [failed, setFailed] = useState(false)
  const src = failed ? fallbackUrl : imageUrl

  return (
    <motion.div
      variants={fadeUp}
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
    >
      <BlobDecor className="-left-4 top-8 h-14 w-16 sm:h-16 sm:w-20" color={primary} delay={0} />
      <BlobDecor className="right-2 top-1/3 h-10 w-12 sm:h-12 sm:w-14" color={primary} delay={1.2} />
      <BlobDecor className="-bottom-2 left-1/4 h-12 w-14 sm:h-14 sm:w-16" color={primary} delay={0.6} />

      <div className="relative mx-auto aspect-[4/5] w-full max-w-md sm:max-w-lg">
        <div
          className="relative h-full w-full overflow-hidden shadow-xl shadow-indigo-900/10"
          style={{
            borderRadius: '63% 37% 54% 46% / 55% 48% 52% 45%',
          }}
        >
          <motion.img
            src={src}
            alt={imageAlt}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setFailed(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5, ease }}
          />
        </div>

        {videoUrl && (
          <motion.a
            href={videoUrl}
            aria-label="Play video"
            className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg sm:h-20 sm:w-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.25, ease }}
          >
            <PlayArrow className="!text-[32px] sm:!text-[40px]" style={{ color: primary }} />
          </motion.a>
        )}
      </div>
    </motion.div>
  )
}

function TabPanel({
  tab,
  primary,
}: {
  tab: TabItem
  primary: string
}) {
  const heading = safeText(tab?.heading)
  const description = safeText(tab?.description)
  const imageUrl = safeText(tab?.image)
  const imageAlt = safeText(tab?.imageAlt, heading)
  const ctaText = safeText(tab?.cta?.text, 'ABOUT MORE')
  const ctaLink = safeText(tab?.cta?.link, '#')

  const [imageFailed, setImageFailed] = useState(false)
  const fallbackProfile =
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=480&fit=crop&q=80'
  const resolvedImage = imageFailed ? fallbackProfile : imageUrl

  return (
    <motion.div
      key={tab?.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease }}
      className="grid gap-5 p-5 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-6 sm:p-6 md:gap-8 md:p-8"
    >
      {imageUrl && (
        <div className="mx-auto w-full max-w-[140px] overflow-hidden rounded-lg sm:mx-0">
          <motion.img
            src={resolvedImage}
            alt={imageAlt}
            className="aspect-[5/6] w-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.35, ease }}
          />
        </div>
      )}

      <div className="flex flex-col justify-center text-center sm:text-left">
        {heading && (
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">{heading}</h3>
        )}
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-[0.9375rem] md:text-base">
            {description}
          </p>
        )}
        {ctaText && (
          <motion.a
            href={ctaLink}
            className="mt-5 inline-flex w-full items-center justify-center rounded-md px-6 py-3 text-xs font-bold tracking-wide text-white sm:mt-6 sm:w-auto sm:text-sm"
            style={{ backgroundColor: primary }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
          >
            {ctaText}
          </motion.a>
        )}
      </div>
    </motion.div>
  )
}

export default function Design() {
  const about = data?.about ?? null

  const primary = safeText(about?.theme?.primary, '#5b4fc7')
  const primaryDark = safeText(about?.theme?.primaryDark, '#1a1a2e')
  const background = safeText(about?.theme?.background, '#f8f7fc')

  const badgeText = safeText(about?.badge?.text)
  const BadgeIcon = resolveIcon(about?.badge?.icon, 'AutoAwesome')

  const heading = safeText(about?.heading)
  const headingParts = splitHeading(heading, about?.headingAccent)
  const description = safeText(about?.description)

  const mediaImage = safeText(about?.media?.image)
  const mediaAlt = safeText(about?.media?.alt, 'Team collaboration')
  const videoUrl = safeText(about?.media?.videoUrl, '#')

  const tabItems = safeArray(about?.tabs?.items).filter(
    (item) => safeText(item?.id) && safeText(item?.label),
  )
  const defaultTabId =
    safeText(about?.tabs?.defaultActive) || safeText(tabItems[0]?.id) || ''

  const [activeTabId, setActiveTabId] = useState(defaultTabId)
  const activeTab = tabItems.find((tab) => safeText(tab?.id) === activeTabId) ?? tabItems[0]

  const hasContent =
    Boolean(about) &&
    (heading || description || mediaImage || tabItems.length > 0 || badgeText)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4 sm:px-6">
        <p className="text-base text-gray-500 sm:text-lg">No content available.</p>
      </section>
    )
  }

  const mediaFallback =
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&h=1000&fit=crop&q=80'

  return (
    <section
      className="min-h-screen overflow-y-auto overflow-x-hidden px-4 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20 lg:px-12 xl:px-16"
      style={{ backgroundColor: background }}
    >
      <motion.div
        className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
      >
        {mediaImage && (
          <MediaBlob
            imageUrl={mediaImage}
            imageAlt={mediaAlt}
            videoUrl={videoUrl}
            primary={primary}
            fallbackUrl={mediaFallback}
          />
        )}

        <motion.div variants={fadeUp} className="flex flex-col">
          {(badgeText || safeText(about?.badge?.icon)) && (
            <motion.div
              variants={fadeUp}
              className="mb-4 flex items-center gap-2 sm:mb-5"
            >
              <BadgeIcon className="!text-[20px] sm:!text-[22px]" style={{ color: primary }} />
              {badgeText && (
                <span
                  className="text-xs font-bold tracking-[0.12em] sm:text-sm"
                  style={{ color: primary }}
                >
                  {badgeText}
                </span>
              )}
            </motion.div>
          )}

          {heading && (
            <motion.h2
              variants={fadeUp}
              className="max-w-xl text-2xl font-bold leading-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
            >
              {headingParts.before}
              {headingParts.accent ? (
                <span style={{ color: primary }}>{headingParts.accent}</span>
              ) : null}
              {headingParts.after}
            </motion.h2>
          )}

          {description && (
            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500 sm:mt-5 sm:text-base md:text-[1.05rem]"
            >
              {description}
            </motion.p>
          )}

          {tabItems.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="mt-8 overflow-hidden rounded-lg bg-white shadow-lg shadow-slate-900/8 sm:mt-10"
            >
              <div className="grid grid-cols-2">
                {tabItems.map((tab) => {
                  const tabId = safeText(tab?.id)
                  const tabLabel = safeText(tab?.label)
                  const isActive = tabId === activeTabId

                  return (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => setActiveTabId(tabId)}
                      className="relative px-3 py-3.5 text-[10px] font-bold tracking-wide text-white transition-colors sm:px-4 sm:py-4 sm:text-xs md:text-sm"
                      style={{
                        backgroundColor: isActive ? primary : primaryDark,
                      }}
                    >
                      {tabLabel}
                      {isActive && (
                        <span
                          className="absolute -bottom-px left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[10px] border-x-transparent"
                          style={{ borderTopColor: primary }}
                          aria-hidden
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-gray-100">
                <AnimatePresence mode="wait">
                  {activeTab && <TabPanel key={activeTabId} tab={activeTab} primary={primary} />}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  )
}
