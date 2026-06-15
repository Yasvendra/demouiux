import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion'
import pageData from './data.json'

/* ─── Types ─── */

interface ThemeData {
  accent?: string
  accentAlert?: string
  accentCritical?: string
  accentGlow?: string
  surface?: string
  panel?: string
  gridLine?: string
}

interface Department {
  id: string
  name?: string
  color?: string
  icon?: string
}

type CellStatus = 'full' | 'watch' | 'gap'

interface GridCell {
  id: string
  deptId: string
  dayIndex?: number
  shift?: string
  staffed?: number
  required?: number
  coverage?: number
  status?: CellStatus
  lead?: string
  note?: string
  openShifts?: number
}

interface CareGridData {
  org?: string
  title?: string
  subtitle?: string
  weekLabel?: string
  timezone?: string
  defaultSelected?: string
  autoHighlight?: boolean
  autoHighlightMs?: number
  days?: string[]
  departments?: Department[]
  cells?: GridCell[]
}

interface DesignPageData {
  theme?: ThemeData
  careGrid?: CareGridData
}

const data = pageData as DesignPageData
const ease = [0.22, 1, 0.36, 1] as const

/* ─── Null-safe helpers ─── */

function trim(value?: string | null): string {
  return value?.trim() ?? ''
}

function safeDepartments(depts?: Department[]): Department[] {
  return (depts ?? []).filter((d): d is Department => Boolean(trim(d?.id)))
}

function safeCells(cells?: GridCell[]): GridCell[] {
  return (cells ?? []).filter((c): c is GridCell => Boolean(trim(c?.id)))
}

function safeDays(days?: string[]): string[] {
  const list = (days ?? []).map((d) => trim(d)).filter(Boolean)
  return list.length ? list : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

function resolveDefault(cells: GridCell[], preferred?: string): string {
  const id = trim(preferred)
  if (id && cells.some((c) => c.id === id)) return id
  return cells[0]?.id ?? ''
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return trim(value) || fallback
}

function safeMs(value?: number | null, fallback = 8500): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(Math.min(value, 60000), 3000)
}

function safeDayIndex(value?: number | null): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(Math.floor(value), 6))
}

function safeNum(value?: number | null, fallback = 0): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return value
}

function cellFor(deptId: string, dayIndex: number, cells: GridCell[]): GridCell | null {
  return cells.find((c) => c.deptId === deptId && safeDayIndex(c.dayIndex) === dayIndex) ?? null
}

function statusColor(status: CellStatus | undefined, theme: ThemeData): string {
  if (status === 'gap') return safeColor(theme.accentCritical, '#EF4444')
  if (status === 'watch') return safeColor(theme.accentAlert, '#F59E0B')
  return safeColor(theme.accent, '#0D9488')
}

function statusLabel(status: CellStatus | undefined): string {
  if (status === 'gap') return 'Coverage gap'
  if (status === 'watch') return 'Needs attention'
  return 'Fully staffed'
}

/* ─── Shift cell button ─── */

