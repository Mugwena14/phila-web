import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { doctorsApi } from '../../api/doctors'
import { WorkingHoursInput } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { colors } from '../../theme/colors'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DEFAULT_HOURS: WorkingHoursInput[] = DAYS.map((_, i) => ({
  day_of_week: i,
  is_active: i < 5,
  start_time: '08:00:00',
  end_time: '17:00:00',
}))

const SA_MEDICAL_AIDS = [
  'Discovery Health', 'Momentum Health', 'Bonitas',
  'Medihelp', 'Fedhealth', 'Bestmed', 'Gems', 'Cash patients'
]

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
]

export default function OnboardingPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const [specialty, setSpecialty] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [yearsExp, setYearsExp] = useState<string>('')
  const [qualification, setQualification] = useState<string>('')
  const [practiceName, setPracticeName] = useState<string>('')
  const [address, setAddress] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [province, setProvince] = useState<string>('')
  const [fee, setFee] = useState<string>('')
  const [slotDuration, setSlotDuration] = useState<string>('20')
  const [selectedAids, setSelectedAids] = useState<string[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingHoursInput[]>(DEFAULT_HOURS)

  const toggleAid = (aid: string): void => {
    setSelectedAids((prev) =>
      prev.includes(aid) ? prev.filter((a) => a !== aid) : [...prev, aid]
    )
  }

  const updateHours = (index: number, field: keyof WorkingHoursInput, value: string | boolean): void => {
    setWorkingHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  const handleSubmit = async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      await doctorsApi.register({
        specialty,
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
      navigate('/dashboard')
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

  const inputStyle = { marginBottom: '16px' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgBase, padding: '40px 24px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', color: colors.gold, marginBottom: '4px' }}>Phila Practice</h1>
          <p style={{ color: colors.textMuted }}>Step {step} of 3 — {step === 1 ? 'Professional info' : step === 2 ? 'Practice details' : 'Working hours'}</p>
          <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: s <= step ? colors.gold : colors.bgElevated }} />
            ))}
          </div>
        </div>

        <Card>
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '24px', color: colors.text }}>Professional info</h2>
              <Input label="Specialty" placeholder="e.g. General Practitioner" value={specialty} onChange={(e) => setSpecialty(e.target.value)} containerStyle={inputStyle} />
              <Input label="Qualification" placeholder="e.g. MBChB (UCT)" value={qualification} onChange={(e) => setQualification(e.target.value)} containerStyle={inputStyle} />
              <Input label="Years of experience" type="number" placeholder="8" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} containerStyle={inputStyle} />
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '6px' }}>Bio</label>
                <textarea
                  placeholder="Tell patients about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  style={{ width: '100%', backgroundColor: colors.bgElevated, border: `1px solid ${colors.borderStrong}`, borderRadius: '12px', padding: '12px 16px', color: colors.text, fontSize: '15px', outline: 'none', resize: 'vertical' }}
                />
              </div>
              <Button label="Next" onClick={() => setStep(2)} fullWidth />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '24px', color: colors.text }}>Practice details</h2>
              <Input label="Practice name" placeholder="Healthpoint Medical Centre" value={practiceName} onChange={(e) => setPracticeName(e.target.value)} containerStyle={inputStyle} />
              <Input label="Street address" placeholder="12 Main Road" value={address} onChange={(e) => setAddress(e.target.value)} containerStyle={inputStyle} />
              <Input label="City" placeholder="Makhanda" value={city} onChange={(e) => setCity(e.target.value)} containerStyle={inputStyle} />
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '6px' }}>Province</label>
                <select value={province} onChange={(e) => setProvince(e.target.value)} style={{ width: '100%', backgroundColor: colors.bgElevated, border: `1px solid ${colors.borderStrong}`, borderRadius: '12px', padding: '12px 16px', color: province ? colors.text : colors.textFaint, fontSize: '15px', outline: 'none' }}>
                  <option value="">Select province</option>
                  {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <Input label="Consultation fee (ZAR)" type="number" placeholder="450" value={fee} onChange={(e) => setFee(e.target.value)} containerStyle={inputStyle} />
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '6px' }}>Slot duration (minutes)</label>
                <select value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} style={{ width: '100%', backgroundColor: colors.bgElevated, border: `1px solid ${colors.borderStrong}`, borderRadius: '12px', padding: '12px 16px', color: colors.text, fontSize: '15px', outline: 'none' }}>
                  {['15', '20', '30', '45', '60'].map((d) => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '10px' }}>Medical aids accepted</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SA_MEDICAL_AIDS.map((aid) => (
                    <span
                      key={aid}
                      onClick={() => toggleAid(aid)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: `1px solid ${selectedAids.includes(aid) ? colors.goldBorder : colors.border}`,
                        backgroundColor: selectedAids.includes(aid) ? colors.goldBg : 'transparent',
                        color: selectedAids.includes(aid) ? colors.gold : colors.textMuted,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {aid}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button label="Back" onClick={() => setStep(1)} variant="ghost" fullWidth />
                <Button label="Next" onClick={() => setStep(3)} fullWidth />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '24px', color: colors.text }}>Working hours</h2>
              {workingHours.map((wh, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '12px', backgroundColor: colors.bgElevated, borderRadius: '12px' }}>
                  <input
                    type="checkbox"
                    checked={wh.is_active}
                    onChange={(e) => updateHours(i, 'is_active', e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: colors.gold }}
                  />
                  <span style={{ width: '90px', fontSize: '13px', color: wh.is_active ? colors.text : colors.textFaint }}>{DAYS[i]}</span>
                  {wh.is_active && (
                    <>
                      <input type="time" value={wh.start_time.slice(0, 5)} onChange={(e) => updateHours(i, 'start_time', `${e.target.value}:00`)} style={{ backgroundColor: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '6px 10px', color: colors.text, fontSize: '13px', outline: 'none' }} />
                      <span style={{ color: colors.textFaint, fontSize: '13px' }}>to</span>
                      <input type="time" value={wh.end_time.slice(0, 5)} onChange={(e) => updateHours(i, 'end_time', `${e.target.value}:00`)} style={{ backgroundColor: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '6px 10px', color: colors.text, fontSize: '13px', outline: 'none' }} />
                    </>
                  )}
                  {!wh.is_active && <span style={{ fontSize: '13px', color: colors.textFaint }}>Closed</span>}
                </div>
              ))}

              {error !== '' && <p style={{ color: colors.coral, fontSize: '13px', marginTop: '12px' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Button label="Back" onClick={() => setStep(2)} variant="ghost" fullWidth />
                <Button label="Complete setup" onClick={() => void handleSubmit()} loading={loading} fullWidth />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}