import { getAuthUserId } from '@convex-dev/auth/server'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import type { QueryCtx } from './_generated/server'
import { colorForMemberCount, initialsOf, makeInviteCode, requireMembership, requireUser } from './model'

const ONLINE_WINDOW_MS = 30_000

// Assembles a trip into the nested shape the UI renders, resolving membership,
// presence, days+items, messages, polls, expenses and packing in one payload.
async function assembleTrip(ctx: QueryCtx, trip: Doc<'trips'>, viewerId: Id<'users'>) {
  const [memberRows, presenceRows, days, items, messages, polls, expenses, packing] = await Promise.all([
    ctx.db.query('tripMembers').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
    ctx.db.query('presence').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
    ctx.db.query('days').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
    ctx.db.query('items').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
    ctx.db.query('messages').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
    ctx.db.query('polls').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
    ctx.db.query('expenses').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
    ctx.db.query('packing').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect(),
  ])

  const now = Date.now()
  const presenceByUser = new Map(presenceRows.map((p) => [p.userId, p]))
  const members = memberRows.map((m) => {
    const p = presenceByUser.get(m.userId)
    return {
      id: m.userId as string,
      name: m.name,
      initials: m.initials,
      color: m.color,
      online: m.userId === viewerId || (!!p && now - p.lastSeen < ONLINE_WINDOW_MS),
      you: m.userId === viewerId,
    }
  })

  const typingMember = presenceRows.find((p) => p.typing && p.userId !== viewerId && now - p.lastSeen < ONLINE_WINDOW_MS)

  const sortedDays = [...days].sort((a, b) => a.order - b.order)
  const itemsByDay = new Map<string, typeof items>()
  for (const it of items) {
    const arr = itemsByDay.get(it.dayId) ?? []
    arr.push(it)
    itemsByDay.set(it.dayId, arr)
  }

  return {
    id: trip._id as string,
    name: trip.name,
    destination: trip.destination,
    emoji: trip.emoji,
    start: trip.start,
    end: trip.end,
    currency: trip.currency,
    palette: trip.palette,
    inviteCode: trip.inviteCode,
    ownerId: trip.ownerId as string,
    typing: (typingMember?.userId as string) ?? null,
    members,
    days: sortedDays.map((d) => ({
      id: d._id as string,
      date: d.date,
      items: (itemsByDay.get(d._id) ?? [])
        .sort((a, b) => a.order - b.order)
        .map((it) => ({
          id: it._id as string,
          title: it.title,
          time: it.time,
          note: it.note,
          category: it.category,
          fromChat: it.fromChat,
          addedBy: it.addedBy as string,
          votes: it.votes as string[],
        })),
    })),
    messages: [...messages]
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((m) => ({
        id: m._id as string,
        authorId: m.userId as string,
        text: m.text,
        ts: m._creationTime,
        suggestion: m.suggestion,
        addedToItinerary: m.addedToItinerary,
        reactions: (m.reactions ?? []).map((r) => ({ emoji: r.emoji, users: r.users as string[] })),
      })),
    polls: [...polls]
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((p) => ({
        id: p._id as string,
        question: p.question,
        createdBy: p.createdBy as string,
        status: p.status,
        resolvedTo: p.resolvedTo,
        ts: p._creationTime,
        options: p.options,
      })),
    expenses: [...expenses]
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((e) => ({
        id: e._id as string,
        title: e.title,
        amount: e.amount,
        paidBy: e.paidBy as string,
        splitWith: e.splitWith as string[],
        category: e.category,
        ts: e._creationTime,
      })),
    packing: [...packing]
      .sort((a, b) => a.order - b.order)
      .map((pk) => ({
        id: pk._id as string,
        label: pk.label,
        done: pk.done,
        assignee: (pk.assignee as string) ?? undefined,
      })),
  }
}

/** Lightweight list for the sidebar — every trip the user belongs to. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []
    const memberships = await ctx.db.query('tripMembers').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
    const trips = await Promise.all(memberships.map((m) => ctx.db.get(m.tripId)))
    return trips
      .filter((t): t is Doc<'trips'> => t !== null)
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((t) => ({
        id: t._id as string,
        name: t.name,
        destination: t.destination,
        emoji: t.emoji,
        start: t.start,
        end: t.end,
        palette: t.palette,
      }))
  },
})

/** Full trip payload for the active trip. Returns null if not a member. */
export const get = query({
  args: { tripId: v.id('trips') },
  handler: async (ctx, { tripId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const membership = await ctx.db
      .query('tripMembers')
      .withIndex('by_trip_user', (q) => q.eq('tripId', tripId).eq('userId', userId))
      .unique()
    if (!membership) return null
    const trip = await ctx.db.get(tripId)
    if (!trip) return null
    return assembleTrip(ctx, trip, userId)
  },
})

/** Public preview of an invite so the join screen can show what you're joining. */
export const inviteInfo = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const trip = await ctx.db.query('trips').withIndex('by_invite', (q) => q.eq('inviteCode', code.toUpperCase())).unique()
    if (!trip) return null
    const members = await ctx.db.query('tripMembers').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect()
    return { name: trip.name, destination: trip.destination, emoji: trip.emoji, memberCount: members.length }
  },
})

