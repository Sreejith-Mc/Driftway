import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import type { Category, Suggestion, Tab, Theme, Toast, Trip, TripSummary } from './types'
import { uid } from './utils'

const STORAGE_KEY = 'driftway.ui.v1'

// ---------------------------------------------------------------------------
// UI-only state. Trip *data* lives in Convex; this reducer holds view state
// (active tab, theme, which drawers are open, toasts) that is local to a
// browser and persists as a preference.

interface UIState {
  activeTripId: string | null
  tab: Tab
  theme: Theme
  chatOpen: boolean
  navOpen: boolean
  toasts: Toast[]
  paletteOpen: boolean
}

export type Action =
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SET_TRIP'; tripId: string }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'TOGGLE_NAV' }
  | { type: 'SET_NAV'; open: boolean }
  | { type: 'SET_PALETTE_OPEN'; open: boolean }
  | { type: 'TOAST'; text: string; kind?: Toast['kind'] }
  | { type: 'DISMISS_TOAST'; id: string }

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 980px)').matches
}

function reducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, tab: action.tab, navOpen: false }
    case 'SET_TRIP':
      return { ...state, activeTripId: action.tripId, tab: 'overview', navOpen: false }
    case 'SET_THEME':
      return { ...state, theme: action.theme }
    case 'TOGGLE_CHAT':
      return { ...state, chatOpen: !state.chatOpen, navOpen: false }
    case 'TOGGLE_NAV':
      return { ...state, navOpen: !state.navOpen }
    case 'SET_NAV':
      return { ...state, navOpen: action.open }
    case 'SET_PALETTE_OPEN':
      return { ...state, paletteOpen: action.open, navOpen: action.open ? false : state.navOpen }
    case 'TOAST':
      return { ...state, toasts: [...state.toasts, { id: uid('toast'), text: action.text, kind: action.kind ?? 'ok' }] }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    default:
      return state
  }
}

function initialUI(): UIState {
  const base: UIState = {
    activeTripId: null,
    tab: 'overview',
    theme: 'day',
    chatOpen: !isMobile(),
    navOpen: false,
    toasts: [],
    paletteOpen: false,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<UIState>
      base.theme = saved.theme === 'night' ? 'night' : 'day'
      base.activeTripId = saved.activeTripId ?? null
      if (!isMobile() && typeof saved.chatOpen === 'boolean') base.chatOpen = saved.chatOpen
    }
  } catch {
    /* first run or storage unavailable */
  }
  return base
}

// ---------------------------------------------------------------------------

export interface Actions {
  createTrip: (args: {
    name: string
    destination: string
    emoji: string
    start: string
    end: string
    currency: string
    palette: number
    dates: string[]
  }) => Promise<string>
  joinTrip: (code: string) => Promise<string>
  rotateInvite: () => Promise<void>
  addItem: (args: {
    dayId: string
    title: string
    time?: string
    note?: string
    category: Category
    fromChat?: boolean
    atIndex?: number
  }) => Promise<void>
  updateItem: (args: { itemId: string; title?: string; time?: string | null; note?: string | null; category?: Category }) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  moveItem: (args: { itemId: string; toDayId: string; toIndex: number }) => Promise<void>
  toggleItemVote: (itemId: string) => Promise<void>
  sendMessage: (args: { text: string; suggestion?: Suggestion }) => Promise<void>
  markMessageAdded: (messageId: string) => Promise<void>
  createPoll: (args: { question: string; options: string[] }) => Promise<void>
  votePoll: (args: { pollId: string; optionId: string }) => Promise<void>
  closePoll: (args: { pollId: string; resolvedTo?: string }) => Promise<void>
  addExpense: (args: { title: string; amount: number; paidBy: string; splitWith: string[]; category: Category }) => Promise<void>
  deleteExpense: (expenseId: string) => Promise<void>
  addPack: (label: string) => Promise<void>
  togglePack: (itemId: string) => Promise<void>
  assignPack: (args: { itemId: string; assignee?: string }) => Promise<void>
  deletePack: (itemId: string) => Promise<void>
  heartbeat: (typing: boolean) => Promise<void>
}