function ShiftCell({
  cell,
  dept,
  isSelected,
  isToday,
  accent,
  alert,
  critical,
  panel,
  gridLine,
  reduceMotion,
  onSelect,
}: {
  cell: GridCell | null
  dept: Department
  isSelected: boolean
  isToday: boolean
  accent: string
  alert: string
  critical: string
  panel: string
  gridLine: string
  reduceMotion: boolean
  onSelect: (id: string) => void
}) {
  if (!cell) {
    return (
      <td className="border p-1" style={{ borderColor: gridLine }}>
        <div className="h-16 rounded-lg bg-slate-50 sm:h-[4.5rem]" />
      </td>
    )
  }

  const status = cell.status ?? 'full'
  const color = status === 'gap' ? critical : status === 'watch' ? alert : accent
  const coverage = safeNum(cell.coverage, 100)
  const staffed = safeNum(cell.staffed)
  const required = safeNum(cell.required)
  const open = safeNum(cell.openShifts)
  const shift = trim(cell.shift) || '—'

  return (
    <td className="border p-1" style={{ borderColor: gridLine }}>
      <motion.button
        type="button"
        onClick={() => onSelect(cell.id)}
        className="relative flex h-16 w-full flex-col justify-between overflow-hidden rounded-lg border p-2 text-left sm:h-[4.5rem] sm:p-2.5"
        style={{
          background: isSelected ? `${color}12` : panel,
          borderColor: isSelected ? color : gridLine,
          boxShadow: isSelected ? `0 0 0 2px ${color}33` : undefined,
        }}
        whileHover={reduceMotion ? undefined : { y: -2, boxShadow: `0 4px 12px ${color}22` }}
        whileTap={{ scale: 0.98 }}
        aria-pressed={isSelected}
        aria-label={`${dept.name ?? dept.id} ${shift}, ${coverage}% coverage`}
      >
        {isToday && (
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
            style={{ background: accent }}
            aria-hidden
          />
        )}
        <span className="truncate text-[9px] font-medium text-slate-500 sm:text-[10px]">{shift}</span>
        <div className="flex items-end justify-between gap-1">
          <span className="text-sm font-bold tabular-nums sm:text-base" style={{ color }}>
            {coverage}%
          </span>
          <span className="text-[9px] tabular-nums text-slate-400 sm:text-[10px]">
            {staffed}/{required}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={false}
            animate={{ width: `${Math.min(coverage, 100)}%` }}
            transition={{ duration: 0.4, ease }}
          />
        </div>
        {open > 0 && (
          <span
            className="absolute bottom-1 right-1 rounded px-1 text-[8px] font-bold uppercase"
            style={{ background: `${critical}18`, color: critical }}
          >
            +{open}
          </span>
        )}
      </motion.button>
    </td>
  )
}

/* ─── Detail drawer ─── */

