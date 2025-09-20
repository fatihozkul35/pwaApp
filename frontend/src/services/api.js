import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://pwa-backend.onrender.com/api/' 
    : 'http://localhost:8000/api/',
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

// Note endpoints
export const getNotes = () => api.get('/notes/')
export const getNote = (id) => api.get(`/notes/${id}/`)
export const createNote = (noteData) => api.post('/notes/', noteData)
export const updateNote = (id, noteData) => api.put(`/notes/${id}/`, noteData)
export const deleteNote = (id) => api.delete(`/notes/${id}/`)

export default api
