import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireMembership } from './model'

function optId(): string {
  return `opt_${Math.random().toString(36).slice(2, 9)}`
}

export const create = mutation({
  args: { tripId: v.id('trips'), question: v.string(), options: v.array(v.string()) },
  handler: async (ctx, { tripId, question, options }) => {
    const { userId } = await requireMembership(ctx, tripId)
    const clean = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || clean.length < 2) throw new Error('A poll needs a question and at least two options')
    const id = await ctx.db.insert('polls', {
      tripId,
      question: question.trim(),
      createdBy: userId,
      status: 'open',
      options: clean.map((label) => ({ id: optId(), label, votes: [] })),
    })
    return id as string
  },
})

export const vote = mutation({
  args: { pollId: v.id('polls'), optionId: v.string() },
  handler: async (ctx, { pollId, optionId }) => {
    const poll = await ctx.db.get(pollId)
    if (!poll) throw new Error('Poll no longer exists')
    const { userId } = await requireMembership(ctx, poll.tripId)
    if (poll.status === 'closed') return
    const already = poll.options.find((o) => o.id === optionId)?.votes.includes(userId)
    const options = poll.options.map((o) => ({
      ...o,
      votes:
        o.id === optionId
          ? already
            ? o.votes.filter((u) => u !== userId)
            : [...o.votes.filter((u) => u !== userId), userId]
          : o.votes.filter((u) => u !== userId),
    }))
    await ctx.db.patch(pollId, { options })
  },
})

export const close = mutation({
  args: { pollId: v.id('polls'), resolvedTo: v.optional(v.string()) },
  handler: async (ctx, { pollId, resolvedTo }) => {
    const poll = await ctx.db.get(pollId)
    if (!poll) return
    await requireMembership(ctx, poll.tripId)
    await ctx.db.patch(pollId, { status: 'closed', resolvedTo: resolvedTo ?? poll.resolvedTo })
  },
})
