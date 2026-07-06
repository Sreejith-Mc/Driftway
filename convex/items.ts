import { mutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { categoryValidator } from './schema'
import { requireMembership } from './model'

// Re-packs a day's items into contiguous 0..n order values after any change.
async function renumber(ctx: MutationCtx, dayId: Id<'days'>) {
  const items = await ctx.db.query('items').withIndex('by_day', (q) => q.eq('dayId', dayId)).collect()
  items.sort((a, b) => a.order - b.order)
  for (let i = 0; i < items.length; i++) {
    if (items[i].order !== i) await ctx.db.patch(items[i]._id, { order: i })
  }
}

export const add = mutation({
  args: {
    tripId: v.id('trips'),
    dayId: v.id('days'),
    title: v.string(),
    time: v.optional(v.string()),
    note: v.optional(v.string()),
    category: categoryValidator,
    fromChat: v.optional(v.boolean()),
    atIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireMembership(ctx, args.tripId)
    const siblings = await ctx.db.query('items').withIndex('by_day', (q) => q.eq('dayId', args.dayId)).collect()
    const index = args.atIndex ?? siblings.length
    // Shift everything at/after the insertion point down by one.
    for (const it of siblings) {
      if (it.order >= index) await ctx.db.patch(it._id, { order: it.order + 1 })
    }
    const id = await ctx.db.insert('items', {
      tripId: args.tripId,
      dayId: args.dayId,
      title: args.title,
      time: args.time,
      note: args.note,
      category: args.category,
      order: index,
      addedBy: userId,
      fromChat: args.fromChat,
      votes: [userId],
    })
    await renumber(ctx, args.dayId)
    return id as string
  },
})

export const update = mutation({
  args: {
    itemId: v.id('items'),
    title: v.optional(v.string()),
    time: v.optional(v.union(v.string(), v.null())),
    note: v.optional(v.union(v.string(), v.null())),
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error('Item no longer exists')
    await requireMembership(ctx, item.tripId)
    const patch: Record<string, unknown> = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.time !== undefined) patch.time = args.time ?? undefined
    if (args.note !== undefined) patch.note = args.note ?? undefined
    if (args.category !== undefined) patch.category = args.category
    await ctx.db.patch(args.itemId, patch)
  },
})

export const remove = mutation({
  args: { itemId: v.id('items') },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId)
    if (!item) return
    await requireMembership(ctx, item.tripId)
    const dayId = item.dayId
    await ctx.db.delete(itemId)
    await renumber(ctx, dayId)
  },
})

export const move = mutation({
  args: { itemId: v.id('items'), toDayId: v.id('days'), toIndex: v.number() },
  handler: async (ctx, { itemId, toDayId, toIndex }) => {
    const item = await ctx.db.get(itemId)
    if (!item) throw new Error('Item no longer exists')
    await requireMembership(ctx, item.tripId)
    const dest = await ctx.db.get(toDayId)
    if (!dest || dest.tripId !== item.tripId) throw new Error('Invalid destination day')
    const fromDayId = item.dayId

    // Pull it out of the source day first, then renumber the source.
    if (fromDayId !== toDayId) {
      await ctx.db.patch(itemId, { dayId: toDayId, order: 999_999 })
    }
    // Make room at the target index in the destination day.
    const destItems = (await ctx.db.query('items').withIndex('by_day', (q) => q.eq('dayId', toDayId)).collect())
      .filter((it) => it._id !== itemId)
      .sort((a, b) => a.order - b.order)
    const clamped = Math.max(0, Math.min(toIndex, destItems.length))
    destItems.splice(clamped, 0, item)
    for (let i = 0; i < destItems.length; i++) {
      await ctx.db.patch(destItems[i]._id, { order: i, dayId: toDayId })
    }
    if (fromDayId !== toDayId) await renumber(ctx, fromDayId)
  },
})

export const toggleVote = mutation({
  args: { itemId: v.id('items') },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId)
    if (!item) throw new Error('Item no longer exists')
    const { userId } = await requireMembership(ctx, item.tripId)
    const votes = item.votes.includes(userId)
      ? item.votes.filter((u) => u !== userId)
      : [...item.votes, userId]
    await ctx.db.patch(itemId, { votes })
  },
})
