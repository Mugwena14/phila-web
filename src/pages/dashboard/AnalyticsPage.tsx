import React, { useEffect, useState } from 'react'
import { colors } from '../../theme/colors'
import apiClient from '../../api/client'
import {
  HiOutlineChartBar,
  HiOutlineRefresh,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
} from 'react-icons/hi'
import { RiRobot2Line } from 'react-icons/ri'

const Ico = ({ i: I, size = 16, style }: { i: any; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...style }}>
    <I size={size} />
  </span>
)

interface Booking {
  id: string
  slot_date: string
  slot_start_time: string
  status: string
  intake_status: string
  risk_score: string
  crisis_flag: string | null
  is_walk_in: boolean
  specialty: string
  created_at: string
}

function StatCard({ label, value, sub, icon, color = colors.primary, trend }: {
  label: string; value: string | number; sub?: string; icon: any; color?: string; trend?: 'up' | 'down' | null
}) {
  return (
    <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}>{label}</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ico i={icon} size={16} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 4 }}>{value}</div>
      {sub && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend && <Ico i={trend === 'up' ? HiOutlineTrendingUp : HiOutlineTrendingDown} size={13} style={{ color: trend === 'up' ? '#059669' : colors.coral }} />}
          <span style={{ fontSize: 12, color: colors.textMuted }}>{sub}</span>
        </div>
      )}
    </div>
  )
}

