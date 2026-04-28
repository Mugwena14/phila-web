import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../../context/AuthContext'
import { doctorsApi } from '../../api/doctors'
import { Doctor, Slot } from '../../types'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { colors } from '../../theme/colors'

export default function DashboardPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const profile = await doctorsApi.getProfile()
        setDoctor(profile)
        const todaySlots = await doctorsApi.getSlots(profile.id, today)
        setSlots(todaySlots)
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
        <h1 style={{ fontSize: '20px', color: colors.gold }}>Phila Practice</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {doctor && (
            <span style={{ fontSize: '14px', color: colors.textMuted }}>
              {doctor.practice_name}
            </span>
          )}
          <Button label="Sign out" onClick={handleLogout} variant="ghost" style={{ padding: '6px 16px', fontSize: '13px' }} />
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {error !== '' && (
          <p style={{ color: colors.coral, marginBottom: '24px' }}>{error}</p>
        )}

        {/* Welcome + stats */}
        {doctor && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', color: colors.text, marginBottom: '4px' }}>
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, Dr {doctor.user_id.slice(0, 4)}
              </h2>
              <p style={{ color: colors.textMuted }}>
                {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: "Today's slots", value: slots.length, variant: 'gray' as const },
                { label: 'Booked', value: bookedSlots.length, variant: 'teal' as const },
                { label: 'Available', value: availableSlots.length, variant: 'gold' as const },
                { label: 'Consultation fee', value: `R${doctor.consultation_fee}`, variant: 'gray' as const },
              ].map((stat) => (
                <Card key={stat.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px', fontFamily: 'Syne, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</p>
                  <p style={{ fontSize: '28px', fontFamily: 'Syne, sans-serif', fontWeight: 800, color: colors.text }}>{stat.value}</p>
                </Card>
              ))}
            </div>

            {/* Doctor profile card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <Card>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: colors.text }}>Practice info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Specialty', value: doctor.specialty },
                    { label: 'Practice', value: doctor.practice_name },
                    { label: 'Location', value: `${doctor.city}, ${doctor.province}` },
                    { label: 'Experience', value: `${doctor.years_experience} years` },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: `1px solid ${colors.border}` }}>
                      <span style={{ fontSize: '13px', color: colors.textMuted }}>{item.label}</span>
                      <span style={{ fontSize: '13px', color: colors.text, fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 style={{ fontSize: '16px', marginBottom: '16px', color: colors.text }}>Medical aids</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {doctor.medical_aids.map((aid) => (
                    <Badge key={aid} label={aid} variant="gold" />
                  ))}
                </div>
                <h3 style={{ fontSize: '16px', margin: '20px 0 12px', color: colors.text }}>Languages</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {doctor.languages.map((lang) => (
                    <Badge key={lang} label={lang} variant="teal" />
                  ))}
                </div>
              </Card>
            </div>

            {/* Today's slots */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', color: colors.text }}>Today's schedule</h3>
                <Badge label={`${slots.length} slots`} variant="gray" />
              </div>
              {slots.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>No slots generated for today yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${slot.status === 'booked' ? colors.tealBorder : colors.border}`,
                        backgroundColor: slot.status === 'booked' ? colors.tealBg : colors.bgElevated,
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: '13px', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: slot.status === 'booked' ? colors.teal : colors.text }}>
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
          </>
        )}
      </div>
    </div>
  )
}