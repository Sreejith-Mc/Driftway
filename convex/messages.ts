import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { suggestionValidator } from './schema'
import { requireMembership } from './model'

export const send = mutation({
  args: {
    tripId: v.id('trips'),
    text: v.string(),
    suggestion: v.optional(suggestionValidator),
  },
  handler: async (ctx, { tripId, text, suggestion }) => {
    const { userId } = await requireMembership(ctx, tripId)
    const trimmed = text.trim()
    if (!trimmed) return
    await ctx.db.insert('messages', { tripId, userId, text: trimmed, suggestion })
  },
})

export const markAdded = mutation({
  args: { messageId: v.id('messages') },
  handler: async (ctx, { messageId }) => {
    const msg = await ctx.db.get(messageId)
    if (!msg) return
    await requireMembership(ctx, msg.tripId)
    await ctx.db.patch(messageId, { addedToItinerary: true })
  },
})
