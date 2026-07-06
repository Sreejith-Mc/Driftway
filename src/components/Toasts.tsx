import { useEffect } from 'react'
import { useStore } from '../store'
import { CheckIcon, SparkIcon } from './Icons'

export function Toasts() {
  const { state, dispatch } = useStore()

  useEffect(() => {
    if (state.toasts.length === 0) return
    const oldest = state.toasts[0]
    const t = setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id: oldest.id }), 3200)
    return () => clearTimeout(t)
  }, [state.toasts, dispatch])

  return (
    <div className="toasts" aria-live="polite">
      {state.toasts.map((t) => (
        <button key={t.id} className={`toast toast-${t.kind}`} onClick={() => dispatch({ type: 'DISMISS_TOAST', id: t.id })}>
          {t.kind === 'ok' ? <CheckIcon size={14} /> : <SparkIcon size={14} />}
          <span>{t.text}</span>
        </button>
      ))}
    </div>
  )
}
