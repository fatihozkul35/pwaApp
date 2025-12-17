import { createStore } from 'vuex'
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  wakeUpBackend,
  getReminders,
  getUpcomingReminders,
  getTaskStats
} from '../services/api'
import offlineService from '../services/offlineService'
import notificationService from '../services/notificationService'

export default createStore({
  state: {
    tasks: [],
    reminders: [],
    upcomingReminders: [],
    taskStats: null,
    loading: false,
    error: null,
    isOnline: navigator.onLine,
    pendingSyncCount: 0
  },
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_TASKS(state, tasks) {
      console.log('SET_TASKS mutation - gelen tasks:', tasks)
      console.log(Array.isArray(tasks))
      // Handle both paginated response (tasks.results) and direct array
      if (tasks && Array.isArray(tasks.results)) {
        state.tasks = tasks.results
      } else if (Array.isArray(tasks)) {
        state.tasks = tasks
      } else {
        state.tasks = []
      }
      console.log('SET_TASKS mutation - state.tasks güncellendi:', state.tasks)
      // localStorage'a kaydet
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
      console.log('SET_TASKS mutation - localStorage\'a kaydedildi')
    },
    ADD_TASK(state, task) {
      if (Array.isArray(state.tasks)) {
        state.tasks.unshift(task)
      } else {
        state.tasks = [task]
      }
      // localStorage'a kaydet
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
    },
    UPDATE_TASK(state, updatedTask) {
      if (Array.isArray(state.tasks)) {
        const index = state.tasks.findIndex(task => task.id === updatedTask.id)
        if (index !== -1) {
          state.tasks.splice(index, 1, updatedTask)
        }
      }
      // localStorage'a kaydet
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
    },
    DELETE_TASK(state, taskId) {
      if (Array.isArray(state.tasks)) {
        state.tasks = state.tasks.filter(task => task.id !== taskId)
      }
      // localStorage'a kaydet
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
    },
    SET_REMINDERS(state, reminders) {
      state.reminders = Array.isArray(reminders) ? reminders : []
    },
    SET_UPCOMING_REMINDERS(state, reminders) {
      state.upcomingReminders = Array.isArray(reminders) ? reminders : []
    },
    SET_TASK_STATS(state, stats) {
      state.taskStats = stats
    },
    SET_ONLINE_STATUS(state, isOnline) {
      state.isOnline = isOnline
    },
    SET_PENDING_SYNC_COUNT(state, count) {
      state.pendingSyncCount = count
    }
  },
  actions: {
    async fetchTasks({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        console.log('Backend\'den veriler çekiliyor...')
        
        // Önce backend'i uyandır (Render.com free tier için)
        try {
          await wakeUpBackend()
          console.log('Backend uyandırıldı')
        } catch (wakeError) {
          console.log('Backend uyandırma hatası (normal olabilir):', wakeError.message)
        }
        
        const response = await getTasks()
        console.log("response", response)
        console.log('Backend\'den gelen veriler:', response.data)
        
        // Görevler yüklendikten sonra bildirimleri zamanla (commit'ten önce)
        let tasksToSchedule = []
        if (response.data && Array.isArray(response.data.results)) {
          tasksToSchedule = response.data.results
        } else if (Array.isArray(response.data)) {
          tasksToSchedule = response.data
        }
        
        commit('SET_TASKS', response.data)
        // localStorage'a kaydet
        localStorage.setItem('tasks', JSON.stringify(response.data))
        console.log('Veriler localStorage\'a kaydedildi')
        
        // Bildirimleri zamanla
        if (tasksToSchedule.length > 0) {
          notificationService.scheduleNotificationsForTasks(tasksToSchedule)
        }
      } catch (error) {
        console.error('Backend\'den veri çekme hatası:', error)
        console.error('Error details:', error.response)
        console.error('Error status:', error.response?.status)
        console.error('Error data:', error.response?.data)
        
        // Timeout hatası için özel mesaj
        if (error.code === 'ECONNABORTED') {
          commit('SET_ERROR', 'Backend yanıt vermiyor. Lütfen daha sonra tekrar deneyin.')
        } else {
          commit('SET_ERROR', error.message)
        }
        
        // Hata durumunda localStorage'dan yükle
        const savedTasks = localStorage.getItem('tasks')
        if (savedTasks) {
          console.log('localStorage\'dan veriler yükleniyor...')
          const parsedTasks = JSON.parse(savedTasks)
          commit('SET_TASKS', parsedTasks)
          // localStorage'dan yüklenen görevler için de bildirimleri zamanla
          // SET_TASKS mutation'dan sonra state'ten al
          const tasks = Array.isArray(parsedTasks.results) ? parsedTasks.results : (Array.isArray(parsedTasks) ? parsedTasks : [])
          if (tasks.length > 0) {
            notificationService.scheduleNotificationsForTasks(tasks)
          }
        } else {
          console.log('localStorage\'da da veri yok')
        }
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async createTask({ commit }, taskData) {
      commit('SET_LOADING', true)
      try {
        const response = await createTask(taskData)
        commit('ADD_TASK', response.data)
        
        // Yeni görev için bildirim zamanla (eğer reminder_time varsa)
        if (response.data.reminder_time && !response.data.completed) {
          const settings = notificationService.getNotificationSettings()
          if (settings.enabled && settings.taskReminders) {
            notificationService.scheduleNotificationAt(response.data, response.data.reminder_time)
          }
        }
        
        // Offline durumunda pending sync count'u güncelle
        if (response.data.offline) {
          commit('SET_PENDING_SYNC_COUNT', offlineService.getPendingSyncCount())
        }
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async updateTask({ commit }, { id, taskData }) {
      commit('SET_LOADING', true)
      try {
        const response = await updateTask(id, taskData)
        commit('UPDATE_TASK', response.data)
        
        // Görev güncellendiğinde bildirimleri yeniden zamanla
        const updatedTask = response.data
        if (updatedTask.reminder_time && !updatedTask.completed) {
          // Önce mevcut bildirimi iptal et
          notificationService.cancelScheduledNotification(updatedTask.id)
          // Yeni bildirim zamanla
          const settings = notificationService.getNotificationSettings()
          if (settings.enabled && settings.taskReminders) {
            notificationService.scheduleNotificationAt(updatedTask, updatedTask.reminder_time)
          }
        } else {
          // Reminder_time yoksa veya tamamlandıysa bildirimi iptal et
          notificationService.cancelScheduledNotification(updatedTask.id)
        }
        
        // Offline durumunda pending sync count'u güncelle
        if (response.data.offline) {
          commit('SET_PENDING_SYNC_COUNT', offlineService.getPendingSyncCount())
        }
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async deleteTask({ commit }, taskId) {
      commit('SET_LOADING', true)
      try {
        const response = await deleteTask(taskId)
        
        // Görev silindiğinde bildirimi iptal et
        notificationService.cancelScheduledNotification(taskId)
        
        // Offline durumunda pending sync count'u güncelle
        if (response.data && response.data.offline) {
          commit('SET_PENDING_SYNC_COUNT', offlineService.getPendingSyncCount())
        }
        
        commit('DELETE_TASK', taskId)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchReminders({ commit }) {
      commit('SET_LOADING', true)
      try {
        const response = await getReminders()
        commit('SET_REMINDERS', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchUpcomingReminders({ commit }) {
      commit('SET_LOADING', true)
      try {
        const response = await getUpcomingReminders()
        commit('SET_UPCOMING_REMINDERS', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchTaskStats({ commit }) {
      commit('SET_LOADING', true)
      try {
        const response = await getTaskStats()
        commit('SET_TASK_STATS', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },
  getters: {
    completedTasks: state => {
      if (!Array.isArray(state.tasks)) {
        return []
      }
      return state.tasks.filter(task => task.completed)
    },
    pendingTasks: state => {
      if (!Array.isArray(state.tasks)) {
        return []
      }
      return state.tasks.filter(task => !task.completed)
    },
    tasksWithReminders: state => {
      if (!Array.isArray(state.tasks)) {
        return []
      }
      return state.tasks.filter(task => task.reminder_time)
    },
    upcomingTasks: state => {
      if (!Array.isArray(state.tasks)) {
        return []
      }
      const now = new Date()
      return state.tasks.filter(task => 
        task.reminder_time && 
        new Date(task.reminder_time) > now &&
        !task.completed
      )
    }
  }
})
