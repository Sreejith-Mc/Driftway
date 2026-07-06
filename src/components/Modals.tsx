import React, { createContext, useContext, useMemo, useState } from 'react'
import { useActions, useStore, useYou } from '../store'
import type { Category, ItineraryItem, Suggestion } from '../types'
import { CATEGORIES, CATEGORY_META, cx, datesBetween, fmtDate, weekday } from '../utils'
import { Avatar, Field, Modal } from './ui'
import { CheckIcon, TrashIcon } from './Icons'

export type ModalSpec =
  | { kind: 'newTrip' }
  | { kind: 'addItem'; dayId?: string; seed?: Suggestion & { messageId?: string } }
  | { kind: 'editItem'; dayId: string; item: ItineraryItem }
  | { kind: 'newExpense' }
  | { kind: 'newPoll'; seedQuestion?: string; seedOptions?: string[] }
  | { kind: 'invite' }

interface UIValue {
  openModal: (spec: ModalSpec) => void
  closeModal: () => void
}

const UIContext = createContext<UIValue | null>(null)

export function useUI(): UIValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within ModalProvider')
  return ctx
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [spec, setSpec] = useState<ModalSpec | null>(null)
  const value = useMemo<UIValue>(() => ({ openModal: setSpec, closeModal: () => setSpec(null) }), [])
  return (
    <UIContext.Provider value={value}>
      {children}
      {spec?.kind === 'newTrip' && <NewTripModal onClose={() => setSpec(null)} />}
      {spec?.kind === 'addItem' && <ItemModal onClose={() => setSpec(null)} dayId={spec.dayId} seed={spec.seed} />}
      {spec?.kind === 'editItem' && <ItemModal onClose={() => setSpec(null)} dayId={spec.dayId} editing={spec.item} />}
      {spec?.kind === 'newExpense' && <ExpenseModal onClose={() => setSpec(null)} />}
      {spec?.kind === 'newPoll' && (
        <PollModal onClose={() => setSpec(null)} seedQuestion={spec.seedQuestion} seedOptions={spec.seedOptions} />
      )}
      {spec?.kind === 'invite' && <InviteModal onClose={() => setSpec(null)} />}
    </UIContext.Provider>
  )
}

// ---------------------------------------------------------------------------

function CategoryPicker({ value, onChange }: { value: Category; onChange: (c: Category) => void }) {
  return (
    <div className="cat-picker" role="radiogroup" aria-label="Category">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          className={cx('cat-chip', value === c && 'active')}
          onClick={() => onChange(c)}
        >
          <span>{CATEGORY_META[c].emoji}</span> {CATEGORY_META[c].label}
        </button>
      ))}
    </div>
  )
}

