import React, { useState } from 'react'
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import apiClient from '../../api/client'
import SchedulePage from './SchedulePage'
import PatientsPage from './PatientsPage'
import BookingsPage from './BookingsPage'
import DocumentsPage from './DocumentsPage'
import AnalyticsPage from './AnalyticsPage'
import OverviewPage from './OverviewPage'
import CopilotPage from './CopilotPage'
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
  HiOutlineDesktopComputer,
} from 'react-icons/hi'
import { RiRobot2Line } from 'react-icons/ri'

const Ico = ({ i: I, size = 18, style }: { i: any; size?: number; style?: React.CSSProperties }) => (
  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, ...style }}>
    <I size={size} />
  </span>
)

const NAV_ITEMS = [
  { path: 'overview',   label: 'Overview',    icon: HiOutlineViewGrid },
  { path: 'schedule',   label: 'Schedule',    icon: HiOutlineCalendar },
  { path: 'patients',   label: 'Patients',    icon: HiOutlineUsers },
  { path: 'bookings',   label: 'Bookings',    icon: HiOutlineClipboardList },
  { path: 'documents',  label: 'Documents',   icon: HiOutlineDocumentText },
  { path: 'analytics',  label: 'Analytics',   icon: HiOutlineChartBar },
  { path: 'copilot',    label: 'AI Co-pilot', icon: RiRobot2Line },
]

export default function DashboardLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { colors: c, isDark, toggle } = useTheme()

  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [calling, setCalling] = useState(false)
  const [callResult, setCallResult] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const callNext = async () => {
    setCalling(true)
    setCallResult(null)
    try {
      const res = await apiClient.post('/waiting-room/call-next')
      const name = res.data.now_seen?.display_name ?? 'Next patient'
      setCallResult(`✅ ${name} called`)
    } catch {
      setCallResult('❌ No patients in queue')
    } finally {
      setCalling(false)
      setTimeout(() => setCallResult(null), 4000)
    }
  }

  const openWaitingRoom = async () => {
    try {
      const res = await apiClient.get('/doctors/today')
      const doctor = res.data.doctor ?? res.data
      window.open(`/waiting-room?doctor=${doctor.id}`, '_blank')
    } catch {}
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: c.bgBase }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: collapsed ? 64 : 220, flexShrink: 0, backgroundColor: c.bgSurface, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden' }}>

        {/* Logo + collapse */}
        <div style={{ padding: collapsed ? '18px 0' : '18px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 10, minHeight: 60 }}>
          {!collapsed && (
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: c.primary, whiteSpace: 'nowrap' }}>Phila</span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, flexShrink: 0 }}>
            <Ico i={collapsed ? HiOutlineChevronRight : HiOutlineChevronLeft} size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={`/dashboard/${item.path}`}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '13px 0' : '13px 20px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                color: isActive ? c.primary : c.textMuted,
                backgroundColor: isActive ? c.primaryBg : 'transparent',
                borderRight: isActive ? `3px solid ${c.primary}` : '3px solid transparent',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
              })}
            >
              <Ico i={item.icon} size={18} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Waiting room link */}
          <button
            onClick={openWaitingRoom}
            title="Open waiting room display"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '13px 0' : '13px 20px', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', background: 'none', border: 'none', color: c.textMuted, fontSize: 13, fontWeight: 400, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', transition: 'color 0.15s', borderRight: '3px solid transparent' }}
          >
            <Ico i={HiOutlineDesktopComputer} size={18} />
            {!collapsed && <span>Waiting room</span>}
          </button>
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${c.border}`, padding: collapsed ? '12px 0' : '12px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => toggle()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', borderRadius: 6 }}
          >
            <Ico i={isDark ? HiOutlineSun : HiOutlineMoon} size={18} />
            {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>

          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.coral, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%' }}
          >
            <Ico i={HiOutlineLogout} size={18} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ height: 60, backgroundColor: c.bgSurface, borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <Ico i={HiOutlineSearch} size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.textFaint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patients, bookings..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: c.bgElevated, border: `1px solid ${c.border}`, borderRadius: 8, color: c.text, fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textMuted, padding: 4, display: 'flex', alignItems: 'center' }}>
                <Ico i={HiOutlineBell} size={20} />
              </button>
              <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 4, backgroundColor: c.coral, border: `2px solid ${c.bgSurface}` }} />
            </div>
            <div style={{ width: 1, height: 24, backgroundColor: c.border }} />
            <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.primaryBg, border: `2px solid ${c.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: c.primary, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              DR
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: c.bgBase, position: 'relative' }}>
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview"  element={<OverviewPage />} />
            <Route path="schedule"  element={<SchedulePage />} />
            <Route path="patients"  element={<PatientsPage />} />
            <Route path="bookings"  element={<BookingsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="copilot"   element={<CopilotPage />} />
          </Routes>
        </div>
      </div>

      {/* ── FLOATING CALL NEXT BUTTON ── */}
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        {callResult && (
          <div style={{ backgroundColor: c.bgSurface, border: `1px solid ${c.border}`, borderRadius: 12, padding: '10px 18px', fontSize: 13, color: c.text, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
            {callResult}
          </div>
        )}
        <button
          onClick={callNext}
          disabled={calling}
          title="Call next patient to consultation room"
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderRadius: 14, border: 'none', backgroundColor: c.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: calling ? 'not-allowed' : 'pointer', boxShadow: `0 8px 32px ${c.primary}55`, opacity: calling ? 0.7 : 1, transition: 'all 0.2s' }}
        >
          <span style={{ fontSize: 18 }}>👆</span>
          {calling ? 'Calling...' : 'Call next patient'}
        </button>
      </div>
    </div>
  )
}