import React from 'react'
import { colors } from '../../theme/colors'

type BadgeVariant = 'gold' | 'teal' | 'coral' | 'gray'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  dot?: boolean
}

export default function Badge({ label, variant = 'gray', dot = false }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'gold': return { bg: colors.goldBg, text: colors.gold, border: colors.goldBorder }
      case 'teal': return { bg: colors.tealBg, text: colors.teal, border: colors.tealBorder }
      case 'coral': return { bg: colors.coralBg, text: colors.coral, border: colors.coralBorder }
      case 'gray': return { bg: colors.bgElevated, text: colors.textMuted, border: colors.border }
    }
  }

  const c = getColors()

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: '6px',
      padding: '3px 8px',
      fontSize: '11px',
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.3px',
    }}>
      {dot && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.text, display: 'inline-block' }} />
      )}
      {label}
    </span>
  )
}