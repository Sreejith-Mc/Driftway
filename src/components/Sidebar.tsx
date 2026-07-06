import { useStore } from '../store'
import { fmtRange } from '../utils'
import { cx } from '../utils'
import { CompassIcon, MoonIcon, PlusIcon, SunIcon } from './Icons'
import { Avatar } from './ui'
import { useUI } from './Modals'

export function Sidebar() {
  const { state, dispatch, trip } = useStore()
  const { openModal } = useUI()
  const you = trip.members.find((m) => m.you)

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <CompassIcon size={20} />
        </span>
        <span className="brand-name">Driftway</span>
      </div>
      <p className="brand-tag">group chats → itineraries</p>

      <div className="side-section">
        <div className="side-heading">
          <span>Trips</span>
          <button className="icon-btn" onClick={() => openModal({ kind: 'newTrip' })} aria-label="New trip" title="New trip">
            <PlusIcon size={15} />
          </button>
        </div>
        <nav className="trip-list">
          {state.trips.map((t) => (
            <button
              key={t.id}
              className={cx('trip-chip', t.id === state.activeTripId && 'active')}
              onClick={() => dispatch({ type: 'SET_TRIP', tripId: t.id })}
            >
              <span className={cx('trip-emoji', `cover-${t.palette}`)}>{t.emoji}</span>
              <span className="trip-chip-text">
                <span className="trip-chip-name">{t.name}</span>
                <span className="trip-chip-dates">{fmtRange(t.start, t.end)}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="side-foot">
        <button
          className="side-foot-btn"
          onClick={() => dispatch({ type: 'SET_THEME', theme: state.theme === 'day' ? 'night' : 'day' })}
        >
          {state.theme === 'day' ? <MoonIcon size={15} /> : <SunIcon size={15} />}
          <span>{state.theme === 'day' ? 'Overnight mode' : 'Daybreak mode'}</span>
        </button>
        <button
          className="side-foot-btn"
          onClick={() => dispatch({ type: 'SET_PALETTE_OPEN', open: true })}
          title="Command palette"
        >
          <span className="kbd">⌘K</span>
          <span>Command palette</span>
        </button>
        {you && (
          <div className="side-you">
            <Avatar member={you} size={28} />
            <span>Signed in as you</span>
          </div>
        )}
      </div>
    </aside>
  )
}
