import { useEffect, useMemo, useState } from 'react'
import pageData from './data.json'

interface NavTab {
  id: string
  label: string
  url: string
}

interface DashboardData {
  brand?: string
  tagline?: string
  navigation?: NavTab[]
}

const data = pageData as DashboardData

function isValidUrl(url?: string) {
  return typeof url === 'string' && url.startsWith('https://')
}

function parseTabs(items: NavTab[] = []) {
  return items.filter((item) => item?.id && item?.label && isValidUrl(item.url))
}

export default function Design() {
  const brand = data.brand?.trim() || 'Acme Panel'
  const tagline = data.tagline?.trim() || ''
  const tabs = useMemo(() => parseTabs(data.navigation), [])

  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  const selectTab = (id: string) => {
    if (!tabs.some((tab) => tab.id === id)) return
    setActiveId(id)
    setMobileNavOpen(false)
  }

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeId)) {
      setActiveId(tabs[0].id)
    }
  }, [tabs, activeId])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#f3f1ec]">
      <header className="shrink-0 border-b border-stone-200/80 bg-[#faf9f6]">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-display truncate text-lg font-semibold text-stone-900 sm:text-xl">
              {brand}
            </h1>
            {tagline && (
              <p className="truncate text-[11px] text-stone-500 sm:text-xs">{tagline}</p>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileNavOpen((open) => !open)}
            className="shrink-0 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 lg:hidden"
          >
            {mobileNavOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <nav
          className={`border-t border-stone-200/60 bg-[#181d27] lg:block ${
            mobileNavOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex flex-col gap-0 px-2 py-2 lg:flex-row lg:items-center lg:gap-1 lg:overflow-x-auto lg:px-4 lg:py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const isActive = tab.id === activeId

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors lg:w-auto lg:whitespace-nowrap ${
                    isActive
                      ? 'font-medium text-amber-50 lg:border-b-2 lg:border-amber-400'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
        <div className="relative h-full overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm">
          {activeTab ? (
            <iframe
              key={`${activeTab.id}-${activeTab.url}`}
              src={activeTab.url}
              title={activeTab.label}
              className="absolute inset-0 h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-500">
              Select a page from the top navigation.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
