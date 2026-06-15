import { useEffect, useMemo, useState } from 'react'
import pageData from './data.json'

type IconVariant = 'outline' | 'fill'

interface NavLeaf {
  id: string
  label: string
  url: string
  icon?: string
  iconStyle?: IconVariant
}

interface NavGroup {
  id: string
  label: string
  icon?: string
  iconStyle?: IconVariant
  children: NavLeaf[]
}

type NavEntry = NavLeaf | NavGroup

interface NavSection {
  label?: string
  items?: NavEntry[]
}

interface DashboardData {
  title?: string
  brand?: string
  tagline?: string
  brandIcon?: string
  sections?: NavSection[]
}

const data = pageData as DashboardData

function isGroup(item: NavEntry): item is NavGroup {
  return Array.isArray((item as NavGroup).children)
}

function isValidUrl(url?: string) {
  return typeof url === 'string' && url.startsWith('https://')
}

function parseSections(sections: NavSection[] = []) {
  const parsed: NavSection[] = []

  for (const section of sections) {
    const items: NavEntry[] = []

    for (const item of section.items ?? []) {
      if (!item?.id || !item?.label) continue

      if (isGroup(item)) {
        const children = item.children.filter(
          (child) => child?.id && child?.label && isValidUrl(child.url),
        )
        if (children.length > 0) {
          items.push({ ...item, children })
        }
        continue
      }

      if (isValidUrl(item.url)) {
        items.push(item)
      }
    }

    if (items.length > 0) {
      parsed.push({ label: section.label, items })
    }
  }

  return parsed
}

function collectLeaves(sections: NavSection[]) {
  const leaves: NavLeaf[] = []

  for (const section of sections) {
    for (const item of section.items ?? []) {
      if (isGroup(item)) {
        leaves.push(...item.children)
      } else {
        leaves.push(item)
      }
    }
  }

  return leaves
}

function findParentGroupId(sections: NavSection[], leafId: string) {
  for (const section of sections) {
    for (const item of section.items ?? []) {
      if (isGroup(item) && item.children.some((child) => child.id === leafId)) {
        return item.id
      }
    }
  }
  return null
}

function MaterialIcon({
  name,
  variant = 'outline',
  className = '',
}: {
  name: string
  variant?: IconVariant
  className?: string
}) {
  const fontClass = variant === 'fill' ? 'material-symbols' : 'material-symbols-outlined'

  return (
    <span className={`${fontClass} shrink-0 ${className}`} aria-hidden>
      {name}
    </span>
  )
}

function resolveIconVariant(item: { iconStyle?: IconVariant }, isActive: boolean): IconVariant {
  if (item.iconStyle === 'outline' || item.iconStyle === 'fill') {
    return item.iconStyle
  }
  return isActive ? 'fill' : 'outline'
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-2 mt-1 flex items-center gap-2 px-3">
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-amber-200/15" />
      <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-200/45">
        {label}
      </span>
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-amber-200/15" />
    </div>
  )
}

function SidebarTooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null

  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-amber-200/15 bg-[#11151c] px-3 py-1.5 text-xs font-medium tracking-wide text-stone-100 opacity-0 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-200 group-hover:opacity-100"
    >
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-r-[6px] border-y-transparent border-r-[#11151c]" />
    </span>
  )
}

