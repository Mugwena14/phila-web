import React, { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import apiClient from '../../api/client'
import {
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineChevronDown,
} from 'react-icons/hi'

const Ico = ({ i: I, size = 16, style }: { i: any; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...style }}>
    <I size={size} />
  </span>
)

interface Booking {
  id: string
  patient_id: string
  doctor_name: string
  slot_date: string
  slot_start_time: string
  status: string
  reason: string | null
  receptionist_note: string | null
  risk_score: string
  intake_status: string
  intake_brief: any
  crisis_flag: string | null
  is_walk_in: boolean
  arrived_at: string | null
  completed_at: string | null
  created_at: string
  practice_name: string
  specialty: string
}

const STATUS_OPTIONS = ['all', 'confirmed', 'arrived', 'in_consultation', 'completed', 'no_show', 'cancelled']

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
  { status: 'cancelled',       label: 'Cancel booking',  color: '#6B7280' },
]

export default function BookingsPage() {
  const { colors } = useTheme()

  const [bookings, setBookings]               = useState<Booking[]>([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [statusFilter, setStatusFilter]       = useState('all')
  const [dateFilter, setDateFilter]           = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showEditModal, setShowEditModal]     = useState(false)
  const [editNote, setEditNote]               = useState('')
  const [editReason, setEditReason]           = useState('')
  const [statusLoading, setStatusLoading]     = useState<string | null>(null)
  const [saving, setSaving]                   = useState(false)

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

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    setStatusLoading(status)
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status })
      await load()
      setSelectedBooking(null)
    } catch {}
    setStatusLoading(null)
  }

  const handleSaveEdit = async () => {
    if (!selectedBooking) return
    setSaving(true)
    try {
      await apiClient.patch(`/bookings/${selectedBooking.id}/status`, {
        reason: editReason,
        receptionist_note: editNote,
      })
      await load()
      setShowEditModal(false)
    } catch {}
    setSaving(false)
  }

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking?')) return
    await handleStatusUpdate(bookingId, 'cancelled')
  }

  const openEdit = (b: Booking) => {
    setSelectedBooking(b)
    setEditReason(b.reason ?? '')
    setEditNote(b.receptionist_note ?? '')
    setShowEditModal(true)
  }

  const today = new Date().toISOString().split('T')[0]
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    const matchSearch =
      (b.doctor_name ?? '').toLowerCase().includes(q) ||
      (b.reason ?? '').toLowerCase().includes(q) ||
      (b.specialty ?? '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    const matchDate =
      dateFilter === 'all'   ? true :
      dateFilter === 'today' ? b.slot_date === today :
      dateFilter === 'week'  ? b.slot_date >= today && b.slot_date <= weekEndStr :
      dateFilter === 'past'  ? b.slot_date < today : true
    return matchSearch && matchStatus && matchDate
  })

  const DATE_FILTERS = [
    { key: 'all',   label: 'All dates' },
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This week' },
    { key: 'past',  label: 'Past' },
  ]

  const getRiskLabel = (score: string) => {
    const n = parseInt(score || '0')
    if (n < 30) return { label: 'Low',    color: colors.primary }
    if (n < 65) return { label: 'Medium', color: '#D97706' }
    return               { label: 'High',   color: '#DC2626' }
  }

  const tableHeaderBg = colors.bgBase === '#F0F7F5' ? '#D4E8E3' : '#0A1A17'

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: colors.bgBase }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '24px 32px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 4, height: 22, backgroundColor: colors.primary, borderRadius: 2 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>Bookings</h1>
            <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Filter bar */}
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Ico i={HiOutlineSearch} size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient name, reason..." style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {DATE_FILTERS.map(f => (
                <button key={f.key} onClick={() => setDateFilter(f.key)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${dateFilter === f.key ? colors.primary : colors.border}`, backgroundColor: dateFilter === f.key ? colors.primaryBg : colors.bgSurface, color: dateFilter === f.key ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: dateFilter === f.key ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ appearance: 'none', paddingLeft: 12, paddingRight: 32, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : STATUS_MAP[s]?.label ?? s}</option>)}
              </select>
              <Ico i={HiOutlineChevronDown} size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textFaint, pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 32px 32px' }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', backgroundColor: tableHeaderBg, padding: '12px 20px' }}>
              {['Patient', 'Date & time', 'Specialty', 'Risk', 'Status', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>Loading bookings...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 64, textAlign: 'center' }}>
                <Ico i={HiOutlineClipboardList} size={36} style={{ color: colors.textFaint, marginBottom: 12, justifyContent: 'center' }} />
                <div style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 4 }}>No bookings found</div>
                <div style={{ fontSize: 13, color: colors.textMuted }}>Try adjusting your filters</div>
              </div>
            ) : (
              filtered.map((b, i) => {
                const st = STATUS_MAP[b.status] ?? STATUS_MAP.confirmed
                const risk = getRiskLabel(b.risk_score)
                const isLast = i === filtered.length - 1
                return (
                  <div key={b.id}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', padding: '14px 20px', borderBottom: isLast ? 'none' : `1px solid ${colors.border}`, alignItems: 'center', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.bgElevated)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Patient */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.primary, flexShrink: 0 }}>
                        {(b.doctor_name ?? 'P').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.doctor_name ?? 'Unknown'}</span>
                          {b.crisis_flag && <Ico i={HiOutlineExclamation} size={13} style={{ color: '#DC2626' }} />}
                          {b.is_walk_in && <span style={{ fontSize: 9, fontWeight: 700, color: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 999, padding: '1px 6px', border: '1px solid rgba(37,99,235,0.25)' }}>WALK-IN</span>}
                        </div>
                        {b.reason && <span style={{ fontSize: 11, color: colors.textFaint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 200 }}>{b.reason}</span>}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{b.slot_date ?? '—'}</div>
                      <div style={{ fontSize: 11, color: colors.textFaint }}>{b.slot_start_time?.slice(0, 5) ?? ''}</div>
                    </div>

                    {/* Specialty */}
                    <div style={{ fontSize: 12, color: colors.textMuted }}>{b.specialty}</div>

                    {/* Risk */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: risk.color }} />
                      <span style={{ fontSize: 12, color: risk.color, fontWeight: 500 }}>{risk.label}</span>
                    </div>

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.color }} />
                      <span style={{ fontSize: 12, color: st.color, fontWeight: 500 }}>{st.label}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => setSelectedBooking(selectedBooking?.id === b.id ? null : b)} title="Update status" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${selectedBooking?.id === b.id ? colors.primaryBorder : colors.border}`, backgroundColor: selectedBooking?.id === b.id ? colors.primaryBg : colors.bgSurface, color: selectedBooking?.id === b.id ? colors.primary : colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ico i={HiOutlineEye} size={15} />
                      </button>
                      <button onClick={() => openEdit(b)} title="Edit booking" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ico i={HiOutlinePencil} size={15} />
                      </button>
                      {!['cancelled', 'completed', 'no_show'].includes(b.status) && (
                        <button onClick={() => handleCancel(b.id)} title="Cancel booking" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ico i={HiOutlineTrash} size={15} />
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

      {/* Status update panel */}
      {selectedBooking && !showEditModal && (
        <div style={{ width: 320, borderLeft: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Syne, sans-serif', color: colors.text }}>Booking actions</span>
            <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
              <Ico i={HiOutlineX} size={17} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 4 }}>{selectedBooking.doctor_name}</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>{selectedBooking.slot_date} · {selectedBooking.slot_start_time?.slice(0, 5)}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(() => { const st = STATUS_MAP[selectedBooking.status] ?? STATUS_MAP.confirmed; return (
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.color, backgroundColor: `${st.color}12`, borderRadius: 999, padding: '3px 10px', border: `1px solid ${st.color}30` }}>{st.label}</span>
                )})()}
                {selectedBooking.crisis_flag && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', backgroundColor: 'rgba(220,38,38,0.08)', borderRadius: 999, padding: '3px 10px', border: '1px solid rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ico i={HiOutlineExclamation} size={11} />Crisis
                  </span>
                )}
              </div>
            </div>

            {selectedBooking.intake_brief && (
              <div style={{ backgroundColor: colors.bgElevated, borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>Intake brief</div>
                {[
                  { label: 'Concern', value: selectedBooking.intake_brief.main_concern },
                  { label: 'Duration', value: selectedBooking.intake_brief.duration },
                  { label: 'Severity', value: selectedBooking.intake_brief.severity ? `${selectedBooking.intake_brief.severity}/10` : null },
                ].map(item => item.value && (
                  <div key={item.label} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: colors.textFaint }}>{item.label}: </span>
                    <span style={{ fontSize: 12, color: colors.text, fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 10 }}>Update status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STATUS_ACTIONS.filter(a => a.status !== selectedBooking.status).map(action => (
                <button key={action.status} onClick={() => handleStatusUpdate(selectedBooking.id, action.status)} disabled={statusLoading === action.status}
                  style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: action.color, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, opacity: statusLoading === action.status ? 0.6 : 1 }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: action.color }} />
                  {statusLoading === action.status ? 'Updating...' : action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 28, width: 420, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>Edit booking</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{selectedBooking.doctor_name} · {selectedBooking.slot_date}</div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                <Ico i={HiOutlineX} size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Reason for visit</label>
                <input value={editReason} onChange={e => setEditReason(e.target.value)} placeholder="e.g. Flu symptoms, follow-up..." style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500 }}>Receptionist note</label>
                <textarea value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Private note visible only to the practice..." rows={3} style={{ width: '100%', padding: '10px 12px', backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                <Ico i={HiOutlineCheck} size={15} />{saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}