import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cx, fmtDate, parseISO, toISO } from '../utils'
import { CalendarIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons'

// Custom, on-brand replacements for the browser's native <input type="date">
// and <select>. The native popups can't be themed, so we render our own
// popovers styled with the Driftway design system.

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Closes the popover on Escape or a click anywhere outside `ref`.
function useDismiss(ref: React.RefObject<HTMLElement>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [ref, onClose, active])
}

// Six weeks of cells (always 42) starting from the Sunday on/before the 1st.
function monthGrid(month: Date): Array<{ date: Date; inMonth: boolean }> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  const cells: Array<{ date: Date; inMonth: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    cells.push({ date: d, inMonth: d.getMonth() === month.getMonth() })
  }
  return cells
}

export function DatePicker({
  value,
  onChange,
  min,
  align = 'left',
  ariaLabel,
}: {
  value: string // ISO yyyy-mm-dd
  onChange: (iso: string) => void
  min?: string
  align?: 'left' | 'right'
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useDismiss(wrapRef, () => setOpen(false), open)

  const [view, setView] = useState(() => {
    const base = value ? parseISO(value) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  // Jump the visible month to the selected date each time the popover opens.
  useEffect(() => {
    if (!open) return
    const base = value ? parseISO(value) : new Date()
    setView(new Date(base.getFullYear(), base.getMonth(), 1))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const minDate = min ? stripTime(parseISO(min)) : null
  const todayIso = toISO(stripTime(new Date()))
  const grid = useMemo(() => monthGrid(view), [view])

  const pick = (d: Date) => {
    onChange(toISO(d))
    setOpen(false)
  }
  const shift = (months: number) => setView((m) => new Date(m.getFullYear(), m.getMonth() + months, 1))

  const label = value
    ? fmtDate(value, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Pick a date'

  return (
    <div className="picker" ref={wrapRef}>
      <button
        type="button"
        className={cx('picker-trigger', open && 'open')}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <CalendarIcon size={15} className="picker-lead" />
        <span className={cx('picker-value', !value && 'placeholder')}>{label}</span>
        <ChevronDownIcon size={15} className="picker-chevron" />
      </button>
      {open && (
        <div className={cx('picker-pop', 'calendar-pop', align === 'right' && 'align-right')} role="dialog" aria-label="Choose a date">
          <div className="cal-head">
            <button type="button" className="cal-nav" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeftIcon size={16} />
            </button>
            <span className="cal-title">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button type="button" className="cal-nav" onClick={() => shift(1)} aria-label="Next month">
              <ChevronRightIcon size={16} />
            </button>
          </div>
          <div className="cal-dow">
            {WEEKDAYS.map((d) => (
              <span key={d} className="cal-dow-cell">
                {d}
              </span>
            ))}
          </div>
          <div className="cal-grid">
            {grid.map(({ date, inMonth }) => {
              const iso = toISO(date)
              const selected = value === iso
              const disabled = minDate ? date < minDate : false
              return (
                <button
                  key={iso}
                  type="button"
                  className={cx('cal-day', !inMonth && 'muted', selected && 'selected', iso === todayIso && !selected && 'today')}
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
          <div className="cal-foot">
            <button
              type="button"
              className="cal-link"
              onClick={() => {
                const t = new Date()
                pick(new Date(t.getFullYear(), t.getMonth(), t.getDate()))
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export interface Option {
  value: string
  label: string
}

export function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: Option[]
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  useDismiss(wrapRef, () => setOpen(false), open)
  const current = options.find((o) => o.value === value)

  return (
    <div className="picker" ref={wrapRef}>
      <button
        type="button"
        className={cx('picker-trigger', open && 'open')}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={cx('picker-value', !current && 'placeholder')}>{current?.label ?? 'Select…'}</span>
        <ChevronDownIcon size={15} className="picker-chevron" />
      </button>
      {open && (
        <ul className="picker-pop picker-list" role="listbox" aria-label={ariaLabel}>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={cx('picker-opt', o.value === value && 'selected')}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                <span>{o.label}</span>
                {o.value === value && <CheckIcon size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
