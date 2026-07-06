import React, { useRef, useState } from 'react'
import { useStore, useYou } from '../store'
import type { Day, ItineraryItem } from '../types'
import { parseQuickAdd } from '../sim'
import { CATEGORY_META, cx, fmtDate, uid, weekday } from '../utils'
import { Avatar } from './ui'
import { ClockIcon, GripIcon, HeartIcon, PlusIcon, SparkIcon } from './Icons'
import { useUI } from './Modals'

interface DragPayload {
  kind: 'item' | 'suggestion'
  itemId?: string
  fromDayId?: string
  messageId?: string
  title?: string
  category?: ItineraryItem['category']
  time?: string
}

function readPayload(e: React.DragEvent): DragPayload | null {
  try {
    const raw = e.dataTransfer.getData('application/x-driftway')
    return raw ? (JSON.parse(raw) as DragPayload) : null
  } catch {
    return null
  }
}

export function Itinerary() {
  const { trip } = useStore()
  const [dragging, setDragging] = useState(false)

  return (
    <div
      className={cx('itinerary', dragging && 'is-dragging')}
      onDragEnter={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      onDrop={() => setDragging(false)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
      }}
    >
      <div className="itinerary-hint">
        <SparkIcon size={14} />
        <span>
          Drag stops to reorder or move between days — chat suggestions can be dropped straight onto a day.
        </span>
      </div>
      {trip.days.map((day, i) => (
        <DaySection key={day.id} day={day} index={i} />
      ))}
    </div>
  )
}

function DaySection({ day, index }: { day: Day; index: number }) {
  const { trip, dispatch } = useStore()
  const you = useYou()
  const { openModal } = useUI()
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [quick, setQuick] = useState('')
  const quickRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const payload = readPayload(e)
    const idx = overIndex ?? day.items.length
    setOverIndex(null)
    if (!payload) return
    if (payload.kind === 'item' && payload.itemId && payload.fromDayId) {
      dispatch({
        type: 'MOVE_ITEM',
        tripId: trip.id,
        fromDayId: payload.fromDayId,
        toDayId: day.id,
        itemId: payload.itemId,
        index: idx,
      })
    } else if (payload.kind === 'suggestion' && payload.title) {
      const item: ItineraryItem = {
        id: uid('it'),
        title: payload.title,
        time: payload.time,
        category: payload.category ?? 'other',
        votes: [you.id],
        addedBy: you.id,
        fromChat: true,
      }
      dispatch({ type: 'ADD_ITEM', tripId: trip.id, dayId: day.id, item, index: idx })
      if (payload.messageId) dispatch({ type: 'MARK_MESSAGE_ADDED', tripId: trip.id, messageId: payload.messageId })
      dispatch({ type: 'TOAST', text: `“${payload.title}” dropped onto Day ${index + 1}`, kind: 'ok' })
    }
  }

  const quickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const text = quick.trim()
    if (!text) return
    const parsed = parseQuickAdd(text)
    dispatch({
      type: 'ADD_ITEM',
      tripId: trip.id,
      dayId: day.id,
      item: { id: uid('it'), ...parsed, votes: [you.id], addedBy: you.id },
    })
    setQuick('')
    quickRef.current?.focus()
  }

  return (
    <section
      className="day"
      onDragOver={(e) => {
        e.preventDefault()
        if (overIndex === null) setOverIndex(day.items.length)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverIndex(null)
      }}
      onDrop={handleDrop}
    >
      <header className="day-head">
        <span className="day-num">{String(index + 1).padStart(2, '0')}</span>
        <div className="day-title">
          <h2>{weekday(day.date)}</h2>
          <p>{fmtDate(day.date, { month: 'long', day: 'numeric' })}</p>
        </div>
        <span className="day-count">
          {day.items.length === 0 ? 'free day' : `${day.items.length} stop${day.items.length === 1 ? '' : 's'}`}
        </span>
        <button className="icon-btn" onClick={() => openModal({ kind: 'addItem', dayId: day.id })} aria-label={`Add stop to day ${index + 1}`}>
          <PlusIcon size={15} />
        </button>
      </header>

      <div className="day-items">
        {day.items.map((item, i) => (
          <React.Fragment key={item.id}>
            {overIndex === i && <div className="drop-line" />}
            <ItemCard
              item={item}
              dayId={day.id}
              onDragOverItem={(e) => {
                e.preventDefault()
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setOverIndex(e.clientY < rect.top + rect.height / 2 ? i : i + 1)
              }}
            />
          </React.Fragment>
        ))}
        {overIndex === day.items.length && <div className="drop-line" />}
        {day.items.length === 0 && overIndex === null && (
          <p className="day-empty">Nothing planned yet — drop a chat suggestion here or quick-add below.</p>
        )}
      </div>

      <form className="quick-add" onSubmit={quickAdd}>
        <SparkIcon size={14} className="quick-spark" />
        <input
          ref={quickRef}
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder='Quick add — try "Dinner at Ramiro 8pm"'
          aria-label={`Quick add to day ${index + 1}`}
        />
        {quick.trim() && <button className="btn btn-small btn-primary">Add</button>}
      </form>
    </section>
  )
}

function ItemCard({
  item,
  dayId,
  onDragOverItem,
}: {
  item: ItineraryItem
  dayId: string
  onDragOverItem: (e: React.DragEvent) => void
}) {
  const { trip, dispatch } = useStore()
  const you = useYou()
  const { openModal } = useUI()
  const author = trip.members.find((m) => m.id === item.addedBy)
  const voted = item.votes.includes(you.id)

  return (
    <article
      className={cx('stop', `stop-${item.category}`)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-driftway', JSON.stringify({ kind: 'item', itemId: item.id, fromDayId: dayId }))
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={onDragOverItem}
      onDoubleClick={() => openModal({ kind: 'editItem', dayId, item })}
      title="Drag to move · double-click to edit"
    >
      <span className="stop-grip">
        <GripIcon size={13} />
      </span>
      <div className="stop-time">
        {item.time ? (
          <>
            <ClockIcon size={12} />
            <span>{item.time}</span>
          </>
        ) : (
          <span className="stop-time-any">anytime</span>
        )}
      </div>
      <div className="stop-body">
        <div className="stop-title-row">
          <span className="stop-cat" title={CATEGORY_META[item.category].label}>
            {CATEGORY_META[item.category].emoji}
          </span>
          <h3>{item.title}</h3>
          {item.fromChat && (
            <span className="stop-fromchat" title="Came from the trip chat">
              <SparkIcon size={11} /> chat
            </span>
          )}
        </div>
        {item.note && <p className="stop-note">{item.note}</p>}
      </div>
      <div className="stop-side">
        {author && <Avatar member={author} size={22} />}
        <button
          className={cx('vote-btn', voted && 'voted')}
          onClick={() => dispatch({ type: 'TOGGLE_ITEM_VOTE', tripId: trip.id, dayId, itemId: item.id, memberId: you.id })}
          aria-pressed={voted}
          aria-label={`${item.votes.length} votes — ${voted ? 'remove your vote' : 'vote for this'}`}
        >
          <HeartIcon size={13} filled={voted} />
          {item.votes.length > 0 && <span>{item.votes.length}</span>}
        </button>
      </div>
    </article>
  )
}
