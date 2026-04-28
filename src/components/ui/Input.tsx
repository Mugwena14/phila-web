import React, { useState } from 'react'
import { colors } from '../../theme/colors'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  containerStyle?: React.CSSProperties
}

export default function Input({
  label,
  error,
  containerStyle,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState<boolean>(false)

  const borderColor = error
    ? colors.coral
    : focused
    ? colors.gold
    : colors.borderStrong

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...containerStyle }}>
      {label !== undefined && (
        <label style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        style={{
          backgroundColor: colors.bgElevated,
          border: `1px solid ${borderColor}`,
          borderRadius: '12px',
          padding: '12px 16px',
          color: colors.text,
          fontSize: '15px',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error !== undefined && (
        <span style={{ fontSize: '12px', color: colors.coral }}>{error}</span>
      )}
    </div>
  )
}