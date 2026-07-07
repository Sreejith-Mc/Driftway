export type Category =
  | 'food'
  | 'culture'
  | 'outdoors'
  | 'nightlife'
  | 'stay'
  | 'transit'
  | 'shopping'
  | 'other'

export interface Member {
  id: string
  name: string
  initials: string
  color: string
  online: boolean
  you?: boolean
}

export interface ItineraryItem {
  id: string
  title: string
  time?: string
  category: Category
  note?: string
  votes: string[]
  addedBy: string
  fromChat?: boolean
}

export interface Day {
  id: string
  date: string // ISO yyyy-mm-dd
  items: ItineraryItem[]
}

export interface Suggestion {
  title: string
  category: Category
  time?: string
}

export interface Reaction {
  emoji: string
  users: string[] // member ids who reacted with this emoji
}

export interface Message {
  id: string
  authorId: string
  text: string
  ts: number
  suggestion?: Suggestion
  addedToItinerary?: boolean
  reactions?: Reaction[]
}

export interface PollOption {
  id: string
  label: string
  votes: string[]
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  status: 'open' | 'closed'
  createdBy: string
  ts: number
  resolvedTo?: string // option id chosen / added to itinerary
  messageId?: string // chat suggestion this poll was raised from, if any
}

export interface Expense {
  id: string
  title: string
  amount: number
  paidBy: string
  splitWith: string[]
  category: Category
  ts: number
}

export interface PackingItem {
  id: string
  label: string
  done: boolean
  assignee?: string
}

export interface Trip {
  id: string
  name: string
  destination: string
  emoji: string
  start: string // ISO date
  end: string // ISO date
  currency: string
  palette: number // cover gradient variant 0..4
  inviteCode: string
  ownerId: string
  typing: string | null // member id currently typing in chat
  members: Member[]
  days: Day[]
  messages: Message[]
  polls: Poll[]
  expenses: Expense[]
  packing: PackingItem[]
}

// Lightweight shape for the sidebar trip list.
export interface TripSummary {
  id: string
  name: string
  destination: string
  emoji: string
  start: string
  end: string
  palette: number
}

export type Tab = 'overview' | 'itinerary' | 'polls' | 'budget' | 'packing'

export interface Toast {
  id: string
  text: string
  kind: 'ok' | 'info' | 'warn'
}

export type Theme = 'day' | 'night'
