import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { AppState, Day, Expense, ItineraryItem, Message, PackingItem, Poll, Tab, Theme, Toast, Trip } from './types'
import { buildSeedTrips } from './data/seed'
import { uid } from './utils'

const STORAGE_KEY = 'driftway.v2'

export type Action =
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SET_TRIP'; tripId: string }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'TOGGLE_NAV' }
  | { type: 'SET_NAV'; open: boolean }
  | { type: 'SET_PALETTE_OPEN'; open: boolean }
  | { type: 'SEND_MESSAGE'; tripId: string; message: Message }
  | { type: 'SET_TYPING'; memberId: string | null }
  | { type: 'MARK_MESSAGE_ADDED'; tripId: string; messageId: string }
  | { type: 'ADD_ITEM'; tripId: string; dayId: string; item: ItineraryItem; index?: number }
  | { type: 'UPDATE_ITEM'; tripId: string; dayId: string; itemId: string; patch: Partial<ItineraryItem> }
  | { type: 'DELETE_ITEM'; tripId: string; dayId: string; itemId: string }
  | { type: 'MOVE_ITEM'; tripId: string; fromDayId: string; toDayId: string; itemId: string; index: number }
  | { type: 'TOGGLE_ITEM_VOTE'; tripId: string; dayId: string; itemId: string; memberId: string }
  | { type: 'CREATE_POLL'; tripId: string; poll: Poll }
  | { type: 'VOTE_POLL'; tripId: string; pollId: string; optionId: string; memberId: string }
  | { type: 'CLOSE_POLL'; tripId: string; pollId: string; resolvedTo?: string }
  | { type: 'ADD_EXPENSE'; tripId: string; expense: Expense }
  | { type: 'DELETE_EXPENSE'; tripId: string; expenseId: string }
  | { type: 'ADD_PACK'; tripId: string; item: PackingItem }
  | { type: 'TOGGLE_PACK'; tripId: string; itemId: string }
  | { type: 'DELETE_PACK'; tripId: string; itemId: string }
  | { type: 'ASSIGN_PACK'; tripId: string; itemId: string; assignee?: string }
  | { type: 'ADD_TRIP'; trip: Trip }
  | { type: 'TOAST'; text: string; kind?: Toast['kind'] }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'RESET' }

function updateTrip(state: AppState, tripId: string, fn: (t: Trip) => Trip): AppState {
  return { ...state, trips: state.trips.map((t) => (t.id === tripId ? fn(t) : t)) }
}

function updateDay(trip: Trip, dayId: string, fn: (d: Day) => Day): Trip {
  return { ...trip, days: trip.days.map((d) => (d.id === dayId ? fn(d) : d)) }
}

function reducer(state: AppState, action: Action): AppState {
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
    case 'SET_TYPING':
      return { ...state, typing: action.memberId }
    case 'SEND_MESSAGE':
      return updateTrip(state, action.tripId, (t) => ({ ...t, messages: [...t.messages, action.message] }))
    case 'MARK_MESSAGE_ADDED':
      return updateTrip(state, action.tripId, (t) => ({
        ...t,
        messages: t.messages.map((m) => (m.id === action.messageId ? { ...m, addedToItinerary: true } : m)),
      }))
    case 'ADD_ITEM':
      return updateTrip(state, action.tripId, (t) =>
        updateDay(t, action.dayId, (d) => {
          const items = [...d.items]
          items.splice(action.index ?? items.length, 0, action.item)
          return { ...d, items }
        }),
      )
    case 'UPDATE_ITEM':
      return updateTrip(state, action.tripId, (t) =>
        updateDay(t, action.dayId, (d) => ({
          ...d,
          items: d.items.map((it) => (it.id === action.itemId ? { ...it, ...action.patch } : it)),
        })),
      )
    case 'DELETE_ITEM':
      return updateTrip(state, action.tripId, (t) =>
        updateDay(t, action.dayId, (d) => ({ ...d, items: d.items.filter((it) => it.id !== action.itemId) })),
      )
    case 'MOVE_ITEM': {
      return updateTrip(state, action.tripId, (t) => {
        const fromDay = t.days.find((d) => d.id === action.fromDayId)
        const item = fromDay?.items.find((it) => it.id === action.itemId)
        if (!fromDay || !item) return t
        let trip = updateDay(t, action.fromDayId, (d) => ({ ...d, items: d.items.filter((it) => it.id !== action.itemId) }))
        trip = updateDay(trip, action.toDayId, (d) => {
          const items = [...d.items]
          let idx = action.index
          if (action.fromDayId === action.toDayId) {
            const oldIdx = fromDay.items.findIndex((it) => it.id === action.itemId)
            if (oldIdx < idx) idx -= 1
          }
          items.splice(Math.max(0, Math.min(idx, items.length)), 0, item)
          return { ...d, items }
        })
        return trip
      })
    }
    case 'TOGGLE_ITEM_VOTE':
      return updateTrip(state, action.tripId, (t) =>
        updateDay(t, action.dayId, (d) => ({
          ...d,
          items: d.items.map((it) =>
            it.id === action.itemId
              ? {
                  ...it,
                  votes: it.votes.includes(action.memberId)
                    ? it.votes.filter((v) => v !== action.memberId)
                    : [...it.votes, action.memberId],
                }
              : it,
          ),
        })),
      )
    case 'CREATE_POLL':
      return updateTrip(state, action.tripId, (t) => ({ ...t, polls: [action.poll, ...t.polls] }))
    case 'VOTE_POLL':
      return updateTrip(state, action.tripId, (t) => ({
        ...t,
        polls: t.polls.map((p) => {
          if (p.id !== action.pollId || p.status === 'closed') return p
          const already = p.options.find((o) => o.id === action.optionId)?.votes.includes(action.memberId)
          return {
            ...p,
            options: p.options.map((o) => ({
              ...o,
              votes:
                o.id === action.optionId
                  ? already
                    ? o.votes.filter((v) => v !== action.memberId)
                    : [...o.votes.filter((v) => v !== action.memberId), action.memberId]
                  : o.votes.filter((v) => v !== action.memberId),
            })),
          }
        }),
      }))
    case 'CLOSE_POLL':
      return updateTrip(state, action.tripId, (t) => ({
        ...t,
        polls: t.polls.map((p) => (p.id === action.pollId ? { ...p, status: 'closed', resolvedTo: action.resolvedTo ?? p.resolvedTo } : p)),
      }))
    case 'ADD_EXPENSE':
      return updateTrip(state, action.tripId, (t) => ({ ...t, expenses: [action.expense, ...t.expenses] }))
    case 'DELETE_EXPENSE':
      return updateTrip(state, action.tripId, (t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== action.expenseId) }))
    case 'ADD_PACK':
      return updateTrip(state, action.tripId, (t) => ({ ...t, packing: [...t.packing, action.item] }))
    case 'TOGGLE_PACK':
      return updateTrip(state, action.tripId, (t) => ({
        ...t,
        packing: t.packing.map((p) => (p.id === action.itemId ? { ...p, done: !p.done } : p)),
      }))
    case 'DELETE_PACK':
      return updateTrip(state, action.tripId, (t) => ({ ...t, packing: t.packing.filter((p) => p.id !== action.itemId) }))
    case 'ASSIGN_PACK':
      return updateTrip(state, action.tripId, (t) => ({
        ...t,
        packing: t.packing.map((p) => (p.id === action.itemId ? { ...p, assignee: action.assignee } : p)),
      }))
    case 'ADD_TRIP':
      return { ...state, trips: [...state.trips, action.trip], activeTripId: action.trip.id, tab: 'overview' }
    case 'TOAST':
      return { ...state, toasts: [...state.toasts, { id: uid('toast'), text: action.text, kind: action.kind ?? 'ok' }] }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'RESET': {
      const trips = buildSeedTrips()
      return { ...initialState(), trips, activeTripId: trips[0].id, theme: state.theme }
    }
    default:
      return state
  }
}

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 980px)').matches
}

function initialState(): AppState {
  const trips = buildSeedTrips()
  return {
    trips,
    activeTripId: trips[0].id,
    tab: 'overview',
    theme: 'day',
    chatOpen: !isMobile(), // on phones the chat is an overlay drawer; start closed
    navOpen: false,
    typing: null,
    toasts: [],
    paletteOpen: false,
  }
}

function loadState(): AppState {
  const base = initialState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const saved = JSON.parse(raw) as Partial<AppState>
    if (!Array.isArray(saved.trips) || saved.trips.length === 0) return base
    return {
      ...base,
      trips: saved.trips,
      activeTripId: saved.trips.some((t) => t.id === saved.activeTripId) ? saved.activeTripId! : saved.trips[0].id,
      tab: saved.tab ?? 'overview',
      theme: saved.theme === 'night' ? 'night' : 'day',
      chatOpen: isMobile() ? false : (saved.chatOpen ?? true),
    }
  } catch {
    return base
  }
}

interface StoreValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  trip: Trip
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    const { trips, activeTripId, tab, theme, chatOpen } = state
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips, activeTripId, tab, theme, chatOpen }))
    } catch {
      /* storage may be unavailable; the app still works in-memory */
    }
  }, [state.trips, state.activeTripId, state.tab, state.theme, state.chatOpen])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  const trip = state.trips.find((t) => t.id === state.activeTripId) ?? state.trips[0]
  const value = useMemo(() => ({ state, dispatch, trip }), [state, trip])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useYou() {
  const { trip } = useStore()
  return trip.members.find((m) => m.you) ?? trip.members[0]
}
