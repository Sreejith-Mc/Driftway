import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireMembership } from './model'

export const add = mutation({
  args: { tripId: v.id('trips'), label: v.string() },
  handler: async (ctx, { tripId, label }) => {
    await requireMembership(ctx, tripId)
    if (!label.trim()) return
    const existing = await ctx.db.query('packing').withIndex('by_trip', (q) => q.eq('tripId', tripId)).collect()
    await ctx.db.insert('packing', { tripId, label: label.trim(), done: false, order: existing.length })
  },
})

export const toggle = mutation({
  args: { itemId: v.id('packing') },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId)
    if (!item) return
    await requireMembership(ctx, item.tripId)
    await ctx.db.patch(itemId, { done: !item.done })
  },
})

export const assign = mutation({
  args: { itemId: v.id('packing'), assignee: v.optional(v.id('users')) },
  handler: async (ctx, { itemId, assignee }) => {
    const item = await ctx.db.get(itemId)
    if (!item) return
    await requireMembership(ctx, item.tripId)
    await ctx.db.patch(itemId, { assignee: assignee ?? undefined })
  },
})

export const remove = mutation({
  args: { itemId: v.id('packing') },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId)
    if (!item) return
    await requireMembership(ctx, item.tripId)
    await ctx.db.delete(itemId)
  },
})
