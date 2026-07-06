import { useState } from 'react'
import { useActions, useStore } from '../store'
import { cx } from '../utils'
import { Avatar, EmptyState, ProgressBar } from './ui'
import { CheckIcon, PackIcon, PlusIcon, TrashIcon } from './Icons'

export function Packing() {
  const { trip } = useStore()
  const actions = useActions()
  const [draft, setDraft] = useState('')
  if (!trip) return null
  const done = trip.packing.filter((p) => p.done).length

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const label = draft.trim()
    if (!label) return
    setDraft('')
    await actions.addPack(label)
  }

  const cycleAssignee = (itemId: string, current?: string) => {
    const ids = [undefined, ...trip.members.map((m) => m.id)]
    const next = ids[(ids.indexOf(current) + 1) % ids.length]
    actions.assignPack({ itemId, assignee: next })
  }

  return (
    <div className="packing">
      <div className="view-head">
        <div>
          <h2 className="view-title">The bag check</h2>
          <p className="view-sub">Tap the circle to check off · tap the avatar slot to hand it to someone.</p>
        </div>
        <div className="packing-progress">
          <span>
            {done}/{trip.packing.length}
          </span>
          <ProgressBar value={trip.packing.length ? done / trip.packing.length : 0} />
        </div>
      </div>

      <form className="pack-add" onSubmit={add}>
        <PlusIcon size={15} />
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add something the group shouldn't forget…" aria-label="Add packing item" />
        {draft.trim() && <button className="btn btn-small btn-primary">Add</button>}
      </form>

      {trip.packing.length === 0 ? (
        <EmptyState icon={<PackIcon size={26} />} title="The list is empty" hint="Passports. Start with passports." />
      ) : (
        <ul className="pack-list">
          {trip.packing.map((p) => {
            const assignee = trip.members.find((m) => m.id === p.assignee)
            return (
              <li key={p.id} className={cx('pack-item', p.done && 'done')}>
                <button
                  className="pack-check"
                  onClick={() => actions.togglePack(p.id)}
                  aria-pressed={p.done}
                  aria-label={p.done ? `Uncheck ${p.label}` : `Check off ${p.label}`}
                >
                  {p.done && <CheckIcon size={13} />}
                </button>
                <span className="pack-label">{p.label}</span>
                <button
                  className="pack-assignee"
                  onClick={() => cycleAssignee(p.id, p.assignee)}
                  title={assignee ? `${assignee.name} has it — tap to reassign` : 'Unassigned — tap to assign'}
                >
                  {assignee ? <Avatar member={assignee} size={24} /> : <span className="pack-unassigned">?</span>}
                </button>
                <button
                  className="icon-btn icon-btn-quiet"
                  aria-label={`Delete ${p.label}`}
                  onClick={() => actions.deletePack(p.id)}
                >
                  <TrashIcon size={14} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
