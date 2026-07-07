import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { CompassIcon, SparkIcon } from './Icons'
import { cx } from '../utils'

// Google's multi-color "G" mark.
function GoogleG() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

// Email + password, and Google OAuth, backed by Convex Auth. The same screen
// toggles between creating an account and signing in.
export function AuthScreen() {
  const { signIn } = useAuthActions()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const joinCode = new URLSearchParams(window.location.search).get('join')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const form = new FormData()
      form.set('email', email.trim())
      form.set('password', password)
      form.set('flow', mode)
      if (mode === 'signUp') form.set('name', name.trim() || email.trim().split('@')[0])
      await signIn('password', form)
      // On success the <Authenticated> boundary swaps this screen out.
    } catch (err) {
      const msg = String((err as Error)?.message ?? err)
      if (/InvalidAccountId|InvalidSecret|Invalid password/i.test(msg)) {
        setError(mode === 'signIn' ? 'That email or password is incorrect.' : 'Could not create the account — try a different email.')
      } else if (/8 characters|password/i.test(msg)) {
        setError('Password must be at least 8 characters.')
      } else if (/already/i.test(msg)) {
        setError('An account with that email already exists — sign in instead.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth-brandside cover-1">
        <div className="auth-brand">
          <span className="brand-mark">
            <CompassIcon size={22} />
          </span>
          <span className="brand-name">Driftway</span>
        </div>
        <div className="auth-pitch">
          <h1>Group chats become itineraries.</h1>
          <p>Plan the whole trip together — chat, vote, split costs, and watch it all sync live with your crew.</p>
        </div>
        <ul className="auth-points">
          <li><SparkIcon size={15} /> Messages turn into draggable plan cards</li>
          <li><SparkIcon size={15} /> One-tap polls settle the arguments</li>
          <li><SparkIcon size={15} /> Shared budget keeps everyone square</li>
        </ul>
      </aside>

      <main className="auth-formside">
        <form className="auth-card" onSubmit={submit}>
          <h2>{mode === 'signUp' ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-sub">
            {joinCode
              ? 'Sign in to join the trip you were invited to.'
              : mode === 'signUp'
                ? 'Start planning in under a minute.'
                : 'Sign in to get back to your trips.'}
          </p>

          <button
            type="button"
            className="btn"
            style={{ width: '100%', justifyContent: 'center', padding: 11, fontSize: 14 }}
            onClick={() => void signIn('google')}
            disabled={busy}
          >
            <GoogleG /> Continue with Google
          </button>
          <div
            aria-hidden="true"
            style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-faint)', fontSize: 12, margin: '2px 0' }}
          >
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            or
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          {mode === 'signUp' && (
            <label className="field">
              <span className="field-label">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya Chen" autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signUp' ? 'At least 8 characters' : 'Your password'}
              autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
              required
              minLength={8}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className={cx('btn btn-primary auth-submit')} disabled={busy}>
            {busy ? 'One moment…' : mode === 'signUp' ? 'Create account' : 'Sign in'}
          </button>

          <p className="auth-toggle">
            {mode === 'signUp' ? 'Already have an account?' : 'New to Driftway?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signUp' ? 'signIn' : 'signUp')
                setError(null)
              }}
            >
              {mode === 'signUp' ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </form>
      </main>
    </div>
  )
}
