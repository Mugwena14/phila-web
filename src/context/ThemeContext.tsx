import React, { createContext, useContext, useState } from 'react'

const darkColors = {
  bgBase: '#080F0E',
  bgSurface: '#0D1614',
  bgElevated: '#142420',
  primary: '#14B8A6',
  primaryDim: '#0F8A7B',
  primaryBg: 'rgba(20,184,166,0.08)',
  primaryBorder: 'rgba(20,184,166,0.2)',
  coral: '#FF6B6B',
  coralBg: 'rgba(255,107,107,0.08)',
  coralBorder: 'rgba(255,107,107,0.2)',
  text: '#F0F4F3',
  textMuted: '#8FA89E',
  textFaint: '#4A6560',
  border: 'rgba(20,184,166,0.08)',
  borderStrong: 'rgba(20,184,166,0.16)',
}

const lightColors = {
  bgBase: '#F0F7F5',
  bgSurface: '#FFFFFF',
  bgElevated: '#E4F0ED',
  primary: '#0F766E',
  primaryDim: '#0D6B63',
  primaryBg: 'rgba(15,118,110,0.07)',
  primaryBorder: 'rgba(15,118,110,0.2)',
  coral: '#DC2626',
  coralBg: 'rgba(220,38,38,0.07)',
  coralBorder: 'rgba(220,38,38,0.2)',
  text: '#0A1410',
  textMuted: '#3D6058',
  textFaint: '#7A9E96',
  border: 'rgba(15,118,110,0.12)',
  borderStrong: 'rgba(15,118,110,0.22)',
}

export type ThemeColors = typeof darkColors

interface ThemeContextType {
  isDark: boolean
  colors: ThemeColors
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false) // ← light mode default

  return (
    <ThemeContext.Provider value={{
      isDark,
      colors: isDark ? darkColors : lightColors,
      toggle: () => setIsDark(p => !p),
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}