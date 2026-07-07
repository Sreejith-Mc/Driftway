import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useStore } from '../store'
import type { Tab } from '../types'
import { exportItinerary } from '../export'
import { useUI } from './Modals'
import { ChatIcon, CoinIcon, CompassIcon, DownloadIcon, MapIcon, MoonIcon, PackIcon, PinIcon, PlusIcon, PollIcon, SettingsIcon, SunIcon, UserPlusIcon, XIcon } from './Icons'

interface Command {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  keywords: string
  run: () => void
}

export function CommandPalette() {
  const { state, dispatch, trip, trips } = useStore()
  const { openModal } = useUI()
  const { signOut } = useAuthActions()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const close = () => dispatch({ type: 'SET_PALETTE_OPEN', open: false })

  // Global shortcut lives here so it works everywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        dispatch({ type: 'SET_PALETTE_OPEN', open: !state.paletteOpen })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.paletteOpen, dispatch])

  useEffect(() => {
    if (state.paletteOpen) {
      setQuery('')
      setIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [state.paletteOpen])

  const commands = useMemo<Command[]>(() => {
    const go = (tab: Tab) => () => {
      dispatch({ type: 'SET_TAB', tab })
      close()
    }
    const cmds: Command[] = [
      { id: 'overview', label: 'Go to Overview', icon: <CompassIcon size={15} />, keywords: 'overview home dashboard', run: go('overview') },
      { id: 'itinerary', label: 'Go to Itinerary', icon: <MapIcon size={15} />, keywords: 'itinerary board days schedule plan', run: go('itinerary') },
      { id: 'polls', label: 'Go to Polls', icon: <PollIcon size={15} />, keywords: 'polls vote decide', run: go('polls') },
      { id: 'budget', label: 'Go to Budget', icon: <CoinIcon size={15} />, keywords: 'budget money expenses split', run: go('budget') },
      { id: 'packing', label: 'Go to Packing', icon: <PackIcon size={15} />, keywords: 'packing checklist bags', run: go('packing') },
      {
        id: 'add-stop',
        label: 'Add a stop to the itinerary',
        icon: <PinIcon size={15} />,
        keywords: 'add stop item place activity new',
        run: () => {
          close()
          openModal({ kind: 'addItem' })
        },
      },
      {
        id: 'new-poll',
        label: 'Start a poll',
        icon: <PollIcon size={15} />,
        keywords: 'poll vote new create decide',
        run: () => {
          close()
          openModal({ kind: 'newPoll' })
        },
      },
      {
        id: 'new-expense',
        label: 'Log an expense',
        icon: <CoinIcon size={15} />,
        keywords: 'expense money log add split',
        run: () => {
          close()
          openModal({ kind: 'newExpense' })
        },
      },
      {
        id: 'invite',
        label: 'Invite your crew',
        icon: <UserPlusIcon size={15} />,
        keywords: 'invite share link crew join members',
        run: () => {
          close()
          openModal({ kind: 'invite' })
        },
      },
      {
        id: 'new-trip',
        label: 'Start a new trip',
        icon: <PlusIcon size={15} />,
        keywords: 'new trip create',
        run: () => {
          close()
          openModal({ kind: 'newTrip' })
        },
      },
      {
        id: 'manage-trip',
        label: 'Trip settings (delete or leave)',
        icon: <SettingsIcon size={15} />,
        keywords: 'settings manage delete remove leave trip danger',
        run: () => {
          close()
          openModal({ kind: 'manageTrip' })
        },
      },
      {
        id: 'theme',
        label: state.theme === 'day' ? 'Switch to Overnight mode' : 'Switch to Daybreak mode',
        icon: state.theme === 'day' ? <MoonIcon size={15} /> : <SunIcon size={15} />,
        keywords: 'theme dark light night day mode toggle',
        run: () => {
          dispatch({ type: 'SET_THEME', theme: state.theme === 'day' ? 'night' : 'day' })
          close()
        },
      },
      {
        id: 'chat',
        label: state.chatOpen ? 'Hide trip chat' : 'Show trip chat',
        icon: <ChatIcon size={15} />,
        keywords: 'chat panel toggle messages',
        run: () => {
          dispatch({ type: 'TOGGLE_CHAT' })
          close()
        },
      },
      {
        id: 'export',
        label: 'Export itinerary as Markdown',
        icon: <DownloadIcon size={15} />,
        keywords: 'export download markdown share',
        run: () => {
          if (trip) {
            exportItinerary(trip)
            dispatch({ type: 'TOAST', text: 'Itinerary exported as Markdown', kind: 'ok' })
          }
          close()
        },
      },
      {
        id: 'signout',
        label: 'Sign out',
        icon: <XIcon size={15} />,
        keywords: 'sign out log out logout leave account',
        run: () => {
          close()
          void signOut()
        },
      },
    ]
    for (const t of trips) {
      if (t.id !== trip?.id) {
        cmds.push({
          id: `switch-${t.id}`,
          label: `Switch to ${t.emoji} ${t.name}`,
          icon: <MapIcon size={15} />,
          keywords: `switch trip ${t.name} ${t.destination}`,
          run: () => {
            dispatch({ type: 'SET_TRIP', tripId: t.id })
            close()
          },
        })
      }
    }
    return cmds
  }, [state.theme, state.chatOpen, trips, trip, dispatch, openModal, signOut])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.keywords.includes(q))
  }, [commands, query])

  if (!state.paletteOpen) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[index]) {
      filtered[index].run()
    }
  }

  return (
    <div className="overlay overlay-top" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="palette" role="dialog" aria-label="Command palette">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIndex(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a command… (navigate, add, export)"
          aria-label="Search commands"
        />
        <ul className="palette-list">
          {filtered.length === 0 && <li className="palette-empty">Nothing matches “{query}”</li>}
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button className={i === index ? 'active' : ''} onMouseEnter={() => setIndex(i)} onClick={c.run}>
                {c.icon}
                <span>{c.label}</span>
                {c.hint && <em>{c.hint}</em>}
              </button>
            </li>
          ))}
        </ul>
        <footer className="palette-foot">
          <span>
            <span className="kbd">↑↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> run
          </span>
          <span>
            <span className="kbd">esc</span> close
          </span>
        </footer>
      </div>
    </div>
  )
}
