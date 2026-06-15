import { useEffect, useMemo, useRef, useState } from 'react'
import pageData from './data.json'

interface NavLink {
  id: string
  label: string
  url: string
  description?: string
  featured?: boolean
}

interface NavItem {
  id: string
  label: string
  url?: string
  children?: NavLink[]
}

interface FooterColumn {
  title?: string
  links?: NavLink[]
}

interface DashboardData {
  brand?: string
  tagline?: string
  edition?: string
  navbar?: {
    layout?: string
    searchPlaceholder?: string
    showTrustBadges?: boolean
    quickAccess?: { id: string; label: string }[]
  }
  announcement?: { text?: string; linkLabel?: string; linkId?: string }
  utility?: {
    status?: string
    supportLabel?: string
    supportUrl?: string
    docsLabel?: string
    docsId?: string
  }
  trust?: string[]
  cta?: { label?: string; url?: string }
  secondaryCta?: { label?: string; url?: string }
  navigation?: NavItem[]
  footer?: {
    copyright?: string
    links?: NavLink[]
    columns?: FooterColumn[]
  }
}

const data = pageData as DashboardData

function isValidUrl(url?: string) {
  return typeof url === 'string' && url.startsWith('https://')
}

function parseNavigation(items: NavItem[] = []) {
  return items.flatMap((item) => {
    if (!item?.id || !item?.label) return []

    const children = (item.children ?? []).filter(
      (child) => child?.id && child?.label && isValidUrl(child.url),
    )

    if (isValidUrl(item.url) || children.length > 0) {
      return [{ ...item, children }]
    }

    return []
  })
}

function collectLinks(items: NavItem[]) {
  const links: NavLink[] = []

  for (const item of items) {
    if (item.children?.length) {
      links.push(...item.children)
    } else if (isValidUrl(item.url)) {
      links.push({ id: item.id, label: item.label, url: item.url! })
    }
  }

  return links
}

function collectFooterLinks(columns: FooterColumn[] = [], legacyLinks: NavLink[] = []) {
  const fromColumns = columns.flatMap((col) =>
    (col.links ?? []).filter((link) => link?.id && link?.label && isValidUrl(link.url)),
  )
  const seen = new Set<string>()
  const merged: NavLink[] = []

  for (const link of [...fromColumns, ...legacyLinks]) {
    if (!seen.has(link.id)) {
      seen.add(link.id)
      merged.push(link)
    }
  }

  return merged
}

function findActiveLink(items: NavItem[], activeId: string): NavLink | undefined {
  for (const item of items) {
    if (item.id === activeId && isValidUrl(item.url)) {
      return { id: item.id, label: item.label, url: item.url! }
    }
    const child = item.children?.find((entry) => entry.id === activeId)
    if (child) return child
  }
  return undefined
}

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  )
}

function ExternalIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M9 2h3v3M12 2 7 7M5 4H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Design() {
  const brand = data.brand?.trim() || 'Acme'
  const edition = data.edition?.trim() || ''
  const navbarConfig = data.navbar ?? {}
  const searchPlaceholder = navbarConfig.searchPlaceholder?.trim() || 'Search the catalogue…'
  const showTrustBadges = navbarConfig.showTrustBadges !== false
  const quickAccess = (navbarConfig.quickAccess ?? []).filter((entry) => entry?.id && entry?.label)
  const trustBadges = (data.trust ?? []).filter((badge) => typeof badge === 'string' && badge.trim())
  const announcementText = data.announcement?.text?.trim()
  const announcementLinkLabel = data.announcement?.linkLabel?.trim()
  const announcementLinkId = data.announcement?.linkId?.trim()

  const utilityStatus = data.utility?.status?.trim() || 'All systems operational'
  const utilitySupportLabel = data.utility?.supportLabel?.trim() || 'Support'
  const utilitySupportUrl = isValidUrl(data.utility?.supportUrl) ? data.utility!.supportUrl! : ''
  const utilityDocsLabel = data.utility?.docsLabel?.trim() || 'Documentation'
  const utilityDocsId = data.utility?.docsId?.trim() || ''

  const ctaLabel = data.cta?.label?.trim() || 'Get Started'
  const ctaUrl = isValidUrl(data.cta?.url) ? data.cta!.url! : ''
  const secondaryLabel = data.secondaryCta?.label?.trim() || 'Sign In'
  const secondaryUrl = isValidUrl(data.secondaryCta?.url) ? data.secondaryCta!.url! : ''

  const footerColumns = (data.footer?.columns ?? []).filter((col) => col?.title && col.links?.length)
  const legacyFooterLinks = (data.footer?.links ?? []).filter(
    (link) => link?.id && link?.label && isValidUrl(link.url),
  )
  const footerLinks = useMemo(
    () => collectFooterLinks(footerColumns, legacyFooterLinks),
    [footerColumns, legacyFooterLinks],
  )

  const navigation = useMemo(() => parseNavigation(data.navigation), [])
  const allLinks = useMemo(() => [...collectLinks(navigation), ...footerLinks], [navigation, footerLinks])

  const resolveLink = (id: string) =>
    findActiveLink(navigation, id) ?? footerLinks.find((link) => link.id === id)

  const [activeId, setActiveId] = useState(allLinks[0]?.id ?? '')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [announcementDismissed, setAnnouncementDismissed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const dropdownCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navMenuRef = useRef<HTMLDivElement>(null)

  const clearDropdownCloseTimer = () => {
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
  }

  const openNavDropdown = (id: string) => {
    clearDropdownCloseTimer()
    setOpenDropdown(id)
  }

  const scheduleCloseNavDropdown = () => {
    clearDropdownCloseTimer()
    dropdownCloseTimer.current = setTimeout(() => {
      setOpenDropdown(null)
      dropdownCloseTimer.current = null
    }, 200)
  }

  const closeNavDropdownNow = () => {
    clearDropdownCloseTimer()
    setOpenDropdown(null)
  }

  const toggleNavDropdown = (id: string) => {
    clearDropdownCloseTimer()
    setOpenDropdown((current) => (current === id ? null : id))
  }

  useEffect(() => {
    return () => clearDropdownCloseTimer()
  }, [])

  useEffect(() => {
    if (!openDropdown) return

    const handlePointerDown = (event: PointerEvent) => {
      if (navMenuRef.current?.contains(event.target as Node)) return
      closeNavDropdownNow()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openDropdown])

  const isCtaActive = activeId === '__cta__'
  const isSecondaryActive = activeId === '__secondary__'
  const activePage = isCtaActive || isSecondaryActive
    ? undefined
    : resolveLink(activeId) ?? allLinks[0]

  const iframeUrl = isCtaActive ? ctaUrl : isSecondaryActive ? secondaryUrl : activePage?.url
  const iframeTitle = isCtaActive
    ? ctaLabel
    : isSecondaryActive
      ? secondaryLabel
      : activePage?.label

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return allLinks.filter(
      (link) =>
        link.label.toLowerCase().includes(q) ||
        link.description?.toLowerCase().includes(q) ||
        link.id.toLowerCase().includes(q),
    )
  }, [allLinks, searchQuery])

  const selectCta = () => {
    if (!ctaUrl) return
    setActiveId('__cta__')
    closeNavDropdownNow()
    setMobileOpen(false)
    setSearchQuery('')
    setIframeLoading(true)
  }

  const selectSecondary = () => {
    if (!secondaryUrl) return
    setActiveId('__secondary__')
    closeNavDropdownNow()
    setMobileOpen(false)
    setSearchQuery('')
    setIframeLoading(true)
  }

  const selectPage = (id: string) => {
    if (!resolveLink(id)) return
    setActiveId(id)
    closeNavDropdownNow()
    setMobileOpen(false)
    setSearchQuery('')
    setIframeLoading(true)
  }

  const refreshIframe = () => {
    setIframeLoading(true)
    setIframeKey((key) => key + 1)
  }

  const openExternal = () => {
    if (iframeUrl) window.open(iframeUrl, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (activeId === '__cta__' || activeId === '__secondary__') return
    if (allLinks.length > 0 && !resolveLink(activeId)) {
      setActiveId(allLinks[0].id)
    }
  }, [allLinks, navigation, activeId])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
      }
      if (window.innerWidth >= 1280) {
        closeNavDropdownNow()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showAnnouncement = announcementText && !announcementDismissed

  const openMegaItem = openDropdown ? navigation.find((item) => item.id === openDropdown) : undefined
  const openMegaFeatured = openMegaItem?.children?.find((child) => child.featured)

  const searchField = (variant: 'light' | 'dark' = 'light', className = '') => (
    <>
      <div
        className={`pointer-events-none absolute inset-y-0 left-3.5 flex items-center ${
          variant === 'dark' ? 'text-[#9a9488]/70' : 'text-[#9a9488]'
        } ${className}`}
      >
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden>
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className={`w-full py-2 pl-10 pr-4 text-sm transition-all ${
          variant === 'dark'
            ? 'command-search'
            : 'premium-search rounded-sm text-base text-[#14120f] placeholder:text-[#9a9488] sm:text-sm'
        }`}
      />
      {searchQuery.trim() && searchResults.length > 0 && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 max-h-[min(60dvh,320px)] overflow-y-auto rounded-md py-1 shadow-lg ${
            variant === 'dark'
              ? 'border border-white/10 bg-[#1e1c18]'
              : 'premium-dropdown premium-popover rounded-sm'
          }`}
        >
          {searchResults.slice(0, 8).map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => selectPage(link.id)}
              className={`touch-target block w-full px-4 py-2.5 text-left transition-colors ${
                variant === 'dark' ? 'hover:bg-white/5' : 'hover:bg-[#f0ebe2]'
              }`}
            >
              <span
                className={`font-display block text-sm font-semibold ${
                  variant === 'dark' ? 'text-[#e8d9a8]' : 'text-[#14120f]'
                }`}
              >
                {link.label}
              </span>
              {link.description && (
                <span
                  className={`mt-0.5 block truncate text-xs ${
                    variant === 'dark' ? 'text-[#a8a095]' : 'text-[#5c574f]'
                  }`}
                >
                  {link.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  )

  return (
    <div className="premium-shell flex h-dvh w-full flex-col">
      {showAnnouncement && (
        <div className="relative shrink-0 border-b border-[#9a7b2f]/30 bg-linear-to-r from-[#12100e] via-[#1a1814] to-[#12100e] px-3 py-2.5 pr-10 text-center text-xs text-[#e8d9a8]/90 safe-area-x sm:px-4 sm:pr-12 sm:text-sm">
          <div className="premium-gold-rule absolute inset-x-0 top-0 opacity-60" />
          <span className="font-display inline-block max-w-[90vw] text-sm font-medium leading-snug tracking-wide italic sm:max-w-none">
            {announcementText}
          </span>
          {announcementLinkId && announcementLinkLabel && (
            <>
              <span className="mx-2.5 text-stone-600">|</span>
              <button
                type="button"
                onClick={() => selectPage(announcementLinkId)}
                className="font-display font-semibold text-[#d4b85a] underline-offset-4 hover:underline"
              >
                {announcementLinkLabel}
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setAnnouncementDismissed(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-stone-500 transition-colors hover:bg-white/5 hover:text-stone-300"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 3l8 8M11 3 3 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <header className="premium-command-header sticky top-0 shrink-0 backdrop-blur-md">
        <div className="command-deck hidden shrink-0 md:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-2 safe-area-x sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#d8d2c6]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6b9e6b] shadow-[0_0_8px_rgba(107,158,107,0.7)]" />
                <span className="truncate font-medium">{utilityStatus}</span>
              </span>
              {edition && (
                <>
                  <span className="hidden text-[#4a4640] lg:inline">|</span>
                  <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#c4a035] lg:inline">
                    {edition}
                  </span>
                </>
              )}
              {showTrustBadges && trustBadges.length > 0 && (
                <div className="hidden items-center gap-2 xl:flex">
                  {trustBadges.slice(0, 3).map((badge) => (
                    <span
                      key={badge}
                      className="trust-badge rounded-full px-2.5 py-0.5 text-[9px] font-medium uppercase text-[#e8d9a8]/80"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4 text-[10px] uppercase tracking-[0.12em] text-[#a8a095]">
              {quickAccess.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectPage(entry.id)}
                  className="hidden transition-colors hover:text-[#e8d9a8] sm:inline"
                >
                  {entry.label}
                </button>
              ))}
              {utilityDocsId && (
                <button
                  type="button"
                  onClick={() => selectPage(utilityDocsId)}
                  className="transition-colors hover:text-[#e8d9a8]"
                >
                  {utilityDocsLabel}
                </button>
              )}
              {utilitySupportUrl && (
                <a
                  href={utilitySupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition-colors hover:text-[#e8d9a8]"
                >
                  {utilitySupportLabel}
                  <ExternalIcon className="opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="nav-deck">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 safe-area-x sm:gap-4 sm:px-6 sm:py-3.5 lg:gap-5 lg:px-8">
            <button
              type="button"
              aria-label={brand}
              onClick={() => selectPage(allLinks[0]?.id ?? 'home')}
              className="group shrink-0"
            >
              <span className="premium-logo relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-transform group-hover:scale-[1.04] sm:h-10 sm:w-10">
                <span className="font-display relative text-lg font-bold text-[#e8d9a8] sm:text-xl">
                  {brand.charAt(0)}
                </span>
              </span>
            </button>

            <div className="relative hidden min-w-0 flex-1 overflow-visible lg:block xl:max-w-2xl">
              {searchField('dark')}
            </div>

            <nav
              ref={navMenuRef}
              className="hidden shrink-0 items-center justify-center gap-1 lg:flex"
            >
              {navigation.map((item) => {
                const hasChildren = (item.children?.length ?? 0) > 0
                const isActive =
                  item.id === activeId || item.children?.some((child) => child.id === activeId)
                const isOpen = openDropdown === item.id

                if (!hasChildren) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectPage(item.id)}
                      className={`nav-pill touch-target whitespace-nowrap px-4 py-2 ${
                        item.id === activeId ? 'nav-pill-active' : 'text-[#c8c2b6]'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onMouseEnter={() => openNavDropdown(item.id)}
                    onMouseLeave={scheduleCloseNavDropdown}
                    onClick={() => toggleNavDropdown(item.id)}
                    className={`nav-pill flex touch-target items-center gap-1.5 whitespace-nowrap px-4 py-2 ${
                      isOpen ? 'nav-pill-open' : isActive ? 'nav-pill-active' : 'text-[#c8c2b6]'
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`text-current opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                )
              })}
            </nav>

            <div className="action-cluster ml-auto flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:pl-4">
              {secondaryUrl && (
                <button
                  type="button"
                  onClick={selectSecondary}
                  className={`touch-target hidden rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.06em] transition-all md:inline-flex ${
                    isSecondaryActive
                      ? 'border-[#c4a035] bg-[#c4a035]/15 text-[#e8d9a8]'
                      : 'border-white/15 text-[#c8c2b6] hover:border-[#c4a035]/40 hover:text-[#e8d9a8]'
                  }`}
                >
                  {secondaryLabel}
                </button>
              )}
              {ctaUrl && (
                <button
                  type="button"
                  onClick={selectCta}
                  className={`premium-btn-gold touch-target hidden rounded-full px-4 py-2 md:inline-flex ${
                    isCtaActive ? 'ring-2 ring-[#e8d9a8]/40' : ''
                  }`}
                >
                  {ctaLabel}
                </button>
              )}
              <button
                type="button"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((open) => !open)}
                className="touch-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#e8d9a8] transition-colors hover:border-[#c4a035]/40 hover:bg-white/5 lg:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  {mobileOpen ? (
                    <path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  ) : (
                    <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {openMegaItem && (openMegaItem.children?.length ?? 0) > 0 && (
          <div
            className="mega-panel hidden lg:block"
            onMouseEnter={() => openNavDropdown(openMegaItem.id)}
            onMouseLeave={scheduleCloseNavDropdown}
          >
            <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[1fr_auto] lg:px-8">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7b2f]">
                  {openMegaItem.label}
                </p>
                <div className="mt-4 grid gap-1 sm:grid-cols-2">
                  {openMegaItem.children?.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      role="menuitem"
                      onClick={() => selectPage(child.id)}
                      className={`rounded-md px-4 py-3 text-left transition-all ${
                        child.id === activeId
                          ? 'bg-[#f5edd8] ring-1 ring-[#c4a035]/40'
                          : 'hover:bg-[#f0ebe2]'
                      }`}
                    >
                      <span
                        className={`block text-sm ${
                          child.id === activeId ? 'font-semibold text-[#14120f]' : 'font-medium text-[#2a2620]'
                        }`}
                      >
                        {child.label}
                      </span>
                      {child.description && (
                        <span className="mt-1 block text-xs leading-relaxed text-[#5c574f]">
                          {child.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {openMegaFeatured && (
                <div className="w-full rounded-md border border-[#d8d2c6] bg-linear-to-br from-[#f5f0e8] to-[#ebe3d0] p-5 lg:w-64">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#9a7b2f]">
                    Spotlight
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold leading-snug text-[#14120f]">
                    {openMegaFeatured.label}
                  </p>
                  {openMegaFeatured.description && (
                    <p className="mt-2 text-xs leading-relaxed text-[#5c574f]">
                      {openMegaFeatured.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => selectPage(openMegaFeatured.id)}
                    className="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a7b2f] transition-colors hover:text-[#7a6020]"
                  >
                    Explore →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-white/5 px-3 py-2.5 safe-area-x lg:hidden sm:px-6">
          <div className="relative overflow-visible">{searchField('dark')}</div>
        </div>

        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu overlay"
              className="fixed inset-0 z-[90] bg-[#14120f]/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="mobile-drawer fixed inset-y-0 right-0 z-[95] flex w-[min(88vw,340px)] flex-col border-l border-white/10 lg:hidden">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
                <span className="premium-logo relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full">
                  <span className="font-display text-lg font-bold text-[#e8d9a8]">{brand.charAt(0)}</span>
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                  className="touch-target flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[#e8d9a8]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 4l8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <div className="flex flex-col gap-1">
                  {searchQuery.trim() && searchResults.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-[#9a9488]">No results found.</p>
                  )}
                  {(searchQuery.trim() ? searchResults : []).map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => selectPage(link.id)}
                      className="touch-target rounded-md px-3 py-3 text-left text-sm text-[#c8c2b6] hover:bg-white/5"
                    >
                      {link.label}
                    </button>
                  ))}
                  {!searchQuery.trim() &&
                    navigation.map((item) => {
                      const hasChildren = (item.children?.length ?? 0) > 0
                      const isDropdownOpen = openDropdown === item.id

                      if (!hasChildren) {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectPage(item.id)}
                            className={`touch-target rounded-md px-3 py-3 text-left text-sm ${
                              item.id === activeId
                                ? 'bg-[#c4a035]/15 font-semibold text-[#e8d9a8]'
                                : 'text-[#c8c2b6] hover:bg-white/5'
                            }`}
                          >
                            {item.label}
                          </button>
                        )
                      }

                      return (
                        <div key={item.id} className="rounded-md border border-white/10">
                          <button
                            type="button"
                            onClick={() => toggleNavDropdown(item.id)}
                            className="touch-target flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium text-[#f5edd8]"
                          >
                            {item.label}
                            <ChevronDown
                              className={`text-[#9a9488] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isDropdownOpen && (
                            <div className="space-y-0.5 border-t border-white/8 p-2">
                              {item.children?.map((child) => (
                                <button
                                  key={child.id}
                                  type="button"
                                  onClick={() => selectPage(child.id)}
                                  className={`touch-target block w-full rounded-md px-3 py-3 text-left ${
                                    child.id === activeId ? 'bg-[#c4a035]/12' : 'hover:bg-white/5'
                                  }`}
                                >
                                  <span
                                    className={`block text-sm ${
                                      child.id === activeId
                                        ? 'font-semibold text-[#e8d9a8]'
                                        : 'text-[#c8c2b6]'
                                    }`}
                                  >
                                    {child.label}
                                  </span>
                                  {child.description && (
                                    <span className="mt-0.5 block text-xs text-[#9a9488]">
                                      {child.description}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </nav>

              <div className="shrink-0 space-y-2 border-t border-white/8 p-4 safe-area-bottom">
                {secondaryUrl && (
                  <button
                    type="button"
                    onClick={selectSecondary}
                    className="touch-target w-full rounded-full border border-white/15 px-4 py-3 text-sm text-[#c8c2b6]"
                  >
                    {secondaryLabel}
                  </button>
                )}
                {ctaUrl && (
                  <button
                    type="button"
                    onClick={selectCta}
                    className="premium-btn-gold touch-target w-full rounded-full px-4 py-3"
                  >
                    {ctaLabel}
                  </button>
                )}
              </div>
            </aside>
          </>
        )}
      </header>

      <main className="relative z-0 min-h-0 flex-1 overflow-hidden p-2 safe-area-x safe-area-bottom sm:p-4 lg:p-6">
        <div className="premium-frame relative mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-sm bg-[#fdfbf7]">
          <div className="premium-frame-bar flex shrink-0 items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full border border-[#b8b0a2] bg-[#d8d2c6]" />
              <span className="h-2 w-2 rounded-full border border-[#b8b0a2] bg-[#d8d2c6]" />
              <span className="h-2 w-2 rounded-full border border-[#b8b0a2] bg-[#d8d2c6]" />
            </div>
            <div className="mx-0 flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-[#d8d2c6] bg-[#fdfbf7] px-2 py-1.5 shadow-[inset_0_1px_2px_rgba(20,18,15,0.04)] sm:mx-1 sm:px-3">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6b9e6b]" />
              <span className="font-mono-ui min-w-0 flex-1 truncate text-[9px] tracking-wide text-[#5c574f] sm:text-[10px]">
                {iframeUrl ?? 'No destination selected'}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={refreshIframe}
                disabled={!iframeUrl}
                title="Refresh"
                className="touch-target inline-flex items-center justify-center rounded-sm p-2 text-[#5c574f] transition-colors hover:bg-[#e8e4dc] hover:text-[#14120f] disabled:opacity-40"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M11.5 2.5A5 5 0 1 0 12 7M12 2.5V5.5M12 2.5H9"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={openExternal}
                disabled={!iframeUrl}
                title="Open in new tab"
                className="touch-target inline-flex items-center justify-center rounded-sm p-2 text-[#5c574f] transition-colors hover:bg-[#e8e4dc] hover:text-[#14120f] disabled:opacity-40"
              >
                <ExternalIcon />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {iframeLoading && iframeUrl && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#fdfbf7]/96 p-4 text-center backdrop-blur-sm">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#d8d2c6] border-t-[#9a7b2f] sm:h-10 sm:w-10" />
                <p className="font-display text-base font-semibold text-[#14120f] sm:text-lg">Loading preview</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a9488]">Please wait</p>
              </div>
            )}
            {iframeUrl ? (
              <iframe
                key={`${activeId}-${iframeUrl}-${iframeKey}`}
                src={iframeUrl}
                title={iframeTitle ?? 'Page'}
                onLoad={() => setIframeLoading(false)}
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="enterprise-pattern flex h-full flex-col items-center justify-center gap-4 bg-[#f5f0e8]/60 p-4 text-center sm:p-8">
                <div className="premium-frame w-full max-w-sm rounded-sm bg-[#fdfbf7] p-6 sm:p-8">
                  <p className="font-display text-xl font-semibold text-[#14120f] sm:text-2xl">Welcome</p>
                  <div className="mx-auto mt-3 h-px w-12 bg-linear-to-r from-transparent via-[#c4a035] to-transparent" />
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#5c574f]">
                    Select a page from the navigation above, or search the catalogue to begin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
