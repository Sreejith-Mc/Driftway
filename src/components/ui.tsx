import React, { useEffect, useRef } from 'react'
import type { Member } from '../types'
import { cx } from '../utils'
import { XIcon } from './Icons'

export function Avatar({ member, size = 30, ring }: { member: Member; size?: number; ring?: boolean }) {
  return (
    <span
      className={cx('avatar', ring && 'avatar-ring')}
      style={{ width: size, height: size, fontSize: size * 0.36, background: member.color }}
      title={member.name}
    >
      {member.initials}
      {member.online && <span className="presence" />}
    </span>
  )
}

export function AvatarStack({ members, size = 28, max = 5 }: { members: Member[]; size?: number; max?: number }) {
  const shown = members.slice(0, max)
  const extra = members.length - shown.length
  return (
    <span className="avatar-stack">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size={size} ring />
      ))}
      {extra > 0 && (
        <span className="avatar avatar-ring avatar-extra" style={{ width: size, height: size, fontSize: size * 0.36 }}>
          +{extra}
        </span>
      )}
    </span>
  )
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Focus the first focusable field for keyboard users.
    const el = ref.current?.querySelector<HTMLElement>('input, select, textarea, button')
    el?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal', wide && 'modal-wide')} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <XIcon size={16} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('progress', className)}>
      <div className="progress-fill" style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
    </div>
  )
}

export function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
    </div>
  )
}
