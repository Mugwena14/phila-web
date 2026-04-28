import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth'
import { User } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { colors } from '../../theme/colors'

export default function RegisterPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleRegister = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      await authApi.register({ full_name: fullName, email, phone, password })
      const tokenData = await authApi.login({ email, password })
      const user: User = {
        id: '',
        full_name: fullName,
        email,
        phone,
        role: 'doctor',
        language_pref: 'en',
      }
      setAuth(user, tokenData.access_token)
      navigate('/onboarding')
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Registration failed.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgBase,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', color: colors.text, marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: colors.textMuted }}>Join Phila Practice</p>
        </div>

        <form onSubmit={(e) => void handleRegister(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Full name" placeholder="Dr Nomvula Dlamini" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email address" type="email" placeholder="doctor@practice.co.za" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Phone (WhatsApp)" type="tel" placeholder="+27 82 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error !== '' && (
            <p style={{ color: colors.coral, fontSize: '13px' }}>{error}</p>
          )}

          <Button label="Create account" type="submit" loading={loading} fullWidth style={{ marginTop: '8px' }} />
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: colors.textMuted }}>
          Already have an account?{' '}
          <span style={{ color: colors.gold, cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/login')}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  )
}