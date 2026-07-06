import { mutation } from './_generated/server'
import { colorForMemberCount, initialsOf, makeInviteCode, requireUser } from './model'

function inDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Idempotent: if the signed-in user already belongs to any trip this is a
 * no-op. Otherwise it creates one populated starter trip so the app has life
 * on first sign-in (the real-user equivalent of the old localStorage demo).
 */
export const ensureStarterTrip = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx)
    const existing = await ctx.db.query('tripMembers').withIndex('by_user', (q) => q.eq('userId', userId)).first()
    if (existing) return existing.tripId as string

    const user = await ctx.db.get(userId)
    const name = (user?.name as string) || (user?.email as string) || 'You'

    const dates = [inDays(74), inDays(75), inDays(76), inDays(77)]
    const tripId = await ctx.db.insert('trips', {
      name: 'Lisbon Golden Week',
      destination: 'Lisbon, Portugal',
      emoji: '🌊',
      start: dates[0],
      end: dates[3],
      currency: 'EUR',
      palette: 0,
      ownerId: userId,
      inviteCode: makeInviteCode(),
    })
    await ctx.db.insert('tripMembers', {
      tripId,
      userId,
      name,
      initials: initialsOf(name),
      color: colorForMemberCount(0),
      role: 'owner',
    })

    const dayIds = []
    for (let i = 0; i < dates.length; i++) {
      dayIds.push(await ctx.db.insert('days', { tripId, date: dates[i], order: i }))
    }

    const seedItems: Array<[number, string, string | undefined, any, string | undefined]> = [
      [0, 'Land at Humberto Delgado Airport', '10:40am', 'transit', 'Metro red line into town — buy the Viva Viagem card.'],
      [0, 'Check In — Alfama Apartment', '1:00pm', 'stay', 'Rooftop access!'],
      [0, 'First Pastel De Nata Stop', '2:30pm', 'food', undefined],
      [1, 'Tram 28 Loop', '9:00am', 'transit', 'Board at Martim Moniz before the queue builds.'],
      [1, 'Seafood Lunch At Cervejaria Ramiro', '1:30pm', 'food', 'Garlic prawns. Non-negotiable.'],
      [2, 'Day Trip — Sintra & Pena Palace', '8:30am', 'culture', 'Train from Rossio, ~40 min.'],
      [3, 'Belém — Monastery & Tower', '9:30am', 'culture', undefined],
    ]
    const orderByDay: Record<number, number> = {}
    for (const [dayIdx, title, time, category, note] of seedItems) {
      const order = orderByDay[dayIdx] ?? 0
      orderByDay[dayIdx] = order + 1
      await ctx.db.insert('items', {
        tripId,
        dayId: dayIds[dayIdx],
        title,
        time,
        note,
        category,
        order,
        addedBy: userId,
        votes: [userId],
      })
    }

    await ctx.db.insert('messages', {
      tripId,
      userId,
      text: 'Welcome to Driftway! Invite your crew with the link button up top, then drop ideas here — anything that reads like a plan becomes a card you can drag onto a day.',
      addedToItinerary: false,
    })

    await ctx.db.insert('polls', {
      tripId,
      question: 'Sunset spot for Friday night?',
      createdBy: userId,
      status: 'open',
      options: [
        { id: 'opt_a', label: 'Miradouro da Graça', votes: [userId] },
        { id: 'opt_b', label: 'Rooftop bar near the cathedral', votes: [] },
        { id: 'opt_c', label: 'Ponte 25 de Abril viewpoint', votes: [] },
      ],
    })

    const packing = ['Comfortable walking shoes (the hills are real)', 'EU plug adapters', 'Sunscreen + hat', 'Portable speaker for the rooftop']
    for (let i = 0; i < packing.length; i++) {
      await ctx.db.insert('packing', { tripId, label: packing[i], done: i === 0, order: i })
    }

    return tripId as string
  },
})