function ShiftDetail({
  cell,
  dept,
  dayLabel,
  accent,
  alert,
  critical,
  panel,
  gridLine,
  reduceMotion,
}: {
  cell: GridCell
  dept: Department
  dayLabel: string
  accent: string
  alert: string
  critical: string
  panel: string
  gridLine: string
  reduceMotion: boolean
}) {
  const status = cell.status ?? 'full'
  const color = statusColor(status, { accent, accentAlert: alert, accentCritical: critical })
  const deptColor = safeColor(dept.color, accent)
  const shift = trim(cell.shift) || '—'
  const lead = trim(cell.lead) || 'Unassigned'
  const note = trim(cell.note)
  const open = safeNum(cell.openShifts)

  return (
    <motion.div
      key={cell.id}
      className="overflow-hidden rounded-xl border"
      style={{ background: panel, borderColor: gridLine }}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease }}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{ background: `${deptColor}18`, color: deptColor }}
            >
              {trim(dept.icon) || '●'} {trim(dept.name) || dept.id}
            </span>
            <span className="text-xs font-medium text-slate-500">{dayLabel}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${color}18`, color }}
            >
              {statusLabel(status)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{shift}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Shift lead: <span className="font-medium text-slate-700">{lead}</span>
          </p>
          {note && <p className="mt-3 text-sm leading-relaxed text-slate-600">{note}</p>}
        </div>

        <div className="flex shrink-0 gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color }}>
              {safeNum(cell.coverage)}%
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Coverage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums text-slate-800 sm:text-3xl">
              {safeNum(cell.staffed)}
              <span className="text-base text-slate-400">/{safeNum(cell.required)}</span>
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Staffed</p>
          </div>
          {open > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums sm:text-3xl" style={{ color: critical }}>
                {open}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Open shifts</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: gridLine }}>
        <motion.button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: accent }}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Assign staff
        </motion.button>
        <motion.button
          type="button"
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700"
          style={{ borderColor: gridLine }}
          whileHover={reduceMotion ? undefined : { borderColor: accent, color: accent }}
        >
          Request swap
        </motion.button>
        {open > 0 && (
          <motion.button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: `${critical}12`, color: critical }}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          >
            Post open shift
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Mobile: single-day cards ─── */

function MobileDayView({
  departments,
  cells,
  days,
  dayIndex,
  selectedId,
  accent,
  alert,
  critical,
  panel,
  gridLine,
  onSelect,
}: {
  departments: Department[]
  cells: GridCell[]
  days: string[]
  dayIndex: number
  selectedId: string
  accent: string
  alert: string
  critical: string
  panel: string
  gridLine: string
  onSelect: (id: string) => void
}) {
  const dayLabel = days[dayIndex] ?? `Day ${dayIndex + 1}`

  return (
    <div className="space-y-2 lg:hidden">
      {departments.map((dept) => {
        const cell = cellFor(dept.id, dayIndex, cells)
        if (!cell) return null
        const isSelected = cell.id === selectedId
        const status = cell.status ?? 'full'
        const color = status === 'gap' ? critical : status === 'watch' ? alert : accent
        const deptColor = safeColor(dept.color, accent)

        return (
          <motion.button
            key={cell.id}
            type="button"
            onClick={() => onSelect(cell.id)}
            className="flex w-full items-center gap-3 rounded-xl border p-3 text-left"
            style={{
              background: isSelected ? `${color}10` : panel,
              borderColor: isSelected ? color : gridLine,
            }}
            whileTap={{ scale: 0.99 }}
            aria-pressed={isSelected}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm"
              style={{ background: `${deptColor}18`, color: deptColor }}
            >
              {trim(dept.icon) || '●'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{trim(dept.name) || dept.id}</p>
              <p className="truncate text-xs text-slate-500">{trim(cell.shift)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums" style={{ color }}>
                {safeNum(cell.coverage)}%
              </p>
              <p className="text-[10px] text-slate-400">
                {safeNum(cell.staffed)}/{safeNum(cell.required)}
              </p>
            </div>
          </motion.button>
        )
      })}
      <p className="text-center text-[10px] text-slate-400">{dayLabel} overview</p>
    </div>
  )
}

/* ─── Main: CareGrid (single component) ─── */

export default function Design() {
  const reduceMotion = useReducedMotion() ?? false
  const [mobileDay, setMobileDay] = useState(1)

  const theme = data?.theme ?? {}
  const grid = data?.careGrid ?? {}

  const accent = safeColor(theme.accent, '#0D9488')
  const alert = safeColor(theme.accentAlert, '#F59E0B')
  const critical = safeColor(theme.accentCritical, '#EF4444')
  const surface = safeColor(theme.surface, '#F8FAFC')
  const panel = safeColor(theme.panel, '#FFFFFF')
  const gridLine = safeColor(theme.gridLine, '#E2E8F0')

  const departments = safeDepartments(grid.departments)
  const cells = safeCells(grid.cells)
  const days = safeDays(grid.days)
  const defaultId = resolveDefault(cells, grid.defaultSelected)
  const [selectedId, setSelectedId] = useState(defaultId)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedCell = cells.find((c) => c.id === selectedId) ?? cells[0] ?? null
  const selectedDept = departments.find((d) => d.id === selectedCell?.deptId) ?? departments[0] ?? null
  const selectedDayIndex = safeDayIndex(selectedCell?.dayIndex)
  const selectedDayLabel = days[selectedDayIndex] ?? ''

  const autoHighlight = grid.autoHighlight !== false
  const highlightMs = safeMs(grid.autoHighlightMs, 8500)

  const org = trim(grid.org)
  const title = trim(grid.title)
  const subtitle = trim(grid.subtitle)
  const weekLabel = trim(grid.weekLabel)
  const timezone = trim(grid.timezone)

  const gapCount = cells.filter((c) => c.status === 'gap').length
  const watchCount = cells.filter((c) => c.status === 'watch').length

  useEffect(() => {
    setSelectedId((cur) => (cells.some((c) => c.id === cur) ? cur : defaultId))
  }, [cells, defaultId])

  useEffect(() => {
    if (selectedCell) setMobileDay(safeDayIndex(selectedCell.dayIndex))
  }, [selectedCell])

  const selectCell = useCallback(
    (id: string) => {
      if (!trim(id) || !cells.some((c) => c.id === id)) return
      setSelectedId(id)
    },
    [cells],
  )

  const cycleSelection = useCallback(() => {
    if (!cells.length) return
    const idx = cells.findIndex((c) => c.id === selectedId)
    const next = cells[(idx + 1) % cells.length]
    if (next?.id) setSelectedId(next.id)
  }, [cells, selectedId])

  useEffect(() => {
    if (!autoHighlight || paused || cells.length < 2 || reduceMotion) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(cycleSelection, highlightMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [autoHighlight, cells.length, cycleSelection, highlightMs, paused, reduceMotion])

  if (!cells.length || !departments.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6" style={{ background: surface }}>
        <p className="text-sm text-slate-500">No schedule data available.</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-[100svh] px-3 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ background: surface, color: '#0f172a' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-6xl">
        {/* App header — real workforce tool chrome */}
        <header className="mb-5 sm:mb-6">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              {org && (
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{org}</p>
              )}
              {title && <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>}
            </div>
            <div className="text-right">
              {weekLabel && (
                <p className="text-sm font-semibold text-slate-800">{weekLabel}</p>
              )}
              {timezone && <p className="text-xs text-slate-400">{timezone}</p>}
            </div>
          </div>

          {subtitle && <p className="max-w-2xl text-sm text-slate-600">{subtitle}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: `${accent}15`, color: accent }}>
              <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
              Fully staffed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: `${alert}15`, color: alert }}>
              <span className="h-2 w-2 rounded-full" style={{ background: alert }} />
              {watchCount} need attention
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: `${critical}15`, color: critical }}>
              <span className="h-2 w-2 rounded-full" style={{ background: critical }} />
              {gapCount} coverage gaps
            </span>
          </div>
        </header>

        {/* Mobile day picker */}
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => setMobileDay(i)}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold"
              style={{
                background: mobileDay === i ? accent : panel,
                color: mobileDay === i ? '#fff' : '#64748b',
                border: `1px solid ${mobileDay === i ? accent : gridLine}`,
              }}
            >
              {day}
            </button>
          ))}
        </div>

        <MobileDayView
          departments={departments}
          cells={cells}
          days={days}
          dayIndex={mobileDay}
          selectedId={selectedId}
          accent={accent}
          alert={alert}
          critical={critical}
          panel={panel}
          gridLine={gridLine}
          onSelect={selectCell}
        />

        {/* Desktop schedule grid — single CareGrid component core */}
        <div
          className="hidden overflow-x-auto rounded-xl border lg:block"
          style={{ background: panel, borderColor: gridLine }}
        >
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-10 border-b bg-white p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  style={{ borderColor: gridLine }}
                >
                  Department
                </th>
                {days.map((day, i) => (
                  <th
                    key={day}
                    className="border-b p-2 text-center text-xs font-semibold uppercase tracking-wide"
                    style={{
                      borderColor: gridLine,
                      color: i === selectedDayIndex ? accent : '#64748b',
                    }}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td
                    className="sticky left-0 z-10 border-b bg-white p-3"
                    style={{ borderColor: gridLine }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                        style={{
                          background: `${safeColor(dept.color, accent)}18`,
                          color: safeColor(dept.color, accent),
                        }}
                      >
                        {trim(dept.icon) || '●'}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {trim(dept.name) || dept.id}
                      </span>
                    </div>
                  </td>
                  {days.map((_, dayIndex) => (
                    <ShiftCell
                      key={`${dept.id}-${dayIndex}`}
                      cell={cellFor(dept.id, dayIndex, cells)}
                      dept={dept}
                      isSelected={selectedCell?.id === cellFor(dept.id, dayIndex, cells)?.id}
                      isToday={dayIndex === 1}
                      accent={accent}
                      alert={alert}
                      critical={critical}
                      panel={panel}
                      gridLine={gridLine}
                      reduceMotion={reduceMotion}
                      onSelect={selectCell}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Shift detail panel */}
        <div className="mt-4 sm:mt-5">
          <AnimatePresence mode="wait">
            {selectedCell && selectedDept && (
              <ShiftDetail
                cell={selectedCell}
                dept={selectedDept}
                dayLabel={selectedDayLabel}
                accent={accent}
                alert={alert}
                critical={critical}
                panel={panel}
                gridLine={gridLine}
                reduceMotion={reduceMotion}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
