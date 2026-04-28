import apiClient from './client'
import { Doctor, Slot, DoctorCreatePayload } from '../types'

export const doctorsApi = {
  register: async (data: DoctorCreatePayload): Promise<Doctor> => {
    const response = await apiClient.post<Doctor>('/doctors/register', data)
    return response.data
  },

  getProfile: async (): Promise<Doctor> => {
    const response = await apiClient.get<Doctor>('/doctors/today')
    return response.data
  },

  getSlots: async (doctorId: string, date: string): Promise<Slot[]> => {
    const response = await apiClient.get<Slot[]>(
      `/doctors/${doctorId}/slots?date=${date}`
    )
    return response.data
  },
}