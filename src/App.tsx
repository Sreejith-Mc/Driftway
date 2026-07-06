import { StoreProvider, useStore } from './store'
import { ModalProvider } from './components/Modals'
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
import { cx } from './utils'

function Workspace() {
  const { state, dispatch } = useStore()
  return (
    <div className={cx('app', !state.chatOpen && 'chat-hidden', state.navOpen && 'nav-open')}>
      <Sidebar />
      {state.navOpen && <div className="scrim" onClick={() => dispatch({ type: 'SET_NAV', open: false })} />}
      <main className="main">
        <TopBar />
        <section className="view" key={`${state.activeTripId}:${state.tab}`}>
          {state.tab === 'overview' && <Overview />}
          {state.tab === 'itinerary' && <Itinerary />}
          {state.tab === 'polls' && <Polls />}
          {state.tab === 'budget' && <Budget />}
          {state.tab === 'packing' && <Packing />}
        </section>
      </main>
      <ChatPanel />
      <CommandPalette />
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ModalProvider>
        <Workspace />
      </ModalProvider>
    </StoreProvider>
  )
}
