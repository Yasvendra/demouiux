import type { SvgIconComponent } from '@mui/icons-material'
import ArrowForward from '@mui/icons-material/ArrowForward'
import SettingsSuggest from '@mui/icons-material/SettingsSuggest'
import WbSunny from '@mui/icons-material/WbSunny'
import { motion } from 'framer-motion'
import pageData from './data.json'

type IconName = 'ArrowForward' | 'WbSunny' | 'SettingsSuggest'

interface HeadingPart {
  text?: string
  variant?: string
}

interface HeadingLine {
  parts?: HeadingPart[]
}

interface FundItem {
  number?: string
  title?: string
  description?: string
}

interface PageData {
  funds?: {
    heading?: { lines?: HeadingLine[] }
    description?: string
    cta?: { text?: string; link?: string; icon?: string }
    centerIcon?: string
    items?: FundItem[]
  }
  theme?: {
    primary?: string
    primaryHover?: string
    text?: string
    muted?: string
    lightMuted?: string
    cardBg?: string
  }
}

interface DesignPageData {
  page?: PageData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const iconMap: Record<IconName, SvgIconComponent> = {
  ArrowForward,
  WbSunny,
  SettingsSuggest,
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

function resolveIcon(name?: string | null, fallback: IconName = 'ArrowForward'): SvgIconComponent {
  if (!name?.trim()) return iconMap[fallback]
  const key = name.trim() as IconName
  return iconMap[key] ?? iconMap[fallback]
}

function HeadingBlock({
  lines,
  primary,
  textColor,
  lightMuted,
}: {
  lines: HeadingLine[]
  primary: string
  textColor: string
  lightMuted: string
}) {
  const colorFor = (variant?: string) => {
    if (variant === 'accent') return primary
    if (variant === 'muted') return lightMuted
    return textColor
  }

  return (
    <h1 className="text-3xl font-bold leading-[1.2] tracking-tight sm:text-4xl md:text-[2.65rem]">
      {lines.map((line, lineIndex) => {
        const parts = safeArray(line?.parts).filter((p) => safeText(p?.text))
        if (parts.length === 0) return null
        return (
          <span key={lineIndex} className="block">
            {parts.map((part, partIndex) => (
              <span
                key={partIndex}
                style={{ color: colorFor(part?.variant) }}
                className={safeText(part?.variant) === 'accent' ? 'font-bold' : 'font-bold'}
              >
                {safeText(part?.text)}
              </span>
            ))}
          </span>
        )
      })}
    </h1>
  )
}

export default function Design() {
  const page = data?.page ?? null
  const funds = page?.funds ?? null

  const primary = safeText(page?.theme?.primary, '#004b5e')
  const primaryHover = safeText(page?.theme?.primaryHover, '#003d4d')
  const textColor = safeText(page?.theme?.text, '#1a1a1a')
  const muted = safeText(page?.theme?.muted, '#6b7280')
  const lightMuted = safeText(page?.theme?.lightMuted, '#9ca3af')
  const cardBg = safeText(page?.theme?.cardBg, '#f3f4f6')

  const headingLines = safeArray(funds?.heading?.lines)
  const description = safeText(funds?.description)
  const ctaText = safeText(funds?.cta?.text)
  const ctaLink = safeText(funds?.cta?.link, '#')
  const items = safeArray(funds?.items).filter((i) => safeText(i?.title))
  const CenterIcon = resolveIcon(funds?.centerIcon, 'WbSunny')
  const CtaIcon = resolveIcon(funds?.cta?.icon, 'ArrowForward')

  const hasContent = Boolean(page) && (headingLines.length > 0 || items.length > 0)

  if (!hasContent) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <p className="text-gray-500">No content available.</p>
      </section>
    )
  }

  return (
    <section className="h-full min-h-0 overflow-x-hidden overflow-y-auto bg-white font-sans">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="relative grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left — heading, description, CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="lg:pr-6"
          >
            {headingLines.length > 0 && (
              <motion.div variants={fadeUp}>
                <HeadingBlock
                  lines={headingLines}
                  primary={primary}
                  textColor={textColor}
                  lightMuted={lightMuted}
                />
              </motion.div>
            )}

            {description && (
              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-md text-sm leading-relaxed sm:text-base"
                style={{ color: muted }}
              >
                {description}
              </motion.p>
            )}

            {ctaText && (
              <motion.a
                variants={fadeUp}
                href={ctaLink}
                className="mt-8 inline-flex items-center gap-2 rounded-md px-6 py-3.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primary
                }}
              >
                {ctaText}
                <CtaIcon className="!text-[18px]" />
              </motion.a>
            )}
          </motion.div>

          {/* Center floating icon */}
          <div
            className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 lg:flex"
            aria-hidden
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg shadow-md sm:h-14 sm:w-14"
              style={{ backgroundColor: primary }}
            >
              <CenterIcon className="!text-[26px] text-white sm:!text-[30px]" />
            </div>
          </div>

          {/* Right — numbered list card */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease }}
              className="relative lg:pl-4"
            >
              {/* Mobile center icon */}
              <div
                className="absolute -left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg shadow-md lg:hidden"
                style={{ backgroundColor: primary }}
                aria-hidden
              >
                <CenterIcon className="!text-[22px] text-white" />
              </div>

              <div
                className="rounded-sm px-6 py-8 pl-12 sm:px-10 sm:py-10 sm:pl-14 lg:px-12 lg:py-12 lg:pl-14"
                style={{ backgroundColor: cardBg }}
              >
                <div className="space-y-0">
                  {items.map((item, index) => {
                    const number = safeText(item?.number, String(index + 1).padStart(2, '0'))
                    const title = safeText(item?.title)
                    const desc = safeText(item?.description)
                    const isLast = index === items.length - 1

                    return (
                      <div key={index} className="flex gap-4 sm:gap-5">
                        <div className="flex w-10 shrink-0 flex-col items-center sm:w-12">
                          <span
                            className="text-2xl font-light leading-none sm:text-3xl"
                            style={{ color: lightMuted }}
                          >
                            {number}
                          </span>
                          {!isLast && (
                            <span
                              className="mt-2 w-px flex-1 min-h-[3rem]"
                              style={{ backgroundColor: '#d1d5db' }}
                              aria-hidden
                            />
                          )}
                        </div>

                        <div className={`min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-8 sm:pb-10'}`}>
                          {title && (
                            <h3 className="text-sm font-bold leading-snug sm:text-base" style={{ color: textColor }}>
                              {title}
                            </h3>
                          )}
                          {desc && (
                            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: muted }}>
                              {desc}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