function BarChart({ data, color = colors.primary, height = 120 }: {
  data: { label: string; value: number }[]; color?: string; height?: number
}) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, paddingBottom: 24, position: 'relative' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div
            title={`${d.label}: ${d.value}`}
            style={{
              width: '100%',
              height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%`,
              backgroundColor: color,
              borderRadius: '4px 4px 0 0',
              opacity: 0.85,
              transition: 'height 0.3s ease',
              cursor: 'default',
              minHeight: d.value > 0 ? 4 : 0,
            }}
          />
          <span style={{ fontSize: 10, color: colors.textFaint, whiteSpace: 'nowrap', position: 'absolute', bottom: 0 }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ value, total, color = colors.primary, size = 100 }: {
  value: number; total: number; color?: string; size?: number
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={`${color}20`} strokeWidth="12" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>{pct}%</span>
      </div>
    </div>
  )
}

function HorizontalBar({ label, value, total, color = colors.primary }: {
  label: string; value: number; total: number; color?: string
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{value} <span style={{ color: colors.textFaint, fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, backgroundColor: colors.bgElevated, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'30' | '90' | 'all'>('30')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/bookings/practice')
      setBookings(res.data)
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  // Filter by range
  const now = new Date()
  const filtered = bookings.filter(b => {
    if (range === 'all') return true
    if (!b.slot_date) return false
    const days = parseInt(range)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return new Date(b.slot_date) >= cutoff
  })

  // ── COMPUTED STATS ──────────────────────────────────────────────
  const total = filtered.length
  const completed   = filtered.filter(b => b.status === 'completed').length
  const noShows     = filtered.filter(b => b.status === 'no_show').length
  const cancelled   = filtered.filter(b => b.status === 'cancelled').length
  const confirmed   = filtered.filter(b => b.status === 'confirmed').length
  const arrived     = filtered.filter(b => b.status === 'arrived').length
  const walkIns     = filtered.filter(b => b.is_walk_in).length
  const crisisFlags = filtered.filter(b => b.crisis_flag).length
  const intakeComplete = filtered.filter(b => b.intake_status === 'complete').length
  const highRisk    = filtered.filter(b => parseInt(b.risk_score || '0') >= 65).length
  const medRisk     = filtered.filter(b => parseInt(b.risk_score || '0') >= 30 && parseInt(b.risk_score || '0') < 65).length
  const lowRisk     = filtered.filter(b => parseInt(b.risk_score || '0') < 30).length

  const noShowRate  = total === 0 ? 0 : Math.round((noShows / total) * 100)
  const intakeRate  = total === 0 ? 0 : Math.round((intakeComplete / total) * 100)
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)

  // Bookings by day of week
  const byDay = DAYS.map((label, i) => ({
    label,
    value: filtered.filter(b => b.slot_date && new Date(b.slot_date).getDay() === i).length
  }))

  // Bookings by month (last 6 months)
  const byMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const m = d.getMonth()
    const y = d.getFullYear()
    return {
      label: MONTHS[m],
      value: filtered.filter(b => {
        if (!b.slot_date) return false
        const bd = new Date(b.slot_date)
        return bd.getMonth() === m && bd.getFullYear() === y
      }).length
    }
  })

  // Busiest hour
  const byHour: Record<string, number> = {}
  filtered.forEach(b => {
    if (b.slot_start_time) {
      const h = b.slot_start_time.slice(0, 2)
      byHour[h] = (byHour[h] || 0) + 1
    }
  })
  const busiestHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0]

  // Unique patients
  const uniquePatients = new Set(filtered.map(b => b.id)).size

  const RANGES = [
    { key: '30',  label: 'Last 30 days' },
    { key: '90',  label: 'Last 90 days' },
    { key: 'all', label: 'All time' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 4, height: 22, backgroundColor: colors.primary, borderRadius: 2 }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>Analytics</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key as any)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${range === r.key ? colors.primary : colors.border}`, backgroundColor: range === r.key ? colors.primaryBg : 'transparent', color: range === r.key ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: range === r.key ? 600 : 400, cursor: 'pointer' }}>
              {r.label}
            </button>
          ))}
          <button onClick={load} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico i={HiOutlineRefresh} size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 64, textAlign: 'center', color: colors.textMuted }}>Loading analytics...</div>
      ) : (
        <>
          {/* ── TOP STAT CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="Total appointments" value={total} icon={HiOutlineCalendar} color={colors.primary} sub={`${confirmed} upcoming`} />
            <StatCard label="Completed" value={completed} icon={HiOutlineTrendingUp} color="#059669" sub={`${completionRate}% completion rate`} trend="up" />
            <StatCard label="No-shows" value={noShows} icon={HiOutlineTrendingDown} color={colors.coral} sub={`${noShowRate}% no-show rate`} trend={noShowRate > 10 ? 'down' : null} />
            <StatCard label="Walk-ins" value={walkIns} icon={HiOutlineUsers} color="#60A5FA" sub={`${total === 0 ? 0 : Math.round((walkIns / total) * 100)}% of bookings`} />
            <StatCard label="Crisis flags" value={crisisFlags} icon={HiOutlineExclamation} color={colors.coral} sub="Detected by AI" />
            <StatCard label="AI intake rate" value={`${intakeRate}%`} icon={RiRobot2Line} color={colors.primary} sub={`${intakeComplete} of ${total} completed`} />
          </div>

          {/* ── CHARTS ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Bookings by month */}
            <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 4 }}>Appointments by month</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20 }}>Last 6 months</div>
              <BarChart data={byMonth} color={colors.primary} height={140} />
            </div>

            {/* Bookings by day of week */}
            <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 4 }}>Busiest days</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20 }}>
                {busiestHour ? `Peak time: ${busiestHour[0]}:00 (${busiestHour[1]} bookings)` : 'No data yet'}
              </div>
              <BarChart data={byDay} color="#60A5FA" height={140} />
            </div>
          </div>

          {/* ── BOTTOM ROW ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

            {/* Booking status breakdown */}
            <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 16 }}>Booking status</div>
              <HorizontalBar label="Completed" value={completed} total={total} color="#059669" />
              <HorizontalBar label="Confirmed" value={confirmed} total={total} color={colors.primary} />
              <HorizontalBar label="No-show" value={noShows} total={total} color={colors.coral} />
              <HorizontalBar label="Cancelled" value={cancelled} total={total} color={colors.textFaint} />
              <HorizontalBar label="Arrived" value={arrived} total={total} color="#0284C7" />
            </div>

            {/* Risk breakdown */}
            <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 16 }}>Patient risk levels</div>
              <HorizontalBar label="Low risk" value={lowRisk} total={total} color={colors.primary} />
              <HorizontalBar label="Medium risk" value={medRisk} total={total} color="#F59E0B" />
              <HorizontalBar label="High risk" value={highRisk} total={total} color={colors.coral} />
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>WALK-INS VS BOOKED</div>
                <HorizontalBar label="App bookings" value={total - walkIns} total={total} color={colors.primary} />
                <HorizontalBar label="Walk-ins" value={walkIns} total={total} color="#60A5FA" />
              </div>
            </div>

            {/* Intake + AI stats */}
            <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 20 }}>AI agent performance</div>

              {/* Intake donut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <DonutChart value={intakeComplete} total={total} color={colors.primary} size={90} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>Intake completion</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{intakeComplete} of {total} patients</div>
                  <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 4 }}>completed AI intake</div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16 }}>
                {[
                  { label: 'Intake complete', value: intakeComplete, color: colors.primary },
                  { label: 'Intake pending', value: total - intakeComplete, color: colors.textFaint },
                  { label: 'Crisis flags', value: crisisFlags, color: colors.coral },
                  { label: 'High risk patients', value: highRisk, color: '#F59E0B' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }} />
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}