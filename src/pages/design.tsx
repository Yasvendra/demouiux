import { useCallback, useMemo, useRef, useState } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import AutoAwesome from '@mui/icons-material/AutoAwesome'
import PlayArrow from '@mui/icons-material/PlayArrow'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import modelData from './data.json'

/* ─── Types ─── */

type IconName = 'AutoAwesome' | 'PlayArrow'

interface IconData {
  iconName?: string
  type?: string
  fontSize?: string
  colorCode?: string
}

interface MediaSlot {
  media?: {
    mediaLink?: string
    mediaType?: string
    alt?: string
  }
}

interface TabItem {
  id?: string
  label?: string
  heading?: string
  description?: string
  image?: MediaSlot
  cta?: { text?: string; link?: string; clickType?: string }
}

interface MediaCellItem {
  mediaType?: string
  mediaLink?: string
  type?: string
  htmlView?: string
}

interface EnhancerItem {
  type?: string
  align?: string
  data?: { text?: string }
  css?: {
    colorKey?: string
    tailwind?: Record<string, string | undefined>
  }
}

interface BackgroundSetting {
  className?: string
  duration?: number
  colorKey?: string
}

interface AboutSolutionsModel {
  id?: string
  type?: string
  left?: string
  right?: string
  data?: {
    header?: {
      badge?: { text?: string; icon?: IconData }
      title?: string
      titleHighlight?: string
      description?: string
    }
    media?: {
      main?: MediaSlot
      video?: { link?: string; clickType?: string; icon?: IconData }
    }
    tabs?: { defaultActive?: string; items?: TabItem[] }
    cta?: {
      primary?: { text?: string; link?: string; clickType?: string; icon?: IconData }
    }
  }
  mediaCells?: Record<string, MediaCellItem[]>
  css?: {
    colorPalette?: {
      theme?: string
      light?: Record<string, string>
      dark?: Record<string, string>
    }
    typography?: {
      fontFamily?: Record<string, string>
      standard?: {
        fontSize?: Record<string, string>
        lineHeight?: Record<string, string>
        letterSpacing?: Record<string, string>
      }
    }
    borders?: Record<string, string>
    layout?: Record<string, Record<string, string>>
    tailwind?: Record<string, string | undefined>
  }
  background?: { type?: string; settings?: BackgroundSetting[] }
  enhancers?: EnhancerItem[]
  settings?: {
    animations?: { fadeIn?: boolean; slideIn?: boolean }
    interactions?: { hover?: boolean }
  }
}

/* ─── Constants ─── */

const CSS_PREFIX = 'aboutSolutions'
const ease = [0.22, 1, 0.36, 1] as const

const RADIUS_MAP: Record<string, string> = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
}

const iconMap: Record<IconName, SvgIconComponent> = {
  AutoAwesome,
  PlayArrow,
}

const BLOB_POSITIONS = [
  { className: '-left-4 top-8', size: 'lg', delay: 0 },
  { className: 'right-2 top-1/3', size: 'sm', delay: 1.2 },
  { className: '-bottom-2 left-1/4', size: 'md', delay: 0.6 },
] as const

/* ─── Safe access ─── */

function safeObject<T extends Record<string, unknown>>(value: unknown): T {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as T)
    : ({} as T)
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : []
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function createSafeTailwind(
  tailwind: Record<string, string | undefined> | undefined,
): Record<string, string> {
  const result: Record<string, string> = {}
  if (!tailwind) return result
  for (const [key, value] of Object.entries(tailwind)) {
    result[key] = typeof value === 'string' ? value : ''
  }
  return result
}

function resolveRoundedValue(token: string): string {
  return RADIUS_MAP[token] ?? token
}

function resolveLayoutValue(value: string): string {
  const num = parseFloat(value.trim())
  if (Number.isNaN(num)) return value.trim()
  const rem = Math.abs(num) * 0.25
  return num < 0 ? `-${rem}rem` : `${rem}rem`
}

