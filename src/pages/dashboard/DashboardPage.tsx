import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../../context/AuthContext'
import { doctorsApi } from '../../api/doctors'
import { Doctor, Slot } from '../../types'
import apiClient from '../../api/client'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { colors } from '../../theme/colors'

interface PatientBooking {
  id: string
  doctor_name: string
  slot_date: string
  slot_start_time: string
  reason: string
  risk_score: string
  intake_status: string
  intake_brief: any
  crisis_flag: string | null
  specialty: string
}

export default function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<PatientBooking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const profile = await doctorsApi.getProfile()
        setDoctor(profile)
        const todaySlots = await doctorsApi.getSlots(profile.id, today)
        setSlots(todaySlots)

        // Load patient bookings with intake briefs
        const bookingData = await apiClient.get('/bookings/practice')
        setBookings(bookingData.data)
      } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 404) {
          navigate('/onboarding')
        } else {
          setError('Failed to load dashboard')
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [navigate, today])

  const handleLogout = (): void => {
    logout()
    navigate('/login')
  }

  const getRiskLabel = (score: string) => {
    const n = parseInt(score || '0')
    if (n < 30) return { label: 'Low risk', color: colors.primary }
    if (n < 65) return { label: 'Medium risk', color: '#F59E0B' }
    return { label: 'High risk', color: colors.coral }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: colors.textMuted }}>Loading your dashboard...</p>
      </div>
    )
  }

  const availableSlots = slots.filter((s) => s.status === 'available')
  const bookedSlots = slots.filter((s) => s.status === 'booked')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgBase }}>

      {/* Top nav */}
      <div style={{ backgroundColor: colors.bgSurface, borderBottom: `1px solid ${colors.border}`, padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '20px', color: colors.primary }}>Phila Practice</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {doctor && (
            <span style={{ fontSize: '14px', color: colors.textMuted }}>
              {doctor.practice_name}
            </span>
          )}
          <Button label="Sign out" onClick={handleLogout} variant="ghost" style={{ padding: '6px 16px', fontSize: '13px' }} />
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {error !== '' && (
          <p style={{ color: colors.coral, marginBottom: '24px' }}>{error}</p>
        )}

        {doctor && (
          <>
            {/* Welcome */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', color: colors.text, marginBottom: '4px' }}>
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {doctor.practice_name}
              </h2>
              <p style={{ color: colors.textMuted }}>
                {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Agent stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: "Today's slots", value: slots.length },
                { label: 'Booked', value: bookedSlots.length },
                { label: 'Available', value: availableSlots.length },
                { label: 'Intake complete', value: bookings.filter(b => b.intake_status === 'complete').length },
                { label: 'Intake pending', value: bookings.filter(b => b.intake_status === 'pending').length },
                { label: 'Crisis flags', value: bookings.filter(b => b.crisis_flag).length },
              ].map((stat) => (
                <div key={stat.label} style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: '16px 20px' }}>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: colors.text }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedBooking ? '1fr 380px' : '1fr', gap: 24, marginBottom: 32 }}>

              {/* Patient bookings with briefs */}
              <div>
                <h3 style={{ fontSize: '16px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: colors.text, marginBottom: 16 }}>
                  Patient bookings
                </h3>

                {bookings.length === 0 ? (
                  <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 32, textAlign: 'center', color: colors.textMuted }}>
                    No patient bookings yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bookings.map((booking) => {
                      const risk = getRiskLabel(booking.risk_score)
                      const isSelected = selectedBooking?.id === booking.id

                      return (
                        <div
                          key={booking.id}
                          onClick={() => setSelectedBooking(isSelected ? null : booking)}
                          style={{
                            backgroundColor: colors.bgSurface,
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? colors.primary : colors.border}`,
                            padding: '16px 20px',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s',
                          }}
                        >
                          {/* Crisis banner */}
                          {booking.crisis_flag && (
                            <div style={{ backgroundColor: '#FAECE7', border: '1px solid #F09995', borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>⚠️</span>
                              <span style={{ fontSize: 12, color: '#712B13', fontWeight: 500 }}>
                                Crisis flag — {booking.crisis_flag} severity. Follow up with this patient.
                              </span>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryBg, border: `1px solid ${colors.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: colors.primary }}>
                                {booking.doctor_name?.charAt(0) ?? 'P'}
                              </div>
                              <div>
                                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 2 }}>
                                  {booking.doctor_name ?? 'Patient'}
                                </div>
                                <div style={{ fontSize: 13, color: colors.textMuted }}>
                                  {booking.slot_date} · {booking.slot_start_time?.slice(0, 5)}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: risk.color, backgroundColor: `${risk.color}15`, border: `1px solid ${risk.color}30`, borderRadius: 999, padding: '3px 10px' }}>
                                {risk.label}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '3px 10px', backgroundColor: booking.intake_status === 'complete' ? colors.primaryBg : colors.bgElevated, color: booking.intake_status === 'complete' ? colors.primary : colors.textFaint, border: `1px solid ${booking.intake_status === 'complete' ? colors.primaryBorder : colors.border}` }}>
                                {booking.intake_status === 'complete' ? '✓ Intake complete' : 'Intake pending'}
                              </span>
                            </div>
                          </div>

                          {booking.reason && (
                            <div style={{ marginTop: 12, fontSize: 13, color: colors.textMuted, backgroundColor: colors.bgElevated, borderRadius: 8, padding: '8px 12px' }}>
                              <span style={{ fontWeight: 500, color: colors.text }}>Reason: </span>{booking.reason}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Brief drawer */}
              {selectedBooking && (
                <div style={{ backgroundColor: colors.bgSurface, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, height: 'fit-content', position: 'sticky', top: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: colors.text, margin: 0 }}>
                      Patient brief
                    </h3>
                    <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: 18 }}>✕</button>
                  </div>

                  <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient</div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: colors.text }}>{selectedBooking.doctor_name}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{selectedBooking.slot_date} · {selectedBooking.slot_start_time?.slice(0, 5)}</div>
                  </div>

                  {selectedBooking.intake_brief ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {[
                        { label: 'Main concern', value: selectedBooking.intake_brief.main_concern },
                        { label: 'Duration', value: selectedBooking.intake_brief.duration },
                        { label: 'Severity', value: `${selectedBooking.intake_brief.severity} / 10` },
                        { label: 'Language', value: selectedBooking.intake_brief.language_used },
                      ].map((item) => item.value && (
                        <div key={item.label}>
                          <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>{item.value}</div>
                        </div>
                      ))}

                      {selectedBooking.intake_brief.medications?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Medications</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {selectedBooking.intake_brief.medications.map((med: string) => (
                              <span key={med} style={{ fontSize: 12, backgroundColor: colors.primaryBg, color: colors.primary, border: `1px solid ${colors.primaryBorder}`, borderRadius: 999, padding: '3px 10px' }}>{med}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedBooking.intake_brief.allergies?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Allergies</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {selectedBooking.intake_brief.allergies.map((allergy: string) => (
                              <span key={allergy} style={{ fontSize: 12, backgroundColor: '#FAECE7', color: '#712B13', border: '1px solid #F09995', borderRadius: 999, padding: '3px 10px' }}>{allergy}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedBooking.intake_brief.additional_notes && (
                        <div>
                          <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Additional notes</div>
                          <div style={{ fontSize: 14, color: colors.text, backgroundColor: colors.bgElevated, borderRadius: 8, padding: '10px 12px', lineHeight: 1.6 }}>
                            {selectedBooking.intake_brief.additional_notes}
                          </div>
                        </div>
                      )}

                      {selectedBooking.intake_brief.crisis_flagged && (
                        <div style={{ backgroundColor: '#FAECE7', border: '1px solid #F09995', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 12, color: '#712B13', fontWeight: 600 }}>⚠️ Crisis flag detected during intake. Handle with care.</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: colors.textMuted }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🕐</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: colors.text, marginBottom: 4 }}>Intake not completed yet</div>
                      <div style={{ fontSize: 13 }}>The patient will receive a WhatsApp reminder shortly.</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Practice info + Today's schedule */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <Card>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: colors.text }}>Practice info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Specialty', value: doctor.specialty },
                    { label: 'Practice', value: doctor.practice_name },
                    { label: 'Location', value: `${doctor.city}, ${doctor.province}` },
                    { label: 'Experience', value: `${doctor.years_experience} years` },
                    { label: 'Fee', value: `R${doctor.consultation_fee}` },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: `1px solid ${colors.border}` }}>
                      <span style={{ fontSize: '13px', color: colors.textMuted }}>{item.label}</span>
                      <span style={{ fontSize: '13px', color: colors.text, fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', color: colors.text }}>Today's schedule</h3>
                  <Badge label={`${slots.length} slots`} variant="gray" />
                </div>
                {slots.length === 0 ? (
                  <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No slots generated for today.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${slot.status === 'booked' ? colors.primaryBorder : colors.border}`,
                          backgroundColor: slot.status === 'booked' ? colors.primaryBg : colors.bgElevated,
                          textAlign: 'center',
                        }}
                      >
                        <p style={{ fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: slot.status === 'booked' ? colors.primary : colors.text }}>
                          {slot.start_time.slice(0, 5)}
                        </p>
                        <p style={{ fontSize: '11px', color: colors.textFaint, marginTop: '2px' }}>
                          {slot.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Medical aids + Languages */}
            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: colors.text }}>Medical aids accepted</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {doctor.medical_aids.map((aid) => (
                      <Badge key={aid} label={aid} variant="gold" />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: colors.text }}>Languages</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {doctor.languages.map((lang) => (
                      <Badge key={lang} label={lang} variant="teal" />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}