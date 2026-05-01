import React from 'react'
import { colors } from '../../theme/colors'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

interface ButtonProps {
  label: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: React.CSSProperties
  icon?: string
}

export default function Button({
  label,
  onClick,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  icon,
}: ButtonProps) {
  const getStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: '13px 26px',
      borderRadius: '999px',
      border: 'none',
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      fontSize: '15px',
      letterSpacing: '0.2px',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.45 : 1,
      transition: 'all 0.15s ease',
      width: fullWidth ? '100%' : 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    }

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: colors.primary, color: '#FFFFFF' }
      case 'outline':
        return { ...base, backgroundColor: 'transparent', color: colors.primary, border: `1.5px solid ${colors.primary}` }
      case 'secondary':
        return { ...base, backgroundColor: colors.bgElevated, color: colors.text, border: `1px solid ${colors.borderStrong}` }
      case 'ghost':
        return { ...base, backgroundColor: 'transparent', color: colors.text, border: `1px solid ${colors.border}` }
      case 'danger':
        return { ...base, backgroundColor: colors.coralBg, color: colors.coral, border: `1px solid ${colors.coralBorder}` }
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...getStyle(), ...style }}
    >
      {icon && <span>{icon}</span>}
      {loading ? 'Loading...' : label}
    </button>
  )
}