function pickLeftCss(
  baseKey: string,
  leftType: string,
  tailwind: Record<string, string>,
): string {
  const typeNum = parseInt(leftType.replace('Type', ''), 10)
  if (!Number.isNaN(typeNum)) {
    for (let n = typeNum; n >= 1; n--) {
      const typeKey = n === 1 ? baseKey : `${baseKey}Type${n}`
      if (tailwind[typeKey]) return tailwind[typeKey]
    }
  }
  return tailwind[baseKey] ?? ''
}

function pickRightCss(
  baseKey: string,
  rightType: string,
  tailwind: Record<string, string>,
): string {
  const typeNum = parseInt(rightType.replace('Type', ''), 10)
  if (!Number.isNaN(typeNum)) {
    for (let n = typeNum; n >= 1; n--) {
      const typeKey = n === 1 ? baseKey : `${baseKey}Type${n}`
      if (tailwind[typeKey]) return tailwind[typeKey]
    }
  }
  return tailwind[baseKey] ?? ''
}

function resolveIcon(name?: string | null, fallback: IconName = 'AutoAwesome'): SvgIconComponent {
  if (!name?.trim()) return iconMap[fallback]
  const key = name.trim() as IconName
  return iconMap[key] ?? iconMap[fallback]
}

function buildCssVariables(
  css: AboutSolutionsModel['css'],
  themeMode: string,
): Record<string, string> {
  const vars: Record<string, string> = {}
  const palette = safeObject<Record<string, string>>(
    themeMode === 'dark' ? css?.colorPalette?.dark : css?.colorPalette?.light,
  )

  for (const [key, value] of Object.entries(palette)) {
    if (typeof value === 'string') vars[`--${CSS_PREFIX}-${key}`] = value
  }

  const fontFamily = safeObject<Record<string, string>>(css?.typography?.fontFamily)
  for (const [key, value] of Object.entries(fontFamily)) {
    if (typeof value === 'string') vars[`--${CSS_PREFIX}-fontFamily-${key}`] = value
  }

  const fontSize = safeObject<Record<string, string>>(css?.typography?.standard?.fontSize)
  for (const [key, value] of Object.entries(fontSize)) {
    if (typeof value === 'string') vars[`--${CSS_PREFIX}-fontSize-${key}`] = value
  }

  const lineHeight = safeObject<Record<string, string>>(
    css?.typography?.standard?.lineHeight,
  )
  for (const [key, value] of Object.entries(lineHeight)) {
    if (typeof value === 'string') vars[`--${CSS_PREFIX}-lineHeight-${key}`] = value
  }

  const letterSpacing = safeObject<Record<string, string>>(
    css?.typography?.standard?.letterSpacing,
  )
  for (const [key, value] of Object.entries(letterSpacing)) {
    if (typeof value === 'string') vars[`--${CSS_PREFIX}-letterSpacing-${key}`] = value
  }

  const borders = safeObject<Record<string, string>>(css?.borders)
  for (const [section, token] of Object.entries(borders)) {
    const resolved = resolveRoundedValue(token)
    for (const corner of ['tl', 'tr', 'br', 'bl'] as const) {
      vars[`--${CSS_PREFIX}-radius-${section}-${corner}`] = resolved
    }
  }

  const layout = safeObject<Record<string, Record<string, string>>>(css?.layout)
  for (const [section, props] of Object.entries(layout)) {
    for (const [prop, value] of Object.entries(props ?? {})) {
      if (typeof value === 'string') {
        vars[`--${CSS_PREFIX}-layout-${section}-${prop}`] = resolveLayoutValue(value)
      }
    }
  }

  return vars
}

function resolveColorKey(
  colorKey: string | undefined,
  palette: Record<string, string>,
  fallback: string,
): string {
  if (!colorKey) return fallback
  return palette[colorKey] ?? fallback
}

/* ─── Sub-components ─── */

function SafeImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) return null

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function BlobDecor({
  className,
  sizeClass,
  color,
  delay,
  reducedMotion,
}: {
  className?: string
  sizeClass: string
  color: string
  delay: number
  reducedMotion: boolean
}) {
  return (
    <motion.span
      className={`${sizeClass} ${className ?? ''}`}
      style={{ backgroundColor: color }}
      aria-hidden
      animate={reducedMotion ? undefined : { y: [0, -10, 0], rotate: [0, 4, 0] }}
      transition={
        reducedMotion
          ? undefined
          : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay }
      }
    />
  )
}

