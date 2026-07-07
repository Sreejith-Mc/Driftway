import React, { useEffect, useRef, useState } from 'react'
import { useActions, usePresence, useStore, useYou } from '../store'
import type { Message } from '../types'
import { parseSuggestion } from '../sim'
import { CATEGORY_META, cx, timeAgo } from '../utils'
import { Avatar } from './ui'
import { PinIcon, PollIcon, SendIcon, SmileIcon, SparkIcon, CheckIcon, XIcon } from './Icons'
import { useUI } from './Modals'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

export function ChatPanel() {
  const { state, dispatch, trip } = useStore()
  const actions = useActions()
  const { openModal } = useUI()
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number>()

  // Broadcast presence + typing to the rest of the crew.
  usePresence(typing)

  const messageCount = trip?.messages.length ?? 0
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messageCount, trip?.typing, trip?.id])

  if (!trip) return <aside className={cx('chat', !state.chatOpen && 'chat-closed')} aria-label="Trip chat" />

  const flagTyping = (value: string) => {
    setDraft(value)
    setTyping(true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => setTyping(false), 2500)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    const suggestion = parseSuggestion(text)
    setDraft('')
    setTyping(false)
    window.clearTimeout(typingTimer.current)
    try {
      await actions.sendMessage({ text, suggestion })
      if (suggestion) dispatch({ type: 'TOAST', text: 'Driftway spotted a plan in that message ✨', kind: 'info' })
    } catch {
      dispatch({ type: 'TOAST', text: 'Message failed to send — try again', kind: 'warn' })
      setDraft(text)
    }
  }

  const typingMember = trip.typing ? trip.members.find((m) => m.id === trip.typing) : null
  const onlineCount = trip.members.filter((m) => m.online).length

  return (
    <aside className={cx('chat', !state.chatOpen && 'chat-closed')} aria-label="Trip chat">
      <header className="chat-head">
        <div>
          <h2>Trip chat</h2>
          <p>
            <span className="live-dot" /> {onlineCount} of {trip.members.length} online
          </p>
        </div>
        <span className="chat-spark" title="Messages with plans get suggestion cards automatically">
          <SparkIcon size={15} /> auto-detect
        </span>
        <button className="icon-btn chat-close" aria-label="Close chat" onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}>
          <XIcon size={16} />
        </button>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        {trip.messages.length === 0 && (
          <p className="chat-empty">No messages yet. Drop the first idea — Driftway turns plans into cards automatically.</p>
        )}
        {trip.messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            prev={trip.messages[i - 1]}
            onAdd={(msg) =>
              openModal({ kind: 'addItem', seed: msg.suggestion ? { ...msg.suggestion, messageId: msg.id } : undefined })
            }
            onPoll={(msg) =>
              openModal({
                kind: 'newPoll',
                seedQuestion: msg.suggestion ? `Should we do “${msg.suggestion.title}”?` : undefined,
                seedOptions: ['Yes, lock it in', 'Pass this time'],
              })
            }
          />
        ))}
        {typingMember && (
          <div className="msg msg-them">
            <Avatar member={typingMember} size={26} />
            <div className="bubble bubble-typing" aria-label={`${typingMember.name} is typing`}>
              <span className="tdot" />
              <span className="tdot" />
              <span className="tdot" />
            </div>
          </div>
        )}
      </div>

      <form className="chat-compose" onSubmit={send}>
        <input
          value={draft}
          onChange={(e) => flagTyping(e.target.value)}
          placeholder='Try: "let’s do a sunset picnic at the park around 7pm"'
          aria-label="Message the group"
        />
        <button className="send-btn" type="submit" aria-label="Send message" disabled={!draft.trim()}>
          <SendIcon size={16} />
        </button>
      </form>
    </aside>
  )
}

function MessageBubble({
  message,
  prev,
  onAdd,
  onPoll,
}: {
  message: Message
  prev?: Message
  onAdd: (m: Message) => void
  onPoll: (m: Message) => void
}) {
  const { trip, dispatch } = useStore()
  const actions = useActions()
  const you = useYou()
  const [picker, setPicker] = useState(false)
  const author = trip?.members.find((m) => m.id === message.authorId)
  if (!author) return null
  const mine = Boolean(author.you)
  const grouped = prev?.authorId === message.authorId && message.ts - prev.ts < 5 * 60_000

  const react = async (emoji: string) => {
    setPicker(false)
    try {
      await actions.toggleReaction({ messageId: message.id, emoji })
    } catch {
      dispatch({ type: 'TOAST', text: 'Could not react — try again', kind: 'warn' })
    }
  }

  const reactionTitle = (users: string[]) =>
    users
      .map((id) => {
        const m = trip?.members.find((x) => x.id === id)
        return m?.you ? 'You' : m?.name.split(' ')[0] ?? 'Someone'
      })
      .join(', ')

  return (
    <div className={cx('msg', mine ? 'msg-you' : 'msg-them', grouped && 'msg-grouped')} onMouseLeave={() => setPicker(false)}>
      {!mine && !grouped ? <Avatar member={author} size={26} /> : !mine ? <span className="avatar-gap" /> : null}
      <div className="msg-col">
        {!grouped && (
          <span className="msg-meta">
            {mine ? 'You' : author.name.split(' ')[0]} · {timeAgo(message.ts)}
          </span>
        )}
        <div className="bubble-wrap">
          <div className="bubble">{message.text}</div>
          <button
            type="button"
            className={cx('react-btn', picker && 'open')}
            aria-label="Add reaction"
            title="Add reaction"
            onClick={() => setPicker((p) => !p)}
          >
            <SmileIcon size={13} />
          </button>
        </div>
        {picker && (
          <div className="react-picker" role="menu" aria-label="Pick a reaction">
            {REACTION_EMOJIS.map((e) => (
              <button key={e} type="button" role="menuitem" onClick={() => react(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
        {message.reactions && message.reactions.length > 0 && (
          <div className="react-chips">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                className={cx('react-chip', you && r.users.includes(you.id) && 'yours')}
                onClick={() => react(r.emoji)}
                title={reactionTitle(r.users)}
              >
                {r.emoji} <em>{r.users.length}</em>
              </button>
            ))}
          </div>
        )}
        {message.suggestion && (
          <div
            className={cx('sugg', message.addedToItinerary && 'sugg-added')}
            draggable={!message.addedToItinerary}
            onDragStart={(e) => {
              e.dataTransfer.setData(
                'application/x-driftway',
                JSON.stringify({ kind: 'suggestion', messageId: message.id, ...message.suggestion }),
              )
              e.dataTransfer.effectAllowed = 'copy'
            }}
            title={message.addedToItinerary ? 'Already on the board' : 'Drag onto a day, or use the buttons'}
          >
            <div className="sugg-top">
              <SparkIcon size={13} className="sugg-spark" />
              <span className="sugg-label">Suggestion spotted</span>
              <span className="sugg-cat">
                {CATEGORY_META[message.suggestion.category].emoji} {CATEGORY_META[message.suggestion.category].label}
              </span>
            </div>
            <p className="sugg-title">
              {message.suggestion.title}
              {message.suggestion.time && <span className="sugg-time"> · {message.suggestion.time}</span>}
            </p>
            {message.addedToItinerary ? (
              <p className="sugg-done">
                <CheckIcon size={12} /> On the itinerary
              </p>
            ) : (
              <div className="sugg-actions">
                <button onClick={() => onAdd(message)}>
                  <PinIcon size={13} /> Add to day
                </button>
                <button onClick={() => onPoll(message)}>
                  <PollIcon size={13} /> Put to a vote
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
