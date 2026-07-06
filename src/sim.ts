// The "drift engine": parses free-form chat into structured itinerary
// suggestions, and simulates the rest of the crew replying and voting so the
// collaborative loop can be felt in a demo without a backend.
import type { Category, Suggestion } from './types'
import { titleCase } from './utils'

const CATEGORY_KEYWORDS: Array<[Category, RegExp]> = [
  ['food', /\b(dinner|lunch|brunch|breakfast|eat|food|restaurant|cafe|café|coffee|bakery|tapas|ramen|sushi|pizza|wine|tasting|market)\b/i],
  ['nightlife', /\b(bar|club|drinks|cocktail|rooftop|night out|fado|jazz|live music|karaoke)\b/i],
  ['culture', /\b(museum|gallery|castle|cathedral|church|palace|monastery|temple|shrine|tour|exhibit|opera|theatre|theater|monument|old town)\b/i],
  ['outdoors', /\b(beach|hike|hiking|trail|park|garden|surf|kayak|bike|cycling|viewpoint|sunset|sunrise|cliff|lookout|picnic|swim)\b/i],
  ['transit', /\b(train|flight|fly|airport|ferry|tram|bus|transfer|drive|rental car|taxi)\b/i],
  ['stay', /\b(hotel|hostel|airbnb|check.?in|check.?out|apartment|riad|ryokan)\b/i],
  ['shopping', /\b(shop|shopping|boutique|souvenir|flea market|vintage|bookstore)\b/i],
]

export function guessCategory(text: string): Category {
  for (const [cat, re] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return cat
  }
  return 'other'
}

const TIME_RE = /\b(?:at|around|by|from)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})\b/i
const LEAD_RE =
  /(?:let'?s|we should(?: totally)?|we could|how about|what about|maybe|check out|don'?t miss|we have to|i vote(?: for)?|thinking|can we|should we)\s+(?:go(?:ing)? (?:to|for)\s+|do(?:ing)?\s+|visit(?:ing)?\s+|try(?:ing)?\s+|hit(?:ting)?\s+|see(?:ing)?\s+|grab(?:bing)?\s+|book(?:ing)?\s+)?(.+)/i
const VERB_RE = /\b(?:visit|try|book|explore|see|catch|grab|hit up)\s+(the\s+)?(.+)/i

function cleanTitle(raw: string): string {
  let t = raw.trim()
  // Cut at sentence boundaries and hedging tails.
  t = t.split(/[.!?;]|,\s+(?:and then|then|maybe|right|no)\b/i)[0]
  // Drop the time expression from the title, we capture it separately.
  t = t.replace(/\b(?:at|around|by|from)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b.*$/i, '')
  t = t.replace(/\b(?:tomorrow|tonight|today|on (?:mon|tues|wednes|thurs|fri|satur|sun)day)\b.*$/i, '')
  t = t.replace(/^(?:go(?:ing)? to|go(?:ing)? for|to|for|the)\s+/i, '')
  t = t.replace(/\s+(?:one day|some day|at some point|if we can|please+|tho|though)\s*$/i, '')
  t = t.replace(/[\s,]+$/g, '').trim()
  if (t.length > 60) t = t.slice(0, 60).replace(/\s+\S*$/, '') + '…'
  return titleCase(t)
}

/**
 * Detects an actionable trip suggestion inside a chat message.
 * Returns undefined when the message is just conversation.
 */
export function parseSuggestion(text: string): Suggestion | undefined {
  if (text.trim().length < 8) return undefined
  const lead = text.match(LEAD_RE) ?? text.match(VERB_RE)
  if (!lead) return undefined
  const rawTitle = lead[lead.length - 1]
  const title = cleanTitle(rawTitle)
  if (title.length < 3) return undefined
  const time = text.match(TIME_RE)?.[1]?.toLowerCase().replace(/\s+/, '')
  return { title, category: guessCategory(text), time }
}

/** Quick-add parser: "Dinner at Ramiro 8pm" -> structured itinerary item. */
export function parseQuickAdd(text: string): { title: string; time?: string; category: Category } {
  const time = text.match(TIME_RE)?.[1]?.toLowerCase().replace(/\s+/, '')
  let title = text
    .replace(/\b(?:at|around|by|from)?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i, '')
    .replace(/\b\d{1,2}:\d{2}\b/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!title) title = text.trim()
  return { title: titleCase(title), time, category: guessCategory(text) }
}

// ---------------------------------------------------------------------------
// Simulated crew chatter

interface CannedReply {
  text: string
  /** Replies with suggestions keep the planning loop alive. */
  suggests?: boolean
}

const REPLIES: CannedReply[] = [
  { text: 'ohh yes, adding that to my mental map immediately' },
  { text: 'ok that actually sounds perfect' },
  { text: "i'm in. someone drag it onto the board before we forget 👀" },
  { text: 'yesss this is why this trip is going to be legendary' },
  { text: 'counterpoint: we do that AND we still make sunset' },
  { text: 'my feet hurt just reading this but ok, i love it' },
  { text: 'wait i read about that place, apparently you have to book ahead' },
  { text: 'can confirm, a friend went last spring and would not shut up about it' },
  { text: "let's try the miradouro da graça for sunset, i heard it's unreal", suggests: true },
  { text: 'how about a pastel de nata crawl through belém one morning', suggests: true },
  { text: "we should book the tram 28 loop early before the crowds", suggests: true },
  { text: 'maybe grab cocktails at the rooftop bar near the cathedral around 9pm', suggests: true },
  { text: "let's do a day trip to sintra, the palace looks fake in the best way", suggests: true },
  { text: 'ok putting it to a vote feels right, this crew never agrees on food' },
  { text: 'strong agree. also can someone check the budget, we are… enthusiastic' },
  { text: 'lol the itinerary is filling up fast, love the ambition' },
]

let replyCursor = Math.floor(Math.random() * REPLIES.length)
export function nextReply(): CannedReply {
  replyCursor = (replyCursor + 1) % REPLIES.length
  return REPLIES[replyCursor]
}

export function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min)
}