function FloatingBlobsBackground({
  settings,
  palette,
  reducedMotion,
  isInView,
}: {
  settings: BackgroundSetting[]
  palette: Record<string, string>
  reducedMotion: boolean
  isInView: boolean
}) {
  if (settings.length === 0) return null

  return (
    <>
      {settings.map((setting, index) => {
        const color = palette[setting.colorKey ?? 'primary'] ?? palette.primary ?? '#5b4fc7'
        return (
          <motion.div
            key={index}
            className={`absolute rounded-full blur-3xl ${setting.className ?? ''}`}
            style={{ backgroundColor: color }}
            aria-hidden
            animate={
              reducedMotion || !isInView
                ? undefined
                : { x: [0, 20, -10, 0], y: [0, -15, 10, 0], scale: [1, 1.05, 0.98, 1] }
            }
            transition={
              reducedMotion
                ? undefined
                : { duration: setting.duration ?? 14, repeat: Infinity, ease: 'easeInOut' }
            }
          />
        )
      })}
    </>
  )
}

function TabPanelContent({
  tab,
  finalCss,
  hoverEnabled,
  reducedMotion,
}: {
  tab: TabItem
  finalCss: Record<string, string>
  hoverEnabled: boolean
  reducedMotion: boolean
}) {
  const heading = safeString(tab?.heading)
  const description = safeString(tab?.description)
  const imageMedia = safeObject(tab?.image?.media)
  const imageSrc = safeString(imageMedia?.mediaLink)
  const imageAlt = safeString(imageMedia?.alt, heading)
  const ctaText = safeString(tab?.cta?.text)
  const ctaLink = safeString(tab?.cta?.link, '#')
  const hasImage = imageSrc !== '' && safeString(imageMedia?.mediaType) === 'image'

  const ctaHover =
    hoverEnabled && !reducedMotion
      ? { whileHover: { scale: 1.04, y: -2 }, whileTap: { scale: 0.98 } }
      : {}

  return (
    <motion.div
      key={tab?.id}
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease }}
      className={finalCss.tabPanel}
      role="tabpanel"
    >
      {hasImage && (
        <div className={finalCss.tabImageWrapper}>
          <SafeImage src={imageSrc} alt={imageAlt} className={finalCss.tabImage} />
        </div>
      )}

      <div className={finalCss.tabContent}>
        {heading && <h3 className={finalCss.tabHeading}>{heading}</h3>}
        {description && <p className={finalCss.tabDescription}>{description}</p>}
        {ctaText && (
          <motion.a href={ctaLink} className={finalCss.ctaButton} {...ctaHover}>
            {ctaText}
          </motion.a>
        )}
      </div>
    </motion.div>
  )
}

function TabPanelContentType2({
  tab,
  finalCss,
  hoverEnabled,
  reducedMotion,
}: {
  tab: TabItem
  finalCss: Record<string, string>
  hoverEnabled: boolean
  reducedMotion: boolean
}) {
  const heading = safeString(tab?.heading)
  const description = safeString(tab?.description)
  const ctaText = safeString(tab?.cta?.text)
  const ctaLink = safeString(tab?.cta?.link, '#')

  const ctaHover =
    hoverEnabled && !reducedMotion
      ? { whileHover: { scale: 1.04 }, whileTap: { scale: 0.98 } }
      : {}

  return (
    <motion.div
      key={tab?.id}
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease }}
      className={finalCss.tabPanelType2}
      role="tabpanel"
    >
      {heading && <h3 className={finalCss.tabHeadingType2}>{heading}</h3>}
      {description && <p className={finalCss.tabDescriptionType2}>{description}</p>}
      {ctaText && (
        <motion.a href={ctaLink} className={finalCss.ctaButton} {...ctaHover}>
          {ctaText}
        </motion.a>
      )}
    </motion.div>
  )
}

/* ─── Main painter ─── */

