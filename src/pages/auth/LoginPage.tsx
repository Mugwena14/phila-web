import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/auth'
import { User } from '../../types'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { colors } from '../../theme/colors'

export default function LoginPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (email.trim() === '' || password.trim() === '') {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const tokenData = await authApi.login({ email, password })
      const user: User = {
        id: '',
        full_name: '',
        email,
        phone: '',
        role: 'doctor',
        language_pref: 'en',
      }
      setAuth(user, tokenData.access_token)
      navigate('/dashboard')
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Login failed. Check your details.')
      } else {
        setError('Something went wrong. Please try again.')
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
          <h1 style={{ fontSize: '36px', color: colors.gold, marginBottom: '8px' }}>Phila</h1>
          <p style={{ color: colors.textMuted, fontSize: '15px' }}>Practice dashboard — sign in to continue</p>
        </div>

        <form onSubmit={(e) => void handleLogin(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Email address"
            type="email"
            placeholder="doctor@practice.co.za"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error !== '' && (
            <p style={{ color: colors.coral, fontSize: '13px' }}>{error}</p>
          )}

          <Button
            label="Sign in"
            type="submit"
            loading={loading}
            fullWidth
            style={{ marginTop: '8px' }}
          />
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: colors.textMuted }}>
          No account?{' '}
          <span
            style={{ color: colors.gold, cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/register')}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  )
}