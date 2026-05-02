import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { doctorsApi } from '../../api/doctors'
import { WorkingHoursInput } from '../../types'
import { useTheme } from '../../context/ThemeContext'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_HOURS: WorkingHoursInput[] = DAYS.map((_, i) => ({
  day_of_week: i,
  is_active: i < 5,
  start_time: '08:00:00',
  end_time: '17:00:00',
}))

const SA_SPECIALTIES = [
  'General Practitioner', 'Paediatrician', 'Gynaecologist', 'Obstetrician',
  'Cardiologist', 'Dermatologist', 'Orthopaedic Surgeon', 'Psychiatrist',
  'Neurologist', 'Ophthalmologist', 'ENT Specialist', 'Urologist',
  'Gastroenterologist', 'Pulmonologist', 'Endocrinologist', 'Oncologist',
  'Rheumatologist', 'Nephrologist', 'Dentist', 'Physiotherapist',
  'Occupational Therapist', 'Radiologist', 'Anaesthesiologist', 'Other',
]

const SA_MEDICAL_AIDS = [
  'Discovery Health', 'Momentum Health', 'Bonitas', 'Medihelp',
  'Fedhealth', 'Bestmed', 'GEMS', 'Profmed', 'Polmed', 'Selfmed',
  'Keyhealth', 'LA Health', 'Compcare', 'Resolution Health',
  'Sizwe', 'Cash patients',
]

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

const SLOT_DURATIONS = [
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
]

const STEPS = [
  { num: 1, label: 'Professional' },
  { num: 2, label: 'Practice' },
  { num: 3, label: 'Hours' },
  { num: 4, label: 'Preview' },
  { num: 5, label: 'Done' },
]

