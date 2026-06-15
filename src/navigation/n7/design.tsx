import { useEffect, useMemo, useState } from 'react'
import pageData from './data.json'

interface SideTab {
  id: string
  label: string
  url: string
}

interface NavGroup {
  id: string
  label: string
  sideTabs: SideTab[]
}

interface DashboardData {
  brand?: string
  tagline?: string
  navigation?: NavGroup[]
}

const data = pageData as DashboardData

function isValidUrl(url?: string) {
  return typeof url === 'string' && url.startsWith('https://')
}

function parseNavigation(items: NavGroup[] = []) {
  return items.flatMap((item) => {
    if (!item?.id || !item?.label) return []

    const sideTabs = (item.sideTabs ?? []).filter(
      (tab) => tab?.id && tab?.label && isValidUrl(tab.url),
    )

    return sideTabs.length > 0 ? [{ ...item, sideTabs }] : []
  })
}

function SideTabsPanel({
  title,
  tabs,
  activeSideId,
  onSelect,
  variant,
}: {
  title: string
  tabs: SideTab[]
  activeSideId: string
  onSelect: (id: string) => void
  variant: 'mobile' | 'desktop'
}) {
  if (tabs.length === 0) return null

  if (variant === 'mobile') {
    return (
      <div className="shrink-0 border-b border-stone-200/80 bg-white xl:hidden">
        <p className="px-3 pt-3 text-[10px] font-medium uppercase tracking-wider text-stone-400 sm:px-4">
          {title}
        </p>
        <div className="flex gap-4 overflow-x-auto px-3 py-2.5 sm:px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = tab.id === activeSideId
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(tab.id)}
                className={`shrink-0 text-sm transition-colors ${
                  isActive
                    ? 'font-medium text-stone-900 underline decoration-amber-500 underline-offset-4'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col overflow-hidden border-l border-stone-200/80 bg-[#faf9f6] xl:flex 2xl:w-64">
      <div className="shrink-0 border-b border-stone-200/80 px-4 py-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{title}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = tab.id === activeSideId
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                isActive
                  ? 'border-r-2 border-amber-500 bg-white font-medium text-stone-900'
                  : 'text-stone-600 hover:bg-white/80 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default function Design() {
  const brand = data.brand?.trim() || 'Acme Panel'
  const tagline = data.tagline?.trim() || ''
  const navigation = useMemo(() => parseNavigation(data.navigation), [])

  const [activeTopId, setActiveTopId] = useState(navigation[0]?.id ?? '')
  const [activeSideId, setActiveSideId] = useState(navigation[0]?.sideTabs[0]?.id ?? '')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activeGroup = navigation.find((item) => item.id === activeTopId) ?? navigation[0]
  const sideTabs = activeGroup?.sideTabs ?? []

  const activePage =
    sideTabs.find((tab) => tab.id === activeSideId) ?? sideTabs[0]

  const selectTopTab = (id: string) => {
    const group = navigation.find((item) => item.id === id)
    if (!group) return
    setActiveTopId(id)
    setActiveSideId(group.sideTabs[0]?.id ?? '')
    setMobileNavOpen(false)
  }

  const selectSideTab = (id: string) => {
    if (!sideTabs.some((tab) => tab.id === id)) return
    setActiveSideId(id)
  }

  useEffect(() => {
    if (navigation.length === 0) return
    if (!navigation.some((item) => item.id === activeTopId)) {
      setActiveTopId(navigation[0].id)
      setActiveSideId(navigation[0].sideTabs[0]?.id ?? '')
    }
  }, [navigation, activeTopId])

  useEffect(() => {
    if (sideTabs.length === 0) {
      setActiveSideId('')
      return
    }
    if (!sideTabs.some((tab) => tab.id === activeSideId)) {
      setActiveSideId(sideTabs[0].id)
    }
  }, [activeTopId, sideTabs, activeSideId])

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
            {navigation.map((tab) => {
              const isActive = tab.id === activeTopId

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTopTab(tab.id)}
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

      <div className="flex min-h-0 flex-1 overflow-hidden xl:flex-row">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
          <SideTabsPanel
            title={activeGroup?.label ?? 'Pages'}
            tabs={sideTabs}
            activeSideId={activeSideId}
            onSelect={selectSideTab}
            variant="mobile"
          />

          <div className="relative mt-0 min-h-0 flex-1 overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm">
            {activePage ? (
              <iframe
                key={`${activeTopId}-${activeSideId}-${activePage.url}`}
                src={activePage.url}
                title={activePage.label}
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-stone-500">
                Select a tab from the navigation.
              </div>
            )}
          </div>
        </main>

        <SideTabsPanel
          title={activeGroup?.label ?? 'Pages'}
          tabs={sideTabs}
          activeSideId={activeSideId}
          onSelect={selectSideTab}
          variant="desktop"
        />
      </div>
    </div>
  )
}
