import React, { useEffect, useState } from 'react'
import { colors } from '../../theme/colors'
import apiClient from '../../api/client'
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineDownload,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineChevronDown,
  HiOutlineRefresh,
  HiOutlineExclamation,
} from 'react-icons/hi'
import { RiRobot2Line } from 'react-icons/ri'

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
  intake_brief: any
  reason: string | null
  specialty: string
  practice_name: string
}

interface Document {
  id: string
  doc_type: string
  content: any
  created_at: string
  patient_id: string
  booking_id: string
}

const DOC_TYPES = [
  { key: 'sick_letter',          label: 'Sick Letter',          desc: 'For employer or school absence' },
  { key: 'medical_certificate',  label: 'Medical Certificate',  desc: 'Formal certificate for records' },
  { key: 'referral_letter',      label: 'Referral Letter',      desc: 'Refer to another specialist' },
  { key: 'visit_summary',        label: 'Visit Summary',        desc: 'Patient-facing visit notes' },
]

const DOC_TYPE_MAP: Record<string, string> = {
  sick_letter:         'Sick Letter',
  medical_certificate: 'Medical Certificate',
  referral_letter:     'Referral Letter',
  visit_summary:       'Visit Summary',
}

function buildDefaultContent(docType: string, booking: Booking, doctorName: string) {
  const brief = booking.intake_brief
  const today = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })

  switch (docType) {
    case 'sick_letter':
      return {
        patient_name: booking.doctor_name,
        date_of_visit: booking.slot_date,
        date_issued: today,
        days_off: '3',
        from_date: booking.slot_date,
        to_date: '',
        diagnosis: brief?.main_concern ?? booking.reason ?? '',
        doctor_name: doctorName,
        practice_name: booking.practice_name,
        notes: brief?.additional_notes ?? '',
      }
    case 'medical_certificate':
      return {
        patient_name: booking.doctor_name,
        date_of_visit: booking.slot_date,
        date_issued: today,
        diagnosis: brief?.main_concern ?? booking.reason ?? '',
        duration: brief?.duration ?? '',
        doctor_name: doctorName,
        practice_name: booking.practice_name,
        qualification: '',
        hpcsa_number: '',
        notes: '',
      }
    case 'referral_letter':
      return {
        patient_name: booking.doctor_name,
        date_issued: today,
        referring_doctor: doctorName,
        practice_name: booking.practice_name,
        referred_to_specialty: '',
        referred_to_doctor: '',
        reason_for_referral: brief?.main_concern ?? booking.reason ?? '',
        relevant_history: brief?.additional_notes ?? '',
        current_medications: brief?.medications?.join(', ') ?? '',
        allergies: brief?.allergies?.join(', ') ?? '',
        urgency: 'Routine',
      }
    case 'visit_summary':
      return {
        patient_name: booking.doctor_name,
        date_of_visit: booking.slot_date,
        doctor_name: doctorName,
        practice_name: booking.practice_name,
        chief_complaint: brief?.main_concern ?? booking.reason ?? '',
        duration: brief?.duration ?? '',
        severity: brief?.severity ?? '',
        medications_prescribed: brief?.medications?.join(', ') ?? '',
        allergies: brief?.allergies?.join(', ') ?? '',
        recommendations: '',
        follow_up: '',
        notes: brief?.additional_notes ?? '',
      }
    default:
      return {}
  }
}

function FieldGroup({ label, value, onChange, multiline = false, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: colors.textFaint, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ width: '100%', padding: '9px 12px', backgroundColor: colors.bgBase, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: '9px 12px', backgroundColor: colors.bgBase, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        />
      )}
    </div>
  )
}

