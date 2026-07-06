import React, { useEffect, useRef, useState } from 'react'
import { useStore, useYou } from '../store'
import type { Message } from '../types'
import { nextReply, parseSuggestion, randomDelay } from '../sim'
import { CATEGORY_META, cx, timeAgo, uid } from '../utils'
import { Avatar } from './ui'
import { PinIcon, PollIcon, SendIcon, SparkIcon, CheckIcon, XIcon } from './Icons'
import { useUI } from './Modals'

export function ChatPanel() {
  const { state, dispatch, trip } = useStore()
  const you = useYou()
  const { openModal } = useUI()
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [trip.messages.length, state.typing, trip.id])

  // Clear pending simulated replies when unmounting or switching trips.
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
      dispatch({ type: 'SET_TYPING', memberId: null })
    }
  }, [trip.id, dispatch])

  const scheduleCrewReply = (tripId: string) => {
    const others = trip.members.filter((m) => !m.you && m.online)
    if (others.length === 0) return
    const author = others[Math.floor(Math.random() * others.length)]
    const reply = nextReply()
    const t1 = window.setTimeout(() => {
      dispatch({ type: 'SET_TYPING', memberId: author.id })
      const t2 = window.setTimeout(() => {
        dispatch({ type: 'SET_TYPING', memberId: null })
        dispatch({
          type: 'SEND_MESSAGE',
          tripId,
          message: {
            id: uid('msg'),
            authorId: author.id,
            text: reply.text,
            ts: Date.now(),
            suggestion: parseSuggestion(reply.text),
          },
        })
      }, randomDelay(1400, 2800))
      timers.current.push(t2)
    }, randomDelay(600, 1600))
    timers.current.push(t1)
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    const message: Message = {
      id: uid('msg'),
      authorId: you.id,
      text,
      ts: Date.now(),
      suggestion: parseSuggestion(text),
    }
    dispatch({ type: 'SEND_MESSAGE', tripId: trip.id, message })
    setDraft('')
    if (message.suggestion) {
      dispatch({ type: 'TOAST', text: 'Driftway spotted a plan in that message ✨', kind: 'info' })
    }
    scheduleCrewReply(trip.id)
  }

  const typingMember = state.typing ? trip.members.find((m) => m.id === state.typing) : null
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
          onChange={(e) => setDraft(e.target.value)}
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
  const { trip } = useStore()
  const author = trip.members.find((m) => m.id === message.authorId)
  if (!author) return null
  const mine = Boolean(author.you)
  const grouped = prev?.authorId === message.authorId && message.ts - prev.ts < 5 * 60_000

  return (
    <div className={cx('msg', mine ? 'msg-you' : 'msg-them', grouped && 'msg-grouped')}>
      {!mine && !grouped ? <Avatar member={author} size={26} /> : !mine ? <span className="avatar-gap" /> : null}
      <div className="msg-col">
        {!grouped && (
          <span className="msg-meta">
            {mine ? 'You' : author.name.split(' ')[0]} · {timeAgo(message.ts)}
          </span>
        )}
        <div className="bubble">{message.text}</div>
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
