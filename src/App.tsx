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
import { CompassIcon } from './components/Icons'
import { cx } from './utils'

function Splash({ label }: { label: string }) {
  return (
    <div className="splash">
      <span className="splash-mark">
        <CompassIcon size={26} />
      </span>
      <p>{label}</p>
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
  const { state, dispatch, trip, trips, loadingTrip } = useStore()

  if (trips.length === 0 && !loadingTrip) {
    // Brief window before the starter trip seed lands.
    return <Splash label="Setting up your first trip…" />
  }

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
            <Splash label="Loading trip…" />
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
        <Splash label="Driftway" />
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
