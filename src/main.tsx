import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import App from './App'
import './styles.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined

function Root() {
  if (!convexUrl) {
    // Friendly guidance if the app is opened before Convex is connected.
    return (
      <div className="boot-error">
        <h1>Driftway needs its backend</h1>
        <p>
          Set <code>VITE_CONVEX_URL</code> in a <code>.env.local</code> file (run <code>npx convex dev</code> to
          generate it), then reload. See the README for the full setup.
        </p>
      </div>
    )
  }
  const convex = new ConvexReactClient(convexUrl)
  return (
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
