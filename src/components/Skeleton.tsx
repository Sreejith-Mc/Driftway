import { CompassIcon } from './Icons'

// Placeholder blocks shown while trip data streams in. They mirror the real
// layout so the shell doesn't jump when content lands.

/** The inner content of a view — mirrors the Overview (hero, stats, cards). */
export function ViewSkeleton() {
  return (
    <div className="overview" aria-hidden="true">
      <div className="sk sk-hero" />
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="sk sk-stat" />
        ))}
      </div>
      <div className="overview-cols">
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
    </div>
  )
}

/** The full app frame in a loading state — sidebar, top bar and a view. */
export function AppSkeleton() {
  return (
    <div className="app chat-hidden sk-frame" aria-busy="true" aria-label="Loading Driftway">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <CompassIcon size={20} />
          </span>
          <span className="brand-name">Driftway</span>
        </div>
        <p className="brand-tag">group chats → itineraries</p>
        <div className="side-section">
          <div className="side-heading">
            <span>Trips</span>
          </div>
          <div className="trip-list">
            {[0, 1, 2].map((i) => (
              <div className="trip-chip" key={i}>
                <span className="sk sk-emoji" />
                <span className="sk-lines">
                  <span className="sk sk-line" style={{ width: '70%' }} />
                  <span className="sk sk-line sk-line-sm" style={{ width: '45%' }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-main">
            <div className="topbar-title">
              <span className="sk sk-emoji-lg" />
              <span className="sk-lines">
                <span className="sk sk-line" style={{ width: 190, height: 18 }} />
                <span className="sk sk-line sk-line-sm" style={{ width: 130 }} />
              </span>
            </div>
          </div>
          <div className="tabs">
            {[60, 66, 48, 58, 64].map((w, i) => (
              <span key={i} className="sk sk-tab" style={{ width: w }} />
            ))}
          </div>
        </header>
        <section className="view">
          <ViewSkeleton />
        </section>
      </main>
    </div>
  )
}
