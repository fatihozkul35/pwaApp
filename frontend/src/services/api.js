import axios from 'axios'

// Environment detection - Manuel fallback
const isProduction = process.env.NODE_ENV === 'production'
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname.includes('127.0.0.1') ||
                   window.location.hostname.includes('192.168.')

const apiUrl = process.env.VUE_APP_API_URL || (isLocalhost 
  ? 'http://localhost:8000/api/' 
  : 'https://pwaapp-fms1.onrender.com/api/')

console.log('Environment Detection:', {
  hostname: window.location.hostname,
  isProduction,
  nodeEnv: process.env.NODE_ENV,
  apiUrl: apiUrl
})

const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Burada token eklenebilir
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - token geçersiz
      localStorage.removeItem('token')
      // Login sayfasına yönlendirme
    }
    return Promise.reject(error)
  }
)

// Task endpoints
export const getTasks = () => api.get('/tasks/')
export const getTask = (id) => api.get(`/tasks/${id}/`)
export const createTask = (taskData) => api.post('/tasks/', taskData)
export const updateTask = (id, taskData) => api.put(`/tasks/${id}/`, taskData)
export const deleteTask = (id) => api.delete(`/tasks/${id}/`)

// Task specific endpoints
export const getCompletedTasks = () => api.get('/tasks/completed/')
export const getPendingTasks = () => api.get('/tasks/pending/')
export const getOverdueTasks = () => api.get('/tasks/overdue/')
export const getHighPriorityTasks = () => api.get('/tasks/high_priority/')
export const getTasksByCategory = (category) => api.get(`/tasks/by_category/?category=${category}`)
export const toggleTaskComplete = (id) => api.post(`/tasks/${id}/toggle_complete/`)
export const getTaskStats = () => api.get('/tasks/stats/')
export const getReminders = () => api.get('/tasks/reminders/')
export const getUpcomingReminders = () => api.get('/tasks/upcoming_reminders/')

// Note endpoints
export const getNotes = () => api.get('/notes/')
export const getNote = (id) => api.get(`/notes/${id}/`)
export const createNote = (noteData) => api.post('/notes/', noteData)
export const updateNote = (id, noteData) => api.put(`/notes/${id}/`, noteData)
export const deleteNote = (id) => api.delete(`/notes/${id}/`)

// Backend wake-up function for Render.com free tier
export const wakeUpBackend = async () => {
  try {
    await api.get('/tasks/', { timeout: 5000 })
  } catch (error) {
    // Ignore errors, just wake up the backend
    console.log('Backend wake-up attempt:', error.message)
  }
}

export default api