function DocumentForm({ docType, content, onChange }: { docType: string; content: any; onChange: (key: string, value: string) => void }) {
  const f = (key: string, label: string, multiline = false, placeholder = '') => (
    <FieldGroup key={key} label={label} value={content[key] ?? ''} onChange={v => onChange(key, v)} multiline={multiline} placeholder={placeholder} />
  )

  switch (docType) {
    case 'sick_letter':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {f('patient_name', 'Patient name')}
          {f('date_of_visit', 'Date of visit')}
          {f('date_issued', 'Date issued')}
          {f('diagnosis', 'Diagnosis / reason', true, 'e.g. Upper respiratory tract infection')}
          {f('days_off', 'Days off recommended')}
          {f('from_date', 'From date')}
          {f('to_date', 'To date')}
          {f('doctor_name', 'Doctor name')}
          {f('practice_name', 'Practice name')}
          {f('notes', 'Additional notes', true)}
        </div>
      )
    case 'medical_certificate':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {f('patient_name', 'Patient name')}
          {f('date_of_visit', 'Date of visit')}
          {f('date_issued', 'Date issued')}
          {f('diagnosis', 'Diagnosis', true)}
          {f('duration', 'Duration of illness')}
          {f('doctor_name', 'Doctor name')}
          {f('qualification', 'Qualification', false, 'e.g. MBChB (UCT)')}
          {f('hpcsa_number', 'HPCSA number')}
          {f('practice_name', 'Practice name')}
          {f('notes', 'Notes', true)}
        </div>
      )
    case 'referral_letter':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {f('patient_name', 'Patient name')}
          {f('date_issued', 'Date issued')}
          {f('referring_doctor', 'Referring doctor')}
          {f('practice_name', 'Practice name')}
          {f('referred_to_specialty', 'Referred to specialty', false, 'e.g. Cardiologist')}
          {f('referred_to_doctor', 'Referred to doctor', false, 'e.g. Dr Smith (optional)')}
          {f('urgency', 'Urgency', false, 'e.g. Routine / Urgent')}
          {f('reason_for_referral', 'Reason for referral', true)}
          {f('relevant_history', 'Relevant history', true)}
          {f('current_medications', 'Current medications', false, 'e.g. Metformin, Aspirin')}
          {f('allergies', 'Allergies')}
        </div>
      )
    case 'visit_summary':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {f('patient_name', 'Patient name')}
          {f('date_of_visit', 'Date of visit')}
          {f('doctor_name', 'Doctor name')}
          {f('practice_name', 'Practice name')}
          {f('chief_complaint', 'Chief complaint', true)}
          {f('duration', 'Duration of complaint')}
          {f('severity', 'Severity (1-10)')}
          {f('medications_prescribed', 'Medications', false, 'e.g. Amoxicillin 500mg')}
          {f('allergies', 'Allergies')}
          {f('recommendations', 'Recommendations', true)}
          {f('follow_up', 'Follow-up', false, 'e.g. Return in 1 week if no improvement')}
          {f('notes', 'Additional notes', true)}
        </div>
      )
    default:
      return null
  }
}