interface StoreValue {
  state: UIState
  dispatch: React.Dispatch<Action>
  trips: TripSummary[]
  trip: Trip | null
  loadingTrip: boolean
  actions: Actions
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialUI)

  const tripsRaw = useQuery(api.trips.listMine)
  const trips = (tripsRaw ?? []) as TripSummary[]

  // Resolve the active trip: keep the persisted one if it's still ours,
  // otherwise fall back to the first trip.
  const activeTripId =
    state.activeTripId && trips.some((t) => t.id === state.activeTripId)
      ? state.activeTripId
      : trips[0]?.id ?? null

  useEffect(() => {
    if (activeTripId && activeTripId !== state.activeTripId) {
      dispatch({ type: 'SET_TRIP', tripId: activeTripId })
    }
  }, [activeTripId, state.activeTripId])

  const tripRaw = useQuery(api.trips.get, activeTripId ? { tripId: activeTripId as Id<'trips'> } : 'skip')
  const trip = (tripRaw ?? null) as Trip | null
  const loadingTrip = activeTripId !== null && tripRaw === undefined

  // Persist preferences.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme: state.theme, activeTripId, chatOpen: state.chatOpen }),
      )
    } catch {
      /* ignore */
    }
  }, [state.theme, activeTripId, state.chatOpen])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  // --- mutation bindings
  const mCreateTrip = useMutation(api.trips.create)
  const mJoin = useMutation(api.trips.join)
  const mRotate = useMutation(api.trips.rotateInvite)
  const mAddItem = useMutation(api.items.add)
  const mUpdateItem = useMutation(api.items.update)
  const mDeleteItem = useMutation(api.items.remove)
  const mMoveItem = useMutation(api.items.move)
  const mVoteItem = useMutation(api.items.toggleVote)
  const mSend = useMutation(api.messages.send)
  const mMarkAdded = useMutation(api.messages.markAdded)
  const mCreatePoll = useMutation(api.polls.create)
  const mVotePoll = useMutation(api.polls.vote)
  const mClosePoll = useMutation(api.polls.close)
  const mAddExpense = useMutation(api.expenses.add)
  const mDeleteExpense = useMutation(api.expenses.remove)
  const mAddPack = useMutation(api.packing.add)
  const mTogglePack = useMutation(api.packing.toggle)
  const mAssignPack = useMutation(api.packing.assign)
  const mDeletePack = useMutation(api.packing.remove)
  const mHeartbeat = useMutation(api.presence.heartbeat)

  const tid = () => {
    if (!activeTripId) throw new Error('No active trip')
    return activeTripId as Id<'trips'>
  }

  const actions = useMemo<Actions>(
    () => ({
      createTrip: (args) => mCreateTrip(args) as Promise<string>,
      joinTrip: (code) => mJoin({ code }) as Promise<string>,
      rotateInvite: async () => {
        await mRotate({ tripId: tid() })
      },
      addItem: async (args) => {
        await mAddItem({ tripId: tid(), dayId: args.dayId as Id<'days'>, title: args.title, time: args.time, note: args.note, category: args.category, fromChat: args.fromChat, atIndex: args.atIndex })
      },
      updateItem: async ({ itemId, ...patch }) => {
        await mUpdateItem({ itemId: itemId as Id<'items'>, ...patch })
      },
      deleteItem: async (itemId) => {
        await mDeleteItem({ itemId: itemId as Id<'items'> })
      },
      moveItem: async ({ itemId, toDayId, toIndex }) => {
        await mMoveItem({ itemId: itemId as Id<'items'>, toDayId: toDayId as Id<'days'>, toIndex })
      },
      toggleItemVote: async (itemId) => {
        await mVoteItem({ itemId: itemId as Id<'items'> })
      },
      sendMessage: async ({ text, suggestion }) => {
        await mSend({ tripId: tid(), text, suggestion })
      },
      markMessageAdded: async (messageId) => {
        await mMarkAdded({ messageId: messageId as Id<'messages'> })
      },
      createPoll: async ({ question, options }) => {
        await mCreatePoll({ tripId: tid(), question, options })
      },
      votePoll: async ({ pollId, optionId }) => {
        await mVotePoll({ pollId: pollId as Id<'polls'>, optionId })
      },
      closePoll: async ({ pollId, resolvedTo }) => {
        await mClosePoll({ pollId: pollId as Id<'polls'>, resolvedTo })
      },
      addExpense: async (args) => {
        await mAddExpense({ tripId: tid(), title: args.title, amount: args.amount, paidBy: args.paidBy as Id<'users'>, splitWith: args.splitWith as Id<'users'>[], category: args.category })
      },
      deleteExpense: async (expenseId) => {
        await mDeleteExpense({ expenseId: expenseId as Id<'expenses'> })
      },
      addPack: async (label) => {
        await mAddPack({ tripId: tid(), label })
      },
      togglePack: async (itemId) => {
        await mTogglePack({ itemId: itemId as Id<'packing'> })
      },
      assignPack: async ({ itemId, assignee }) => {
        await mAssignPack({ itemId: itemId as Id<'packing'>, assignee: assignee ? (assignee as Id<'users'>) : undefined })
      },
      deletePack: async (itemId) => {
        await mDeletePack({ itemId: itemId as Id<'packing'> })
      },
      heartbeat: async (typing) => {
        if (!activeTripId) return
        await mHeartbeat({ tripId: activeTripId as Id<'trips'>, typing })
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTripId],
  )

  const value = useMemo<StoreValue>(
    () => ({ state: { ...state, activeTripId }, dispatch, trips, trip, loadingTrip, actions }),
    [state, activeTripId, trips, trip, loadingTrip, actions],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/** The current user's member record in the active trip. */
export function useYou() {
  const { trip } = useStore()
  return trip?.members.find((m) => m.you) ?? trip?.members[0] ?? null
}

export function useActions(): Actions {
  return useStore().actions
}

// Fires the presence heartbeat on an interval while a trip is open, and lets
// the chat surface report typing. Returns a setter for the typing flag.
export function usePresence(typing: boolean) {
  const { actions, trip } = useStore()
  const typingRef = useRef(typing)
  typingRef.current = typing
  useEffect(() => {
    if (!trip) return
    actions.heartbeat(typingRef.current)
    const id = window.setInterval(() => actions.heartbeat(typingRef.current), 12_000)
    return () => window.clearInterval(id)
  }, [trip?.id, actions])
  // Push an immediate update when the typing flag flips.
  useEffect(() => {
    if (trip) actions.heartbeat(typing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing])
}
