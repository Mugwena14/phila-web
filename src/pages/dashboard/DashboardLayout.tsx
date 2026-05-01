import React, { useState } from 'react'
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../theme/colors'
import SchedulePage from './SchedulePage'
import PatientsPage from './PatientsPage'
import BookingsPage from './BookingsPage'
import DocumentsPage from './DocumentsPage'
import AnalyticsPage from './AnalyticsPage'
import OverviewPage from './OverviewPage'
import {
  HiOutlineViewGrid,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineMoon,
  HiOutlineSun,
} from 'react-icons/hi'
import { RiRobot2Line } from 'react-icons/ri'
import CopilotPage from './CopilotPage'

// ── Icon wrapper — fixes TS2786 return type error ──────────────────
const Ico = ({ i: I, size = 18, style }: { i: any; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...style }}>
    <I size={size} />
  </span>
)

const NAV_ITEMS = [
  { path: 'overview', label: 'Overview', icon: HiOutlineViewGrid },
  { path: 'schedule', label: 'Schedule', icon: HiOutlineCalendar },
  { path: 'patients', label: 'Patients', icon: HiOutlineUsers },
  { path: 'bookings', label: 'Bookings', icon: HiOutlineClipboardList },
  { path: 'documents', label: 'Documents', icon: HiOutlineDocumentText },
  { path: 'analytics', label: 'Analytics', icon: HiOutlineChartBar },
  { path: 'copilot', label: 'AI Co-pilot', icon: RiRobot2Line },
]

const lightColors = {
  bgBase: '#F0F7F5',
  bgSurface: '#FFFFFF',
  bgElevated: '#E4F0ED',
  text: '#0A1410',
  textMuted: '#3D6058',
  textFaint: '#7A9E96',
  border: 'rgba(15,118,110,0.12)',
  borderStrong: 'rgba(15,118,110,0.2)',
  primary: '#0F766E',
  primaryBg: 'rgba(15,118,110,0.07)',
  primaryBorder: 'rgba(15,118,110,0.2)',
  coral: '#DC2626',
  coralBg: 'rgba(220,38,38,0.07)',
}

export default function DashboardLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [isDark, setIsDark] = useState(true)

  const c = isDark ? colors : { ...colors, ...lightColors }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: c.bgBase }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: collapsed ? 64 : 220,
        flexShrink: 0,
        backgroundColor: c.bgSurface,
        borderRight: `1px solid ${c.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Logo + collapse toggle */}
        <div style={{
          padding: collapsed ? '18px 0' : '18px 20px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          minHeight: 60,
        }}>
          {!collapsed && (
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: c.primary, whiteSpace: 'nowrap' }}>
              Phila
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, flexShrink: 0 }}
          >
            <Ico i={collapsed ? HiOutlineChevronRight : HiOutlineChevronLeft} size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={`/dashboard/${item.path}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '13px 0' : '13px 20px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                color: isActive ? c.primary : c.textMuted,
                backgroundColor: isActive ? c.primaryBg : 'transparent',
                borderRight: isActive ? `3px solid ${c.primary}` : '3px solid transparent',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <Ico i={item.icon} size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom — theme toggle + sign out */}
        <div style={{ borderTop: `1px solid ${c.border}`, padding: collapsed ? '12px 0' : '12px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: c.textMuted,
              fontSize: 13,
              fontWeight: 400,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              borderRadius: 6,
              transition: 'color 0.15s',
            }}
          >
            <Ico i={isDark ? HiOutlineSun : HiOutlineMoon} size={18} />
            {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: c.coral,
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
            }}
          >
            <Ico i={HiOutlineLogout} size={18} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          height: 60,
          backgroundColor: c.bgSurface,
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          flexShrink: 0,
        }}>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <Ico
              i={HiOutlineSearch}
              size={15}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.textFaint }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patients, bookings..."
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                backgroundColor: c.bgElevated,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
                color: c.text,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4, display: 'flex', alignItems: 'center' }}>
                <Ico i={HiOutlineBell} size={20} />
              </button>
              <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: c.coral, border: `2px solid ${c.bgSurface}` }} />
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 24, backgroundColor: c.border }} />

            {/* Avatar */}
            <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.primaryBg, border: `2px solid ${c.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c.primary, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              DR
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c.bgBase }}>
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="copilot" element={<CopilotPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}