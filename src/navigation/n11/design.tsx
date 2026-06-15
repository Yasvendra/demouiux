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

  const showAnnouncement = announcementText && !announcementDismissed

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-(--enterprise-bg)">
      {showAnnouncement && (
        <div className="relative shrink-0 border-b border-amber-900/30 bg-linear-to-r from-[#141210] via-[#1c1916] to-[#141210] px-4 py-2.5 text-center text-xs text-amber-50/90 sm:text-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-500/40 to-transparent" />
          <span className="font-medium tracking-wide">{announcementText}</span>
          {announcementLinkId && announcementLinkLabel && (
            <>
              <span className="mx-2.5 text-stone-600">|</span>
              <button
                type="button"
                onClick={() => selectPage(announcementLinkId)}
                className="font-semibold text-amber-300 underline-offset-4 hover:underline"
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

      <div className="hidden shrink-0 border-b border-stone-200/60 bg-[#ebe7df] sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-[11px] tracking-wide text-stone-600 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-stone-700">{utilityStatus}</span>
            </span>
            {edition && (
              <>
                <span className="text-stone-300">|</span>
                <span className="uppercase tracking-[0.15em] text-stone-500">{edition} Edition</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {utilityDocsId && (
              <button
                type="button"
                onClick={() => selectPage(utilityDocsId)}
                className="transition-colors hover:text-stone-900"
              >
                {utilityDocsLabel}
              </button>
            )}
            {utilitySupportUrl && (
              <a
                href={utilitySupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 transition-colors hover:text-stone-900"
              >
                {utilitySupportLabel}
                <ExternalIcon className="opacity-50" />
              </a>
            )}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 shrink-0 border-b border-stone-200/80 bg-white/97 shadow-[0_4px_24px_rgba(26,24,20,0.04)] backdrop-blur-xl">
        <div className="h-px bg-linear-to-r from-transparent via-amber-600/50 to-transparent" />

        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label={brand}
            onClick={() => selectPage(allLinks[0]?.id ?? 'home')}
            className="group shrink-0"
          >
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-amber-300/30 bg-linear-to-br from-[#2a2620] via-[#1a1814] to-[#0f0e0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform group-hover:scale-[1.02]">
              <span className="absolute inset-0 bg-linear-to-br from-amber-400/10 to-transparent" />
              <span className="font-display relative text-xl font-bold text-amber-100">{brand.charAt(0)}</span>
            </span>
          </button>

          <div className="relative hidden min-w-0 flex-1 lg:block">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages…"
              className="w-full rounded-xl border border-stone-200/90 bg-stone-50/80 py-2 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 transition-colors focus:border-amber-300/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200/50"
            />
            {searchQuery.trim() && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
                {searchResults.slice(0, 6).map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => selectPage(link.id)}
                    className="block w-full px-4 py-2.5 text-left transition-colors hover:bg-stone-50"
                  >
                    <span className="block text-sm font-medium text-stone-800">{link.label}</span>
                    {link.description && (
                      <span className="mt-0.5 block truncate text-xs text-stone-500">{link.description}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav ref={navMenuRef} className="hidden shrink-0 items-center gap-0.5 xl:flex">
            {navigation.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0
              const isActive =
                item.id === activeId || item.children?.some((child) => child.id === activeId)
              const featured = item.children?.find((child) => child.featured)
              const isOpen = openDropdown === item.id

              if (!hasChildren) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectPage(item.id)}
                    className={`relative px-3.5 py-2 text-[13px] tracking-[0.02em] transition-colors ${
                      item.id === activeId
                        ? 'font-semibold text-stone-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-amber-600'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              }

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => openNavDropdown(item.id)}
                  onMouseLeave={scheduleCloseNavDropdown}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    onClick={() => toggleNavDropdown(item.id)}
                    className={`flex items-center gap-1 px-3.5 py-2 text-[13px] tracking-[0.02em] transition-colors ${
                      isActive || isOpen
                        ? 'font-semibold text-stone-900'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="absolute left-1/2 top-full z-50 w-max -translate-x-1/2 pt-3"
                      onMouseEnter={() => openNavDropdown(item.id)}
                      onMouseLeave={scheduleCloseNavDropdown}
                    >
                      <div
                        role="menu"
                        className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.14)]"
                      >
                        <div className="flex">
                          <div className="min-w-64 p-2">
                            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                              {item.label}
                            </p>
                            {item.children?.map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                role="menuitem"
                                onClick={() => selectPage(child.id)}
                                className={`block w-full rounded-xl px-3 py-3 text-left transition-all ${
                                  child.id === activeId
                                    ? 'bg-amber-50/90 ring-1 ring-amber-200/70'
                                    : 'hover:bg-stone-50'
                                }`}
                              >
                                <span
                                  className={`block text-sm ${
                                    child.id === activeId ? 'font-semibold text-stone-900' : 'text-stone-800'
                                  }`}
                                >
                                  {child.label}
                                </span>
                                {child.description && (
                                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">
                                    {child.description}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>

                          {featured && (
                            <div className="hidden w-52 border-l border-stone-100 bg-linear-to-br from-stone-50 to-amber-50/30 p-4 sm:block">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700/70">
                                Featured
                              </p>
                              <p className="mt-2 font-display text-lg font-semibold leading-snug text-stone-900">
                                {featured.label}
                              </p>
                              {featured.description && (
                                <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
                                  {featured.description}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => selectPage(featured.id)}
                                className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-amber-800 transition-colors hover:text-amber-900"
                              >
                                Learn more →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {secondaryUrl && (
              <button
                type="button"
                onClick={selectSecondary}
                className={`hidden rounded-xl border px-4 py-2 text-sm font-medium transition-all sm:inline-block ${
                  isSecondaryActive
                    ? 'border-stone-400 bg-stone-100 text-stone-900'
                    : 'border-stone-300/90 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50'
                }`}
              >
                {secondaryLabel}
              </button>
            )}
            {ctaUrl && (
              <button
                type="button"
                onClick={selectCta}
                className={`hidden rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all sm:inline-block ${
                  isCtaActive
                    ? 'bg-amber-700 text-white ring-2 ring-amber-300/50'
                    : 'bg-stone-900 text-white hover:bg-stone-800 hover:shadow-md'
                }`}
              >
                {ctaLabel}
              </button>
            )}
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm xl:hidden"
            >
              {mobileOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-stone-200 bg-white px-4 py-4 xl:hidden">
            <div className="mb-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages…"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              {(searchQuery.trim() ? searchResults : []).map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => selectPage(link.id)}
                  className="rounded-xl px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-stone-50"
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
                        className={`rounded-xl px-3 py-2.5 text-left text-sm ${
                          item.id === activeId
                            ? 'bg-amber-50 font-semibold text-stone-900'
                            : 'text-stone-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  }

                  return (
                    <div key={item.id} className="rounded-xl border border-stone-100">
                      <button
                        type="button"
                        onClick={() => toggleNavDropdown(item.id)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-stone-800"
                      >
                        {item.label}
                        <span className="text-stone-400">{isDropdownOpen ? '−' : '+'}</span>
                      </button>
                      {isDropdownOpen && (
                        <div className="space-y-0.5 border-t border-stone-100 p-2">
                          {item.children?.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => selectPage(child.id)}
                              className={`block w-full rounded-lg px-3 py-2.5 text-left ${
                                child.id === activeId ? 'bg-amber-50' : ''
                              }`}
                            >
                              <span
                                className={`block text-sm ${
                                  child.id === activeId
                                    ? 'font-semibold text-stone-900'
                                    : 'text-stone-700'
                                }`}
                              >
                                {child.label}
                              </span>
                              {child.description && (
                                <span className="mt-0.5 block text-xs text-stone-500">
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
              <div className="mt-3 flex flex-col gap-2 border-t border-stone-200 pt-3">
                {secondaryUrl && (
                  <button
                    type="button"
                    onClick={selectSecondary}
                    className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700"
                  >
                    {secondaryLabel}
                  </button>
                )}
                {ctaUrl && (
                  <button
                    type="button"
                    onClick={selectCta}
                    className="rounded-xl bg-stone-900 px-3 py-2.5 text-sm font-semibold text-white"
                  >
                    {ctaLabel}
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}

      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-5">
        <div className="relative mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_12px_48px_rgba(15,23,42,0.08)]">
          <div className="flex shrink-0 items-center gap-2 border-b border-stone-200/80 bg-linear-to-b from-stone-50 to-white px-3 py-2 sm:px-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-stone-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-stone-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-stone-300/80" />
            </div>
            <div className="mx-2 flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-stone-200/90 bg-white px-3 py-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="font-mono-ui min-w-0 truncate text-[11px] text-stone-500">
                {iframeUrl ?? 'No page selected'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={refreshIframe}
                disabled={!iframeUrl}
                title="Refresh"
                className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40"
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
                className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40"
              >
                <ExternalIcon />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {iframeLoading && iframeUrl && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/95 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-amber-600" />
                <p className="text-sm font-medium text-stone-600">Loading secure preview…</p>
                <p className="text-xs text-stone-400">Establishing connection</p>
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
              <div className="enterprise-pattern flex h-full flex-col items-center justify-center gap-3 bg-stone-50/50 p-8 text-center">
                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="font-display text-xl font-semibold text-stone-800">Select a destination</p>
                  <p className="mt-2 max-w-sm text-sm text-stone-500">
                    Choose a page from the navigation above or use search to browse the platform.
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
