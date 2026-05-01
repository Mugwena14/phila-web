import React, { useEffect, useState } from 'react'
import { colors } from '../../theme/colors'
import apiClient from '../../api/client'
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineBan,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineUser,
  HiOutlineExclamation,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineEye,
} from 'react-icons/hi'

const Ico = ({ i: I, size = 16, style }: { i: any; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...style }}>
    <I size={size} />
  </span>
)

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'booked' | 'blocked'
  blocked_reason?: string
}

interface Booking {
  id: string
  slot_id: string
  doctor_name: string
  status: string
  reason: string
  intake_status: string
  risk_score: string
  crisis_flag: string | null
  is_walk_in: boolean
  intake_brief: any
  receptionist_note: string | null
}

function getSlotColor(slot: Slot, booking?: Booking) {
  if (slot.status === 'blocked') return { bg: '#1A2926', border: '#2A3E3A', text: '#4A6560', label: 'Blocked' }
  if (slot.status === 'available') return { bg: 'transparent', border: colors.border, text: colors.textFaint, label: 'Available' }
  if (!booking) return { bg: colors.primaryBg, border: colors.primaryBorder, text: colors.primary, label: 'Booked' }
  if (booking.crisis_flag) return { bg: 'rgba(255,107,107,0.08)', border: colors.coralBorder, text: colors.coral, label: 'Crisis' }
  if (booking.is_walk_in) return { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: '#60A5FA', label: 'Walk-in' }
  if (booking.intake_status === 'complete') return { bg: colors.primaryBg, border: colors.primaryBorder, text: colors.primary, label: 'Ready' }
  return { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#F59E0B', label: 'Pending' }
}

function getRiskColor(score: string) {
  const n = parseInt(score || '0')
  if (n < 30) return colors.primary
  if (n < 65) return '#F59E0B'
  return colors.coral
}

function ActionBtn({ onClick, color, bg, border, icon, label }: { onClick: (e: React.MouseEvent) => void; color: string; bg: string; border: string; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7, border: `1px solid ${border}`, backgroundColor: bg, color, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}
    >
      <Ico i={icon} size={13} />
      {label}
    </button>
  )
}

