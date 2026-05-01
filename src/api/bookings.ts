import apiClient from './client'

export const bookingsApi = {
  getPracticeBookings: async () => {
    const response = await apiClient.get('/bookings/practice')
    return response.data
  },
}