function ItemModal({
  onClose,
  dayId,
  seed,
  editing,
}: {
  onClose: () => void
  dayId?: string
  seed?: Suggestion & { messageId?: string }
  editing?: ItineraryItem
}) {
  const { trip, dispatch } = useStore()
  const actions = useActions()
  const [title, setTitle] = useState(editing?.title ?? seed?.title ?? '')
  const [time, setTime] = useState(editing?.time ?? seed?.time ?? '')
  const [note, setNote] = useState(editing?.note ?? '')
  const [category, setCategory] = useState<Category>(editing?.category ?? seed?.category ?? 'other')
  const [targetDay, setTargetDay] = useState(dayId ?? trip?.days[0]?.id ?? '')
  const [busy, setBusy] = useState(false)

  if (!trip) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !targetDay || busy) return
    setBusy(true)
    try {
      if (editing && dayId) {
        await actions.updateItem({
          itemId: editing.id,
          title: title.trim(),
          time: time.trim() || null,
          note: note.trim() || null,
          category,
        })
        if (targetDay !== dayId) {
          await actions.moveItem({ itemId: editing.id, toDayId: targetDay, toIndex: 999 })
        }
        dispatch({ type: 'TOAST', text: 'Stop updated', kind: 'ok' })
      } else {
        await actions.addItem({
          dayId: targetDay,
          title: title.trim(),
          time: time.trim() || undefined,
          note: note.trim() || undefined,
          category,
          fromChat: Boolean(seed?.messageId),
        })
        if (seed?.messageId) await actions.markMessageAdded(seed.messageId)
        dispatch({ type: 'TOAST', text: `“${title.trim()}” added to the itinerary`, kind: 'ok' })
      }
      onClose()
    } catch {
      dispatch({ type: 'TOAST', text: 'Could not save — try again', kind: 'warn' })
      setBusy(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit stop' : seed ? 'Add suggestion to itinerary' : 'Add a stop'} onClose={onClose}>
      <form onSubmit={submit} className="modal-body">
        <Field label="What">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sunset at Miradouro da Graça" required />
        </Field>
        <div className="field-row">
          <Field label="Day">
            <select value={targetDay} onChange={(e) => setTargetDay(e.target.value)}>
              {trip.days.map((d, i) => (
                <option key={d.id} value={d.id}>
                  Day {i + 1} · {weekday(d.date).slice(0, 3)} {fmtDate(d.date)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Time (optional)">
            <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="7:30pm" />
          </Field>
        </div>
        <Field label="Category">
          <CategoryPicker value={category} onChange={setCategory} />
        </Field>
        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reservations, links, warnings…" />
        </Field>
        <footer className="modal-actions">
          {editing && dayId && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                await actions.deleteItem(editing.id)
                dispatch({ type: 'TOAST', text: 'Stop removed', kind: 'info' })
                onClose()
              }}
            >
              <TrashIcon size={14} /> Remove
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {editing ? 'Save' : 'Add to itinerary'}
          </button>
        </footer>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

const TRIP_EMOJIS = ['🌊', '🍁', '🏔️', '🏝️', '🌵', '🗼', '🎿', '🦁']
const CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'MXN', 'THB', 'AUD', 'INR']

function isoPlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function NewTripModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore()
  const actions = useActions()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [emoji, setEmoji] = useState(TRIP_EMOJIS[0])
  const [start, setStart] = useState(isoPlus(30))
  const [end, setEnd] = useState(isoPlus(34))
  const [currency, setCurrency] = useState('EUR')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !destination.trim() || end < start || busy) return
    setBusy(true)
    try {
      const dates = datesBetween(start, end).slice(0, 21)
      const tripId = await actions.createTrip({
        name: name.trim(),
        destination: destination.trim(),
        emoji,
        start,
        end: dates[dates.length - 1],
        currency,
        palette: Math.floor(Math.random() * 5),
        dates,
      })
      dispatch({ type: 'SET_TRIP', tripId })
      dispatch({ type: 'TOAST', text: `${emoji} ${name.trim()} created — invite the crew!`, kind: 'ok' })
      onClose()
    } catch {
      dispatch({ type: 'TOAST', text: 'Could not create the trip — try again', kind: 'warn' })
      setBusy(false)
    }
  }

  return (
    <Modal title="Start a new trip" onClose={onClose}>
      <form onSubmit={submit} className="modal-body">
        <Field label="Trip name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Andalusia Road Trip" required />
        </Field>
        <Field label="Destination">
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City, Country" required />
        </Field>
        <Field label="Vibe">
          <div className="emoji-row" role="radiogroup" aria-label="Trip emoji">
            {TRIP_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                role="radio"
                aria-checked={emoji === em}
                className={cx('emoji-btn', emoji === em && 'active')}
                onClick={() => setEmoji(em)}
              >
                {em}
              </button>
            ))}
          </div>
        </Field>
        <div className="field-row">
          <Field label="Start">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          </Field>
          <Field label="End">
            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <footer className="modal-actions">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Create trip
          </button>
        </footer>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const { trip, dispatch } = useStore()
  const actions = useActions()
  const you = useYou()
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(you?.id ?? '')
  const [category, setCategory] = useState<Category>('food')
  const [split, setSplit] = useState<string[]>(trip?.members.map((m) => m.id) ?? [])
  const [busy, setBusy] = useState(false)

  if (!trip || !you) return null

  const toggleSplit = (id: string) => setSplit((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!title.trim() || !isFinite(amt) || amt <= 0 || split.length === 0 || busy) return
    setBusy(true)
    try {
      await actions.addExpense({ title: title.trim(), amount: amt, paidBy, splitWith: split, category })
      dispatch({ type: 'TOAST', text: 'Expense logged and split', kind: 'ok' })
      onClose()
    } catch {
      dispatch({ type: 'TOAST', text: 'Could not log the expense — try again', kind: 'warn' })
      setBusy(false)
    }
  }

  return (
    <Modal title="Log an expense" onClose={onClose}>
      <form onSubmit={submit} className="modal-body">
        <div className="field-row">
          <Field label="What">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ferry tickets" required />
          </Field>
          <Field label={`Amount (${trip.currency})`}>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" required />
          </Field>
        </div>
        <Field label="Paid by">
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {trip.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.you ? 'You' : m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Split between">
          <div className="split-row">
            {trip.members.map((m) => (
              <button
                key={m.id}
                type="button"
                className={cx('split-chip', split.includes(m.id) && 'active')}
                onClick={() => toggleSplit(m.id)}
                aria-pressed={split.includes(m.id)}
              >
                <Avatar member={m} size={20} /> {m.you ? 'You' : m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Category">
          <CategoryPicker value={category} onChange={setCategory} />
        </Field>
        <footer className="modal-actions">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Log expense
          </button>
        </footer>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

function PollModal({
  onClose,
  seedQuestion,
  seedOptions,
}: {
  onClose: () => void
  seedQuestion?: string
  seedOptions?: string[]
}) {
  const { dispatch } = useStore()
  const actions = useActions()
  const [question, setQuestion] = useState(seedQuestion ?? '')
  const [options, setOptions] = useState<string[]>(() => {
    const base = seedOptions?.slice(0, 4) ?? []
    while (base.length < 2) base.push('')
    return base
  })
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || clean.length < 2 || busy) return
    setBusy(true)
    try {
      await actions.createPoll({ question: question.trim(), options: clean })
      dispatch({ type: 'SET_TAB', tab: 'polls' })
      dispatch({ type: 'TOAST', text: 'Poll is live — the crew can vote now', kind: 'ok' })
      onClose()
    } catch {
      dispatch({ type: 'TOAST', text: 'Could not open the poll — try again', kind: 'warn' })
      setBusy(false)
    }
  }

  return (
    <Modal title="Put it to a vote" onClose={onClose}>
      <form onSubmit={submit} className="modal-body">
        <Field label="Question">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Beach day or museum day?" required />
        </Field>
        <Field label="Options">
          <div className="opt-stack">
            {options.map((o, i) => (
              <input
                key={i}
                value={o}
                onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`Option ${i + 1}`}
                required={i < 2}
              />
            ))}
          </div>
        </Field>
        {options.length < 4 && (
          <button type="button" className="btn btn-ghost" onClick={() => setOptions([...options, ''])}>
            + Add option
          </button>
        )}
        <footer className="modal-actions">
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Open poll
          </button>
        </footer>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

function InviteModal({ onClose }: { onClose: () => void }) {
  const { trip, dispatch } = useStore()
  const actions = useActions()
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)
  if (!trip) return null

  const link = `${window.location.origin}${window.location.pathname}?join=${trip.inviteCode}`
  const isOwner = trip.members.find((m) => m.you)?.id === trip.ownerId

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      dispatch({ type: 'TOAST', text: 'Copy failed — select the link and copy manually', kind: 'warn' })
    }
  }

  return (
    <Modal title="Invite your crew" onClose={onClose}>
      <div className="modal-body">
        <p className="card-sub">
          Anyone with this link can join <strong>{trip.name}</strong> and edit it live with you. They'll sign in, then land
          straight in the trip.
        </p>
        <Field label="Invite link">
          <div className="invite-row">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
            <button type="button" className="btn btn-primary" onClick={copy}>
              {copied ? (
                <>
                  <CheckIcon size={14} /> Copied
                </>
              ) : (
                'Copy'
              )}
            </button>
          </div>
        </Field>
        <div className="invite-code">
          <span>Or share the code</span>
          <strong>{trip.inviteCode}</strong>
        </div>
        <footer className="modal-actions">
          {isOwner && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={rotating}
              onClick={async () => {
                setRotating(true)
                try {
                  await actions.rotateInvite()
                  dispatch({ type: 'TOAST', text: 'New invite link generated — the old one no longer works', kind: 'ok' })
                } finally {
                  setRotating(false)
                }
              }}
            >
              Reset link
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </Modal>
  )
}