function NavLeafButton({
  item,
  isActive,
  collapsed,
  nested = false,
  onSelect,
}: {
  item: NavLeaf
  isActive: boolean
  collapsed: boolean
  nested?: boolean
  onSelect: (id: string) => void
}) {
  const icon = item.icon?.trim() || 'link'
  const iconVariant = resolveIconVariant(item, isActive)

  return (
    <div className="group relative z-50 hover:z-[100]">
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex w-full items-center transition-all duration-200 ${
          collapsed
            ? 'justify-center rounded-lg px-0 py-2.5'
            : nested
              ? 'gap-2.5 rounded-md py-2 pl-10 pr-3 text-left text-[13px]'
              : 'gap-3 rounded-lg px-3 py-2.5 text-left text-[13px]'
        } ${
          isActive
            ? 'bg-white/[0.07] font-medium text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
            : 'font-normal text-stone-400 hover:bg-white/[0.04] hover:text-stone-100'
        }`}
      >
        {isActive && !collapsed && (
          <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.45)]" />
        )}
        <span
          className={`flex items-center justify-center ${
            isActive ? 'text-amber-300/90' : 'text-stone-500 group-hover:text-stone-300'
          }`}
        >
          <MaterialIcon
            name={icon}
            variant={iconVariant}
            className={nested && !collapsed ? 'text-[18px]!' : ''}
          />
        </span>
        {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
      </button>
      <SidebarTooltip label={item.label} show={collapsed} />
    </div>
  )
}

function NavGroupItem({
  group,
  collapsed,
  expanded,
  activeId,
  onToggle,
  onSelect,
}: {
  group: NavGroup
  collapsed: boolean
  expanded: boolean
  activeId: string
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const icon = group.icon?.trim() || 'folder'
  const hasActiveChild = group.children.some((child) => child.id === activeId)
  const iconVariant = resolveIconVariant(group, hasActiveChild)

  if (collapsed) {
    return (
      <div className="group relative z-50 hover:z-[100]">
        <button
          type="button"
          aria-label={group.label}
          className={`flex w-full items-center justify-center rounded-lg px-0 py-2.5 transition-all duration-200 ${
            hasActiveChild
              ? 'bg-white/[0.07] text-amber-50'
              : 'text-stone-400 hover:bg-white/[0.04] hover:text-stone-100'
          }`}
        >
          <MaterialIcon name={icon} variant={iconVariant} className="text-amber-300/80" />
        </button>
        <SidebarTooltip label={group.label} show />

        <div className="pointer-events-none absolute left-full top-0 z-[9999] ml-3 min-w-52 rounded-xl border border-amber-200/10 bg-[#11151c]/98 py-2 opacity-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          <p className="border-b border-white/[0.06] px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-amber-200/50">
            {group.label}
          </p>
          {group.children.map((child) => {
            const isActive = child.id === activeId
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => onSelect(child.id)}
                className={`mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                  isActive
                    ? 'bg-white/[0.08] font-medium text-amber-50'
                    : 'text-stone-300 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <MaterialIcon
                  name={child.icon?.trim() || 'link'}
                  variant={resolveIconVariant(child, isActive)}
                  className="text-[18px]! text-amber-300/70"
                />
                <span className="truncate tracking-wide">{child.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(group.id)}
        aria-expanded={expanded}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-200 ${
          hasActiveChild
            ? 'bg-white/[0.05] font-medium text-stone-100'
            : 'font-normal text-stone-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        <MaterialIcon
          name={icon}
          variant={iconVariant}
          className={hasActiveChild ? 'text-amber-300/85' : 'text-stone-500'}
        />
        <span className="flex-1 truncate tracking-wide">{group.label}</span>
        <MaterialIcon
          name={expanded ? 'expand_less' : 'expand_more'}
          variant="outline"
          className="text-[18px]! text-stone-600"
        />
      </button>

      {expanded && (
        <div className="relative mt-1 space-y-0.5 pl-4 before:absolute before:bottom-1 before:left-[1.35rem] before:top-1 before:w-px before:bg-amber-200/10">
          {group.children.map((child) => (
            <NavLeafButton
              key={child.id}
              item={child}
              isActive={child.id === activeId}
              collapsed={false}
              nested
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Design() {
  const title = data.title?.trim() || 'Admin Dashboard'
  const brand = data.brand?.trim() || title
  const tagline = data.tagline?.trim() || 'Executive Control Suite'
  const brandIcon = data.brandIcon?.trim() || 'admin_panel_settings'
  const sections = useMemo(() => parseSections(data.sections), [])
  const leaves = useMemo(() => collectLeaves(sections), [sections])

  const [activeId, setActiveId] = useState(leaves[0]?.id ?? '')
  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const activeItem = leaves.find((item) => item.id === activeId)

  useEffect(() => {
    const parentId = findParentGroupId(sections, activeId)
    if (parentId) {
      setExpandedGroups((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]))
    }
  }, [activeId, sections])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-[#f3f1ec]">
      <aside
        aria-expanded={!collapsed}
        className={`relative z-50 flex shrink-0 flex-col border-r border-white/[0.06] bg-linear-to-b from-[#181d27] via-[#12161f] to-[#0c0f15] shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)] transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-[4.75rem] overflow-visible' : 'w-[17.5rem]'
        }`}
      >
        <div
          className={`border-b border-white/[0.06] ${
            collapsed ? 'overflow-visible px-2.5 py-5' : 'px-5 py-6'
          }`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3.5'}`}>
            <div className="group relative z-50 hover:z-[100]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200/20 bg-linear-to-br from-[#252b38] to-[#151922] text-amber-300 shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <MaterialIcon name={brandIcon} variant="fill" />
              </span>
              <SidebarTooltip label={brand} show={collapsed} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-200/45">
                  {title}
                </p>
                <h2 className="font-display truncate text-[1.35rem] font-semibold leading-tight text-stone-50">
                  {brand}
                </h2>
                <p className="mt-0.5 truncate text-[11px] tracking-wide text-stone-500">{tagline}</p>
              </div>
            )}
          </div>
        </div>

        <nav
          className={`flex-1 px-2.5 py-3 ${
            collapsed ? 'overflow-visible' : 'overflow-x-hidden overflow-y-auto'
          }`}
        >
          {sections.map((section, sectionIndex) => (
            <div key={section.label ?? sectionIndex} className={sectionIndex > 0 ? 'mt-5' : ''}>
              {!collapsed && section.label && <SectionLabel label={section.label} />}

              <div className="flex flex-col gap-1">
                {(section.items ?? []).map((item) => {
                  if (isGroup(item)) {
                    return (
                      <NavGroupItem
                        key={item.id}
                        group={item}
                        collapsed={collapsed}
                        expanded={expandedGroups.includes(item.id)}
                        activeId={activeId}
                        onToggle={toggleGroup}
                        onSelect={setActiveId}
                      />
                    )
                  }

                  return (
                    <NavLeafButton
                      key={item.id}
                      item={item}
                      isActive={item.id === activeId}
                      collapsed={collapsed}
                      onSelect={setActiveId}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`border-t border-white/[0.06] p-2.5 ${collapsed ? 'overflow-visible' : ''}`}>
          <div className="group relative z-50 hover:z-[100]">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              className={`flex w-full items-center rounded-lg text-stone-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-stone-200 ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5 text-left text-[13px]'
              }`}
            >
              <MaterialIcon
                name={collapsed ? 'chevron_right' : 'chevron_left'}
                variant="outline"
              />
              {!collapsed && <span className="tracking-wide">Collapse</span>}
            </button>
            <SidebarTooltip label="Expand" show={collapsed} />
          </div>

          {!collapsed && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.03] px-3 py-2.5">
              <div className="flex items-center gap-2 text-[11px] text-stone-500">
                <MaterialIcon name="link" variant="outline" className="text-[18px]!" />
                <span>{leaves.length} destinations</span>
              </div>
              <span className="rounded-full border border-amber-200/15 bg-amber-200/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200/60">
                Live
              </span>
            </div>
          )}
        </div>
      </aside>

      <main className="relative z-0 flex min-w-0 flex-1 flex-col">
        <header className="flex h-[3.75rem] shrink-0 items-center justify-between border-b border-stone-200/80 bg-[#faf9f6] px-6 shadow-[0_1px_0_rgba(255,255,255,0.8)]">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-400">
              Current view
            </p>
            <h1 className="font-display text-lg font-semibold tracking-wide text-stone-800">
              {activeItem?.label ?? 'Select a page'}
            </h1>
          </div>

          {activeItem && (
            <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] text-stone-500 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="max-w-[14rem] truncate">{activeItem.url}</span>
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 bg-white p-3">
          <div className="h-full overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            {activeItem ? (
              <iframe
                key={activeItem.url}
                src={activeItem.url}
                title={activeItem.label}
                className="h-[calc(100vh-5.25rem)] w-full border-0"
              />
            ) : (
              <div className="flex h-[calc(100vh-5.25rem)] items-center justify-center text-sm text-stone-500">
                Select a menu item from the left panel.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