export default function SchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [doctorId, setDoctorId] = useState<string | null>(null)

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showBriefDrawer, setShowBriefDrawer] = useState(false)

  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInReason, setWalkInReason] = useState('')
  const [walkInLoading, setWalkInLoading] = useState(false)

  const [blockReason, setBlockReason] = useState('Lunch')
  const [blockLoading, setBlockLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)

  useEffect(() => { loadData() }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const todayRes = await apiClient.get('/doctors/today')
      const doctor = todayRes.data.doctor ?? todayRes.data
      setDoctorId(doctor.id)

      const [slotsRes, bookingsRes] = await Promise.all([
      apiClient.get(`/doctors/${doctor.id}/slots`, { params: { date: selectedDate, dashboard: true } }),
      apiClient.get('/bookings/practice'),
      ])

      const allSlots: Slot[] = slotsRes.data
      const allBookings: Booking[] = bookingsRes.data
      const slotIds = new Set(allSlots.map((s: Slot) => s.id))
      const dayBookings = allBookings.filter((b: Booking) => slotIds.has(b.slot_id))

      setSlots(allSlots)
      setBookings(dayBookings)
    } catch (err) {
      console.error('Schedule load error:', err)
      setSlots([])
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const changeDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const getBookingForSlot = (slotId: string) => bookings.find(b => b.slot_id === slotId)

  const handleBlockSlot = async () => {
    if (!selectedSlot) return
    setBlockLoading(true)
    try {
      await apiClient.patch(`/slots/${selectedSlot.id}/block`, { reason: blockReason })
      setShowBlockModal(false)
      setBlockReason('Lunch')
      loadData()
    } catch { }
    setBlockLoading(false)
  }

  const handleUnblockSlot = async (slotId: string) => {
    try {
      await apiClient.patch(`/slots/${slotId}/unblock`)
      setShowBlockModal(false)
      loadData()
    } catch { }
  }

  const handleWalkIn = async () => {
    if (!selectedSlot || !walkInName || !walkInPhone) return
    setWalkInLoading(true)
    try {
      await apiClient.post('/bookings/walk-in', {
        patient_name: walkInName,
        patient_phone: walkInPhone,
        slot_id: selectedSlot.id,
        reason: walkInReason,
      })
      setShowWalkInModal(false)
      setWalkInName('')
      setWalkInPhone('')
      setWalkInReason('')
      loadData()
    } catch { }
    setWalkInLoading(false)
  }

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    setStatusLoading(status)
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status })
      setShowBriefDrawer(false)
      loadData()
    } catch { }
    setStatusLoading(null)
  }

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  const STATUS_ACTIONS = [
    { status: 'arrived', label: 'Mark arrived', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' },
    { status: 'in_consultation', label: 'In consultation', color: '#7C3AED', bg: '#EDE9FE', border: '#DDD6FE' },
    { status: 'completed', label: 'Mark completed', color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
    { status: 'no_show', label: 'No-show', color: colors.coral, bg: colors.coralBg, border: colors.coralBorder },
  ]

  const LEGEND = [
    { color: colors.primary, label: 'Intake complete' },
    { color: '#F59E0B', label: 'Intake pending' },
    { color: colors.coral, label: 'Crisis flag' },
    { color: '#60A5FA', label: 'Walk-in' },
    { color: colors.textFaint, label: 'Available' },
    { color: '#2A3E3A', label: 'Blocked' },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── MAIN SCHEDULE ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, flexShrink: 0 }}>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Ico i={HiOutlineCalendar} size={20} style={{ color: colors.primary }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>Schedule</h1>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => changeDate(-1)} style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                <Ico i={HiOutlineChevronLeft} size={16} />
              </button>
              <div style={{ backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 20px', fontSize: 13, color: colors.text, fontWeight: 500, minWidth: 220, textAlign: 'center' }}>
                {isToday ? '📍 Today — ' : ''}{formattedDate}
              </div>
              <button onClick={() => changeDate(1)} style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                <Ico i={HiOutlineChevronRight} size={16} />
              </button>
              <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} style={{ background: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: colors.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico i={HiOutlineRefresh} size={13} />
                Today
              </button>
            </div>
          </div>

          {/* Legend row */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: colors.textFaint, fontWeight: 500 }}>COLOUR KEY:</span>
            {LEGEND.map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color }} />
                <span style={{ fontSize: 11, color: colors.textFaint }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action key bar */}
        <div style={{ padding: '10px 24px', backgroundColor: colors.bgElevated, borderBottom: `1px solid ${colors.border}`, display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: colors.textFaint, fontWeight: 500 }}>ACTIONS:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.textFaint }} />
            <span style={{ fontSize: 11, color: colors.textFaint }}>Available slot → <strong style={{ color: colors.primary }}>Add walk-in</strong> or <strong style={{ color: colors.coral }}>Block</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.primary }} />
            <span style={{ fontSize: 11, color: colors.textFaint }}>Booked slot → <strong style={{ color: colors.primary }}>View brief + update status</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#2A3E3A' }} />
            <span style={{ fontSize: 11, color: colors.textFaint }}>Blocked slot → <strong style={{ color: colors.primary }}>Unblock</strong></span>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>Loading schedule...</div>
          ) : slots.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <Ico i={HiOutlineCalendar} size={40} style={{ color: colors.textFaint, marginBottom: 12, justifyContent: 'center' }} />
              <div style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 6 }}>No slots for this day</div>
              <div style={{ fontSize: 13, color: colors.textMuted }}>Slots are auto-generated for the next 14 days from today</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slots.map(slot => {
                const booking = getBookingForSlot(slot.id)
                const sc = getSlotColor(slot, booking)

                return (
                  <div
                    key={slot.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: `1px solid ${sc.border}`,
                      backgroundColor: sc.bg,
                      minHeight: 58,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    {/* Time */}
                    <div style={{ width: 52, fontSize: 13, fontWeight: 600, color: colors.textMuted, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                      {slot.start_time.slice(0, 5)}
                    </div>

                    {/* Colour bar */}
                    <div style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: sc.text, flexShrink: 0 }} />

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      {slot.status === 'available' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: colors.textFaint }}>Open slot — no booking yet</span>
                        </div>
                      )}

                      {slot.status === 'blocked' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Ico i={HiOutlineLockClosed} size={14} style={{ color: '#4A6560' }} />
                          <span style={{ fontSize: 13, color: '#4A6560', fontWeight: 500 }}>Blocked</span>
                          {slot.blocked_reason && (
                            <span style={{ fontSize: 12, color: colors.textFaint }}>— {slot.blocked_reason}</span>
                          )}
                        </div>
                      )}

                    {slot.status === 'booked' && booking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${sc.text}18`, border: `1px solid ${sc.text}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: sc.text, flexShrink: 0 }}>
                        {booking.doctor_name?.charAt(0)?.toUpperCase() ?? 'P'}
                        </div>
                        <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{booking.doctor_name}</span>
                            {/* Booking status pill */}
                            <span style={{
                            fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '2px 8px',
                            color: booking.status === 'arrived' ? '#0284C7' : booking.status === 'in_consultation' ? '#7C3AED' : booking.status === 'completed' ? '#059669' : booking.status === 'no_show' ? colors.coral : booking.status === 'cancelled' ? colors.textFaint : colors.primary,
                            backgroundColor: booking.status === 'arrived' ? '#E0F2FE' : booking.status === 'in_consultation' ? '#EDE9FE' : booking.status === 'completed' ? '#D1FAE5' : booking.status === 'no_show' ? colors.coralBg : booking.status === 'cancelled' ? colors.bgElevated : colors.primaryBg,
                            border: `1px solid ${booking.status === 'arrived' ? '#BAE6FD' : booking.status === 'in_consultation' ? '#DDD6FE' : booking.status === 'completed' ? '#A7F3D0' : booking.status === 'no_show' ? colors.coralBorder : booking.status === 'cancelled' ? colors.border : colors.primaryBorder}`,
                            textTransform: 'uppercase',
                            }}>
                            {booking.status === 'in_consultation' ? 'In consult' : booking.status.replace('_', ' ')}
                            </span>
                            {booking.crisis_flag && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: colors.coral, backgroundColor: colors.coralBg, borderRadius: 999, padding: '2px 8px', border: `1px solid ${colors.coralBorder}` }}>
                                <Ico i={HiOutlineExclamation} size={11} />
                                Crisis
                            </span>
                            )}
                            {booking.is_walk_in && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#60A5FA', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 999, padding: '2px 8px', border: '1px solid rgba(59,130,246,0.25)' }}>
                                Walk-in
                            </span>
                            )}
                        </div>
                        {booking.reason && (
                            <span style={{ fontSize: 12, color: colors.textMuted }}>{booking.reason}</span>
                        )}
                        </div>
                    </div>
                    )}
                    </div>

                    {/* ── RIGHT SIDE ACTIONS ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>

                      {/* AVAILABLE — two clear action buttons */}
                      {slot.status === 'available' && (
                        <>
                          <ActionBtn
                            onClick={e => { e.stopPropagation(); setSelectedSlot(slot); setShowWalkInModal(true) }}
                            color={colors.primary}
                            bg={colors.primaryBg}
                            border={colors.primaryBorder}
                            icon={HiOutlinePlus}
                            label="Add walk-in"
                          />
                          <ActionBtn
                            onClick={e => { e.stopPropagation(); setSelectedSlot(slot); setShowBlockModal(true) }}
                            color={colors.coral}
                            bg={colors.coralBg}
                            border={colors.coralBorder}
                            icon={HiOutlineLockClosed}
                            label="Block slot"
                          />
                        </>
                      )}

                      {/* BOOKED — badges + view button */}
                      {slot.status === 'booked' && booking && (
                        <>
                          <span style={{ fontSize: 11, fontWeight: 600, color: getRiskColor(booking.risk_score), backgroundColor: `${getRiskColor(booking.risk_score)}12`, borderRadius: 999, padding: '3px 10px', border: `1px solid ${getRiskColor(booking.risk_score)}30` }}>
                            {parseInt(booking.risk_score) < 30 ? 'Low risk' : parseInt(booking.risk_score) < 65 ? 'Med risk' : 'High risk'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: booking.intake_status === 'complete' ? colors.primary : '#F59E0B', backgroundColor: booking.intake_status === 'complete' ? colors.primaryBg : 'rgba(245,158,11,0.08)', borderRadius: 999, padding: '3px 10px', border: `1px solid ${booking.intake_status === 'complete' ? colors.primaryBorder : 'rgba(245,158,11,0.25)'}` }}>
                            {booking.intake_status === 'complete' ? '✓ Intake done' : 'Intake pending'}
                          </span>
                          <ActionBtn
                            onClick={e => { e.stopPropagation(); setSelectedBooking(booking); setSelectedSlot(slot); setShowBriefDrawer(true) }}
                            color={colors.primary}
                            bg={colors.primaryBg}
                            border={colors.primaryBorder}
                            icon={HiOutlineEye}
                            label="View brief"
                          />
                        </>
                      )}

                      {/* BLOCKED — unblock button */}
                      {slot.status === 'blocked' && (
                        <ActionBtn
                          onClick={e => { e.stopPropagation(); setSelectedSlot(slot); setShowBlockModal(true) }}
                          color={colors.primary}
                          bg={colors.primaryBg}
                          border={colors.primaryBorder}
                          icon={HiOutlineLockOpen}
                          label="Unblock slot"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BRIEF DRAWER ── */}
      {showBriefDrawer && selectedBooking && (
        <div style={{ width: 370, borderLeft: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Ico i={HiOutlineUser} size={18} style={{ color: colors.primary }} />
              <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>Patient brief</span>
            </div>
            <button onClick={() => setShowBriefDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
              <Ico i={HiOutlineX} size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {/* Patient header */}
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryBg, border: `2px solid ${colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: colors.primary }}>
                  {selectedBooking.doctor_name?.charAt(0)?.toUpperCase() ?? 'P'}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>{selectedBooking.doctor_name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{selectedSlot?.start_time.slice(0, 5)} · {selectedSlot?.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedBooking.crisis_flag && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: colors.coral, backgroundColor: colors.coralBg, borderRadius: 999, padding: '3px 10px', border: `1px solid ${colors.coralBorder}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ico i={HiOutlineExclamation} size={11} />
                    Crisis — {selectedBooking.crisis_flag}
                  </span>
                )}
                {selectedBooking.is_walk_in && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#60A5FA', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 999, padding: '3px 10px', border: '1px solid rgba(59,130,246,0.25)' }}>Walk-in</span>
                )}
                <span style={{ fontSize: 11, fontWeight: 600, color: getRiskColor(selectedBooking.risk_score), backgroundColor: `${getRiskColor(selectedBooking.risk_score)}12`, borderRadius: 999, padding: '3px 10px', border: `1px solid ${getRiskColor(selectedBooking.risk_score)}30` }}>
                  {parseInt(selectedBooking.risk_score) < 30 ? 'Low' : parseInt(selectedBooking.risk_score) < 65 ? 'Medium' : 'High'} risk
                </span>
              </div>
            </div>

            {/* Status update */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 500 }}>Update visit status</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STATUS_ACTIONS.map(action => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusUpdate(selectedBooking.id, action.status)}
                    disabled={statusLoading === action.status}
                    style={{ padding: '9px 12px', borderRadius: 8, border: `1px solid ${action.border}`, backgroundColor: action.bg, color: action.color, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: statusLoading === action.status ? 0.6 : 1 }}
                  >
                    <Ico i={HiOutlineCheck} size={13} />
                    {statusLoading === action.status ? 'Updating...' : action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Intake brief */}
            {selectedBooking.intake_brief ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>AI intake brief</div>

                {[
                  { label: 'Main concern', value: selectedBooking.intake_brief.main_concern },
                  { label: 'Duration', value: selectedBooking.intake_brief.duration },
                  { label: 'Severity', value: selectedBooking.intake_brief.severity ? `${selectedBooking.intake_brief.severity} / 10` : null },
                  { label: 'Language used', value: selectedBooking.intake_brief.language_used },
                ].map(item => item.value && (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}

                {selectedBooking.intake_brief.medications?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Medications</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selectedBooking.intake_brief.medications.map((m: string) => (
                        <span key={m} style={{ fontSize: 11, backgroundColor: colors.primaryBg, color: colors.primary, borderRadius: 999, padding: '2px 8px', border: `1px solid ${colors.primaryBorder}` }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.intake_brief.allergies?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 6 }}>Allergies</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selectedBooking.intake_brief.allergies.map((a: string) => (
                        <span key={a} style={{ fontSize: 11, backgroundColor: colors.coralBg, color: colors.coral, borderRadius: 999, padding: '2px 8px', border: `1px solid ${colors.coralBorder}` }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBooking.intake_brief.additional_notes && (
                  <div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Additional notes</div>
                    <div style={{ fontSize: 13, color: colors.text, backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
                      {selectedBooking.intake_brief.additional_notes}
                    </div>
                  </div>
                )}

                {selectedBooking.intake_brief.crisis_flagged && (
                  <div style={{ backgroundColor: colors.coralBg, border: `1px solid ${colors.coralBorder}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ico i={HiOutlineExclamation} size={16} style={{ color: colors.coral }} />
                    <span style={{ fontSize: 12, color: colors.coral, fontWeight: 500 }}>Crisis flag detected during intake — handle with care</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Ico i={HiOutlineClock} size={32} style={{ color: colors.textFaint, marginBottom: 10, justifyContent: 'center' }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: colors.text, marginBottom: 4 }}>Intake not completed yet</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>Patient will receive a WhatsApp reminder shortly</div>
              </div>
            )}

            {selectedBooking.receptionist_note && (
              <div style={{ marginTop: 16, backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${colors.primary}` }}>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Receptionist note</div>
                <div style={{ fontSize: 13, color: colors.text }}>{selectedBooking.receptionist_note}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WALK-IN MODAL ── */}
      {showWalkInModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, width: 440, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryBg, border: `1px solid ${colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico i={HiOutlinePlus} size={18} style={{ color: colors.primary }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>Add walk-in patient</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>Book a patient who arrived without a prior appointment</div>
                </div>
              </div>
              <button onClick={() => setShowWalkInModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                <Ico i={HiOutlineX} size={18} />
              </button>
            </div>

            {selectedSlot && (
              <div style={{ backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.border}` }}>
                <Ico i={HiOutlineClock} size={14} style={{ color: colors.primary }} />
                <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>Slot: {selectedSlot.start_time.slice(0, 5)} on {selectedSlot.date}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Patient full name *</label>
                <input value={walkInName} onChange={e => setWalkInName(e.target.value)} placeholder="e.g. Thabo Nkosi" style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Phone number *</label>
                <input value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} placeholder="+27821234567" style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Reason for visit</label>
                <input value={walkInReason} onChange={e => setWalkInReason(e.target.value)} placeholder="e.g. Headache, follow-up, flu symptoms..." style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowWalkInModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleWalkIn}
                disabled={walkInLoading || !walkInName || !walkInPhone}
                style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: !walkInName || !walkInPhone ? colors.bgElevated : colors.primary, color: !walkInName || !walkInPhone ? colors.textFaint : '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: !walkInName || !walkInPhone ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Ico i={HiOutlineCheck} size={15} />
                {walkInLoading ? 'Creating booking...' : 'Confirm walk-in booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK SLOT MODAL ── */}
      {showBlockModal && selectedSlot && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, width: 400, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.coralBg, border: `1px solid ${colors.coralBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico i={selectedSlot.status === 'blocked' ? HiOutlineLockOpen : HiOutlineLockClosed} size={18} style={{ color: colors.coral }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>
                    {selectedSlot.status === 'blocked' ? 'Unblock this slot' : 'Block this slot'}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>
                    {selectedSlot.status === 'blocked' ? 'Make this slot available for bookings again' : 'Prevent patients from booking this time'}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowBlockModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                <Ico i={HiOutlineX} size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${colors.border}` }}>
              <Ico i={HiOutlineClock} size={14} style={{ color: colors.textMuted }} />
              <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>Slot: {selectedSlot.start_time.slice(0, 5)} on {selectedSlot.date}</span>
            </div>

            {selectedSlot.status === 'blocked' ? (
              <>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
                  Currently blocked for: <strong style={{ color: colors.text }}>{selectedSlot.blocked_reason || 'No reason given'}</strong>
                  <br />Unblocking will make this slot available for patients to book immediately.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowBlockModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUnblockSlot(selectedSlot.id)}
                    style={{ flex: 2, padding: '11px', borderRadius: 8, border: `1px solid ${colors.primaryBorder}`, backgroundColor: colors.primaryBg, color: colors.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Ico i={HiOutlineLockOpen} size={15} />
                    Unblock slot
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 10, fontWeight: 500 }}>Reason for blocking</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {['Lunch', 'Procedure', 'Leave', 'Emergency', 'Admin', 'Other'].map(r => (
                      <button
                        key={r}
                        onClick={() => setBlockReason(r)}
                        style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${blockReason === r ? colors.primary : colors.border}`, backgroundColor: blockReason === r ? colors.primaryBg : 'transparent', color: blockReason === r ? colors.primary : colors.textMuted, fontSize: 12, cursor: 'pointer', fontWeight: blockReason === r ? 600 : 400 }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <input
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="Or type a custom reason..."
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowBlockModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleBlockSlot}
                    disabled={blockLoading}
                    style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: colors.coral, color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Ico i={HiOutlineLockClosed} size={15} />
                    {blockLoading ? 'Blocking...' : 'Block this slot'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}