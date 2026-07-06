import type { Category } from './types'

let counter = 0
export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter}_${Math.random().toString(36).slice(2, 7)}`
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const DAY_MS = 24 * 60 * 60 * 1000

export function parseISO(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return parseISO(iso).toLocaleDateString('en-US', opts)
}

export function fmtRange(start: string, end: string): string {
  const s = parseISO(start)
  const e = parseISO(end)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const eStr = e.toLocaleDateString('en-US', sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${sStr}–${eStr}, ${e.getFullYear()}`
}

export function weekday(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-US', { weekday: 'long' })
}

export function daysUntil(iso: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((parseISO(iso).getTime() - today.getTime()) / DAY_MS)
}

export function tripLengthDays(start: string, end: string): number {
  return Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / DAY_MS) + 1
}

export function datesBetween(start: string, end: string): string[] {
  const out: string[] = []
  const e = parseISO(end).getTime()
  let cur = parseISO(start)
  while (cur.getTime() <= e) {
    out.push(toISO(cur))
    cur = new Date(cur.getTime() + DAY_MS)
  }
  return out
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function money(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  food: { label: 'Food & drink', emoji: '🍜' },
  culture: { label: 'Culture', emoji: '🏛️' },
  outdoors: { label: 'Outdoors', emoji: '🌿' },
  nightlife: { label: 'Nightlife', emoji: '🌙' },
  stay: { label: 'Stay', emoji: '🛏️' },
  transit: { label: 'Transit', emoji: '🚆' },
  shopping: { label: 'Shopping', emoji: '🛍️' },
  other: { label: 'Other', emoji: '📍' },
}

export const CATEGORIES = Object.keys(CATEGORY_META) as Category[]

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}
