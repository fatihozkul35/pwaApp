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

// Network detection utility
let networkCheckInProgress = false
let lastNetworkCheck = null
const NETWORK_CHECK_INTERVAL = 5000 // 5 seconds
const NETWORK_CHECK_TIMEOUT = 3000 // 3 seconds

// Improved network status detection
async function checkNetworkStatus() {
  // Use cached result if checked recently
  if (lastNetworkCheck && Date.now() - lastNetworkCheck < NETWORK_CHECK_INTERVAL) {
    return navigator.onLine
  }

  if (networkCheckInProgress) {
    return navigator.onLine
  }

  networkCheckInProgress = true
  lastNetworkCheck = Date.now()

  try {
    // Try to fetch a small resource to verify actual connectivity
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_CHECK_TIMEOUT)
    
    await fetch(apiUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    })
    
    clearTimeout(timeoutId)
    return true
  } catch (error) {
    // Network error or timeout
    return false
  } finally {
    networkCheckInProgress = false
  }
}

// Check if request should be treated as offline
function isRequestOffline(error) {
  // Network errors
  if (!error.response) {
    // Timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return true
    }
    // Network error
    if (error.message.includes('Network Error') || 
        error.message.includes('Failed to fetch') ||
        error.code === 'ERR_NETWORK') {
      return true
    }
  }
  
  // 503 Service Unavailable (often means backend is down)
  if (error.response?.status === 503) {
    return true
  }
  
  // 0 status (usually means network error)
  if (error.response?.status === 0) {
    return true
  }
  
  return false
}

const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor with network check
api.interceptors.request.use(
  async (config) => {
    // Burada token eklenebilir
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    
    // Check network status before making request
    const isOnline = await checkNetworkStatus()
    if (!isOnline && !navigator.onLine) {
      // Mark request as potentially offline
      config._isOffline = true
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    // Success - update network status
    lastNetworkCheck = Date.now()
    return response
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - token geçersiz
      localStorage.removeItem('token')
      // Login sayfasına yönlendirme
    }
    
    // Check if this is an offline scenario
    if (isRequestOffline(error)) {
      // Update offline service status
      if (!offlineService.isOffline()) {
        offlineService.isOnline = false
      }
    }
    
    return Promise.reject(error)
  }
)

// Task endpoints with improved offline support
export const getTasks = async () => {
  try {
    const response = await api.get('/tasks/')
    return response
  } catch (error) {
    // Check if offline or network error
    if (offlineService.isOffline() || isRequestOffline(error)) {
      // Offline durumunda localStorage'dan veri al
      const cachedTasks = localStorage.getItem('tasks')
      if (cachedTasks) {
        const parsed = JSON.parse(cachedTasks)
        // Return in same format as API response
        return { 
          data: Array.isArray(parsed.results) ? parsed : parsed,
          fromCache: true 
        }
      }
      return { data: [], fromCache: true }
    }
    throw error
  }
}

export const getTask = async (id) => {
  // Önce offline kontrolü yap
  if (offlineService.isOffline() || !navigator.onLine) {
    const cachedTasks = localStorage.getItem('tasks')
    if (cachedTasks) {
      const tasks = JSON.parse(cachedTasks)
      const tasksArray = Array.isArray(tasks.results) ? tasks.results : (Array.isArray(tasks) ? tasks : [])
      const task = tasksArray.find(t => t.id === id)
      if (task) {
        return { data: task, fromCache: true }
      }
    }
    // Offline modda ve cache'de yoksa hata fırlat
    throw new Error('Task not found in cache')
  }

  // Online ise API'ye istek gönder
  try {
    const response = await api.get(`/tasks/${id}/`)
    return response
  } catch (error) {
    // Network hatası durumunda cache'den dene
    if (isRequestOffline(error)) {
      const cachedTasks = localStorage.getItem('tasks')
      if (cachedTasks) {
        const tasks = JSON.parse(cachedTasks)
        const tasksArray = Array.isArray(tasks.results) ? tasks.results : (Array.isArray(tasks) ? tasks : [])
        const task = tasksArray.find(t => t.id === id)
        if (task) {
          return { data: task, fromCache: true }
        }
      }
    }
    throw error
  }
}

export const createTask = async (taskData) => {
  // Önce offline kontrolü yap - eğer offline ise direkt queue'ya ekle
  if (offlineService.isOffline() || !navigator.onLine) {
    console.log('Offline mod: Task queue\'ya ekleniyor')
    const offlineId = offlineService.addOfflineData('task', taskData, 'create')
    return { data: { ...taskData, id: offlineId, offline: true } }
  }

  // Online ise API'ye istek gönder
  try {
    const response = await api.post('/tasks/', taskData)
    return response
  } catch (error) {
    // Network hatası durumunda da queue'ya ekle
    if (isRequestOffline(error)) {
      console.log('Network hatası: Task queue\'ya ekleniyor')
      const offlineId = offlineService.addOfflineData('task', taskData, 'create')
      return { data: { ...taskData, id: offlineId, offline: true } }
    }
    throw error
  }
}

export const updateTask = async (id, taskData) => {
  // Önce offline kontrolü yap - eğer offline ise direkt queue'ya ekle
  if (offlineService.isOffline() || !navigator.onLine) {
    console.log('Offline mod: Task güncelleme queue\'ya ekleniyor')
    offlineService.addOfflineData('task', { ...taskData, id }, 'update')
    return { data: { ...taskData, id, offline: true } }
  }

  // Online ise API'ye istek gönder
  try {
    const response = await api.put(`/tasks/${id}/`, taskData)
    return response
  } catch (error) {
    // Network hatası durumunda da queue'ya ekle
    if (isRequestOffline(error)) {
      console.log('Network hatası: Task güncelleme queue\'ya ekleniyor')
      offlineService.addOfflineData('task', { ...taskData, id }, 'update')
      return { data: { ...taskData, id, offline: true } }
    }
    throw error
  }
}

export const deleteTask = async (id) => {
  // Önce offline kontrolü yap - eğer offline ise direkt queue'ya ekle
  if (offlineService.isOffline() || !navigator.onLine) {
    console.log('Offline mod: Task silme queue\'ya ekleniyor')
    offlineService.addOfflineData('task', { id }, 'delete')
    return { data: { id, deleted: true, offline: true } }
  }

  // Online ise API'ye istek gönder
  try {
    const response = await api.delete(`/tasks/${id}/`)
    return response
  } catch (error) {
    // Network hatası durumunda da queue'ya ekle
    if (isRequestOffline(error)) {
      console.log('Network hatası: Task silme queue\'ya ekleniyor')
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

// Network status check utility
export const checkNetworkConnection = async () => {
  return await checkNetworkStatus()
}

// Export network check function
export { checkNetworkStatus, isRequestOffline }

export default api
