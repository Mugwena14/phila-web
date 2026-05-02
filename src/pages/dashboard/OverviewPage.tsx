import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import apiClient from '../../api/client'
import { useTheme } from '../../context/ThemeContext'

export default function OverviewPage() {
  const { colors } = useTheme()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/bookings/practice')
        setBookings(res.data)
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) {
          navigate('/onboarding')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => b.slot_date === today)

  const stats = {
    total:            todayBookings.length,
    confirmed:        todayBookings.filter(b => b.status === 'confirmed').length,
    arrived:          todayBookings.filter(b => b.status === 'arrived').length,
    completed:        todayBookings.filter(b => b.status === 'completed').length,
    no_show:          todayBookings.filter(b => b.status === 'no_show').length,
    intake_complete:  todayBookings.filter(b => b.intake_status === 'complete').length,
    intake_pending:   todayBookings.filter(b => b.intake_status === 'pending').length,
    crisis_flags:     todayBookings.filter(b => b.crisis_flag).length,
    walk_ins:         todayBookings.filter(b => b.is_walk_in).length,
  }

  const STAT_CARDS = [
    { label: "Today's patients", value: stats.total,           color: colors.primary,  alert: false },
    { label: 'Confirmed',        value: stats.confirmed,       color: colors.primary,  alert: false },
    { label: 'Arrived',          value: stats.arrived,         color: '#0284C7',       alert: false },
    { label: 'Completed',        value: stats.completed,       color: '#059669',       alert: false },
    { label: 'No-shows',         value: stats.no_show,         color: '#DC2626',       alert: true  },
    { label: 'Intake complete',  value: stats.intake_complete, color: colors.primary,  alert: false },
    { label: 'Intake pending',   value: stats.intake_pending,  color: '#D97706',       alert: false },
    { label: 'Crisis flags',     value: stats.crisis_flags,    color: '#DC2626',       alert: true  },
    { label: 'Walk-ins',         value: stats.walk_ins,        color: '#7C3AED',       alert: false },
  ]

  const getRiskColor = (score: string) => {
    const n = parseInt(score || '0')
    if (n < 30) return colors.primary
    if (n < 65) return '#D97706'
    return '#DC2626'
  }

  const getStatusStyle = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      confirmed:       { label: 'Confirmed',  color: colors.primary, bg: colors.primaryBg },
      arrived:         { label: 'Arrived',    color: '#0284C7',      bg: '#E0F2FE' },
      in_consultation: { label: 'In consult', color: '#7C3AED',      bg: '#EDE9FE' },
      completed:       { label: 'Completed',  color: '#059669',      bg: '#D1FAE5' },
      no_show:         { label: 'No-show',    color: '#DC2626',      bg: 'rgba(220,38,38,0.08)' },
      cancelled:       { label: 'Cancelled',  color: colors.textMuted, bg: colors.bgElevated },
    }
    return map[status] ?? { label: status, color: colors.textMuted, bg: colors.bgElevated }
  }

  const tableHeaderBg = colors.bgBase === '#F0F7F5' ? '#D4E8E3' : '#0A1A17'

  return (
    <div style={{ padding: 32, backgroundColor: colors.bgBase, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 4, height: 26, backgroundColor: colors.primary, borderRadius: 2 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'} 👋
          </h1>
        </div>
        <p style={{ fontSize: 14, color: colors.textMuted, marginLeft: 14 }}>
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {STAT_CARDS.map(stat => (
          <div key={stat.label} style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: stat.alert && stat.value > 0 ? stat.color : colors.text }}>
              {loading ? '—' : stat.value}
            </div>
            {stat.value > 0 && (
              <div style={{ width: 24, height: 3, backgroundColor: stat.color, borderRadius: 2, marginTop: 8, opacity: 0.6 }} />
            )}
          </div>
        ))}
      </div>

      {/* Today's patient list */}
      <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>Today's patients</h2>
          <button onClick={() => navigate('/dashboard/schedule')} style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            View schedule →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>Loading...</div>
        ) : todayBookings.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 4 }}>No patients today</div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>Walk-ins can be added from the Schedule page</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: tableHeaderBg }}>
                {['Patient', 'Time', 'Status', 'Risk', 'Intake', 'Type'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayBookings.map((b, i) => {
                const ss = getStatusStyle(b.status)
                const rc = getRiskColor(b.risk_score)
                return (
                  <tr
                    key={b.id}
                    style={{ borderBottom: i < todayBookings.length - 1 ? `1px solid ${colors.border}` : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => navigate('/dashboard/bookings')}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.bgElevated)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.primary, flexShrink: 0 }}>
                          {(b.doctor_name ?? 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{b.doctor_name ?? 'Patient'}</span>
                            {b.crisis_flag && <span style={{ fontSize: 12 }}>⚠️</span>}
                          </div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>{b.specialty}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: colors.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>
                      {b.slot_start_time?.slice(0, 5) ?? '—'}
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ss.color }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: ss.color }}>{ss.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: rc }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: rc }}>
                          {parseInt(b.risk_score) < 30 ? 'Low' : parseInt(b.risk_score) < 65 ? 'Medium' : 'High'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: b.intake_status === 'complete' ? colors.primary : colors.textFaint }} />
                        <span style={{ fontSize: 12, color: b.intake_status === 'complete' ? colors.primary : colors.textFaint, fontWeight: b.intake_status === 'complete' ? 500 : 400 }}>
                          {b.intake_status === 'complete' ? 'Complete' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      {b.is_walk_in && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', backgroundColor: '#EDE9FE', borderRadius: 999, padding: '3px 10px' }}>Walk-in</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}