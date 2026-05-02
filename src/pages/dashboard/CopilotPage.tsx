import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import apiClient from '../../api/client'
import {
  HiOutlinePaperAirplane,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineLightningBolt,
  HiOutlineExclamation,
  HiOutlineCheck,
  HiOutlineShieldCheck,
} from 'react-icons/hi'
import { RiRobot2Line } from 'react-icons/ri'

const Ico = ({ i: I, size = 16, style }: { i: any; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...style }}>
    <I size={size} />
  </span>
)

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  action?: Action | null
}

interface Action {
  type: 'block_slots' | 'unblock_slots' | 'update_booking_status' | 'cancel_booking'
  description: string
  params: Record<string, any>
}

const SUGGESTIONS = [
  "Who are today's patients and their status?",
  "Which patients haven't completed intake?",
  "Show me all high-risk patients",
  "Block all slots this Saturday",
  "Mark all today's confirmed bookings as completed",
  "Which patients have crisis flags?",
  "Block tomorrow's slots — day off",
  "Show me this week's no-shows",
]

const ACTION_LABELS: Record<string, string> = {
  block_slots:           '🔒 Block slots',
  unblock_slots:         '🔓 Unblock slots',
  update_booking_status: '📋 Update booking status',
  cancel_booking:        '❌ Cancel booking',
}

