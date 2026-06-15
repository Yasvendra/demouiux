import { useEffect, useMemo, useState } from 'react'
import pageData from './data.json'

interface NavLink {
  id: string
  label: string
  url: string
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
  cta?: { label?: string; url?: string }
  navigation?: NavItem[]
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

export default function Design() {
  const brand = data.brand?.trim() || 'Acme'
  const tagline = data.tagline?.trim() || ''
  const ctaLabel = data.cta?.label?.trim() || 'Get Started'
  const ctaUrl = isValidUrl(data.cta?.url) ? data.cta!.url! : ''

  const navigation = useMemo(() => parseNavigation(data.navigation), [])
  const allLinks = useMemo(() => collectLinks(navigation), [navigation])

  const [activeId, setActiveId] = useState(allLinks[0]?.id ?? '')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isCtaActive = activeId === '__cta__'
  const activePage = isCtaActive ? undefined : findActiveLink(navigation, activeId) ?? allLinks[0]
  const iframeUrl = isCtaActive ? ctaUrl : activePage?.url
  const iframeTitle = isCtaActive ? ctaLabel : activePage?.label

  const selectCta = () => {
    if (!ctaUrl) return
    setActiveId('__cta__')
    setOpenDropdown(null)
    setMobileOpen(false)
  }

  const selectPage = (id: string) => {
    if (!findActiveLink(navigation, id) && !allLinks.some((link) => link.id === id)) return
    setActiveId(id)
    setOpenDropdown(null)
    setMobileOpen(false)
  }

  useEffect(() => {
    if (activeId === '__cta__') return
    if (allLinks.length > 0 && !findActiveLink(navigation, activeId)) {
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
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-stone-50">
      <header className="sticky top-0 z-50 shrink-0 border-b border-stone-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => selectPage(allLinks[0]?.id ?? '')}
            className="min-w-0 text-left"
          >
            <span className="font-display text-xl font-semibold text-stone-900">{brand}</span>
            {tagline && (
              <span className="mt-0.5 block truncate text-[11px] text-stone-500 sm:text-xs">
                {tagline}
              </span>
            )}
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0
              const isActive =
                item.id === activeId ||
                item.children?.some((child) => child.id === activeId)

              if (!hasChildren) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectPage(item.id)}
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      item.id === activeId
                        ? 'font-medium text-stone-900'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
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
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'font-medium text-stone-900'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    {item.label}
                    <span className="text-xs text-stone-400">▾</span>
                  </button>

                  <div
                    className={`absolute left-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg ${
                      openDropdown === item.id ? 'block' : 'hidden group-hover:block'
                    }`}
                  >
                    {item.children?.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => selectPage(child.id)}
                        className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          child.id === activeId
                            ? 'bg-stone-100 font-medium text-stone-900'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {ctaUrl && (
              <button
                type="button"
                onClick={selectCta}
                className="hidden rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 sm:inline-block"
              >
                {ctaLabel}
              </button>
            )}

            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 lg:hidden"
            >
              {mobileOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden">
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
                          ? 'bg-stone-100 font-medium text-stone-900'
                          : 'text-stone-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                }

                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isDropdownOpen ? null : item.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-stone-700"
                    >
                      {item.label}
                      <span>{isDropdownOpen ? '−' : '+'}</span>
                    </button>
                    {isDropdownOpen && (
                      <div className="ml-3 border-l border-stone-200 pl-2">
                        {item.children?.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => selectPage(child.id)}
                            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                              child.id === activeId
                                ? 'font-medium text-stone-900'
                                : 'text-stone-600'
                            }`}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {ctaUrl && (
                <button
                  type="button"
                  onClick={selectCta}
                  className="mt-2 rounded-lg bg-stone-900 px-3 py-2.5 text-sm font-medium text-white"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
        <div className="relative mx-auto h-full max-w-7xl overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          {iframeUrl ? (
            <iframe
              key={`${activeId}-${iframeUrl}`}
              src={iframeUrl}
              title={iframeTitle ?? 'Page'}
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-500">
              Select a page from the navigation.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
