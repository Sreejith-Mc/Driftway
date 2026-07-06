import { getAuthUserId } from '@convex-dev/auth/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

/** The signed-in user id, or throws if the request is unauthenticated. */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx)
  if (!userId) throw new Error('Not signed in')
  return userId
}

/**
 * Asserts the signed-in user belongs to the trip and returns both ids.
 * Every trip-scoped query/mutation goes through this so one member can never
 * read or mutate another crew's trip.
 */
export async function requireMembership(ctx: QueryCtx | MutationCtx, tripId: Id<'trips'>) {
  const userId = await requireUser(ctx)
  const membership = await ctx.db
    .query('tripMembers')
    .withIndex('by_trip_user', (q) => q.eq('tripId', tripId).eq('userId', userId))
    .unique()
  if (!membership) throw new Error('You are not a member of this trip')
  return { userId, membership }
}

/** Short, unambiguous invite code (no easily-confused characters). */
export function makeInviteCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 7; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

const AVATAR_COLORS = ['#004741', '#b56a3a', '#a5893b', '#5e5a8f', '#3e7d5e', '#35566b', '#96566f', '#12695c']

export function colorForMemberCount(n: number): string {
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
