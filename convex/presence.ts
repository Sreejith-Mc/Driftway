import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireMembership } from './model'

// Called on a short interval by each open client. Upserts the member's
// last-seen timestamp and typing flag; the trip query derives "online" from it.
export const heartbeat = mutation({
  args: { tripId: v.id('trips'), typing: v.boolean() },
  handler: async (ctx, { tripId, typing }) => {
    const { userId } = await requireMembership(ctx, tripId)
    const existing = await ctx.db
      .query('presence')
      .withIndex('by_trip_user', (q) => q.eq('tripId', tripId).eq('userId', userId))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now(), typing })
    } else {
      await ctx.db.insert('presence', { tripId, userId, lastSeen: Date.now(), typing })
    }
  },
})