function MessageBubble({ msg, colors, onConfirmAction }: {
  msg: Message
  colors: any
  onConfirmAction: (action: Action) => void
}) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, border: `1px solid ${colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Ico i={RiRobot2Line} size={16} style={{ color: colors.primary }} />
        </div>
      )}
      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          backgroundColor: isUser ? colors.primary : colors.bgSurface,
          border: isUser ? 'none' : `1px solid ${colors.border}`,
          color: isUser ? '#fff' : colors.text,
          fontSize: 13,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 6, textAlign: isUser ? 'right' : 'left' }}>
            {msg.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Action chip — shown below the message bubble */}
        {!isUser && msg.action && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: colors.primaryBg, border: `1px solid ${colors.primaryBorder}`, borderRadius: 10, padding: '8px 14px' }}>
              <Ico i={HiOutlineShieldCheck} size={14} style={{ color: colors.primary }} />
              <span style={{ fontSize: 12, color: colors.primary, fontWeight: 500 }}>{ACTION_LABELS[msg.action.type]}</span>
            </div>
            <button
              onClick={() => onConfirmAction(msg.action!)}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Ico i={HiOutlineCheck} size={13} />
              Review & confirm
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.primary, marginTop: 2 }}>
          R
        </div>
      )}
    </div>
  )
}

function TypingIndicator({ colors }: { colors: any }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, border: `1px solid ${colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ico i={RiRobot2Line} size={16} style={{ color: colors.primary }} />
      </div>
      <div style={{ padding: '14px 18px', borderRadius: '16px 16px 16px 4px', backgroundColor: colors.bgSurface, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, opacity: 0.6, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

function ActionConfirmModal({ action, practiceData, colors, onConfirm, onCancel, executing }: {
  action: Action
  practiceData: any
  colors: any
  onConfirm: () => void
  onCancel: () => void
  executing: boolean
}) {
  // Build a human-readable preview of what will be affected
  const getAffectedItems = () => {
    const bookings = practiceData?.bookings ?? []
    const today = new Date().toISOString().split('T')[0]

    if (action.type === 'update_booking_status' && action.params.date) {
      const date = action.params.date === 'today' ? today : action.params.date
      const affected = bookings.filter((b: any) => b.slot_date === date)
      return affected.map((b: any) => `${b.doctor_name} — ${b.slot_start_time?.slice(0, 5)} (currently: ${b.status})`)
    }

    if (action.type === 'update_booking_status' && action.params.booking_id) {
      const b = bookings.find((b: any) => b.id === action.params.booking_id)
      return b ? [`${b.doctor_name} — ${b.slot_date} ${b.slot_start_time?.slice(0, 5)}`] : []
    }

    if (action.type === 'cancel_booking' && action.params.booking_id) {
      const b = bookings.find((b: any) => b.id === action.params.booking_id)
      return b ? [`${b.doctor_name} — ${b.slot_date} ${b.slot_start_time?.slice(0, 5)}`] : []
    }

    if (action.type === 'block_slots' && action.params.date) {
      return [`All available slots on ${action.params.date}`]
    }

    if (action.type === 'block_slots' && action.params.day_of_week) {
      const weeks = action.params.weeks_ahead ?? 4
      return [`All available ${action.params.day_of_week} slots for the next ${weeks} weeks`]
    }

    if (action.type === 'unblock_slots' && action.params.date) {
      return [`All blocked slots on ${action.params.date}`]
    }

    return ['See description above']
  }

  const affected = getAffectedItems()
  const isDestructive = action.type === 'cancel_booking'

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${isDestructive ? 'rgba(220,38,38,0.3)' : colors.primaryBorder}`, padding: 28, width: 460, maxWidth: '90vw' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: isDestructive ? 'rgba(220,38,38,0.08)' : colors.primaryBg, border: `1px solid ${isDestructive ? 'rgba(220,38,38,0.2)' : colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ico i={isDestructive ? HiOutlineExclamation : HiOutlineShieldCheck} size={20} style={{ color: isDestructive ? '#DC2626' : colors.primary }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 4 }}>
              Confirm action
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
              {action.description}
            </div>
          </div>
        </div>

        {/* What will be affected */}
        <div style={{ backgroundColor: colors.bgElevated, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>
            What will be affected
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
            {affected.length === 0 ? (
              <div style={{ fontSize: 13, color: colors.textFaint }}>No matching records found</div>
            ) : (
                affected.map((item: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isDestructive ? '#DC2626' : colors.primary, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: colors.text }}>{item}</span>
                </div>
              ))
            )}
          </div>
          {affected.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textMuted }}>
              {affected.length} record{affected.length !== 1 ? 's' : ''} will be affected
            </div>
          )}
        </div>

        {/* Action params summary */}
        <div style={{ backgroundColor: colors.bgBase, borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: colors.textMuted, lineHeight: 1.8 }}>
          {Object.entries(action.params).map(([k, v]) => (
            <div key={k}><span style={{ color: colors.textFaint }}>{k}:</span> {String(v)}</div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={executing}
            style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={executing || affected.length === 0}
            style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: isDestructive ? '#DC2626' : colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: affected.length === 0 || executing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: executing || affected.length === 0 ? 0.7 : 1 }}
          >
            <Ico i={HiOutlineCheck} size={15} />
            {executing ? 'Executing...' : `Confirm — ${affected.length} record${affected.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CopilotPage() {
  const { colors } = useTheme()

  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hi! I'm your Phila practice assistant. 👋\n\nI can read your practice data and take actions on your behalf. Try asking me to:\n\n• Check today's schedule and patient statuses\n• Block slots for a specific date or day\n• Mark bookings as completed or arrived\n• Find patients with pending intake or crisis flags\n\nWhat would you like to do?`,
    timestamp: new Date(),
    action: null,
  }])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [practiceData, setPracticeData] = useState<any>(null)
  const [pendingAction, setPendingAction] = useState<Action | null>(null)
  const [executing, setExecuting]       = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadPracticeData() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const loadPracticeData = async () => {
    try {
      const [bookingsRes, doctorRes] = await Promise.all([
        apiClient.get('/bookings/practice'),
        apiClient.get('/doctors/today'),
      ])
      setPracticeData({
        doctor: doctorRes.data.doctor ?? doctorRes.data,
        bookings: bookingsRes.data,
      })
    } catch {}
  }

  const buildContext = () => {
    if (!practiceData) return 'No practice data available.'
    const { doctor, bookings } = practiceData
    const today = new Date().toISOString().split('T')[0]
    const todayBookings = bookings.filter((b: any) => b.slot_date === today)

    return `
PRACTICE: ${doctor.practice_name}
SPECIALTY: ${doctor.specialty}
CITY: ${doctor.city}
TODAY: ${today}
CURRENT DATE/TIME: ${new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

TODAY'S SCHEDULE (${todayBookings.length} bookings):
${todayBookings.map((b: any) => `- ${b.slot_start_time?.slice(0, 5)} | ${b.doctor_name} | booking_id: ${b.id} | Status: ${b.status} | Intake: ${b.intake_status} | Risk: ${parseInt(b.risk_score) < 30 ? 'Low' : parseInt(b.risk_score) < 65 ? 'Medium' : 'High'}${b.crisis_flag ? ' | ⚠️ CRISIS' : ''}${b.is_walk_in ? ' | Walk-in' : ''}`).join('\n') || 'No bookings today'}

ALL BOOKINGS SUMMARY (${bookings.length} total):
- Confirmed: ${bookings.filter((b: any) => b.status === 'confirmed').length}
- Completed: ${bookings.filter((b: any) => b.status === 'completed').length}
- No-shows: ${bookings.filter((b: any) => b.status === 'no_show').length}
- Cancelled: ${bookings.filter((b: any) => b.status === 'cancelled').length}
- Walk-ins: ${bookings.filter((b: any) => b.is_walk_in).length}
- Crisis flags: ${bookings.filter((b: any) => b.crisis_flag).length}
- Intake complete: ${bookings.filter((b: any) => b.intake_status === 'complete').length}
- Intake pending: ${bookings.filter((b: any) => b.intake_status === 'pending').length}

RECENT BOOKINGS (last 10, includes booking_ids for actions):
${bookings.slice(0, 10).map((b: any) => `- ${b.slot_date} ${b.slot_start_time?.slice(0, 5)} | ${b.doctor_name} | booking_id: ${b.id} | ${b.status}`).join('\n')}

PATIENTS WITH CRISIS FLAGS:
${bookings.filter((b: any) => b.crisis_flag).map((b: any) => `- ${b.doctor_name} | ${b.slot_date} | booking_id: ${b.id}`).join('\n') || 'None'}

PATIENTS WITH PENDING INTAKE:
${bookings.filter((b: any) => b.intake_status === 'pending' && b.status === 'confirmed').map((b: any) => `- ${b.doctor_name} | ${b.slot_date} ${b.slot_start_time?.slice(0, 5)} | booking_id: ${b.id}`).join('\n') || 'None'}
`.trim()
  }

  const sendMessage = async (text?: string) => {
    const userText = text ?? input.trim()
    if (!userText || loading) return

    const userMsg: Message = { role: 'user', content: userText, timestamp: new Date(), action: null }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await apiClient.post('/copilot/chat', {
        messages: [...history, { role: 'user', content: userText }],
        context: buildContext(),
      })

      const { reply, action } = response.data
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        action: action ?? null,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        timestamp: new Date(),
        action: null,
      }])
    } finally {
      setLoading(false)
    }
  }

  const executeAction = async () => {
    if (!pendingAction) return
    setExecuting(true)

    try {
      const { type, params } = pendingAction
      const today = new Date().toISOString().split('T')[0]

      if (type === 'block_slots') {
        if (params.date) {
          await apiClient.post(`/slots/block-range`, {
            start_date: params.date,
            end_date: params.date,
            reason: params.reason ?? 'Blocked by AI co-pilot',
          })
        } else if (params.day_of_week) {
          const weeksAhead = params.weeks_ahead ?? 4
          const dayMap: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
          const targetDay = dayMap[params.day_of_week]
          const dates: string[] = []

          for (let w = 0; w < weeksAhead; w++) {
            const d = new Date()
            d.setDate(d.getDate() + ((targetDay - d.getDay() + 7) % 7) + w * 7)
            dates.push(d.toISOString().split('T')[0])
          }

          for (const date of dates) {
            await apiClient.post(`/slots/block-range`, {
              start_date: date,
              end_date: date,
              reason: params.reason ?? 'Blocked by AI co-pilot',
            })
          }
        }
      }

      else if (type === 'unblock_slots') {
        await apiClient.post(`/slots/unblock-range`, {
          start_date: params.date,
          end_date: params.date,
        })
      }

      else if (type === 'update_booking_status') {
        if (params.booking_id) {
          await apiClient.patch(`/bookings/${params.booking_id}/status`, { status: params.status })
        } else if (params.date) {
          const date = params.date === 'today' ? today : params.date
          const toUpdate = (practiceData?.bookings ?? []).filter((b: any) => b.slot_date === date)
          for (const b of toUpdate) {
            await apiClient.patch(`/bookings/${b.id}/status`, { status: params.status })
          }
        }
      }

      else if (type === 'cancel_booking') {
        await apiClient.delete(`/bookings/${params.booking_id}`)
      }

      // Success message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Done! ${pendingAction.description} — action completed successfully.`,
        timestamp: new Date(),
        action: null,
      }])

      setPendingAction(null)
      await loadPracticeData()

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Something went wrong while executing the action. Please try again or do it manually from the dashboard.`,
        timestamp: new Date(),
        action: null,
      }])
      setPendingAction(null)
    } finally {
      setExecuting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you with your practice?',
      timestamp: new Date(),
      action: null,
    }])
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: colors.bgBase }}>

      {/* ── MAIN CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 22, backgroundColor: colors.primary, borderRadius: 2 }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>AI Co-pilot</h1>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {practiceData
                ? `${practiceData.doctor?.practice_name} · ${practiceData.bookings?.length} bookings · read + write access`
                : 'Loading practice data...'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={loadPracticeData} title="Refresh data" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico i={HiOutlineRefresh} size={15} />
            </button>
            <button onClick={clearChat} title="Clear chat" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico i={HiOutlineX} size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', backgroundColor: colors.bgBase }}>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              colors={colors}
              onConfirmAction={action => setPendingAction(action)}
            />
          ))}
          {loading && <TypingIndicator colors={colors} />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 32px', borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or give an instruction... (Enter to send)"
              rows={1}
              style={{ flex: 1, padding: '12px 16px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 12, color: colors.text, fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              style={{ width: 44, height: 44, borderRadius: 12, border: 'none', backgroundColor: !input.trim() || loading ? colors.bgElevated : colors.primary, color: !input.trim() || loading ? colors.textFaint : '#fff', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Ico i={HiOutlinePaperAirplane} size={18} />
            </button>
          </div>
          <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 8, textAlign: 'center' }}>
            Actions require confirmation before executing · Always verify critical changes
          </div>
        </div>
      </div>

      {/* ── SUGGESTIONS PANEL ── */}
      <div style={{ width: 260, borderLeft: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ico i={HiOutlineLightningBolt} size={15} style={{ color: colors.primary }} />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>Quick actions</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => void sendMessage(s)}
              disabled={loading}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', lineHeight: 1.5, marginBottom: 6, transition: 'all 0.15s', opacity: loading ? 0.5 : 1 }}
              onMouseEnter={e => { if (!loading) { (e.target as HTMLElement).style.backgroundColor = colors.bgElevated; (e.target as HTMLElement).style.color = colors.text; (e.target as HTMLElement).style.borderColor = colors.primaryBorder } }}
              onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; (e.target as HTMLElement).style.color = colors.textMuted; (e.target as HTMLElement).style.borderColor = colors.border }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Practice data summary */}
        {practiceData && (
          <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>Live data</div>
            {[
              { label: 'Total bookings', value: practiceData.bookings?.length ?? 0 },
              { label: 'Today', value: practiceData.bookings?.filter((b: any) => b.slot_date === new Date().toISOString().split('T')[0]).length ?? 0 },
              { label: 'Crisis flags', value: practiceData.bookings?.filter((b: any) => b.crisis_flag).length ?? 0 },
              { label: 'Pending intake', value: practiceData.bookings?.filter((b: any) => b.intake_status === 'pending' && b.status === 'confirmed').length ?? 0 },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ACTION CONFIRM MODAL ── */}
      {pendingAction && practiceData && (
        <ActionConfirmModal
          action={pendingAction}
          practiceData={practiceData}
          colors={colors}
          onConfirm={executeAction}
          onCancel={() => setPendingAction(null)}
          executing={executing}
        />
      )}
    </div>
  )
}