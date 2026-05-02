import React, { useEffect, useState, useRef } from 'react'

interface QueueEntry {
  id: string
  display_name: string
  status: string
  slot_time: string
}

interface QueueState {
  practice_name: string
  now_seen: QueueEntry | null
  queue: QueueEntry[]
  total_waiting: number
  timestamp: string
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://146.231.127.33:8000/api/v1'

export default function WaitingRoomPage() {
  const [queue, setQueue] = useState<QueueState | null>(null)
  const [connected, setConnected] = useState(false)
  const [doctorId, setDoctorId] = useState<string | null>(null)
  const [animateNow, setAnimateNow] = useState(false)
  const prevNowSeen = useRef<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  // Get doctorId from URL query param: /waiting-room?doctor=xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const did = params.get('doctor')
    if (did) setDoctorId(did)
  }, [])

  // Connect to SSE stream
  useEffect(() => {
    if (!doctorId) return

    const connect = () => {
      const es = new EventSource(`${API_BASE}/waiting-room/stream/${doctorId}`)
      esRef.current = es

      es.onopen = () => setConnected(true)

      es.onmessage = (e) => {
        try {
          const data: QueueState = JSON.parse(e.data)
          setQueue(prev => {
            // Detect change in now_seen → trigger animation
            const newNowId = data.now_seen?.id ?? null
            if (newNowId && newNowId !== prevNowSeen.current) {
              prevNowSeen.current = newNowId
              setAnimateNow(true)
              setTimeout(() => setAnimateNow(false), 1000)
            }
            return data
          })
        } catch {}
      }

      es.onerror = () => {
        setConnected(false)
        es.close()
        // Reconnect after 5 seconds
        setTimeout(connect, 5000)
      }
    }

    connect()
    return () => { esRef.current?.close() }
  }, [doctorId])

  const time = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })

  // No doctor ID in URL
  if (!doctorId) {
    return (
      <div style={{ ...fullscreen, backgroundColor: '#080F0E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#4A6560' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏥</div>
          <div style={{ fontSize: 20, fontFamily: 'Syne, sans-serif', color: '#F0F4F3', marginBottom: 8 }}>Waiting Room Display</div>
          <div style={{ fontSize: 14 }}>Add <code style={{ color: '#14B8A6' }}>?doctor=DOCTOR_ID</code> to the URL to connect</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...fullscreen, backgroundColor: '#080F0E', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono&display=swap');
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 48px', borderBottom: '1px solid rgba(20,184,166,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            🏥
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#F0F4F3', letterSpacing: '-0.02em' }}>
              {queue?.practice_name ?? 'Phila Medical'}
            </div>
            <div style={{ fontSize: 14, color: '#4A6560', marginTop: 2 }}>{dateStr}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Connection dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: connected ? '#14B8A6' : '#FF6B6B', animation: connected ? 'none' : 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 12, color: '#4A6560' }}>{connected ? 'Live' : 'Reconnecting...'}</span>
          </div>

          {/* Clock */}
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#14B8A6', letterSpacing: '0.05em' }}>
            <Clock />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', padding: '48px', gap: 48, height: 'calc(100vh - 105px)' }}>

        {/* ── LEFT — NOW BEING SEEN ── */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4A6560', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
            Now being seen
          </div>

          {queue?.now_seen ? (
            <div
              key={queue.now_seen.id}
              style={{
                flex: 1,
                backgroundColor: 'rgba(20,184,166,0.06)',
                border: '1px solid rgba(20,184,166,0.2)',
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 48,
                animation: animateNow ? 'slideIn 0.6s ease' : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle glow */}
              <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', backgroundColor: 'rgba(20,184,166,0.04)', filter: 'blur(60px)' }} />

              {/* Avatar */}
              <div style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(20,184,166,0.12)', border: '2px solid rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#14B8A6', marginBottom: 28 }}>
                {queue.now_seen.display_name.charAt(0)}
              </div>

              <div style={{ fontSize: 52, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#F0F4F3', letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.1, marginBottom: 20 }}>
                {queue.now_seen.display_name}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 999, padding: '10px 24px' }}>
                <span style={{ fontSize: 16 }}>→</span>
                <span style={{ fontSize: 18, color: '#14B8A6', fontWeight: 600 }}>Please proceed to the consultation room</span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, backgroundColor: 'rgba(20,184,166,0.03)', border: '1px solid rgba(20,184,166,0.08)', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 48 }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: '#8FA89E' }}>
                {queue?.total_waiting === 0 ? 'All caught up' : 'Waiting for next call'}
              </div>
              <div style={{ fontSize: 15, color: '#4A6560' }}>
                {queue?.total_waiting === 0 ? 'No patients waiting' : `${queue?.total_waiting} patient${queue?.total_waiting !== 1 ? 's' : ''} in queue`}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT — QUEUE ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4A6560', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
            Waiting · {queue?.total_waiting ?? 0} patient{queue?.total_waiting !== 1 ? 's' : ''}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {!queue || queue.queue.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#4A6560' }}>
                <div style={{ fontSize: 36 }}>🎉</div>
                <div style={{ fontSize: 18, fontFamily: 'Syne, sans-serif', color: '#8FA89E' }}>Queue is empty</div>
              </div>
            ) : (
              queue.queue.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    backgroundColor: i === 0 ? 'rgba(20,184,166,0.06)' : 'rgba(20,184,166,0.02)',
                    border: `1px solid ${i === 0 ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.06)'}`,
                    borderRadius: 16,
                    padding: '20px 24px',
                    animation: 'fadeIn 0.4s ease',
                  }}
                >
                  {/* Position number */}
                  <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: i === 0 ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: i === 0 ? '#14B8A6' : '#4A6560', flexShrink: 0 }}>
                    {i + 1}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: i === 0 ? '#F0F4F3' : '#8FA89E' }}>
                      {entry.display_name}
                    </div>
                    {i === 0 && (
                      <div style={{ fontSize: 13, color: '#14B8A6', marginTop: 2 }}>You're next</div>
                    )}
                  </div>

                  {/* Slot time */}
                  <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: '#4A6560' }}>
                    {entry.slot_time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{ padding: '16px 48px', borderTop: '1px solid rgba(20,184,166,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: '#4A6560' }}>Powered by Phila Health</div>
        <div style={{ fontSize: 13, color: '#4A6560' }}>
          {queue ? `Last updated ${new Date(queue.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Connecting...'}
        </div>
      </div>
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }))
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }))
    }, 1000)
    return () => clearInterval(t)
  }, [])
  return <>{time}</>
}

const fullscreen: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
}