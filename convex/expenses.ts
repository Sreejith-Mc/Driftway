import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { categoryValidator } from './schema'
import { requireMembership } from './model'

export const add = mutation({
  args: {
    tripId: v.id('trips'),
    title: v.string(),
    amount: v.number(),
    paidBy: v.id('users'),
    splitWith: v.array(v.id('users')),
    category: categoryValidator,
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.tripId)
    if (!args.title.trim() || args.amount <= 0 || args.splitWith.length === 0) {
      throw new Error('An expense needs a title, a positive amount, and at least one person to split with')
    }
    await ctx.db.insert('expenses', {
      tripId: args.tripId,
      title: args.title.trim(),
      amount: args.amount,
      paidBy: args.paidBy,
      splitWith: args.splitWith,
      category: args.category,
    })
  },
})

export const remove = mutation({
  args: { expenseId: v.id('expenses') },
  handler: async (ctx, { expenseId }) => {
    const expense = await ctx.db.get(expenseId)
    if (!expense) return
    await requireMembership(ctx, expense.tripId)
    await ctx.db.delete(expenseId)
  },
})
