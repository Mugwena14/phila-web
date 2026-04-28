import React from 'react'
import { colors } from '../../theme/colors'

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
  padded?: boolean
}

export default function Card({
  children,
  style,
  onClick,
  padded = true,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: padded ? '20px' : undefined,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
        ...style,
      }}
    >
      {children}
    </div>
  )
}