import { useStore } from '../store'
import type { Tab } from '../types'
import { cx, fmtRange, daysUntil } from '../utils'
import { ChatIcon, CoinIcon, CompassIcon, DownloadIcon, MapIcon, MenuIcon, PackIcon, PollIcon, UserPlusIcon } from './Icons'
import { AvatarStack } from './ui'
import { exportItinerary } from '../export'
import { useUI } from './Modals'

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <CompassIcon size={15} /> },
  { id: 'itinerary', label: 'Itinerary', icon: <MapIcon size={15} /> },
  { id: 'polls', label: 'Polls', icon: <PollIcon size={15} /> },
  { id: 'budget', label: 'Budget', icon: <CoinIcon size={15} /> },
  { id: 'packing', label: 'Packing', icon: <PackIcon size={15} /> },
]

export function TopBar() {
  const { state, dispatch, trip } = useStore()
  const { openModal } = useUI()
  if (!trip) return null
  const until = daysUntil(trip.start)
  const openPolls = trip.polls.filter((p) => p.status === 'open').length

  return (
    <header className="topbar">
      <div className="topbar-main">
        <button className="icon-btn nav-btn" aria-label="Open menu" onClick={() => dispatch({ type: 'TOGGLE_NAV' })}>
          <MenuIcon size={19} />
        </button>
        <div className="topbar-title">
          <span className={cx('trip-emoji trip-emoji-lg', `cover-${trip.palette}`)}>{trip.emoji}</span>
          <div>
            <h1>{trip.name}</h1>
            <p>
              {trip.destination} · {fmtRange(trip.start, trip.end)}
              {until > 0 && <span className="countdown-pill">T−{until} days</span>}
            </p>
          </div>
        </div>
        <div className="topbar-actions">
          <AvatarStack members={trip.members} />
          <button className="btn btn-small invite-btn" onClick={() => openModal({ kind: 'invite' })} title="Invite your crew">
            <UserPlusIcon size={15} />
            <span className="invite-btn-label">Invite</span>
          </button>
          <span className="v-rule" />
          <button
            className="icon-btn"
            title="Export itinerary (markdown)"
            aria-label="Export itinerary"
            onClick={() => {
              exportItinerary(trip)
              dispatch({ type: 'TOAST', text: 'Itinerary exported as Markdown', kind: 'ok' })
            }}
          >
            <DownloadIcon size={17} />
          </button>
          <button
            className={cx('icon-btn', state.chatOpen && 'icon-btn-on')}
            title="Toggle trip chat"
            aria-label="Toggle trip chat"
            onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
          >
            <ChatIcon size={17} />
          </button>
        </div>
      </div>
      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={state.tab === t.id}
            className={cx('tab', state.tab === t.id && 'active')}
            onClick={() => dispatch({ type: 'SET_TAB', tab: t.id })}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.id === 'polls' && openPolls > 0 && <span className="tab-badge">{openPolls}</span>}
          </button>
        ))}
      </nav>
    </header>
  )
}
