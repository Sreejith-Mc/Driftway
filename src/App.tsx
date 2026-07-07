import { useEffect, useRef } from 'react'
import { Authenticated, AuthLoading, Unauthenticated, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { StoreProvider, useStore } from './store'
import { ModalProvider } from './components/Modals'
import { AuthScreen } from './components/AuthScreen'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { ChatPanel } from './components/ChatPanel'
import { CommandPalette } from './components/CommandPalette'
import { Toasts } from './components/Toasts'
import { Overview } from './components/Overview'
import { Itinerary } from './components/Itinerary'
import { Polls } from './components/Polls'
import { Budget } from './components/Budget'
import { Packing } from './components/Packing'
import { AppSkeleton, ViewSkeleton } from './components/Skeleton'
import { useUI } from './components/Modals'
import { EmptyState } from './components/ui'
import { CompassIcon, PlusIcon } from './components/Icons'
import { cx } from './utils'

// Shown when the crew has no trips at all (e.g. after deleting the last one).
function NoTrips() {
  const { state, dispatch } = useStore()
  const { openModal } = useUI()
  return (
    <div className={cx('app chat-hidden', state.navOpen && 'nav-open')}>
      <Sidebar />
      {state.navOpen && <div className="scrim" onClick={() => dispatch({ type: 'SET_NAV', open: false })} />}
      <main className="main">
        <div className="notrips">
          <EmptyState
            icon={<CompassIcon size={26} />}
            title="No trips yet"
            hint="Start a new trip or open an invite link from a friend to jump in."
          />
          <button className="btn btn-primary" onClick={() => openModal({ kind: 'newTrip' })}>
            <PlusIcon size={15} /> New trip
          </button>
        </div>
      </main>
    </div>
  )
}

// Runs once after sign-in: joins a trip if the URL carries an invite code,
// otherwise ensures the account has a starter trip to look at.
function Bootstrapper() {
  const { dispatch } = useStore()
  const ensureStarter = useMutation(api.seed.ensureStarterTrip)
  const join = useMutation(api.trips.join)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const code = new URLSearchParams(window.location.search).get('join')
    const clearParam = () => window.history.replaceState({}, '', window.location.pathname)
    ;(async () => {
      try {
        if (code) {
          const tripId = (await join({ code })) as string
          clearParam()
          dispatch({ type: 'SET_TRIP', tripId })
          dispatch({ type: 'TOAST', text: 'You joined the trip — say hi in the chat 👋', kind: 'ok' })
        } else {
          await ensureStarter({})
        }
      } catch {
        if (code) dispatch({ type: 'TOAST', text: 'That invite link is no longer valid', kind: 'warn' })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function Workspace() {
  const { state, dispatch, trip, trips, loadingTrips } = useStore()

  // First paint: the trip list is still streaming in — show the full shell as a
  // skeleton so nothing pops in abruptly.
  if (loadingTrips) return <AppSkeleton />

  // Loaded, but the crew has no trips (e.g. deleted the last one).
  if (trips.length === 0) return <NoTrips />

  return (
    <div className={cx('app', !state.chatOpen && 'chat-hidden', state.navOpen && 'nav-open')}>
      <Sidebar />
      {state.navOpen && <div className="scrim" onClick={() => dispatch({ type: 'SET_NAV', open: false })} />}
      <main className="main">
        <TopBar />
        {trip ? (
          <section className="view" key={`${trip.id}:${state.tab}`}>
            {state.tab === 'overview' && <Overview />}
            {state.tab === 'itinerary' && <Itinerary />}
            {state.tab === 'polls' && <Polls />}
            {state.tab === 'budget' && <Budget />}
            {state.tab === 'packing' && <Packing />}
          </section>
        ) : (
          <section className="view">
            <ViewSkeleton />
          </section>
        )}
      </main>
      <ChatPanel />
      <CommandPalette />
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <>
      <AuthLoading>
        <AppSkeleton />
      </AuthLoading>
      <Unauthenticated>
        <AuthScreen />
      </Unauthenticated>
      <Authenticated>
        <StoreProvider>
          <ModalProvider>
            <Bootstrapper />
            <Workspace />
          </ModalProvider>
        </StoreProvider>
      </Authenticated>
    </>
  )
}
