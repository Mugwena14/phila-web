import React, { useEffect, useState } from 'react'
import { colors } from '../../theme/colors'
import apiClient from '../../api/client'
import {
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineDocumentText,
  HiOutlineChip,
  HiOutlineRefresh,
  HiOutlineUser,
} from 'react-icons/hi'
import { RiWalkLine } from 'react-icons/ri'

const Ico = ({ i: I, size = 16, style }: { i: any; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...style }}>
    <I size={size} />
  </span>
)

interface Patient {
  id: string
  full_name: string
  phone: string
  is_walk_in: boolean
  claim_code: string | null
  claimed: boolean
  created_at: string
}

interface Booking {
  id: string
  patient_id: string
  slot_date: string
  slot_start_time: string
  status: string
  reason: string
  risk_score: string
  intake_status: string
  crisis_flag: string | null
  is_walk_in: boolean
  intake_brief: any
  practice_name: string
}

interface Medication {
  id: string
  medication_name: string
  estimated_refill_date: string | null
  last_prescribed_date: string | null
}

function getRiskColor(score: string) {
  const n = parseInt(score || '0')
  if (n < 30) return { color: colors.primary, bg: colors.primaryBg, border: colors.primaryBorder, label: 'Low' }
  if (n < 65) return { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Medium' }
  return { color: colors.coral, bg: colors.coralBg, border: colors.coralBorder, label: 'High' }
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    confirmed: { color: colors.primary, bg: colors.primaryBg, label: 'Confirmed' },
    arrived: { color: '#0284C7', bg: '#E0F2FE', label: 'Arrived' },
    in_consultation: { color: '#7C3AED', bg: '#EDE9FE', label: 'In consult' },
    completed: { color: '#059669', bg: '#D1FAE5', label: 'Completed' },
    no_show: { color: colors.coral, bg: colors.coralBg, label: 'No-show' },
    cancelled: { color: colors.textMuted, bg: colors.bgElevated, label: 'Cancelled' },
  }
  const s = map[status] ?? { color: colors.textMuted, bg: colors.bgElevated, label: status }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: s.color, backgroundColor: s.bg, borderRadius: 999, padding: '2px 8px', textTransform: 'uppercase' }}>
      {s.label}
    </span>
  )
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState<'history' | 'medications' | 'documents'>('history')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [patientsRes, bookingsRes] = await Promise.all([
        apiClient.get('/patients/'),
        apiClient.get('/bookings/practice'),
      ])
      setPatients(patientsRes.data)
      setBookings(bookingsRes.data)
    } catch (err) {
      console.error('Patients load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMedications = async (patientId: string) => {
    try {
      const res = await apiClient.get(`/patients/${patientId}/medications`)
      setMedications(res.data)
    } catch {
      setMedications([])
    }
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setActiveTab('history')
    loadMedications(patient.id)
  }

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  )

  const getPatientBookings = (patientId: string) =>
    bookings.filter(b => b.patient_id === patientId)
      .sort((a, b) => (b.slot_date ?? '').localeCompare(a.slot_date ?? ''))

  const getPatientStats = (patientId: string) => {
    const pb = getPatientBookings(patientId)
    const noShows = pb.filter(b => b.status === 'no_show').length
    const completed = pb.filter(b => b.status === 'completed').length
    const lastVisit = pb.find(b => b.slot_date)?.slot_date ?? null
    const maxRisk = pb.reduce((max, b) => Math.max(max, parseInt(b.risk_score || '0')), 0)
    const hasCrisis = pb.some(b => b.crisis_flag)
    return { total: pb.length, noShows, completed, lastVisit, maxRisk, hasCrisis }
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── LEFT — PATIENT LIST ── */}
      <div style={{ width: selectedPatient ? 420 : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: selectedPatient ? `1px solid ${colors.border}` : 'none', overflow: 'hidden', transition: 'width 0.2s ease' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Ico i={HiOutlineUsers} size={20} style={{ color: colors.primary }} />
            <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>Patients</h1>
            <span style={{ fontSize: 12, color: colors.textMuted, backgroundColor: colors.bgElevated, borderRadius: 999, padding: '3px 10px', border: `1px solid ${colors.border}` }}>
              {patients.length} total
            </span>
            <button onClick={loadData} style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
              <Ico i={HiOutlineRefresh} size={15} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Ico i={HiOutlineSearch} size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textFaint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: search ? 36 : 12, paddingTop: 9, paddingBottom: 9, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.textFaint, display: 'flex' }}>
                <Ico i={HiOutlineX} size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px', gap: 0, padding: '10px 24px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, flexShrink: 0 }}>
          {['Patient', 'Visits', 'Last visit', 'Risk'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 500, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {/* Patient list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Ico i={HiOutlineUsers} size={36} style={{ color: colors.textFaint, marginBottom: 12, justifyContent: 'center' }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: colors.text, marginBottom: 4 }}>
                {search ? 'No patients found' : 'No patients yet'}
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted }}>
                {search ? 'Try a different name or phone number' : 'Patients appear here after their first booking'}
              </div>
            </div>
          ) : (
            filtered.map((patient, i) => {
              const stats = getPatientStats(patient.id)
              const risk = getRiskColor(String(stats.maxRisk))
              const isSelected = selectedPatient?.id === patient.id

              return (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 80px',
                    gap: 0,
                    padding: '14px 24px',
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? colors.primaryBg : 'transparent',
                    borderRight: isSelected ? `3px solid ${colors.primary}` : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Patient name + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isSelected ? colors.primary : colors.bgElevated, border: `1px solid ${isSelected ? colors.primary : colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: isSelected ? '#FFFFFF' : colors.textMuted, flexShrink: 0, fontFamily: 'Syne, sans-serif' }}>
                      {patient.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.full_name}</span>
                        {patient.is_walk_in && !patient.claimed && (
                          <span style={{ fontSize: 9, fontWeight: 600, color: '#60A5FA', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 999, padding: '1px 6px', border: '1px solid rgba(59,130,246,0.25)', whiteSpace: 'nowrap' }}>WALK-IN</span>
                        )}
                        {stats.hasCrisis && (
                          <Ico i={HiOutlineExclamation} size={13} style={{ color: colors.coral }} />
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: colors.textFaint }}>{patient.phone.startsWith('WALKIN_') ? patient.phone.replace('WALKIN_', '') : patient.phone}</span>
                    </div>
                  </div>

                  {/* Visit count */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{stats.total}</span>
                    {stats.noShows > 0 && (
                      <span style={{ fontSize: 11, color: colors.coral, marginLeft: 6 }}>({stats.noShows} no-show{stats.noShows > 1 ? 's' : ''})</span>
                    )}
                  </div>

                  {/* Last visit */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>{stats.lastVisit ?? 'Never'}</span>
                  </div>

                  {/* Risk badge */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {stats.total > 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: risk.color, backgroundColor: risk.bg, borderRadius: 999, padding: '2px 8px', border: `1px solid ${risk.border}` }}>
                        {risk.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: colors.textFaint }}>—</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── RIGHT — PATIENT DETAIL ── */}
      {selectedPatient && (() => {
        const patientBookings = getPatientBookings(selectedPatient.id)
        const stats = getPatientStats(selectedPatient.id)
        const risk = getRiskColor(String(stats.maxRisk))

        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Detail header */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryBg, border: `2px solid ${colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: colors.primary, fontFamily: 'Syne, sans-serif' }}>
                    {selectedPatient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>{selectedPatient.full_name}</span>
                      {selectedPatient.is_walk_in && !selectedPatient.claimed && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#60A5FA', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 999, padding: '2px 8px', border: '1px solid rgba(59,130,246,0.25)' }}>WALK-IN</span>
                      )}
                      {stats.hasCrisis && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: colors.coral, backgroundColor: colors.coralBg, borderRadius: 999, padding: '2px 8px', border: `1px solid ${colors.coralBorder}`, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Ico i={HiOutlineExclamation} size={10} />
                          Crisis on record
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ico i={HiOutlinePhone} size={13} style={{ color: colors.textFaint }} />
                        <span style={{ fontSize: 13, color: colors.textMuted }}>
                          {selectedPatient.phone.startsWith('WALKIN_') ? selectedPatient.phone.replace('WALKIN_', '') : selectedPatient.phone}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Ico i={HiOutlineCalendar} size={13} style={{ color: colors.textFaint }} />
                        <span style={{ fontSize: 13, color: colors.textMuted }}>Patient since {selectedPatient.created_at?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                  <Ico i={HiOutlineX} size={18} />
                </button>
              </div>

              {/* Walk-in claim code */}
              {selectedPatient.is_walk_in && !selectedPatient.claimed && selectedPatient.claim_code && (
                <div style={{ marginTop: 14, backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Ico i={RiWalkLine} size={16} style={{ color: '#60A5FA' }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#60A5FA', fontWeight: 500, marginBottom: 2 }}>Walk-in patient — not yet on the app</div>
                    <div style={{ fontSize: 12, color: colors.textMuted }}>Claim code: <strong style={{ color: colors.text, fontFamily: 'JetBrains Mono, monospace' }}>{selectedPatient.claim_code}</strong> — share this so they can claim their history when they register</div>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16 }}>
                {[
                  { label: 'Total visits', value: stats.total },
                  { label: 'Completed', value: stats.completed },
                  { label: 'No-shows', value: stats.noShows },
                  { label: 'Risk level', value: risk.label, color: risk.color },
                ].map(s => (
                  <div key={s.label} style={{ backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 14px', border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: s.color ?? colors.text }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, flexShrink: 0 }}>
              {([
                { key: 'history', label: 'Visit history', icon: HiOutlineCalendar },
                { key: 'medications', label: 'Medications', icon: HiOutlineChip },
                { key: 'documents', label: 'Documents', icon: HiOutlineDocumentText },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab.key ? `2px solid ${colors.primary}` : '2px solid transparent', cursor: 'pointer', color: activeTab === tab.key ? colors.primary : colors.textMuted, fontSize: 13, fontWeight: activeTab === tab.key ? 500 : 400, transition: 'all 0.15s' }}
                >
                  <Ico i={tab.icon} size={15} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

              {/* VISIT HISTORY */}
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {patientBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: colors.textMuted }}>
                      <Ico i={HiOutlineCalendar} size={32} style={{ color: colors.textFaint, marginBottom: 10, justifyContent: 'center' }} />
                      <div style={{ fontSize: 14, color: colors.text, fontWeight: 500, marginBottom: 4 }}>No visits yet</div>
                      <div style={{ fontSize: 13 }}>Bookings will appear here after the patient's first appointment</div>
                    </div>
                  ) : (
                    patientBookings.map(b => (
                      <div key={b.id} style={{ backgroundColor: colors.bgSurface, borderRadius: 10, border: `1px solid ${colors.border}`, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <Ico i={HiOutlineCalendar} size={13} style={{ color: colors.textFaint }} />
                              <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{b.slot_date ?? 'Unknown date'}</span>
                              {b.slot_start_time && (
                                <span style={{ fontSize: 12, color: colors.textMuted }}>at {b.slot_start_time.slice(0, 5)}</span>
                              )}
                            </div>
                            {b.reason && (
                              <div style={{ fontSize: 12, color: colors.textMuted, marginLeft: 21 }}>{b.reason}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                            {b.crisis_flag && <Ico i={HiOutlineExclamation} size={14} style={{ color: colors.coral }} />}
                            {b.is_walk_in && <span style={{ fontSize: 9, fontWeight: 600, color: '#60A5FA', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 999, padding: '1px 6px' }}>WALK-IN</span>}
                            <StatusPill status={b.status} />
                          </div>
                        </div>

                        {/* Intake brief summary */}
                        {b.intake_brief && (
                          <div style={{ backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${colors.primary}` }}>
                            <div style={{ fontSize: 11, color: colors.primary, fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI intake brief</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {b.intake_brief.main_concern && (
                                <div style={{ fontSize: 12, color: colors.text }}>
                                  <span style={{ color: colors.textFaint }}>Concern: </span>{b.intake_brief.main_concern}
                                </div>
                              )}
                              {b.intake_brief.severity && (
                                <div style={{ fontSize: 12, color: colors.text }}>
                                  <span style={{ color: colors.textFaint }}>Severity: </span>{b.intake_brief.severity}/10
                                </div>
                              )}
                              {b.intake_brief.medications?.length > 0 && (
                                <div style={{ fontSize: 12, color: colors.text }}>
                                  <span style={{ color: colors.textFaint }}>Medications: </span>
                                  {b.intake_brief.medications.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Intake pending note */}
                        {b.intake_status === 'pending' && b.status === 'confirmed' && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Ico i={HiOutlineClock} size={12} style={{ color: '#F59E0B' }} />
                            <span style={{ fontSize: 11, color: '#F59E0B' }}>Intake not completed yet</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* MEDICATIONS */}
              {activeTab === 'medications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {medications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: colors.textMuted }}>
                      <Ico i={HiOutlineChip} size={32} style={{ color: colors.textFaint, marginBottom: 10, justifyContent: 'center' }} />
                      <div style={{ fontSize: 14, color: colors.text, fontWeight: 500, marginBottom: 4 }}>No medications tracked</div>
                      <div style={{ fontSize: 13 }}>Chronic medications are extracted automatically from intake conversations</div>
                    </div>
                  ) : (
                    medications.map(med => {
                      const today = new Date()
                      const refillDate = med.estimated_refill_date ? new Date(med.estimated_refill_date) : null
                      const daysUntilRefill = refillDate ? Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
                      const isRefillSoon = daysUntilRefill !== null && daysUntilRefill <= 14

                      return (
                        <div key={med.id} style={{ backgroundColor: colors.bgSurface, borderRadius: 10, border: `1px solid ${isRefillSoon ? 'rgba(245,158,11,0.3)' : colors.border}`, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 4, textTransform: 'capitalize' }}>{med.medication_name}</div>
                              <div style={{ display: 'flex', gap: 12 }}>
                                {med.last_prescribed_date && (
                                  <span style={{ fontSize: 12, color: colors.textMuted }}>Last prescribed: {med.last_prescribed_date}</span>
                                )}
                                {med.estimated_refill_date && (
                                  <span style={{ fontSize: 12, color: isRefillSoon ? '#F59E0B' : colors.textMuted }}>
                                    Refill due: {med.estimated_refill_date}
                                    {daysUntilRefill !== null && daysUntilRefill > 0 && ` (${daysUntilRefill} days)`}
                                    {daysUntilRefill !== null && daysUntilRefill <= 0 && ' (overdue)'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isRefillSoon && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 999, padding: '3px 10px', border: '1px solid rgba(245,158,11,0.25)', whiteSpace: 'nowrap' }}>
                                Refill soon
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* DOCUMENTS */}
              {activeTab === 'documents' && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: colors.textMuted }}>
                  <Ico i={HiOutlineDocumentText} size={32} style={{ color: colors.textFaint, marginBottom: 10, justifyContent: 'center' }} />
                  <div style={{ fontSize: 14, color: colors.text, fontWeight: 500, marginBottom: 4 }}>Documents</div>
                  <div style={{ fontSize: 13 }}>Sick letters and certificates generated for this patient will appear here</div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}