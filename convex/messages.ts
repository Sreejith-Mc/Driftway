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

/** Adds or removes the caller's reaction on a message (one tap on = tap off). */
export const toggleReaction = mutation({
  args: { messageId: v.id('messages'), emoji: v.string() },
  handler: async (ctx, { messageId, emoji }) => {
    const msg = await ctx.db.get(messageId)
    if (!msg) return
    const { userId } = await requireMembership(ctx, msg.tripId)

    const reactions = [...(msg.reactions ?? [])]
    const i = reactions.findIndex((r) => r.emoji === emoji)
    if (i === -1) {
      reactions.push({ emoji, users: [userId] })
    } else if (reactions[i].users.includes(userId)) {
      const users = reactions[i].users.filter((u) => u !== userId)
      if (users.length === 0) reactions.splice(i, 1)
      else reactions[i] = { ...reactions[i], users }
    } else {
      reactions[i] = { ...reactions[i], users: [...reactions[i].users, userId] }
    }
    await ctx.db.patch(messageId, { reactions })
  },
})
