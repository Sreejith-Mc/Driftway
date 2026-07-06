import type { Trip } from '../types'
import { datesBetween, toISO, uid } from '../utils'

// Seed dates are computed relative to "now" so the countdown and "days until"
// UI always look alive, no matter when the demo is opened.
function inDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toISO(d)
}

const now = Date.now()
const min = 60_000
const hr = 60 * min

export function buildSeedTrips(): Trip[] {
  const you = { id: 'm_you', name: 'You', initials: 'YO', color: '#004741', online: true, you: true }
  const maya = { id: 'm_maya', name: 'Maya Chen', initials: 'MC', color: '#b56a3a', online: true }
  const leo = { id: 'm_leo', name: 'Leo Duarte', initials: 'LD', color: '#a5893b', online: true }
  const ana = { id: 'm_ana', name: 'Ana Petrova', initials: 'AP', color: '#5e5a8f', online: false }
  const kofi = { id: 'm_kofi', name: 'Kofi Mensah', initials: 'KM', color: '#3e7d5e', online: true }

  const lisbonStart = inDays(74)
  const lisbonDates = datesBetween(lisbonStart, inDays(77))

  const lisbon: Trip = {
    id: 'trip_lisbon',
    name: 'Lisbon Golden Week',
    destination: 'Lisbon, Portugal',
    emoji: '🌊',
    start: lisbonDates[0],
    end: lisbonDates[3],
    currency: 'EUR',
    palette: 0,
    members: [you, maya, leo, ana, kofi],
    days: [
      {
        id: 'day_l1',
        date: lisbonDates[0],
        items: [
          { id: uid('it'), title: 'Land at Humberto Delgado Airport', time: '10:40am', category: 'transit', votes: [], addedBy: 'm_you', note: 'Metro red line into town — buy the Viva Viagem card.' },
          { id: uid('it'), title: 'Check In — Alfama Apartment', time: '1:00pm', category: 'stay', votes: ['m_maya'], addedBy: 'm_maya', note: 'Door code in the group notes. Rooftop access!' },
          { id: uid('it'), title: 'First Pastel De Nata Stop', time: '2:30pm', category: 'food', votes: ['m_you', 'm_leo', 'm_kofi'], addedBy: 'm_leo', fromChat: true },
          { id: uid('it'), title: 'Wander Alfama + Miradouro Das Portas Do Sol', time: '4:00pm', category: 'outdoors', votes: ['m_ana'], addedBy: 'm_you' },
        ],
      },
      {
        id: 'day_l2',
        date: lisbonDates[1],
        items: [
          { id: uid('it'), title: 'Tram 28 Loop', time: '9:00am', category: 'transit', votes: ['m_you', 'm_maya'], addedBy: 'm_kofi', fromChat: true, note: 'Board at Martim Moniz before the queue builds.' },
          { id: uid('it'), title: 'São Jorge Castle', time: '11:00am', category: 'culture', votes: ['m_leo'], addedBy: 'm_maya' },
          { id: uid('it'), title: 'Seafood Lunch At Cervejaria Ramiro', time: '1:30pm', category: 'food', votes: ['m_you', 'm_maya', 'm_leo', 'm_kofi'], addedBy: 'm_leo', fromChat: true, note: 'Garlic prawns. Non-negotiable.' },
          { id: uid('it'), title: 'Fado Night In Bairro Alto', time: '9:30pm', category: 'nightlife', votes: ['m_ana', 'm_maya'], addedBy: 'm_ana' },
        ],
      },
      {
        id: 'day_l3',
        date: lisbonDates[2],
        items: [
          { id: uid('it'), title: 'Day Trip — Sintra & Pena Palace', time: '8:30am', category: 'culture', votes: ['m_you', 'm_ana', 'm_kofi'], addedBy: 'm_you', note: 'Train from Rossio, ~40 min. Buy palace tickets online.' },
          { id: uid('it'), title: 'Cabo Da Roca Lookout', time: '4:30pm', category: 'outdoors', votes: ['m_kofi'], addedBy: 'm_kofi', note: 'Westernmost point of mainland Europe.' },
        ],
      },
      {
        id: 'day_l4',
        date: lisbonDates[3],
        items: [
          { id: uid('it'), title: 'Belém Morning — Monastery + Tower', time: '9:30am', category: 'culture', votes: ['m_maya'], addedBy: 'm_maya' },
          { id: uid('it'), title: 'LX Factory Browse & Brunch', time: '12:00pm', category: 'shopping', votes: ['m_you', 'm_leo'], addedBy: 'm_leo', fromChat: true },
          { id: uid('it'), title: 'Flight Home', time: '7:15pm', category: 'transit', votes: [], addedBy: 'm_you' },
        ],
      },
    ],
    messages: [
      { id: uid('msg'), authorId: 'm_maya', text: 'ok crew, Lisbon is officially 10 weeks out. drop everything you want to do in here and drag the good ones onto the board 🗺️', ts: now - 26 * hr },
      { id: uid('msg'), authorId: 'm_leo', text: "let's try cervejaria ramiro for lunch at 1:30pm, the garlic prawns are supposedly life-changing", ts: now - 25 * hr, suggestion: { title: 'Cervejaria Ramiro', category: 'food', time: '1:30pm' }, addedToItinerary: true },
      { id: uid('msg'), authorId: 'm_kofi', text: 'we should book the tram 28 loop early before the crowds', ts: now - 24 * hr, suggestion: { title: 'Tram 28 Loop', category: 'transit' }, addedToItinerary: true },
      { id: uid('msg'), authorId: 'm_ana', text: 'i will be landing a day late but SAVE ME PRAWNS', ts: now - 22 * hr },
      { id: uid('msg'), authorId: 'm_you', text: 'poll is up for the sunset spot on friday — vote before leo picks for all of us again', ts: now - 4 * hr },
      { id: uid('msg'), authorId: 'm_leo', text: 'one time. that happened ONE time.', ts: now - 3.8 * hr },
      { id: uid('msg'), authorId: 'm_maya', text: "how about a pastel de nata crawl through belém on the last morning", ts: now - 40 * min, suggestion: { title: 'Pastel De Nata Crawl Through Belém', category: 'food' } },
    ],
    polls: [
      {
        id: 'poll_sunset',
        question: 'Sunset spot for Friday night?',
        createdBy: 'm_you',
        status: 'open',
        ts: now - 4 * hr,
        options: [
          { id: 'opt_a', label: 'Miradouro da Graça', votes: ['m_maya', 'm_kofi'] },
          { id: 'opt_b', label: 'Park rooftop bar', votes: ['m_leo'] },
          { id: 'opt_c', label: 'Ponte 25 de Abril viewpoint', votes: [] },
        ],
      },
      {
        id: 'poll_dinner',
        question: 'Big group dinner — which night?',
        createdBy: 'm_maya',
        status: 'closed',
        ts: now - 20 * hr,
        resolvedTo: 'opt_y',
        options: [
          { id: 'opt_x', label: 'Thursday', votes: ['m_leo'] },
          { id: 'opt_y', label: 'Friday', votes: ['m_you', 'm_maya', 'm_kofi', 'm_ana'] },
        ],
      },
    ],
    expenses: [
      { id: uid('exp'), title: 'Alfama apartment (4 nights)', amount: 920, paidBy: 'm_maya', splitWith: ['m_you', 'm_maya', 'm_leo', 'm_ana', 'm_kofi'], category: 'stay', ts: now - 21 * 24 * hr },
      { id: uid('exp'), title: 'Sintra palace tickets', amount: 70, paidBy: 'm_you', splitWith: ['m_you', 'm_ana', 'm_kofi'], category: 'culture', ts: now - 3 * 24 * hr },
      { id: uid('exp'), title: 'Fado night reservation deposit', amount: 60, paidBy: 'm_ana', splitWith: ['m_you', 'm_maya', 'm_leo', 'm_ana', 'm_kofi'], category: 'nightlife', ts: now - 2 * 24 * hr },
      { id: uid('exp'), title: 'Airport transfer van', amount: 45, paidBy: 'm_kofi', splitWith: ['m_you', 'm_maya', 'm_leo', 'm_kofi'], category: 'transit', ts: now - 24 * hr },
    ],
    packing: [
      { id: uid('pk'), label: 'Comfortable walking shoes (the hills are real)', done: true },
      { id: uid('pk'), label: 'EU plug adapters', done: true, assignee: 'm_kofi' },
      { id: uid('pk'), label: 'Portable speaker for the rooftop', done: false, assignee: 'm_leo' },
      { id: uid('pk'), label: 'Sunscreen + hat', done: false },
      { id: uid('pk'), label: 'Print Sintra tickets', done: false, assignee: 'm_you' },
      { id: uid('pk'), label: 'Deck of cards', done: false, assignee: 'm_maya' },
    ],
  }

  const kyotoStart = inDays(135)
  const kyotoDates = datesBetween(kyotoStart, inDays(139))
  const kyoto: Trip = {
    id: 'trip_kyoto',
    name: 'Kyoto in Colour',
    destination: 'Kyoto, Japan',
    emoji: '🍁',
    start: kyotoDates[0],
    end: kyotoDates[4],
    currency: 'JPY',
    palette: 2,
    members: [you, maya, leo],
    days: kyotoDates.map((date, i) => ({
      id: `day_k${i + 1}`,
      date,
      items:
        i === 0
          ? [
              { id: uid('it'), title: 'Shinkansen From Tokyo', time: '9:12am', category: 'transit' as const, votes: [], addedBy: 'm_you' },
              { id: uid('it'), title: 'Check In — Machiya Near Gion', time: '1:00pm', category: 'stay' as const, votes: ['m_maya'], addedBy: 'm_maya' },
            ]
          : i === 1
            ? [{ id: uid('it'), title: 'Fushimi Inari At Dawn', time: '6:00am', category: 'outdoors' as const, votes: ['m_you', 'm_leo'], addedBy: 'm_leo', fromChat: true }]
            : [],
    })),
    messages: [
      { id: uid('msg'), authorId: 'm_maya', text: 'november kyoto!!! the maple leaves are supposed to peak that exact week', ts: now - 50 * hr },
      { id: uid('msg'), authorId: 'm_leo', text: "let's do fushimi inari at dawn before the crowds, 6am club rise up", ts: now - 49 * hr, suggestion: { title: 'Fushimi Inari At Dawn', category: 'outdoors' }, addedToItinerary: true },
    ],
    polls: [],
    expenses: [
      { id: uid('exp'), title: 'Machiya house (4 nights)', amount: 96000, paidBy: 'm_you', splitWith: ['m_you', 'm_maya', 'm_leo'], category: 'stay', ts: now - 10 * 24 * hr },
    ],
    packing: [
      { id: uid('pk'), label: 'JR Pass vouchers', done: false, assignee: 'm_you' },
      { id: uid('pk'), label: 'Layers — mornings are cold', done: false },
    ],
  }

  return [lisbon, kyoto]
}
