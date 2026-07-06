import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { CompassIcon, SparkIcon } from './Icons'
import { cx } from '../utils'

// Email + password, backed by Convex Auth. The same screen toggles between
// creating an account and signing in.
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
