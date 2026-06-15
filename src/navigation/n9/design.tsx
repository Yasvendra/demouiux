import { useEffect, useMemo, useState } from 'react'
import pageData from './data.json'

interface NavLink {
  id: string
  label: string
  url: string
  description?: string
}

interface NavItem {
  id: string
  label: string
  url?: string
  children?: NavLink[]
}

interface DashboardData {
  brand?: string
  tagline?: string
  announcement?: { text?: string; linkLabel?: string; linkId?: string }
  cta?: { label?: string; url?: string }
  secondaryCta?: { label?: string; url?: string }
  navigation?: NavItem[]
  footer?: {
    copyright?: string
    links?: NavLink[]
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

function findParentLabel(items: NavItem[], activeId: string) {
  for (const item of items) {
    if (item.id === activeId) return item.label
    if (item.children?.some((child) => child.id === activeId)) return item.label
  }
  return ''
}

export default function Design() {
  const brand = data.brand?.trim() || 'Acme'
  const tagline = data.tagline?.trim() || ''
  const announcementText = data.announcement?.text?.trim()
  const announcementLinkLabel = data.announcement?.linkLabel?.trim()
  const announcementLinkId = data.announcement?.linkId?.trim()

  const ctaLabel = data.cta?.label?.trim() || 'Get Started'
  const ctaUrl = isValidUrl(data.cta?.url) ? data.cta!.url! : ''
  const secondaryLabel = data.secondaryCta?.label?.trim() || 'Sign In'
  const secondaryUrl = isValidUrl(data.secondaryCta?.url) ? data.secondaryCta!.url! : ''

  const footerCopyright = data.footer?.copyright?.trim() || `© ${new Date().getFullYear()} ${brand}`
  const footerLinks = useMemo(
    () => (data.footer?.links ?? []).filter((link) => link?.id && link?.label && isValidUrl(link.url)),
    [],
  )

  const navigation = useMemo(() => parseNavigation(data.navigation), [])
  const allLinks = useMemo(() => [...collectLinks(navigation), ...footerLinks], [navigation, footerLinks])

  const resolveLink = (id: string) =>
    findActiveLink(navigation, id) ?? footerLinks.find((link) => link.id === id)

  const [activeId, setActiveId] = useState(allLinks[0]?.id ?? '')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)

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

  const parentLabel = findParentLabel(navigation, activeId)

  const selectCta = () => {
    if (!ctaUrl) return
    setActiveId('__cta__')
    setOpenDropdown(null)
    setMobileOpen(false)
    setIframeLoading(true)
  }

  const selectSecondary = () => {
    if (!secondaryUrl) return
    setActiveId('__secondary__')
    setOpenDropdown(null)
    setMobileOpen(false)
    setIframeLoading(true)
  }

  const selectPage = (id: string) => {
    if (!resolveLink(id)) return
    setActiveId(id)
    setOpenDropdown(null)
    setMobileOpen(false)
    setIframeLoading(true)
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

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#f5f3ee]">
      {announcementText && (
        <div className="shrink-0 border-b border-amber-900/20 bg-[#1c1917] px-4 py-2 text-center text-xs text-amber-100/90 sm:text-sm">
          <span>{announcementText}</span>
          {announcementLinkId && announcementLinkLabel && (
            <>
              <span className="mx-2 text-stone-600">·</span>
              <button
                type="button"
                onClick={() => selectPage(announcementLinkId)}
                className="font-medium text-amber-300 underline-offset-2 hover:underline"
              >
                {announcementLinkLabel}
              </button>
            </>
          )}
        </div>
      )}

      <header className="sticky top-0 z-50 shrink-0 border-b border-stone-200/80 bg-white/95 shadow-[0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => selectPage(allLinks[0]?.id ?? 'home')}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-linear-to-br from-stone-900 to-stone-700 font-display text-lg font-bold text-amber-100">
              {brand.charAt(0)}
            </span>
            <span className="min-w-0">
              <span className="font-display block truncate text-xl font-semibold text-stone-900">
                {brand}
              </span>
              {tagline && (
                <span className="mt-0.5 block truncate text-[11px] tracking-wide text-stone-500 sm:text-xs">
                  {tagline}
                </span>
              )}
            </span>
          </button>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navigation.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0
              const isActive =
                item.id === activeId || item.children?.some((child) => child.id === activeId)

              if (!hasChildren) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectPage(item.id)}
                    className={`relative px-3.5 py-2 text-sm tracking-wide transition-colors ${
                      item.id === activeId
                        ? 'font-medium text-stone-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-amber-600'
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
                  className="group relative"
                  onMouseEnter={() => setOpenDropdown(item.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-sm tracking-wide transition-colors ${
                      isActive ? 'font-medium text-stone-900' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {item.label}
                    <span className="text-[10px] text-stone-400">▾</span>
                  </button>

                  <div
                    className={`absolute left-0 top-full z-50 mt-2 min-w-72 overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)] ${
                      openDropdown === item.id ? 'block' : 'hidden group-hover:block'
                    }`}
                  >
                    <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                      {item.label}
                    </p>
                    {item.children?.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => selectPage(child.id)}
                        className={`block w-full rounded-xl px-3 py-3 text-left transition-colors ${
                          child.id === activeId
                            ? 'bg-amber-50 ring-1 ring-amber-200/80'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <span
                          className={`block text-sm ${
                            child.id === activeId ? 'font-medium text-stone-900' : 'text-stone-800'
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
                </div>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {secondaryUrl && (
              <button
                type="button"
                onClick={selectSecondary}
                className="hidden rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 sm:inline-block"
              >
                {secondaryLabel}
              </button>
            )}
            {ctaUrl && (
              <button
                type="button"
                onClick={selectCta}
                className="hidden rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 sm:inline-block"
              >
                {ctaLabel}
              </button>
            )}
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 lg:hidden"
            >
              {mobileOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-stone-200 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => {
                const hasChildren = (item.children?.length ?? 0) > 0
                const isDropdownOpen = openDropdown === item.id

                if (!hasChildren) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectPage(item.id)}
                      className={`rounded-lg px-3 py-2.5 text-left text-sm ${
                        item.id === activeId
                          ? 'bg-amber-50 font-medium text-stone-900'
                          : 'text-stone-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                }

                return (
                  <div key={item.id} className="rounded-lg border border-stone-100">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isDropdownOpen ? null : item.id)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-stone-800"
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
                                  ? 'font-medium text-stone-900'
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
                    className="rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700"
                  >
                    {secondaryLabel}
                  </button>
                )}
                {ctaUrl && (
                  <button
                    type="button"
                    onClick={selectCta}
                    className="rounded-lg bg-stone-900 px-3 py-2.5 text-sm font-medium text-white"
                  >
                    {ctaLabel}
                  </button>
                )}
              </div>
            </div>
          </nav>
        )}

        <div className="hidden border-t border-stone-200/80 bg-[#faf9f6] sm:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 text-sm text-stone-500">
              <span className="shrink-0 text-stone-400">Viewing</span>
              {parentLabel && (
                <>
                  <span className="text-stone-300">/</span>
                  <span className="truncate">{parentLabel}</span>
                </>
              )}
              <span className="text-stone-300">/</span>
              <span className="truncate font-medium text-stone-800">{iframeTitle}</span>
            </div>
            {iframeUrl && (
              <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] text-stone-500 md:flex">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="max-w-xs truncate">{iframeUrl}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
        <div className="relative mx-auto h-full max-w-7xl overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          {iframeLoading && iframeUrl && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
              <div className="flex items-center gap-3 text-sm text-stone-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-amber-600" />
                Loading preview…
              </div>
            </div>
          )}
          {iframeUrl ? (
            <iframe
              key={`${activeId}-${iframeUrl}`}
              src={iframeUrl}
              title={iframeTitle ?? 'Page'}
              onLoad={() => setIframeLoading(false)}
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              Select a page from the navigation.
            </div>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-stone-200/80 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-stone-500">{footerCopyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {footerLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => selectPage(link.id)}
                className="text-xs text-stone-500 transition-colors hover:text-stone-800"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
