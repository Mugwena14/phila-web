import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import apiClient from '../../api/client'
import { colors } from '../../theme/colors'

interface Stats {
  total: number
  confirmed: number
  arrived: number
  completed: number
  no_show: number
  intake_complete: number
  intake_pending: number
  crisis_flags: number
  walk_ins: number
}

export default function OverviewPage() {
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

  const stats: Stats = {
    total: todayBookings.length,
    confirmed: todayBookings.filter(b => b.status === 'confirmed').length,
    arrived: todayBookings.filter(b => b.status === 'arrived').length,
    completed: todayBookings.filter(b => b.status === 'completed').length,
    no_show: todayBookings.filter(b => b.status === 'no_show').length,
    intake_complete: todayBookings.filter(b => b.intake_status === 'complete').length,
    intake_pending: todayBookings.filter(b => b.intake_status === 'pending').length,
    crisis_flags: todayBookings.filter(b => b.crisis_flag).length,
    walk_ins: todayBookings.filter(b => b.is_walk_in).length,
  }

  const STAT_CARDS = [
    { label: "Today's patients", value: stats.total, color: colors.primary },
    { label: 'Confirmed', value: stats.confirmed, color: colors.primary },
    { label: 'Arrived', value: stats.arrived, color: '#38BDF8' },
    { label: 'Completed', value: stats.completed, color: '#34D399' },
    { label: 'No-shows', value: stats.no_show, color: colors.coral },
    { label: 'Intake complete', value: stats.intake_complete, color: colors.primary },
    { label: 'Intake pending', value: stats.intake_pending, color: '#F59E0B' },
    { label: 'Crisis flags', value: stats.crisis_flags, color: colors.coral },
    { label: 'Walk-ins', value: stats.walk_ins, color: '#A78BFA' },
  ]

  const getRiskColor = (score: string) => {
    const n = parseInt(score || '0')
    if (n < 30) return colors.primary
    if (n < 65) return '#F59E0B'
    return colors.coral
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'} 👋
        </h1>
        <p style={{ fontSize: 14, color: colors.textMuted }}>
          {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {STAT_CARDS.map(stat => (
          <div key={stat.label} style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: stat.value > 0 && stat.label.includes('flag') ? colors.coral : stat.value > 0 && stat.label.includes('show') ? colors.coral : colors.text }}>
              {loading ? '—' : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Today's patient list */}
      <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>Today's patients</h2>
          <button
            onClick={() => navigate('/dashboard/schedule')}
            style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
          >
            View schedule →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>Loading...</div>
        ) : todayBookings.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 4 }}>No patients today</div>
            <div style={{ fontSize: 13 }}>Walk-ins can be added from the Schedule page</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {['Patient', 'Time', 'Status', 'Risk', 'Intake', 'Type'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayBookings.map((b, i) => (
                <tr
                  key={b.id}
                  style={{ borderBottom: i < todayBookings.length - 1 ? `1px solid ${colors.border}` : 'none', cursor: 'pointer' }}
                  onClick={() => navigate('/dashboard/bookings')}
                >
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {b.crisis_flag && <span title="Crisis flag" style={{ fontSize: 14 }}>⚠️</span>}
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{b.doctor_name ?? 'Patient'}</div>
                        <div style={{ fontSize: 12, color: colors.textMuted }}>{b.specialty}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 24px', fontSize: 13, color: colors.textMuted }}>{b.slot_start_time?.slice(0, 5) ?? '—'}</td>
                  <td style={{ padding: '14px 24px' }}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: getRiskColor(b.risk_score), backgroundColor: `${getRiskColor(b.risk_score)}15`, borderRadius: 999, padding: '3px 10px', border: `1px solid ${getRiskColor(b.risk_score)}30` }}>
                      {parseInt(b.risk_score) < 30 ? 'Low' : parseInt(b.risk_score) < 65 ? 'Medium' : 'High'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: b.intake_status === 'complete' ? colors.primary : colors.textFaint, backgroundColor: b.intake_status === 'complete' ? colors.primaryBg : colors.bgElevated, borderRadius: 999, padding: '3px 10px', border: `1px solid ${b.intake_status === 'complete' ? colors.primaryBorder : colors.border}` }}>
                      {b.intake_status === 'complete' ? '✓ Done' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    {b.is_walk_in && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#7C3AED', backgroundColor: '#EDE9FE', borderRadius: 999, padding: '3px 10px' }}>Walk-in</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: 'Confirmed', color: colors.primary, bg: colors.primaryBg },
    arrived: { label: 'Arrived', color: '#0284C7', bg: '#E0F2FE' },
    in_consultation: { label: 'In consult', color: '#7C3AED', bg: '#EDE9FE' },
    completed: { label: 'Completed', color: '#059669', bg: '#D1FAE5' },
    no_show: { label: 'No-show', color: colors.coral, bg: colors.coralBg },
    cancelled: { label: 'Cancelled', color: colors.textMuted, bg: colors.bgElevated },
  }
  const s = map[status] ?? { label: status, color: colors.textMuted, bg: colors.bgElevated }
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color: s.color, backgroundColor: s.bg, borderRadius: 999, padding: '3px 10px', border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  )
}

const colors_ref = { primary: '#14B8A6', primaryBg: 'rgba(20,184,166,0.08)', primaryBorder: 'rgba(20,184,166,0.2)', coral: '#FF6B6B', coralBg: 'rgba(255,107,107,0.08)', text: '#F0F4F3', textMuted: '#8FA89E', textFaint: '#4A6560', bgSurface: '#0D1614', bgElevated: '#142420', border: 'rgba(20,184,166,0.08)' }