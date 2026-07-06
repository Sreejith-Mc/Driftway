import { useStore } from '../store'
import { CATEGORY_META, cx, daysUntil, fmtDate, fmtRange, money, timeAgo, tripLengthDays, weekday } from '../utils'
import { Avatar, AvatarStack, ProgressBar } from './ui'
import { ChatIcon, ClockIcon, CoinIcon, MapIcon, PackIcon, PinIcon, PollIcon, SparkIcon } from './Icons'
import { useUI } from './Modals'

export function Overview() {
  const { state, dispatch, trip } = useStore()
  const { openModal } = useUI()

  const until = daysUntil(trip.start)
  const length = tripLengthDays(trip.start, trip.end)
  const stops = trip.days.reduce((n, d) => n + d.items.length, 0)
  const openPolls = trip.polls.filter((p) => p.status === 'open')
  const total = trip.expenses.reduce((n, e) => n + e.amount, 0)
  const perPerson = trip.members.length ? total / trip.members.length : 0
  const packed = trip.packing.filter((p) => p.done).length
  const nextDay = trip.days.find((d) => d.items.length > 0) ?? trip.days[0]
  const nextDayIdx = trip.days.indexOf(nextDay)
  const pendingSuggestions = trip.messages.filter((m) => m.suggestion && !m.addedToItinerary)

  return (
    <div className="overview">
      <section className={cx('hero', `cover-${trip.palette}`)}>
        <div className="hero-inner">
          <p className="hero-kicker">{trip.emoji} group expedition</p>
          <h2 className="hero-title">{trip.destination.split(',')[0]}</h2>
          <p className="hero-sub">
            {trip.destination} · {fmtRange(trip.start, trip.end)}
          </p>
          <div className="hero-meta">
            <AvatarStack members={trip.members} size={30} />
            <span className="hero-count">
              {until > 0 ? (
                <>
                  <strong>{until}</strong> days to takeoff
                </>
              ) : until === 0 ? (
                <strong>departure day 🎉</strong>
              ) : (
                <>trip in progress</>
              )}
            </span>
          </div>
        </div>
        <svg className="hero-route" viewBox="0 0 320 120" aria-hidden="true">
          <path d="M10 100 C 80 20, 180 120, 250 40 S 300 30, 312 22" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
          <circle cx="10" cy="100" r="4" fill="currentColor" />
          <path d="M312 22 l-11 1.5 8 7.5 z" fill="currentColor" />
        </svg>
      </section>

      <section className="stat-grid">
        <button className="stat" onClick={() => dispatch({ type: 'SET_TAB', tab: 'itinerary' })}>
          <MapIcon size={17} className="stat-icon" />
          <strong>{stops}</strong>
          <span>stops over {length} days</span>
        </button>
        <button className="stat" onClick={() => dispatch({ type: 'SET_TAB', tab: 'polls' })}>
          <PollIcon size={17} className="stat-icon" />
          <strong>{openPolls.length}</strong>
          <span>open poll{openPolls.length === 1 ? '' : 's'} awaiting votes</span>
        </button>
        <button className="stat" onClick={() => dispatch({ type: 'SET_TAB', tab: 'budget' })}>
          <CoinIcon size={17} className="stat-icon" />
          <strong>{money(perPerson, trip.currency)}</strong>
          <span>per person so far</span>
        </button>
        <button className="stat" onClick={() => dispatch({ type: 'SET_TAB', tab: 'packing' })}>
          <PackIcon size={17} className="stat-icon" />
          <strong>
            {packed}/{trip.packing.length}
          </strong>
          <span>packing items done</span>
          <ProgressBar value={trip.packing.length ? packed / trip.packing.length : 0} className="stat-progress" />
        </button>
      </section>

      <div className="overview-cols">
        <section className="card">
          <header className="card-head">
            <h3>
              <ClockIcon size={15} /> First day on the board
            </h3>
            <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'SET_TAB', tab: 'itinerary' })}>
              Full itinerary →
            </button>
          </header>
          {nextDay ? (
            <>
              <p className="card-sub">
                Day {nextDayIdx + 1} · {weekday(nextDay.date)}, {fmtDate(nextDay.date, { month: 'long', day: 'numeric' })}
              </p>
              <ul className="preview-list">
                {nextDay.items.slice(0, 4).map((it) => (
                  <li key={it.id}>
                    <span className="preview-time">{it.time ?? '—'}</span>
                    <span className="preview-cat">{CATEGORY_META[it.category].emoji}</span>
                    <span className="preview-title">{it.title}</span>
                  </li>
                ))}
                {nextDay.items.length === 0 && <li className="preview-empty">A blank canvas. Dangerous.</li>}
              </ul>
            </>
          ) : (
            <p className="card-sub">No days yet.</p>
          )}
        </section>

        <section className="card">
          <header className="card-head">
            <h3>
              <SparkIcon size={15} /> Waiting in the chat
            </h3>
            {!state.chatOpen && (
              <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}>
                <ChatIcon size={13} /> Open chat
              </button>
            )}
          </header>
          {pendingSuggestions.length === 0 ? (
            <p className="card-sub">Every suggestion from the chat is on the board. Inbox zero, itinerary hero.</p>
          ) : (
            <ul className="pending-list">
              {pendingSuggestions.slice(-4).reverse().map((m) => {
                const author = trip.members.find((x) => x.id === m.authorId)
                return (
                  <li key={m.id}>
                    {author && <Avatar member={author} size={22} />}
                    <div className="pending-body">
                      <span className="pending-title">
                        {CATEGORY_META[m.suggestion!.category].emoji} {m.suggestion!.title}
                      </span>
                      <span className="pending-meta">
                        {author?.you ? 'you' : author?.name.split(' ')[0]} · {timeAgo(m.ts)}
                      </span>
                    </div>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => openModal({ kind: 'addItem', seed: { ...m.suggestion!, messageId: m.id } })}
                    >
                      <PinIcon size={12} /> Add
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {openPolls.length > 0 && (
        <section className="card">
          <header className="card-head">
            <h3>
              <PollIcon size={15} /> Decisions in flight
            </h3>
            <button className="btn btn-ghost btn-small" onClick={() => dispatch({ type: 'SET_TAB', tab: 'polls' })}>
              Vote now →
            </button>
          </header>
          <ul className="mini-polls">
            {openPolls.map((p) => {
              const total = p.options.reduce((n, o) => n + o.votes.length, 0)
              return (
                <li key={p.id}>
                  <span className="mini-poll-q">{p.question}</span>
                  <span className="mini-poll-n">
                    {total}/{trip.members.length} voted
                  </span>
                  <ProgressBar value={trip.members.length ? total / trip.members.length : 0} />
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
