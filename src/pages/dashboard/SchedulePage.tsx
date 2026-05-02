import React, { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import apiClient from '../../api/client'
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlinePlus,
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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed:       { label: 'Confirmed',      color: '#0F766E' },
  arrived:         { label: 'Arrived',         color: '#0284C7' },
  in_consultation: { label: 'In Consultation', color: '#7C3AED' },
  completed:       { label: 'Completed',       color: '#059669' },
  no_show:         { label: 'No-show',         color: '#DC2626' },
  cancelled:       { label: 'Cancelled',       color: '#6B7280' },
}

const STATUS_ACTIONS = [
  { status: 'arrived',         label: 'Mark arrived',    color: '#0284C7' },
  { status: 'in_consultation', label: 'In consultation', color: '#7C3AED' },
  { status: 'completed',       label: 'Mark completed',  color: '#059669' },
  { status: 'no_show',         label: 'No-show',         color: '#DC2626' },
]

export default function SchedulePage() {
  const { colors } = useTheme()

  const [slots, setSlots]               = useState<Slot[]>([])
  const [bookings, setBookings]         = useState<Booking[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [selectedSlot, setSelectedSlot]       = useState<Slot | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [showBlockModal, setShowBlockModal]   = useState(false)
  const [showBriefDrawer, setShowBriefDrawer] = useState(false)

  const [walkInName, setWalkInName]       = useState('')
  const [walkInPhone, setWalkInPhone]     = useState('')
  const [walkInReason, setWalkInReason]   = useState('')
  const [walkInLoading, setWalkInLoading] = useState(false)

  const [blockReason, setBlockReason]     = useState('Lunch')
  const [blockLoading, setBlockLoading]   = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)

  useEffect(() => { loadData() }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const todayRes = await apiClient.get('/doctors/today')
      const doctor = todayRes.data.doctor ?? todayRes.data

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
    } catch {}
    setBlockLoading(false)
  }

  const handleUnblockSlot = async (slotId: string) => {
    try {
      await apiClient.patch(`/slots/${slotId}/unblock`)
      setShowBlockModal(false)
      loadData()
    } catch {}
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
    } catch {}
    setWalkInLoading(false)
  }

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    setStatusLoading(status)
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status })
      setShowBriefDrawer(false)
      loadData()
    } catch {}
    setStatusLoading(null)
  }

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const tableHeaderBg = colors.bgBase === '#F0F7F5' ? '#D4E8E3' : '#0A1A17'

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: colors.bgBase }}>

      {/* ── MAIN SCHEDULE ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 32px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 22, backgroundColor: colors.primary, borderRadius: 2 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>Schedule</h1>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => changeDate(-1)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico i={HiOutlineChevronLeft} size={16} />
              </button>
              <div style={{ backgroundColor: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '7px 20px', fontSize: 13, color: colors.text, fontWeight: 500, minWidth: 230, textAlign: 'center' }}>
                {isToday ? 'Today — ' : ''}{formattedDate}
              </div>
              <button onClick={() => changeDate(1)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico i={HiOutlineChevronRight} size={16} />
              </button>
              <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico i={HiOutlineRefresh} size={13} />Today
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 110px 130px', backgroundColor: tableHeaderBg, padding: '12px 20px', gap: 16 }}>
              {['Time', 'Patient', 'Status', 'Intake', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>Loading schedule...</div>
            ) : slots.length === 0 ? (
              <div style={{ padding: 64, textAlign: 'center' }}>
                <Ico i={HiOutlineCalendar} size={36} style={{ color: colors.textFaint, marginBottom: 12, justifyContent: 'center' }} />
                <div style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 4 }}>No slots for this day</div>
                <div style={{ fontSize: 13, color: colors.textMuted }}>Slots are auto-generated for the next 14 days</div>
              </div>
            ) : (
              slots.map((slot, i) => {
                const booking = getBookingForSlot(slot.id)
                const st = booking ? STATUS_MAP[booking.status] ?? STATUS_MAP.confirmed : null
                const isLast = i === slots.length - 1

                return (
                  <div key={slot.id}
                    style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 110px 130px', padding: '14px 20px', borderBottom: isLast ? 'none' : `1px solid ${colors.border}`, alignItems: 'center', gap: 16, transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.bgElevated)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Time */}
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, fontFamily: 'JetBrains Mono, monospace' }}>
                      {slot.start_time.slice(0, 5)}
                    </div>

                    {/* Patient */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      {slot.status === 'available' && <span style={{ fontSize: 13, color: colors.textFaint }}>Open slot</span>}

                      {slot.status === 'blocked' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Ico i={HiOutlineLockClosed} size={14} style={{ color: colors.textFaint }} />
                          <span style={{ fontSize: 13, color: colors.textFaint }}>Blocked — {slot.blocked_reason || 'No reason'}</span>
                        </div>
                      )}

                      {slot.status === 'booked' && booking && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.primary, flexShrink: 0 }}>
                            {booking.doctor_name?.charAt(0)?.toUpperCase() ?? 'P'}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{booking.doctor_name}</span>
                              {booking.crisis_flag && <Ico i={HiOutlineExclamation} size={13} style={{ color: '#DC2626' }} />}
                              {booking.is_walk_in && <span style={{ fontSize: 9, fontWeight: 700, color: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 999, padding: '1px 6px', border: '1px solid rgba(37,99,235,0.2)' }}>WALK-IN</span>}
                            </div>
                            {booking.reason && <span style={{ fontSize: 11, color: colors.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 220 }}>{booking.reason}</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      {slot.status === 'booked' && booking && st && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.color }} />
                          <span style={{ fontSize: 12, color: st.color, fontWeight: 500 }}>{st.label}</span>
                        </div>
                      )}
                      {slot.status === 'available' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint }} />
                          <span style={{ fontSize: 12, color: colors.textFaint }}>Available</span>
                        </div>
                      )}
                      {slot.status === 'blocked' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint }} />
                          <span style={{ fontSize: 12, color: colors.textFaint }}>Blocked</span>
                        </div>
                      )}
                    </div>

                    {/* Intake */}
                    <div>
                      {slot.status === 'booked' && booking && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: booking.intake_status === 'complete' ? colors.primary : colors.textFaint }} />
                          <span style={{ fontSize: 12, color: booking.intake_status === 'complete' ? colors.primary : colors.textFaint, fontWeight: booking.intake_status === 'complete' ? 500 : 400 }}>
                            {booking.intake_status === 'complete' ? 'Complete' : 'Pending'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {slot.status === 'available' && (
                        <>
                          <button onClick={() => { setSelectedSlot(slot); setShowWalkInModal(true) }} title="Add walk-in" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ico i={HiOutlinePlus} size={15} />
                          </button>
                          <button onClick={() => { setSelectedSlot(slot); setShowBlockModal(true) }} title="Block slot" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ico i={HiOutlineLockClosed} size={15} />
                          </button>
                        </>
                      )}
                      {slot.status === 'booked' && booking && (
                        <button onClick={() => { setSelectedBooking(booking); setSelectedSlot(slot); setShowBriefDrawer(true) }} title="View brief" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${showBriefDrawer && selectedBooking?.id === booking.id ? colors.primaryBorder : colors.border}`, backgroundColor: showBriefDrawer && selectedBooking?.id === booking.id ? colors.primaryBg : colors.bgSurface, cursor: 'pointer', color: showBriefDrawer && selectedBooking?.id === booking.id ? colors.primary : colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ico i={HiOutlineEye} size={15} />
                        </button>
                      )}
                      {slot.status === 'blocked' && (
                        <button onClick={() => { setSelectedSlot(slot); setShowBlockModal(true) }} title="Unblock slot" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ico i={HiOutlineLockOpen} size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── BRIEF DRAWER ── */}
      {showBriefDrawer && selectedBooking && (
        <div style={{ width: 340, borderLeft: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ico i={HiOutlineUser} size={17} style={{ color: colors.primary }} />
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>Patient brief</span>
            </div>
            <button onClick={() => setShowBriefDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
              <Ico i={HiOutlineX} size={17} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: colors.primary }}>
                  {selectedBooking.doctor_name?.charAt(0)?.toUpperCase() ?? 'P'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>{selectedBooking.doctor_name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{selectedSlot?.start_time.slice(0, 5)} · {selectedSlot?.date}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedBooking.crisis_flag && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 999, padding: '3px 10px', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ico i={HiOutlineExclamation} size={11} />Crisis — {selectedBooking.crisis_flag}
                  </span>
                )}
                {selectedBooking.is_walk_in && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 999, padding: '3px 10px', border: '1px solid rgba(37,99,235,0.2)' }}>Walk-in</span>
                )}
              </div>
            </div>

            {/* Status actions */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 500 }}>Update status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STATUS_ACTIONS.filter(a => a.status !== selectedBooking.status).map(action => (
                  <button key={action.status} onClick={() => handleStatusUpdate(selectedBooking.id, action.status)} disabled={statusLoading === action.status}
                    style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: action.color, fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, opacity: statusLoading === action.status ? 0.6 : 1 }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: action.color }} />
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
                  { label: 'Duration',     value: selectedBooking.intake_brief.duration },
                  { label: 'Severity',     value: selectedBooking.intake_brief.severity ? `${selectedBooking.intake_brief.severity} / 10` : null },
                  { label: 'Language',     value: selectedBooking.intake_brief.language_used },
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
                        <span key={a} style={{ fontSize: 11, backgroundColor: 'rgba(220,38,38,0.08)', color: '#DC2626', borderRadius: 999, padding: '2px 8px', border: '1px solid rgba(220,38,38,0.2)' }}>{a}</span>
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
                  <div style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ico i={HiOutlineExclamation} size={15} style={{ color: '#DC2626' }} />
                    <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 500 }}>Crisis flag detected during intake</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Ico i={HiOutlineClock} size={30} style={{ color: colors.textFaint, marginBottom: 10, justifyContent: 'center' }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: colors.text, marginBottom: 4 }}>Intake not completed</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>Patient will receive a WhatsApp reminder</div>
              </div>
            )}

            {selectedBooking.receptionist_note && (
              <div style={{ marginTop: 16, backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${colors.border}` }}>
                <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4 }}>Receptionist note</div>
                <div style={{ fontSize: 13, color: colors.text }}>{selectedBooking.receptionist_note}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WALK-IN MODAL ── */}
      {showWalkInModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, width: 420, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>Add walk-in patient</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{selectedSlot ? `${selectedSlot.start_time.slice(0, 5)} · ${selectedSlot.date}` : ''}</div>
              </div>
              <button onClick={() => setShowWalkInModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                <Ico i={HiOutlineX} size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Patient full name *', value: walkInName,   setter: setWalkInName,   placeholder: 'e.g. Thabo Nkosi' },
                { label: 'Phone number *',      value: walkInPhone,  setter: setWalkInPhone,  placeholder: '+27821234567' },
                { label: 'Reason for visit',    value: walkInReason, setter: setWalkInReason, placeholder: 'e.g. Flu symptoms, follow-up...' },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>{field.label}</label>
                  <input value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowWalkInModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleWalkIn} disabled={walkInLoading || !walkInName || !walkInPhone} style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: !walkInName || !walkInPhone ? colors.bgElevated : colors.primary, color: !walkInName || !walkInPhone ? colors.textFaint : '#fff', fontSize: 13, fontWeight: 600, cursor: !walkInName || !walkInPhone ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ico i={HiOutlineCheck} size={15} />{walkInLoading ? 'Creating...' : 'Confirm walk-in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK MODAL ── */}
      {showBlockModal && selectedSlot && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, width: 380, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>{selectedSlot.status === 'blocked' ? 'Unblock slot' : 'Block slot'}</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{selectedSlot.start_time.slice(0, 5)} · {selectedSlot.date}</div>
              </div>
              <button onClick={() => setShowBlockModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                <Ico i={HiOutlineX} size={18} />
              </button>
            </div>

            {selectedSlot.status === 'blocked' ? (
              <>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20, lineHeight: 1.7 }}>
                  Currently blocked for: <strong style={{ color: colors.text }}>{selectedSlot.blocked_reason || 'No reason given'}</strong>
                  <br />Unblocking will make this slot immediately available for patients.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowBlockModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleUnblockSlot(selectedSlot.id)} style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ico i={HiOutlineLockOpen} size={15} />Unblock slot
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 10, fontWeight: 500 }}>Reason</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {['Lunch', 'Procedure', 'Leave', 'Emergency', 'Admin', 'Other'].map(r => (
                      <button key={r} onClick={() => setBlockReason(r)} style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${blockReason === r ? colors.primary : colors.border}`, backgroundColor: blockReason === r ? colors.primaryBg : colors.bgElevated, color: blockReason === r ? colors.primary : colors.textMuted, fontSize: 12, cursor: 'pointer', fontWeight: blockReason === r ? 600 : 400 }}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Or type a custom reason..." style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowBlockModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleBlockSlot} disabled={blockLoading} style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ico i={HiOutlineLockClosed} size={15} />{blockLoading ? 'Blocking...' : 'Block slot'}
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