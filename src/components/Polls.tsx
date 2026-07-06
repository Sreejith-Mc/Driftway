import { useActions, useStore, useYou } from '../store'
import type { Poll } from '../types'
import { guessCategory } from '../sim'
import { cx, timeAgo } from '../utils'
import { Avatar, EmptyState } from './ui'
import { CheckIcon, PinIcon, PlusIcon, PollIcon } from './Icons'
import { useUI } from './Modals'

export function Polls() {
  const { trip } = useStore()
  const { openModal } = useUI()
  if (!trip) return null
  const open = trip.polls.filter((p) => p.status === 'open')
  const closed = trip.polls.filter((p) => p.status === 'closed')

  return (
    <div className="polls">
      <div className="view-head">
        <div>
          <h2 className="view-title">Group decisions, minus the 400-message argument</h2>
          <p className="view-sub">One tap to vote. Winners can be sent straight to the itinerary.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal({ kind: 'newPoll' })}>
          <PlusIcon size={14} /> New poll
        </button>
      </div>

      {trip.polls.length === 0 && (
        <EmptyState
          icon={<PollIcon size={26} />}
          title="No polls yet"
          hint="Start one here, or hit “Put to a vote” on any chat suggestion."
        />
      )}

      {open.length > 0 && (
        <section>
          <h3 className="section-label">Open</h3>
          <div className="poll-grid">
            {open.map((p) => (
              <PollCard key={p.id} poll={p} />
            ))}
          </div>
        </section>
      )}
      {closed.length > 0 && (
        <section>
          <h3 className="section-label">Settled</h3>
          <div className="poll-grid">
            {closed.map((p) => (
              <PollCard key={p.id} poll={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PollCard({ poll }: { poll: Poll }) {
  const { trip, dispatch } = useStore()
  const actions = useActions()
  const you = useYou()
  if (!trip || !you) return null
  const creator = trip.members.find((m) => m.id === poll.createdBy)
  const totalVotes = poll.options.reduce((n, o) => n + o.votes.length, 0)
  const leader = [...poll.options].sort((a, b) => b.votes.length - a.votes.length)[0]
  const isOpen = poll.status === 'open'

  const addWinner = async () => {
    if (!leader || leader.votes.length === 0) return
    const firstDay = trip.days[0]
    if (!firstDay) return
    await actions.addItem({ dayId: firstDay.id, title: leader.label, category: guessCategory(leader.label), fromChat: true })
    await actions.closePoll({ pollId: poll.id, resolvedTo: leader.id })
    dispatch({ type: 'TOAST', text: `Winner “${leader.label}” added to Day 1 — drag it wherever it fits`, kind: 'ok' })
  }

  return (
    <article className={cx('poll-card', !isOpen && 'poll-closed')}>
      <header className="poll-head">
        {creator && <Avatar member={creator} size={24} />}
        <div>
          <h4>{poll.question}</h4>
          <p>
            {creator?.you ? 'you' : creator?.name.split(' ')[0] ?? 'someone'} · {timeAgo(poll.ts)} · {totalVotes} vote
            {totalVotes === 1 ? '' : 's'}
          </p>
        </div>
        {!isOpen && (
          <span className="poll-badge">
            <CheckIcon size={11} /> settled
          </span>
        )}
      </header>

      <div className="poll-options">
        {poll.options.map((o) => {
          const pct = totalVotes === 0 ? 0 : o.votes.length / totalVotes
          const yours = o.votes.includes(you.id)
          const winning = !isOpen && (poll.resolvedTo ? poll.resolvedTo === o.id : o.id === leader?.id)
          return (
            <button
              key={o.id}
              className={cx('poll-opt', yours && 'yours', winning && 'winning')}
              disabled={!isOpen}
              onClick={() => actions.votePoll({ pollId: poll.id, optionId: o.id })}
              aria-pressed={yours}
            >
              <span className="poll-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
              <span className="poll-opt-label">
                {yours && <CheckIcon size={13} />}
                {o.label}
              </span>
              <span className="poll-opt-voters">
                {o.votes.slice(0, 4).map((vid) => {
                  const m = trip.members.find((x) => x.id === vid)
                  return m ? <Avatar key={vid} member={m} size={18} ring /> : null
                })}
                <span className="poll-pct">{Math.round(pct * 100)}%</span>
              </span>
            </button>
          )
        })}
      </div>

      {isOpen && (
        <footer className="poll-foot">
          {poll.createdBy === you.id ? (
            <>
              <button className="btn btn-small" onClick={() => actions.closePoll({ pollId: poll.id })}>
                Close poll
              </button>
              <button className="btn btn-small btn-primary" onClick={addWinner} disabled={!leader || leader.votes.length === 0}>
                <PinIcon size={12} /> Send winner to itinerary
              </button>
            </>
          ) : (
            <span className="poll-hint">tap an option to cast or move your vote</span>
          )}
        </footer>
      )}
    </article>
  )
}
