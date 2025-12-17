import axios from 'axios'
import offlineService from './offlineService'

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

// Task endpoints with offline support
export const getTasks = async () => {
  try {
    const response = await api.get('/tasks/')
    return response
  } catch (error) {
    if (offlineService.isOffline()) {
      // Offline durumunda localStorage'dan veri al
      const cachedTasks = localStorage.getItem('tasks')
      return { data: cachedTasks ? JSON.parse(cachedTasks) : [] }
    }
    throw error
  }
}

export const getTask = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}/`)
    return response
  } catch (error) {
    if (offlineService.isOffline()) {
      const cachedTasks = localStorage.getItem('tasks')
      const tasks = cachedTasks ? JSON.parse(cachedTasks) : []
      const task = tasks.find(t => t.id === id)
      return { data: task }
    }
    throw error
  }
}

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks/', taskData)
    return response
  } catch (error) {
    if (offlineService.isOffline()) {
      // Offline durumunda queue'ya ekle
      const offlineId = offlineService.addOfflineData('task', taskData, 'create')
      return { data: { ...taskData, id: offlineId, offline: true } }
    }
    throw error
  }
}

export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}/`, taskData)
    return response
  } catch (error) {
    if (offlineService.isOffline()) {
      // Offline durumunda queue'ya ekle
      offlineService.addOfflineData('task', { ...taskData, id }, 'update')
      return { data: { ...taskData, id, offline: true } }
    }
    throw error
  }
}

export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}/`)
    return response
  } catch (error) {
    if (offlineService.isOffline()) {
      // Offline durumunda queue'ya ekle
      offlineService.addOfflineData('task', { id }, 'delete')
      return { data: { id, deleted: true, offline: true } }
    }
    throw error
  }
}

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
