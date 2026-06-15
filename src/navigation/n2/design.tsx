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

function SidebarTooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null

  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100"
    >
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-r-[6px] border-y-transparent border-r-slate-950" />
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
        className={`relative flex w-full items-center rounded-md text-sm transition-colors ${
          collapsed
            ? 'justify-center px-0 py-2.5'
            : nested
              ? 'gap-2.5 py-2 pl-9 pr-3 text-left'
              : 'gap-3 px-3 py-2.5 text-left'
        } ${
          isActive
            ? 'bg-slate-800/90 font-medium text-white'
            : 'font-normal text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        {isActive && !collapsed && (
          <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-blue-500" />
        )}
        <MaterialIcon
          name={icon}
          variant={iconVariant}
          className={nested && !collapsed ? 'text-[18px]!' : ''}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
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
          className={`flex w-full items-center justify-center rounded-md px-0 py-2.5 transition-colors ${
            hasActiveChild
              ? 'bg-slate-800/90 text-white'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
          }`}
        >
          <MaterialIcon name={icon} variant={iconVariant} />
        </button>
        <SidebarTooltip label={group.label} show />

        <div className="pointer-events-none absolute left-full top-0 z-[9999] ml-3 min-w-[11rem] rounded-lg border border-slate-700 bg-slate-950 py-1.5 opacity-0 shadow-xl transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          <p className="border-b border-slate-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {group.label}
          </p>
          {group.children.map((child) => {
            const isActive = child.id === activeId
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => onSelect(child.id)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <MaterialIcon
                  name={child.icon?.trim() || 'link'}
                  variant={resolveIconVariant(child, isActive)}
                  className="text-[18px]!"
                />
                <span className="truncate">{child.label}</span>
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
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
          hasActiveChild
            ? 'bg-slate-800/50 font-medium text-white'
            : 'font-normal text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <MaterialIcon name={icon} variant={iconVariant} />
        <span className="flex-1 truncate">{group.label}</span>
        <MaterialIcon
          name={expanded ? 'expand_less' : 'expand_more'}
          variant="outline"
          className="text-[18px]! text-slate-500"
        />
      </button>

      {expanded && (
        <div className="mt-0.5 space-y-0.5 border-l border-slate-700/80 ml-5">
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
    <div className="flex min-h-screen w-full bg-slate-100">
      <aside
        aria-expanded={!collapsed}
        className={`relative z-50 flex shrink-0 flex-col border-r border-slate-800 bg-[#14181f] transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-[4.5rem] overflow-visible' : 'w-64'
        }`}
      >
        <div className={`border-b border-slate-800/80 ${collapsed ? 'overflow-visible px-2 py-4' : 'px-4 py-5'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="group relative z-50 hover:z-[100]">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800 text-blue-400 shadow-sm">
                <MaterialIcon name={brandIcon} variant="fill" />
              </span>
              <SidebarTooltip label={brand} show={collapsed} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {title}
                </p>
                <h2 className="truncate text-[15px] font-semibold text-white">{brand}</h2>
              </div>
            )}
          </div>
        </div>

        <nav
          className={`flex-1 p-2 ${
            collapsed ? 'overflow-visible' : 'overflow-x-hidden overflow-y-auto'
          }`}
        >
          {sections.map((section, sectionIndex) => (
            <div key={section.label ?? sectionIndex} className={sectionIndex > 0 ? 'mt-4' : ''}>
              {!collapsed && section.label && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {section.label}
                </p>
              )}

              <div className="flex flex-col gap-0.5">
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

        <div className={`border-t border-slate-800/80 p-2 ${collapsed ? 'overflow-visible' : ''}`}>
          <div className="group relative z-50 hover:z-[100]">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              className={`flex w-full items-center rounded-md text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5 text-left text-sm'
              }`}
            >
              <MaterialIcon
                name={collapsed ? 'chevron_right' : 'chevron_left'}
                variant="outline"
              />
              {!collapsed && <span>Collapse</span>}
            </button>
            <SidebarTooltip label="Expand" show={collapsed} />
          </div>

          {!collapsed && (
            <div className="mt-1 flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
              <MaterialIcon name="link" variant="outline" />
              <span>{leaves.length} links</span>
            </div>
          )}
        </div>
      </aside>

      <main className="relative z-0 flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Current view</p>
            <h1 className="text-sm font-semibold text-slate-900">
              {activeItem?.label ?? 'Select a page'}
            </h1>
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-white">
          {activeItem ? (
            <iframe
              key={activeItem.url}
              src={activeItem.url}
              title={activeItem.label}
              className="h-[calc(100vh-3.5rem)] w-full border-0"
            />
          ) : (
            <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-slate-500">
              Select a menu item from the left panel.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
