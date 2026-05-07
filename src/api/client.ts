import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'


const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'phila_practice_token'

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased slightly to account for "cold starts" on cloud hosting
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError): Promise<never> => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<never> => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      // Only redirect to login if we're not already there to avoid loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient