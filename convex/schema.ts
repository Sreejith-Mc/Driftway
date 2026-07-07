import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

// Trip activity categories, shared by items, expenses, and chat suggestions.
export const categoryValidator = v.union(
  v.literal('food'),
  v.literal('culture'),
  v.literal('outdoors'),
  v.literal('nightlife'),
  v.literal('stay'),
  v.literal('transit'),
  v.literal('shopping'),
  v.literal('other'),
)

export const suggestionValidator = v.object({
  title: v.string(),
  category: categoryValidator,
  time: v.optional(v.string()),
})

export const pollOptionValidator = v.object({
  id: v.string(),
  label: v.string(),
  votes: v.array(v.id('users')),
})

export default defineSchema({
  // Auth tables (users, sessions, accounts…) provided by Convex Auth.
  ...authTables,

  trips: defineTable({
    name: v.string(),
    destination: v.string(),
    emoji: v.string(),
    start: v.string(), // ISO yyyy-mm-dd
    end: v.string(),
    currency: v.string(),
    palette: v.number(),
    ownerId: v.id('users'),
    inviteCode: v.string(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_invite', ['inviteCode']),

  // Membership is the join table between users and trips, and also carries the
  // per-trip display identity (name/initials/avatar color).
  tripMembers: defineTable({
    tripId: v.id('trips'),
    userId: v.id('users'),
    name: v.string(),
    initials: v.string(),
    color: v.string(),
    role: v.union(v.literal('owner'), v.literal('member')),
  })
    .index('by_trip', ['tripId'])
    .index('by_user', ['userId'])
    .index('by_trip_user', ['tripId', 'userId']),

  days: defineTable({
    tripId: v.id('trips'),
    date: v.string(),
    order: v.number(),
  }).index('by_trip', ['tripId']),

  items: defineTable({
    tripId: v.id('trips'),
    dayId: v.id('days'),
    title: v.string(),
    time: v.optional(v.string()),
    note: v.optional(v.string()),
    category: categoryValidator,
    order: v.number(),
    addedBy: v.id('users'),
    fromChat: v.optional(v.boolean()),
    votes: v.array(v.id('users')),
  })
    .index('by_trip', ['tripId'])
    .index('by_day', ['dayId']),

  messages: defineTable({
    tripId: v.id('trips'),
    userId: v.id('users'),
    text: v.string(),
    suggestion: v.optional(suggestionValidator),
    addedToItinerary: v.optional(v.boolean()),
    // One entry per emoji that has at least one reactor.
    reactions: v.optional(v.array(v.object({ emoji: v.string(), users: v.array(v.id('users')) }))),
  }).index('by_trip', ['tripId']),

  polls: defineTable({
    tripId: v.id('trips'),
    question: v.string(),
    createdBy: v.id('users'),
    status: v.union(v.literal('open'), v.literal('closed')),
    resolvedTo: v.optional(v.string()),
    options: v.array(pollOptionValidator),
  }).index('by_trip', ['tripId']),

  expenses: defineTable({
    tripId: v.id('trips'),
    title: v.string(),
    amount: v.number(),
    paidBy: v.id('users'),
    splitWith: v.array(v.id('users')),
    category: categoryValidator,
  }).index('by_trip', ['tripId']),

  packing: defineTable({
    tripId: v.id('trips'),
    label: v.string(),
    done: v.boolean(),
    assignee: v.optional(v.id('users')),
    order: v.number(),
  }).index('by_trip', ['tripId']),

  // One row per member per trip; refreshed by a heartbeat. Drives the online
  // dots and typing indicator — the real version of the old simulated crew.
  presence: defineTable({
    tripId: v.id('trips'),
    userId: v.id('users'),
    lastSeen: v.number(),
    typing: v.boolean(),
  })
    .index('by_trip', ['tripId'])
    .index('by_trip_user', ['tripId', 'userId']),
})