async function addMember(
  ctx: { db: any },
  tripId: Id<'trips'>,
  userId: Id<'users'>,
  name: string,
  memberIndex: number,
  role: 'owner' | 'member',
) {
  await ctx.db.insert('tripMembers', {
    tripId,
    userId,
    name,
    initials: initialsOf(name),
    color: colorForMemberCount(memberIndex),
    role,
  })
}

export const create = mutation({
  args: {
    name: v.string(),
    destination: v.string(),
    emoji: v.string(),
    start: v.string(),
    end: v.string(),
    currency: v.string(),
    palette: v.number(),
    dates: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    const user = await ctx.db.get(userId)
    const name = (user?.name as string) || (user?.email as string) || 'You'
    const tripId = await ctx.db.insert('trips', {
      name: args.name,
      destination: args.destination,
      emoji: args.emoji,
      start: args.start,
      end: args.end,
      currency: args.currency,
      palette: args.palette,
      ownerId: userId,
      inviteCode: makeInviteCode(),
    })
    await addMember(ctx, tripId, userId, name, 0, 'owner')
    let order = 0
    for (const date of args.dates) {
      await ctx.db.insert('days', { tripId, date, order: order++ })
    }
    return tripId as string
  },
})

export const join = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await requireUser(ctx)
    const trip = await ctx.db.query('trips').withIndex('by_invite', (q) => q.eq('inviteCode', code.toUpperCase())).unique()
    if (!trip) throw new Error('That invite code does not match any trip')
    const existing = await ctx.db
      .query('tripMembers')
      .withIndex('by_trip_user', (q) => q.eq('tripId', trip._id).eq('userId', userId))
      .unique()
    if (existing) return trip._id as string
    const members = await ctx.db.query('tripMembers').withIndex('by_trip', (q) => q.eq('tripId', trip._id)).collect()
    const user = await ctx.db.get(userId)
    const name = (user?.name as string) || (user?.email as string) || 'Guest'
    await addMember(ctx, trip._id, userId, name, members.length, 'member')
    return trip._id as string
  },
})

/** Regenerates the invite code (owner only), invalidating old links. */
export const rotateInvite = mutation({
  args: { tripId: v.id('trips') },
  handler: async (ctx, { tripId }) => {
    const { userId } = await requireMembership(ctx, tripId)
    const trip = await ctx.db.get(tripId)
    if (!trip || trip.ownerId !== userId) throw new Error('Only the trip owner can reset the invite link')
    const code = makeInviteCode()
    await ctx.db.patch(tripId, { inviteCode: code })
    return code
  },
})

/**
 * Deletes a trip and every row that belongs to it. Owner only — this wipes the
 * itinerary, chat, polls, budget and packing for the whole crew.
 */
export const remove = mutation({
  args: { tripId: v.id('trips') },
  handler: async (ctx, { tripId }) => {
    const { userId } = await requireMembership(ctx, tripId)
    const trip = await ctx.db.get(tripId)
    if (!trip) return
    if (trip.ownerId !== userId) throw new Error('Only the trip owner can delete this trip')

    const [members, presence, days, items, messages, polls, expenses, packing] = await Promise.all([
      ctx.db.query('tripMembers').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
      ctx.db.query('presence').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
      ctx.db.query('days').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
      ctx.db.query('items').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
      ctx.db.query('messages').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
      ctx.db.query('polls').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
      ctx.db.query('expenses').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
      ctx.db.query('packing').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect(),
    ])
    const rows = [...members, ...presence, ...days, ...items, ...messages, ...polls, ...expenses, ...packing]
    await Promise.all(rows.map((r) => ctx.db.delete(r._id)))
    await ctx.db.delete(tripId)
  },
})

/**
 * Removes the signed-in member from a trip they joined. The owner can't leave —
 * they delete the trip instead (or the trip would be left without a host).
 */
export const leave = mutation({
  args: { tripId: v.id('trips') },
  handler: async (ctx, { tripId }) => {
    const { userId, membership } = await requireMembership(ctx, tripId)
    const trip = await ctx.db.get(tripId)
    if (trip && trip.ownerId === userId) {
      throw new Error('The trip owner can’t leave — delete the trip instead')
    }
    await ctx.db.delete(membership._id)
    const presence = await ctx.db
      .query('presence')
      .withIndex('by_trip_user', (q) => q.eq('tripId', tripId).eq('userId', userId))
      .unique()
    if (presence) await ctx.db.delete(presence._id)
  },
})