function DocumentPreview({ docType, content, doctorName, practiceName }: { docType: string; content: any; doctorName: string; practiceName: string }) {
  const today = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
  const title = DOC_TYPE_MAP[docType] ?? docType

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#111', borderRadius: 10, padding: '32px 36px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, lineHeight: 1.8, minHeight: 500 }}>
      {/* Practice header */}
      <div style={{ borderBottom: '2px solid #14B8A6', paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#14B8A6', fontFamily: 'Syne, sans-serif' }}>{content.practice_name || practiceName}</div>
        <div style={{ fontSize: 12, color: '#555' }}>{content.doctor_name || doctorName}</div>
        {content.qualification && <div style={{ fontSize: 12, color: '#555' }}>{content.qualification}</div>}
        {content.hpcsa_number && <div style={{ fontSize: 12, color: '#555' }}>HPCSA: {content.hpcsa_number}</div>}
      </div>

      {/* Document title */}
      <div style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20, color: '#111' }}>
        {title}
      </div>

      {/* Date */}
      <div style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>Date: {content.date_issued || today}</div>

      {/* Content by type */}
      {docType === 'sick_letter' && (
        <>
          <p>To whom it may concern,</p>
          <br />
          <p>This is to certify that <strong>{content.patient_name}</strong> was seen at this practice on <strong>{content.date_of_visit}</strong> and is unfit for work/school for <strong>{content.days_off}</strong> day(s){content.from_date ? `, from ${content.from_date}${content.to_date ? ` to ${content.to_date}` : ''}` : ''}.</p>
          {content.diagnosis && <><br /><p><strong>Reason:</strong> {content.diagnosis}</p></>}
          {content.notes && <><br /><p><strong>Notes:</strong> {content.notes}</p></>}
          <br />
          <p>Signed,</p>
          <br />
          <p><strong>{content.doctor_name}</strong></p>
          <p>{content.practice_name}</p>
        </>
      )}

      {docType === 'medical_certificate' && (
        <>
          <p>I, <strong>{content.doctor_name}</strong>{content.qualification ? ` (${content.qualification})` : ''}, hereby certify that I examined <strong>{content.patient_name}</strong> on <strong>{content.date_of_visit}</strong>.</p>
          {content.diagnosis && <><br /><p><strong>Diagnosis:</strong> {content.diagnosis}</p></>}
          {content.duration && <p><strong>Duration:</strong> {content.duration}</p>}
          {content.notes && <><br /><p><strong>Notes:</strong> {content.notes}</p></>}
          <br />
          <p>Signed,</p>
          <br />
          <p><strong>{content.doctor_name}</strong></p>
          {content.hpcsa_number && <p>HPCSA: {content.hpcsa_number}</p>}
          <p>{content.practice_name}</p>
        </>
      )}

      {docType === 'referral_letter' && (
        <>
          <p>Dear {content.referred_to_doctor ? `Dr ${content.referred_to_doctor}` : `${content.referred_to_specialty} Specialist`},</p>
          <br />
          <p>I am referring <strong>{content.patient_name}</strong> to you for specialist assessment.</p>
          {content.reason_for_referral && <><br /><p><strong>Reason for referral:</strong> {content.reason_for_referral}</p></>}
          {content.relevant_history && <><br /><p><strong>Relevant history:</strong> {content.relevant_history}</p></>}
          {content.current_medications && <><br /><p><strong>Current medications:</strong> {content.current_medications}</p></>}
          {content.allergies && <p><strong>Allergies:</strong> {content.allergies}</p>}
          <p><strong>Urgency:</strong> {content.urgency || 'Routine'}</p>
          <br />
          <p>Kind regards,</p>
          <br />
          <p><strong>{content.referring_doctor}</strong></p>
          <p>{content.practice_name}</p>
        </>
      )}

      {docType === 'visit_summary' && (
        <>
          <p><strong>Patient:</strong> {content.patient_name}</p>
          <p><strong>Date:</strong> {content.date_of_visit}</p>
          <p><strong>Doctor:</strong> {content.doctor_name}</p>
          <br />
          {content.chief_complaint && <p><strong>Chief complaint:</strong> {content.chief_complaint}</p>}
          {content.duration && <p><strong>Duration:</strong> {content.duration}</p>}
          {content.severity && <p><strong>Severity:</strong> {content.severity}/10</p>}
          {content.medications_prescribed && <><br /><p><strong>Medications:</strong> {content.medications_prescribed}</p></>}
          {content.allergies && <p><strong>Allergies:</strong> {content.allergies}</p>}
          {content.recommendations && <><br /><p><strong>Recommendations:</strong> {content.recommendations}</p></>}
          {content.follow_up && <p><strong>Follow-up:</strong> {content.follow_up}</p>}
          {content.notes && <><br /><p><strong>Notes:</strong> {content.notes}</p></>}
          <br />
          <p><strong>{content.doctor_name}</strong></p>
          <p>{content.practice_name}</p>
        </>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  const [bookings, setBookings]           = useState<Booking[]>([])
  const [documents, setDocuments]         = useState<Document[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [doctorName, setDoctorName]       = useState('')
  const [practiceName, setPracticeName]   = useState('')

  // Generate modal
  const [showGenModal, setShowGenModal]   = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedDocType, setSelectedDocType] = useState('sick_letter')
  const [docContent, setDocContent]       = useState<any>({})
  const [previewMode, setPreviewMode]     = useState(false)
  const [saving, setSaving]               = useState(false)

  // View/edit modal
  const [viewDoc, setViewDoc]             = useState<Document | null>(null)
  const [editingDoc, setEditingDoc]       = useState(false)
  const [editContent, setEditContent]     = useState<any>({})

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [bookingsRes, doctorRes] = await Promise.all([
        apiClient.get('/bookings/practice'),
        apiClient.get('/doctors/today'),
      ])
      setBookings(bookingsRes.data)
      const doc = doctorRes.data.doctor ?? doctorRes.data
      setDoctorName(doc.user_id ?? '')
      setPracticeName(doc.practice_name ?? '')

      // Load all docs for all patients
      const patientIds = Array.from(new Set(bookingsRes.data.map((b: Booking) => b.id)))
      const docsPromises = bookingsRes.data.map((b: Booking) =>
        apiClient.get(`/documents/patient/${b.patient_id ?? b.id}`).catch(() => ({ data: [] }))
      )
      const docsResults = await Promise.all(docsPromises)
      const allDocs = docsResults.flatMap((r: any) => r.data)
      const unique = allDocs.filter((d: Document, i: number, arr: Document[]) =>
        arr.findIndex(x => x.id === d.id) === i
      )
      setDocuments(unique)
    } catch {
      setBookings([])
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const openGenerate = (booking: Booking) => {
    setSelectedBooking(booking)
    setSelectedDocType('sick_letter')
    setDocContent(buildDefaultContent('sick_letter', booking, doctorName))
    setPreviewMode(false)
    setShowGenModal(true)
  }

  const handleDocTypeChange = (type: string) => {
    setSelectedDocType(type)
    if (selectedBooking) {
      setDocContent(buildDefaultContent(type, selectedBooking, doctorName))
    }
    setPreviewMode(false)
  }

  const handleContentChange = (key: string, value: string) => {
    setDocContent((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!selectedBooking) return
    setSaving(true)
    try {
      await apiClient.post('/documents/generate', {
        booking_id: selectedBooking.id,
        doc_type: selectedDocType,
        content: docContent,
      })
      setShowGenModal(false)
      load()
    } catch {}
    setSaving(false)
  }

  const handlePrint = () => {
    const printContent = document.getElementById('doc-preview')?.innerHTML
    if (!printContent) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>${DOC_TYPE_MAP[viewDoc?.doc_type ?? selectedDocType]}</title>
      <style>body{font-family:'DM Sans',sans-serif;padding:40px;font-size:13px;line-height:1.8;color:#111}h1,h2{font-family:'Syne',sans-serif}strong{font-weight:600}</style>
      </head><body>${printContent}</body></html>
    `)
    win.document.close()
    win.print()
  }

  const openView = (doc: Document) => {
    setViewDoc(doc)
    setEditContent(doc.content)
    setEditingDoc(false)
  }

  const handleEditSave = async () => {
    if (!viewDoc) return
    setSaving(true)
    try {
      // Update via regenerate with same booking_id
      await apiClient.post('/documents/generate', {
        booking_id: viewDoc.booking_id,
        doc_type: viewDoc.doc_type,
        content: editContent,
      })
      setViewDoc(null)
      load()
    } catch {}
    setSaving(false)
  }

  const getPatientName = (bookingId: string) => {
    const b = bookings.find(x => x.id === bookingId)
    return b?.doctor_name ?? 'Unknown'
  }

  const filtered = documents.filter(d => {
    const q = search.toLowerCase()
    const name = getPatientName(d.booking_id).toLowerCase()
    const matchSearch = name.includes(q)
    const matchType = typeFilter === 'all' || d.doc_type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── HEADER ── */}
        <div style={{ padding: '24px 32px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 4, height: 22, backgroundColor: colors.primary, borderRadius: 2 }} />
            <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0 }}>Documents</h1>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
            <button onClick={load} style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ico i={HiOutlineRefresh} size={15} />
            </button>
          </div>

          {/* Filter bar */}
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Ico i={HiOutlineSearch} size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient name..." style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {[{ key: 'all', label: 'All types' }, ...DOC_TYPES.map(d => ({ key: d.key, label: d.label }))].map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${typeFilter === f.key ? colors.primary : colors.border}`, backgroundColor: typeFilter === f.key ? colors.primaryBg : 'transparent', color: typeFilter === f.key ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: typeFilter === f.key ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Generate from booking */}
            <div style={{ position: 'relative' }}>
              <select
                onChange={e => {
                  const b = bookings.find(x => x.id === e.target.value)
                  if (b) openGenerate(b)
                  e.target.value = ''
                }}
                defaultValue=""
                style={{ appearance: 'none', paddingLeft: 32, paddingRight: 32, paddingTop: 8, paddingBottom: 8, backgroundColor: colors.primary, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
              >
                <option value="" disabled>+ Generate document</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>{b.doctor_name} — {b.slot_date}</option>
                ))}
              </select>
              <Ico i={HiOutlinePlus} size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none' }} />
              <Ico i={HiOutlineChevronDown} size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#fff', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* ── TABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 32px 32px' }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', backgroundColor: '#0A1A17', padding: '12px 20px', gap: 16 }}>
              {['Patient', 'Document type', 'Created', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>Loading documents...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 64, textAlign: 'center' }}>
                <Ico i={HiOutlineDocumentText} size={36} style={{ color: colors.textFaint, marginBottom: 12, justifyContent: 'center' }} />
                <div style={{ fontSize: 15, fontWeight: 500, color: colors.text, marginBottom: 4 }}>No documents yet</div>
                <div style={{ fontSize: 13, color: colors.textMuted }}>Use the Generate button to create a document after a consultation</div>
              </div>
            ) : (
              filtered.map((doc, i) => (
                <div
                  key={doc.id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${colors.border}` : 'none', alignItems: 'center', gap: 16, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.bgElevated)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Patient */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.primary }}>
                      {getPatientName(doc.booking_id).charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{getPatientName(doc.booking_id)}</span>
                  </div>

                  {/* Doc type */}
                  <span style={{ fontSize: 13, color: colors.textMuted }}>{DOC_TYPE_MAP[doc.doc_type] ?? doc.doc_type}</span>

                  {/* Created */}
                  <span style={{ fontSize: 12, color: colors.textFaint }}>
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-ZA') : '—'}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openView(doc)} title="View / Edit" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ico i={HiOutlineEye} size={15} />
                    </button>
                    <button onClick={() => { openView(doc); setEditingDoc(true) }} title="Edit" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${colors.border}`, background: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ico i={HiOutlinePencil} size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── GENERATE MODAL ── */}
      {showGenModal && selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal header */}
            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>Generate document</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  {selectedBooking.doctor_name} · {selectedBooking.slot_date}
                  {selectedBooking.intake_brief && (
                    <span style={{ marginLeft: 8, color: colors.primary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Ico i={RiRobot2Line} size={11} /> Pre-filled from intake
                    </span>
                    )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${previewMode ? colors.primary : colors.border}`, backgroundColor: previewMode ? colors.primaryBg : 'transparent', color: previewMode ? colors.primary : colors.textMuted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Ico i={HiOutlineEye} size={14} />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
                <button onClick={() => setShowGenModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                  <Ico i={HiOutlineX} size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
              {/* Doc type selector */}
              <div style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '16px 0', flexShrink: 0, overflowY: 'auto' }}>
                {DOC_TYPES.map(dt => (
                  <button
                    key={dt.key}
                    onClick={() => handleDocTypeChange(dt.key)}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', borderLeft: `3px solid ${selectedDocType === dt.key ? colors.primary : 'transparent'}`, backgroundColor: selectedDocType === dt.key ? colors.primaryBg : 'transparent', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: selectedDocType === dt.key ? 600 : 400, color: selectedDocType === dt.key ? colors.primary : colors.text }}>{dt.label}</div>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{dt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Form / Preview */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {previewMode ? (
                  <div id="doc-preview">
                    <DocumentPreview docType={selectedDocType} content={docContent} doctorName={doctorName} practiceName={practiceName} />
                  </div>
                ) : (
                  <DocumentForm docType={selectedDocType} content={docContent} onChange={handleContentChange} />
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => setShowGenModal(false)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              {previewMode && (
                <button onClick={handlePrint} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ico i={HiOutlineDownload} size={15} />
                  Print / Save PDF
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ marginLeft: 'auto', padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}
              >
                <Ico i={HiOutlineCheck} size={15} />
                {saving ? 'Saving...' : 'Save document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW / EDIT MODAL ── */}
      {viewDoc && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, width: '100%', maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>
                  {DOC_TYPE_MAP[viewDoc.doc_type]} — {getPatientName(viewDoc.booking_id)}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Created {new Date(viewDoc.created_at).toLocaleDateString('en-ZA')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditingDoc(!editingDoc)} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${editingDoc ? colors.primary : colors.border}`, backgroundColor: editingDoc ? colors.primaryBg : 'transparent', color: editingDoc ? colors.primary : colors.textMuted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ico i={HiOutlinePencil} size={14} />
                  {editingDoc ? 'Preview' : 'Edit'}
                </button>
                <button onClick={() => setViewDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex' }}>
                  <Ico i={HiOutlineX} size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {editingDoc ? (
                <DocumentForm
                  docType={viewDoc.doc_type}
                  content={editContent}
                  onChange={(key, val) => setEditContent((prev: any) => ({ ...prev, [key]: val }))}
                />
              ) : (
                <div id="doc-preview">
                  <DocumentPreview docType={viewDoc.doc_type} content={viewDoc.content} doctorName={doctorName} practiceName={practiceName} />
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={() => setViewDoc(null)} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer' }}>
                Close
              </button>
              {!editingDoc && (
                <button onClick={handlePrint} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ico i={HiOutlineDownload} size={15} />
                  Print / Save PDF
                </button>
              )}
              {editingDoc && (
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  style={{ marginLeft: 'auto', padding: '10px 24px', borderRadius: 8, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}
                >
                  <Ico i={HiOutlineCheck} size={15} />
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}