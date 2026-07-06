import { useStore } from '../store'
import type { Category } from '../types'
import { CATEGORY_META, cx, money, timeAgo } from '../utils'
import { Avatar, EmptyState } from './ui'
import { CoinIcon, PlusIcon, TrashIcon } from './Icons'
import { useUI } from './Modals'

export function Budget() {
  const { trip, dispatch } = useStore()
  const { openModal } = useUI()

  const total = trip.expenses.reduce((n, e) => n + e.amount, 0)

  // Net balance per member: what they paid minus their share of each expense.
  const balances = new Map<string, number>(trip.members.map((m) => [m.id, 0]))
  for (const e of trip.expenses) {
    balances.set(e.paidBy, (balances.get(e.paidBy) ?? 0) + e.amount)
    const share = e.splitWith.length ? e.amount / e.splitWith.length : 0
    for (const id of e.splitWith) {
      balances.set(id, (balances.get(id) ?? 0) - share)
    }
  }

  const byCategory = new Map<Category, number>()
  for (const e of trip.expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount)
  }
  const catEntries = [...byCategory.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className="budget">
      <div className="view-head">
        <div>
          <h2 className="view-title">Shared wallet, zero awkwardness</h2>
          <p className="view-sub">Log it once — Driftway keeps every balance square.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal({ kind: 'newExpense' })}>
          <PlusIcon size={14} /> Log expense
        </button>
      </div>

      <div className="budget-cols">
        <section className="card budget-summary">
          <p className="big-money">{money(total, trip.currency)}</p>
          <p className="card-sub">
            committed so far · {money(trip.members.length ? total / trip.members.length : 0, trip.currency)} per person
          </p>
          {catEntries.length > 0 && (
            <>
              <div className="cat-bar" role="img" aria-label="Spend by category">
                {catEntries.map(([cat, amt]) => (
                  <span
                    key={cat}
                    className={`cat-seg seg-${cat}`}
                    style={{ width: `${(amt / total) * 100}%` }}
                    title={`${CATEGORY_META[cat].label}: ${money(amt, trip.currency)}`}
                  />
                ))}
              </div>
              <ul className="cat-legend">
                {catEntries.map(([cat, amt]) => (
                  <li key={cat}>
                    <span className={`dot seg-${cat}`} />
                    {CATEGORY_META[cat].label}
                    <em>{money(amt, trip.currency)}</em>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card">
          <header className="card-head">
            <h3>Who's square</h3>
          </header>
          <ul className="balance-list">
            {trip.members.map((m) => {
              const bal = balances.get(m.id) ?? 0
              const settled = Math.abs(bal) < 0.01
              return (
                <li key={m.id}>
                  <Avatar member={m} size={26} />
                  <span className="balance-name">{m.you ? 'You' : m.name}</span>
                  <span className={cx('balance-amt', settled ? 'even' : bal > 0 ? 'up' : 'down')}>
                    {settled ? 'settled' : `${bal > 0 ? 'is owed' : 'owes'} ${money(Math.abs(bal), trip.currency)}`}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="card">
        <header className="card-head">
          <h3>Ledger</h3>
        </header>
        {trip.expenses.length === 0 ? (
          <EmptyState icon={<CoinIcon size={26} />} title="Nothing logged yet" hint="The first round is on someone." />
        ) : (
          <ul className="expense-list">
            {trip.expenses.map((e) => {
              const payer = trip.members.find((m) => m.id === e.paidBy)
              return (
                <li key={e.id}>
                  <span className="expense-cat">{CATEGORY_META[e.category].emoji}</span>
                  <div className="expense-body">
                    <span className="expense-title">{e.title}</span>
                    <span className="expense-meta">
                      {payer?.you ? 'you' : payer?.name.split(' ')[0]} paid · split {e.splitWith.length} way{e.splitWith.length === 1 ? '' : 's'} · {timeAgo(e.ts)}
                    </span>
                  </div>
                  <span className="expense-amt">{money(e.amount, trip.currency)}</span>
                  <button
                    className="icon-btn icon-btn-quiet"
                    aria-label={`Delete ${e.title}`}
                    onClick={() => dispatch({ type: 'DELETE_EXPENSE', tripId: trip.id, expenseId: e.id })}
                  >
                    <TrashIcon size={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
