import React, { useState, useRef, useEffect } from 'react'
import { colors } from '../../theme/colors'
import apiClient from '../../api/client'
import {
  HiOutlinePaperAirplane,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineLightningBolt,
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
}

const SUGGESTIONS = [
  "Who are today's patients and what is their status?",
  "Which patients haven't completed their intake?",
  "Show me all high-risk patients",
  "How many no-shows did we have this week?",
  "Which patients have crisis flags?",
  "What is our intake completion rate?",
  "Show me all walk-in patients",
  "Which bookings are confirmed for tomorrow?",
]

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryBg, border: `1px solid ${colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Ico i={RiRobot2Line} size={16} style={{ color: colors.primary }} />
        </div>
      )}
      <div style={{
        maxWidth: '70%',
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
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: colors.primary, marginTop: 2 }}>
          R
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
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

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your Phila practice assistant. 👋\n\nI have access to your bookings, patient data, intake briefs, and analytics. Ask me anything about your practice — I can help you:\n\n• Check today's schedule and patient statuses\n• Find patients with pending intake or crisis flags\n• Summarise your no-show rates and trends\n• Answer questions about specific patients\n• Help you manage your practice data\n\nWhat would you like to know?`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [practiceData, setPracticeData] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { loadPracticeData() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
DATE: ${new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

TODAY'S SCHEDULE (${todayBookings.length} bookings):
${todayBookings.map((b: any) => `- ${b.slot_start_time?.slice(0, 5)} | ${b.doctor_name} | Status: ${b.status} | Intake: ${b.intake_status} | Risk: ${parseInt(b.risk_score) < 30 ? 'Low' : parseInt(b.risk_score) < 65 ? 'Medium' : 'High'}${b.crisis_flag ? ' | ⚠️ CRISIS FLAG' : ''}${b.is_walk_in ? ' | Walk-in' : ''}`).join('\n') || 'No bookings today'}

ALL BOOKINGS SUMMARY (${bookings.length} total):
- Confirmed: ${bookings.filter((b: any) => b.status === 'confirmed').length}
- Completed: ${bookings.filter((b: any) => b.status === 'completed').length}
- No-shows: ${bookings.filter((b: any) => b.status === 'no_show').length}
- Cancelled: ${bookings.filter((b: any) => b.status === 'cancelled').length}
- Walk-ins: ${bookings.filter((b: any) => b.is_walk_in).length}
- Crisis flags: ${bookings.filter((b: any) => b.crisis_flag).length}
- Intake complete: ${bookings.filter((b: any) => b.intake_status === 'complete').length}
- Intake pending: ${bookings.filter((b: any) => b.intake_status === 'pending').length}
- High risk: ${bookings.filter((b: any) => parseInt(b.risk_score) >= 65).length}

RECENT BOOKINGS (last 10):
${bookings.slice(0, 10).map((b: any) => `- ${b.slot_date} ${b.slot_start_time?.slice(0, 5)} | ${b.doctor_name} | ${b.status} | ${b.specialty}${b.reason ? ` | Reason: ${b.reason}` : ''}${b.intake_brief?.main_concern ? ` | Concern: ${b.intake_brief.main_concern}` : ''}`).join('\n')}

PATIENTS WITH CRISIS FLAGS:
${bookings.filter((b: any) => b.crisis_flag).map((b: any) => `- ${b.doctor_name} | ${b.slot_date} | Severity: ${b.crisis_flag}`).join('\n') || 'None'}

PATIENTS WITH PENDING INTAKE:
${bookings.filter((b: any) => b.intake_status === 'pending' && b.status === 'confirmed').map((b: any) => `- ${b.doctor_name} | ${b.slot_date} ${b.slot_start_time?.slice(0, 5)}`).join('\n') || 'None'}
`.trim()
  }

  const sendMessage = async (text?: string) => {
    const userText = text ?? input.trim()
    if (!userText || loading) return

    const userMsg: Message = { role: 'user', content: userText, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))

      // ── Route through backend — avoids CORS + keeps API key secure ──
      const response = await apiClient.post('/copilot/chat', {
        messages: [
          ...history,
          { role: 'user', content: userText }
        ],
        context: buildContext(),
      })

      const reply = response.data.reply ?? 'Sorry, I could not process that.'
      // ────────────────────────────────────────────────────────────────

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
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
      content: `Chat cleared. How can I help you with your practice?`,
      timestamp: new Date(),
    }])
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── MAIN CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 22, backgroundColor: colors.primary, borderRadius: 2 }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>AI Co-pilot</h1>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {practiceData ? `Connected to ${practiceData.doctor?.practice_name} · ${practiceData.bookings?.length} bookings loaded` : 'Loading practice data...'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={loadPracticeData} title="Refresh data" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico i={HiOutlineRefresh} size={15} />
            </button>
            <button onClick={clearChat} title="Clear chat" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico i={HiOutlineX} size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {loading && <TypingIndicator />}
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
              placeholder="Ask anything about your practice... (Enter to send, Shift+Enter for new line)"
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
            AI responses are based on your current practice data · Always verify critical decisions
          </div>
        </div>
      </div>

      {/* ── SUGGESTIONS PANEL ── */}
      <div style={{ width: 260, borderLeft: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ico i={HiOutlineLightningBolt} size={15} style={{ color: colors.primary }} />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>Quick questions</span>
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
            <div style={{ fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>Data loaded</div>
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
    </div>
  )
}