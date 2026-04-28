export type UserRole = 'patient' | 'doctor'

export interface User {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
  language_pref: string
}

export interface Doctor {
  id: string
  user_id: string
  specialty: string
  bio: string | null
  years_experience: number
  qualification: string | null
  practice_name: string
  address: string
  city: string
  province: string
  consultation_fee: number
  slot_duration_minutes: number
  medical_aids: string[]
  languages: string[]
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface Slot {
  id: string
  doctor_id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'booked' | 'blocked'
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface WorkingHoursInput {
  day_of_week: number
  is_active: boolean
  start_time: string
  end_time: string
}

export interface DoctorCreatePayload {
  specialty: string
  bio: string
  years_experience: number
  qualification: string
  practice_name: string
  address: string
  city: string
  province: string
  consultation_fee: number
  slot_duration_minutes: number
  medical_aids: string[]
  languages: string[]
  working_hours: WorkingHoursInput[]
}