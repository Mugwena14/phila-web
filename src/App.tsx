import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingPage from './pages/dashboard/OnboardingPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import { ThemeProvider } from './context/ThemeContext'
import WaitingRoomPage from './pages/WaitingRoomPage'

function AppRoutes() {
  const { token } = useAuth()

  return (
    <Routes>
      {/* ── PUBLIC — no auth required ── */}
      <Route path="/waiting-room" element={<WaitingRoomPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── AUTH GATED ── */}
      {token ? (
        <>
          <Route path="/onboarding"  element={<OnboardingPage />} />
          <Route path="/dashboard/*" element={<DashboardLayout />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  )
}