export default function Design() {
  const item = modelData as AboutSolutionsModel
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' })
  const prefersReducedMotion = useReducedMotion()
  const reducedMotion = prefersReducedMotion ?? false

  const data = useMemo(() => safeObject<AboutSolutionsModel['data']>(item?.data), [item?.data])
  const mediaCells = useMemo(
    () => safeObject<AboutSolutionsModel['mediaCells']>(item?.mediaCells),
    [item?.mediaCells],
  )
  const css = useMemo(() => safeObject<AboutSolutionsModel['css']>(item?.css), [item?.css])
  const tailwind = useMemo(
    () => safeObject<Record<string, string | undefined>>(css?.tailwind),
    [css?.tailwind],
  )
  const finalCss = useMemo(() => createSafeTailwind(tailwind), [tailwind])
  const sectionType = useMemo(() => safeString(item?.type, 'Type1'), [item?.type])
  const leftType = useMemo(() => safeString(item?.left, 'Type1'), [item?.left])
  const rightType = useMemo(() => safeString(item?.right, 'Type1'), [item?.right])
  const settings = useMemo(
    () => safeObject<AboutSolutionsModel['settings']>(item?.settings),
    [item?.settings],
  )
  const background = useMemo(
    () => safeObject<AboutSolutionsModel['background']>(item?.background),
    [item?.background],
  )
  const enhancers = useMemo(
    () => safeArray<EnhancerItem>(item?.enhancers),
    [item?.enhancers],
  )

  const themeMode = useMemo(
    () => safeString(css?.colorPalette?.theme, 'light'),
    [css?.colorPalette?.theme],
  )
  const cssVariables = useMemo(
    () => buildCssVariables(css, themeMode),
    [css, themeMode],
  )
  const activePalette = useMemo(
    () =>
      safeObject<Record<string, string>>(
        themeMode === 'dark' ? css?.colorPalette?.dark : css?.colorPalette?.light,
      ),
    [css?.colorPalette, themeMode],
  )

  const header = useMemo(
    () => safeObject<NonNullable<AboutSolutionsModel['data']>['header']>(data?.header),
    [data?.header],
  )
  const badgeText = useMemo(() => safeString(header?.badge?.text), [header?.badge])
  const badgeIconData = useMemo(
    () => safeObject(header?.badge?.icon) as IconData,
    [header?.badge],
  )
  const BadgeIcon = useMemo(
    () => resolveIcon(badgeIconData?.iconName, 'AutoAwesome'),
    [badgeIconData?.iconName],
  )

  const title = useMemo(() => safeString(header?.title), [header?.title])
  const titleHighlight = useMemo(
    () => safeString(header?.titleHighlight),
    [header?.titleHighlight],
  )
  const description = useMemo(() => safeString(header?.description), [header?.description])

  const mainMedia = useMemo(
    () => safeObject(data?.media?.main?.media),
    [data?.media?.main],
  )
  const mainImageSrc = useMemo(() => safeString(mainMedia?.mediaLink), [mainMedia])
  const mainImageAlt = useMemo(
    () => safeString(mainMedia?.alt, 'Team collaboration'),
    [mainMedia],
  )
  const hasMainImage = useMemo(
    () => mainImageSrc !== '' && safeString(mainMedia?.mediaType) === 'image',
    [mainImageSrc, mainMedia],
  )

  const videoLink = useMemo(
    () => safeString(data?.media?.video?.link),
    [data?.media?.video],
  )
  const videoIconData = useMemo(
    () => safeObject(data?.media?.video?.icon) as IconData,
    [data?.media?.video],
  )
  const VideoIcon = useMemo(
    () => resolveIcon(videoIconData?.iconName, 'PlayArrow'),
    [videoIconData?.iconName],
  )

  const tabItems = useMemo(
    () =>
      safeArray<TabItem>(data?.tabs?.items).filter(
        (t) => safeString(t?.id) && safeString(t?.label),
      ),
    [data?.tabs?.items],
  )
  const defaultTabId = useMemo(
    () => safeString(data?.tabs?.defaultActive) || safeString(tabItems[0]?.id),
    [data?.tabs?.defaultActive, tabItems],
  )

  const [activeTabId, setActiveTabId] = useState(defaultTabId)
  const activeTab = useMemo(
    () => tabItems.find((t) => safeString(t?.id) === activeTabId) ?? tabItems[0],
    [tabItems, activeTabId],
  )

  const hasHeaderContent = useMemo(
    () => title !== '' || description !== '' || badgeText !== '',
    [title, description, badgeText],
  )
  const hasContent = useMemo(
    () => hasHeaderContent || hasMainImage || tabItems.length > 0,
    [hasHeaderContent, hasMainImage, tabItems],
  )

  const animationsEnabled = settings?.animations?.fadeIn !== false
  const hoverEnabled = settings?.interactions?.hover !== false

  const fadeUp = useMemo(
    () =>
      reducedMotion || !animationsEnabled
        ? { hidden: {}, visible: {} }
        : {
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
          },
    [reducedMotion, animationsEnabled],
  )

  const stagger = useMemo(
    () =>
      reducedMotion || !animationsEnabled
        ? { visible: {} }
        : { visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } } },
    [reducedMotion, animationsEnabled],
  )

  const renderMediaCellView = useCallback(
    (slotKey: string) => {
      const items = safeArray<MediaCellItem>(mediaCells?.[slotKey])
      if (items.length === 0) return null

      return items.map((cell, index) => {
        const mediaType = safeString(cell?.mediaType ?? cell?.type)
        const htmlContent = safeString(cell?.mediaLink ?? cell?.htmlView)
        if (mediaType === 'html' && htmlContent) {
          return (
            <div
              key={`${slotKey}-${index}`}
              className={finalCss.mediaCellHtml}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )
        }
        return null
      })
    },
    [mediaCells, finalCss.mediaCellHtml],
  )

  const renderEnhancers = useCallback(
    (align: 'top' | 'bottom') => {
      const items = enhancers.filter((e) => safeString(e?.align) === align)
      if (items.length === 0) return null

      return items.map((enhancer, index) => {
        const enhancerCss = createSafeTailwind(enhancer?.css?.tailwind)
        const text = safeString(enhancer?.data?.text)
        if (!text) return null

        const textColor = resolveColorKey(
          enhancer?.css?.colorKey,
          activePalette,
          activePalette.textMuted ?? '#6b7280',
        )

        return (
          <div key={`enhancer-${align}-${index}`} className={enhancerCss.global}>
            <div className={enhancerCss.wrapper}>
              <p className={enhancerCss.text} style={{ color: textColor }}>
                {text}
              </p>
            </div>
          </div>
        )
      })
    },
    [enhancers, activePalette],
  )

  const renderLeftColumnType1 = useCallback(() => {
    if (!hasMainImage) return null

    const blobColor = activePalette.primary ?? '#5b4fc7'
    const blobSizeMap = {
      sm: finalCss.blobDecorSm,
      md: finalCss.blobDecorMd,
      lg: finalCss.blobDecorLg,
    }

    const imageHover =
      hoverEnabled && !reducedMotion
        ? { whileHover: { scale: 1.02 } }
        : {}

    const videoHover =
      hoverEnabled && !reducedMotion
        ? { whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 } }
        : {}

    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className={pickLeftCss('leftColumn', leftType, finalCss)}
      >
        {renderMediaCellView('leftTopView')}

        <motion.div variants={fadeUp} className="relative" {...imageHover}>
          {BLOB_POSITIONS.map((blob, i) => (
            <BlobDecor
              key={i}
              className={`${finalCss.blobDecor} ${blob.className} ${blobSizeMap[blob.size]}`}
              sizeClass=""
              color={blobColor}
              delay={blob.delay}
              reducedMotion={reducedMotion}
            />
          ))}

          <div className={finalCss.imageContainer}>
            <div className={finalCss.mainImageFrame}>
              <SafeImage
                src={mainImageSrc}
                alt={mainImageAlt}
                className={finalCss.mainImage}
              />
            </div>

            {videoLink && (
              <motion.a
                href={videoLink}
                aria-label="Play video"
                className={finalCss.videoButton}
                {...videoHover}
              >
                <VideoIcon className={finalCss.videoIcon} />
              </motion.a>
            )}
          </div>
        </motion.div>

        {renderMediaCellView('leftBottomView')}
      </motion.div>
    )
  }, [
    hasMainImage,
    leftType,
    finalCss,
    stagger,
    fadeUp,
    mainImageSrc,
    mainImageAlt,
    videoLink,
    VideoIcon,
    activePalette,
    renderMediaCellView,
    hoverEnabled,
    reducedMotion,
  ])

  const renderLeftColumnType2 = useCallback(() => {
    if (!hasMainImage) return null

    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className={finalCss.leftColumnType2}
      >
        <motion.div variants={fadeUp} className={finalCss.imageContainerType2}>
          <SafeImage
            src={mainImageSrc}
            alt={mainImageAlt}
            className={finalCss.mainImageType2}
          />
        </motion.div>
      </motion.div>
    )
  }, [hasMainImage, finalCss, stagger, fadeUp, mainImageSrc, mainImageAlt])

  const renderRightColumnType1 = useCallback(() => {
    try {
      return (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className={pickRightCss('rightColumn', rightType, finalCss)}
        >
          {renderMediaCellView('rightTopView')}

          {(badgeText || badgeIconData?.iconName) && (
            <motion.div variants={fadeUp} className={finalCss.badge}>
              <BadgeIcon className={finalCss.badgeIcon} />
              {badgeText && <span className={finalCss.badgeText}>{badgeText}</span>}
            </motion.div>
          )}

          {title && (
            <motion.h2 variants={fadeUp} className={finalCss.title}>
              <span className={finalCss.mainTitle}>{title}</span>
              {titleHighlight && (
                <span className={finalCss.highlightTitle}>{titleHighlight}</span>
              )}
            </motion.h2>
          )}

          {description && (
            <motion.p variants={fadeUp} className={finalCss.description}>
              {description}
            </motion.p>
          )}

          {renderMediaCellView('insertView')}

          {tabItems.length > 0 && (
            <motion.div variants={fadeUp} className={finalCss.tabCard}>
              <div className={finalCss.tabNav} role="tablist">
                {tabItems.map((tab) => {
                  const tabId = safeString(tab?.id)
                  const tabLabel = safeString(tab?.label)
                  const isActive = tabId === activeTabId

                  return (
                    <button
                      key={tabId}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tabId}`}
                      id={`tab-${tabId}`}
                      onClick={() => setActiveTabId(tabId)}
                      className={`${finalCss.tabButton} ${
                        isActive ? finalCss.tabButtonActive : finalCss.tabButtonInactive
                      }`}
                    >
                      {tabLabel}
                      {isActive && (
                        <span className={finalCss.tabIndicator} aria-hidden />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className={finalCss.tabPanelWrapper}>
                <AnimatePresence mode="wait">
                  {activeTab && (
                    <TabPanelContent
                      key={activeTabId}
                      tab={activeTab}
                      finalCss={finalCss}
                      hoverEnabled={hoverEnabled}
                      reducedMotion={reducedMotion}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {renderMediaCellView('rightBottomView')}
        </motion.div>
      )
    } catch (error) {
      console.error('[AboutSolutions] Right column Type1 error:', error)
      return null
    }
  }, [
    rightType,
    finalCss,
    stagger,
    fadeUp,
    badgeText,
    badgeIconData,
    BadgeIcon,
    title,
    titleHighlight,
    description,
    tabItems,
    activeTabId,
    activeTab,
    renderMediaCellView,
    hoverEnabled,
    reducedMotion,
  ])

  const renderRightColumnType2 = useCallback(() => {
    try {
      return (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className={pickRightCss('rightColumn', rightType, finalCss)}
        >
          {title && (
            <motion.h2 variants={fadeUp} className={finalCss.title}>
              <span className={finalCss.mainTitle}>{title}</span>
              {titleHighlight && (
                <span className={finalCss.highlightTitle}>{titleHighlight}</span>
              )}
            </motion.h2>
          )}

          {description && (
            <motion.p variants={fadeUp} className={finalCss.description}>
              {description}
            </motion.p>
          )}

          {tabItems.length > 0 && (
            <motion.div variants={fadeUp} className={finalCss.tabCardType2}>
              <div className={finalCss.tabNav} role="tablist">
                {tabItems.map((tab) => {
                  const tabId = safeString(tab?.id)
                  const isActive = tabId === activeTabId
                  return (
                    <button
                      key={tabId}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTabId(tabId)}
                      className={`${finalCss.tabButton} ${
                        isActive ? finalCss.tabButtonActive : finalCss.tabButtonInactive
                      }`}
                    >
                      {safeString(tab?.label)}
                    </button>
                  )
                })}
              </div>
              <div className={finalCss.tabPanelWrapper}>
                <AnimatePresence mode="wait">
                  {activeTab && (
                    <TabPanelContentType2
                      key={activeTabId}
                      tab={activeTab}
                      finalCss={finalCss}
                      hoverEnabled={hoverEnabled}
                      reducedMotion={reducedMotion}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </motion.div>
      )
    } catch (error) {
      console.error('[AboutSolutions] Right column Type2 error:', error)
      return null
    }
  }, [
    rightType,
    finalCss,
    stagger,
    fadeUp,
    title,
    titleHighlight,
    description,
    tabItems,
    activeTabId,
    activeTab,
    hoverEnabled,
    reducedMotion,
  ])

  const renderLeftColumn = useCallback(() => {
    if (leftType === 'Type2') return renderLeftColumnType2()
    return renderLeftColumnType1()
  }, [leftType, renderLeftColumnType1, renderLeftColumnType2])

  const renderRightColumn = useCallback(() => {
    if (rightType === 'Type2') return renderRightColumnType2()
    return renderRightColumnType1()
  }, [rightType, renderRightColumnType1, renderRightColumnType2])

  const renderTwoColumnLayout = useCallback(
    (order: 'left-first' | 'right-first') => {
      const left = renderLeftColumn()
      const right = renderRightColumn()
      const gridClass =
        sectionType === 'Type3' || sectionType === 'Type4'
          ? finalCss.gridSingleColumn
          : finalCss.grid

      return (
        <div className={finalCss.container}>
          <div className={gridClass}>
            {order === 'left-first' ? (
              <>
                {left}
                {right}
              </>
            ) : (
              <>
                {right}
                {left}
              </>
            )}
          </div>
        </div>
      )
    },
    [renderLeftColumn, renderRightColumn, sectionType, finalCss],
  )

  const contentRenderers = useMemo<Record<string, () => React.ReactNode>>(
    () => ({
      Type1: () => renderTwoColumnLayout('left-first'),
      Type2: () => renderTwoColumnLayout('right-first'),
      Type3: () => renderTwoColumnLayout('left-first'),
      Type4: () => renderTwoColumnLayout('right-first'),
    }),
    [renderTwoColumnLayout],
  )

  const backgroundLayer = useMemo(() => {
    const bgType = safeString(background?.type)
    if (!bgType || bgType === 'None') return null

    const settings = safeArray<BackgroundSetting>(background?.settings)
    if (bgType === 'FloatingBlobs') {
      return (
        <FloatingBlobsBackground
          settings={settings}
          palette={activePalette}
          reducedMotion={reducedMotion}
          isInView={isInView}
        />
      )
    }
    return null
  }, [background, activePalette, reducedMotion, isInView])

  if (!hasContent) {
    return (
      <section className={finalCss.emptyState} style={cssVariables}>
        <p className={finalCss.emptyStateText} aria-live="polite">
          No content available.
        </p>
      </section>
    )
  }

  const renderer = contentRenderers[sectionType] ?? contentRenderers.Type1

  try {
    return (
      <section
        ref={sectionRef}
        className={finalCss.global}
        style={cssVariables}
        data-theme={themeMode}
      >
        <div className={finalCss.backgroundLayer} aria-hidden="true">
          {backgroundLayer}
        </div>

        <div className={finalCss.contentWrapper}>
          {renderEnhancers('top')}
          {renderMediaCellView('topView')}
          {renderer()}
          {renderMediaCellView('bottomView')}
          {renderEnhancers('bottom')}
        </div>
      </section>
    )
  } catch (error) {
    console.error('[AboutSolutions] Render error:', error)
    return (
      <section className={finalCss.emptyState} style={cssVariables}>
        <p className={finalCss.emptyStateText} aria-live="polite">
          Unable to display content.
        </p>
      </section>
    )
  }
}
