import type { Trip } from './types'
import { CATEGORY_META, fmtDate, fmtRange, weekday } from './utils'

export function buildItineraryMarkdown(trip: Trip): string {
  const lines: string[] = []
  lines.push(`# ${trip.emoji} ${trip.name}`)
  lines.push('')
  lines.push(`**${trip.destination}** · ${fmtRange(trip.start, trip.end)}`)
  lines.push(`Crew: ${trip.members.map((m) => m.name).join(', ')}`)
  lines.push('')
  trip.days.forEach((day, i) => {
    lines.push(`## Day ${i + 1} — ${weekday(day.date)}, ${fmtDate(day.date, { month: 'long', day: 'numeric' })}`)
    if (day.items.length === 0) {
      lines.push('_Free day (for now…)_')
    } else {
      for (const item of day.items) {
        const time = item.time ? `**${item.time}** — ` : ''
        lines.push(`- ${time}${CATEGORY_META[item.category].emoji} ${item.title}${item.note ? ` — _${item.note}_` : ''}`)
      }
    }
    lines.push('')
  })
  lines.push('---')
  lines.push('_Planned together on Driftway._')
  return lines.join('\n')
}

export function exportItinerary(trip: Trip): void {
  const md = buildItineraryMarkdown(trip)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${trip.name.toLowerCase().replace(/\s+/g, '-')}-itinerary.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