export default function OnboardingPage() {
  const { colors } = useTheme()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [specialty, setSpecialty]       = useState('')
  const [customSpecialty, setCustomSpecialty] = useState('')
  const [qualification, setQualification] = useState('')
  const [hpcsa, setHpcsa]               = useState('')
  const [yearsExp, setYearsExp]         = useState('')
  const [bio, setBio]                   = useState('')

  // Step 2
  const [practiceName, setPracticeName] = useState('')
  const [address, setAddress]           = useState('')
  const [city, setCity]                 = useState('')
  const [province, setProvince]         = useState('')
  const [fee, setFee]                   = useState('')
  const [slotDuration, setSlotDuration] = useState('20')
  const [selectedAids, setSelectedAids] = useState<string[]>(['Cash patients'])

  // Step 3
  const [workingHours, setWorkingHours] = useState<WorkingHoursInput[]>(DEFAULT_HOURS)

  const toggleAid = (aid: string) =>
    setSelectedAids(prev => prev.includes(aid) ? prev.filter(a => a !== aid) : [...prev, aid])

  const updateHours = (i: number, field: keyof WorkingHoursInput, value: any) =>
    setWorkingHours(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h))

  const copyToAll = (sourceIndex: number) => {
    const source = workingHours[sourceIndex]
    setWorkingHours(prev => prev.map((h, i) =>
      h.is_active ? { ...h, start_time: source.start_time, end_time: source.end_time } : h
    ))
  }

  // Preview — generate sample slots
  const generatePreviewSlots = () => {
    const slots: string[] = []
    const dur = parseInt(slotDuration)
    const monday = workingHours.find(h => h.is_active)
    if (!monday) return slots
    const [startH, startM] = monday.start_time.split(':').map(Number)
    const [endH, endM] = monday.end_time.split(':').map(Number)
    let current = startH * 60 + startM
    const end = endH * 60 + endM
    while (current + dur <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0')
      const m = (current % 60).toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
      current += dur
    }
    return slots.slice(0, 8)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const finalSpecialty = specialty === 'Other' ? customSpecialty : specialty
      await doctorsApi.register({
        specialty: finalSpecialty,
        bio,
        years_experience: parseInt(yearsExp) || 0,
        qualification,
        practice_name: practiceName,
        address,
        city,
        province,
        consultation_fee: parseFloat(fee) || 0,
        slot_duration_minutes: parseInt(slotDuration) || 20,
        medical_aids: selectedAids,
        languages: ['English'],
        working_hours: workingHours,
      })
      setStep(5)
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Setup failed. Please try again.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Shared input style ──────────────────────────────────────────
  const inp = {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'DM Sans, sans-serif',
  }

  const label = (text: string) => (
    <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{text}</label>
  )

  const field = (children: React.ReactNode) => (
    <div style={{ marginBottom: 18 }}>{children}</div>
  )

  const previewSlots = generatePreviewSlots()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgBase, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: step === 5 ? 'center' : 'flex-start', padding: '40px 24px', fontFamily: 'DM Sans, sans-serif' }}>

      {step !== 5 && (
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 32 }}>

          {/* Logo */}
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: colors.primary }}>Phila</span>
            <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 8 }}>Practice setup</span>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
            {STEPS.filter(s => s.num < 5).map((s, i) => (
              <React.Fragment key={s.num}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, backgroundColor: step > s.num ? colors.primary : step === s.num ? colors.primary : colors.bgElevated, color: step >= s.num ? '#fff' : colors.textFaint, transition: 'all 0.2s', border: step === s.num ? `2px solid ${colors.primary}` : 'none' }}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span style={{ fontSize: 10, color: step >= s.num ? colors.primary : colors.textFaint, fontWeight: step === s.num ? 600 : 400, whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < 3 && (
                  <div style={{ flex: 1, height: 1, backgroundColor: step > s.num ? colors.primary : colors.border, margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── CARD ── */}
      {step !== 5 && (
        <div style={{ width: '100%', maxWidth: 560, backgroundColor: colors.bgSurface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 32 }}>

          {/* ── STEP 1 — Professional ── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0, marginBottom: 4 }}>Professional details</h2>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Tell us about your medical background</p>
              </div>

              {field(<>
                {label('Specialty *')}
                <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={{ ...inp }}>
                  <option value="">Select your specialty</option>
                  {SA_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </>)}

              {specialty === 'Other' && field(<>
                {label('Specify specialty *')}
                <input value={customSpecialty} onChange={e => setCustomSpecialty(e.target.value)} placeholder="e.g. Sports Medicine" style={inp} />
              </>)}

              {field(<>
                {label('Qualification *')}
                <input value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. MBChB (UCT)" style={inp} />
              </>)}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  {label('HPCSA number')}
                  <input value={hpcsa} onChange={e => setHpcsa(e.target.value)} placeholder="MP123456" style={inp} />
                </div>
                <div>
                  {label('Years experience')}
                  <input value={yearsExp} onChange={e => setYearsExp(e.target.value)} type="number" placeholder="8" style={inp} />
                </div>
              </div>

              {field(<>
                {label('Bio')}
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell patients about yourself and your approach to care..." rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
              </>)}

              <button
                onClick={() => { if (!specialty || !qualification) { setError('Please fill in specialty and qualification'); return }; setError(''); setStep(2) }}
                style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
              >
                Continue →
              </button>
              {error && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 10, textAlign: 'center' }}>{error}</p>}
            </>
          )}

          {/* ── STEP 2 — Practice ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0, marginBottom: 4 }}>Practice details</h2>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Where patients will find and book you</p>
              </div>

              {field(<>
                {label('Practice name *')}
                <input value={practiceName} onChange={e => setPracticeName(e.target.value)} placeholder="e.g. Healthpoint Medical Centre" style={inp} />
              </>)}

              {field(<>
                {label('Street address *')}
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="12 Main Road" style={inp} />
              </>)}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  {label('City *')}
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Makhanda" style={inp} />
                </div>
                <div>
                  {label('Province *')}
                  <select value={province} onChange={e => setProvince(e.target.value)} style={inp}>
                    <option value="">Select province</option>
                    {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  {label('Consultation fee (ZAR) *')}
                  <input value={fee} onChange={e => setFee(e.target.value)} type="number" placeholder="450" style={inp} />
                </div>
                <div>
                  {label('Slot duration')}
                  <select value={slotDuration} onChange={e => setSlotDuration(e.target.value)} style={inp}>
                    {SLOT_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              {field(<>
                {label('Medical aids accepted')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {SA_MEDICAL_AIDS.map(aid => (
                    <button
                      key={aid}
                      onClick={() => toggleAid(aid)}
                      style={{ padding: '6px 13px', borderRadius: 999, border: `1px solid ${selectedAids.includes(aid) ? colors.primary : colors.border}`, backgroundColor: selectedAids.includes(aid) ? colors.primaryBg : 'transparent', color: selectedAids.includes(aid) ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: selectedAids.includes(aid) ? 600 : 400, cursor: 'pointer' }}
                    >
                      {aid}
                    </button>
                  ))}
                </div>
              </>)}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px', borderRadius: 10, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 14, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={() => { if (!practiceName || !address || !city || !province || !fee) { setError('Please fill in all required fields'); return }; setError(''); setStep(3) }}
                  style={{ flex: 2, padding: '13px', borderRadius: 10, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
                >
                  Continue →
                </button>
              </div>
              {error && <p style={{ color: '#DC2626', fontSize: 12, marginTop: 10, textAlign: 'center' }}>{error}</p>}
            </>
          )}

          {/* ── STEP 3 — Working hours ── */}
          {step === 3 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0, marginBottom: 4 }}>Working hours</h2>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Set your availability — you can change this anytime</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {workingHours.map((wh, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', backgroundColor: wh.is_active ? colors.primaryBg : colors.bgElevated, borderRadius: 10, border: `1px solid ${wh.is_active ? colors.primaryBorder : colors.border}`, transition: 'all 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={wh.is_active}
                      onChange={e => updateHours(i, 'is_active', e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: colors.primary, flexShrink: 0 }}
                    />
                    <span style={{ width: 86, fontSize: 13, fontWeight: 500, color: wh.is_active ? colors.text : colors.textFaint, flexShrink: 0 }}>
                      {DAYS[i]}
                    </span>
                    {wh.is_active ? (
                      <>
                        <input
                          type="time"
                          value={wh.start_time.slice(0, 5)}
                          onChange={e => updateHours(i, 'start_time', `${e.target.value}:00`)}
                          style={{ backgroundColor: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '5px 10px', color: colors.text, fontSize: 13, outline: 'none' }}
                        />
                        <span style={{ fontSize: 12, color: colors.textFaint }}>to</span>
                        <input
                          type="time"
                          value={wh.end_time.slice(0, 5)}
                          onChange={e => updateHours(i, 'end_time', `${e.target.value}:00`)}
                          style={{ backgroundColor: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '5px 10px', color: colors.text, fontSize: 13, outline: 'none' }}
                        />
                        <button
                          onClick={() => copyToAll(i)}
                          title="Copy these hours to all active days"
                          style={{ marginLeft: 'auto', fontSize: 11, color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Copy to all
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: colors.textFaint }}>Closed</span>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', borderRadius: 10, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 14, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(4)} style={{ flex: 2, padding: '13px', borderRadius: 10, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                  Preview schedule →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 4 — Preview ── */}
          {step === 4 && (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, margin: 0, marginBottom: 4 }}>Your schedule preview</h2>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>This is what a typical day will look like for patients booking you</p>
              </div>

              {/* Practice card */}
              <div style={{ backgroundColor: colors.bgElevated, borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 2 }}>{practiceName}</div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{specialty === 'Other' ? customSpecialty : specialty} · {city}, {province}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary, backgroundColor: colors.primaryBg, borderRadius: 999, padding: '3px 10px', border: `1px solid ${colors.primaryBorder}` }}>R{fee} / visit</span>
                  <span style={{ fontSize: 12, color: colors.textMuted, backgroundColor: colors.bgSurface, borderRadius: 999, padding: '3px 10px', border: `1px solid ${colors.border}` }}>{slotDuration} min slots</span>
                  <span style={{ fontSize: 12, color: colors.textMuted, backgroundColor: colors.bgSurface, borderRadius: 999, padding: '3px 10px', border: `1px solid ${colors.border}` }}>{workingHours.filter(h => h.is_active).length} days/week</span>
                </div>
              </div>

              {/* Slot preview */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>
                  Sample slots — {slotDuration} min each
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {previewSlots.map(slot => (
                    <div key={slot} style={{ backgroundColor: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 0', textAlign: 'center', fontSize: 13, fontWeight: 500, color: colors.text, fontFamily: 'JetBrains Mono, monospace' }}>
                      {slot}
                    </div>
                  ))}
                  {previewSlots.length === 0 && (
                    <div style={{ gridColumn: 'span 4', fontSize: 13, color: colors.textMuted, textAlign: 'center', padding: 12 }}>
                      No active working days configured
                    </div>
                  )}
                </div>
                {previewSlots.length > 0 && (
                  <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 8 }}>
                    +{Math.max(0, (parseInt(slotDuration) > 0 ? Math.floor(480 / parseInt(slotDuration)) : 0) - 8)} more slots per day · Slots auto-generate 14 days ahead
                  </div>
                )}
              </div>

              {/* Working days summary */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                {workingHours.map((wh, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: `1px solid ${wh.is_active ? colors.primaryBorder : colors.border}`, backgroundColor: wh.is_active ? colors.primaryBg : 'transparent', color: wh.is_active ? colors.primary : colors.textFaint, fontWeight: wh.is_active ? 600 : 400 }}>
                    {DAYS[i].slice(0, 3)}
                  </span>
                ))}
              </div>

              {error && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '13px', borderRadius: 10, border: `1px solid ${colors.border}`, backgroundColor: colors.bgElevated, color: colors.textMuted, fontSize: 14, cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={() => void handleSubmit()}
                  disabled={loading}
                  style={{ flex: 2, padding: '13px', borderRadius: 10, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Setting up...' : 'Launch my practice 🚀'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 5 — Done ── */}
      {step === 5 && (
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: colors.text, marginBottom: 8 }}>
            You're all set!
          </h1>
          <p style={{ fontSize: 15, color: colors.textMuted, lineHeight: 1.7, marginBottom: 32 }}>
            <strong style={{ color: colors.text }}>{practiceName}</strong> is now live on Phila.<br />
            Your slots are generating and patients can start booking.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: '14px', borderRadius: 12, border: 'none', backgroundColor: colors.primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}
            >
              Open dashboard →
            </button>
            <button
              onClick={() => {
                const text = `Book an appointment with ${practiceName} on Phila Health 🏥`
                if (navigator.share) {
                  navigator.share({ title: 'Book via Phila', text })
                } else {
                  navigator.clipboard.writeText(text)
                }
              }}
              style={{ padding: '13px', borderRadius: 12, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSurface, color: colors.textMuted, fontSize: 14, cursor: 'pointer' }}
            >
              Share booking link via WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}