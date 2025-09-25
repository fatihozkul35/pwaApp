import { createStore } from 'vuex'
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  wakeUpBackend,
  getReminders,
  getUpcomingReminders,
  getTaskStats
} from '../services/api'

export default createStore({
  state: {
    tasks: [],
    notes: [],
    reminders: [],
    upcomingReminders: [],
    taskStats: null,
    loading: false,
    error: null
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
      state.tasks = Array.isArray(tasks.results) ? tasks.results : []
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
    SET_NOTES(state, notes) {
      state.notes = Array.isArray(notes) ? notes : []
    },
    ADD_NOTE(state, note) {
      if (Array.isArray(state.notes)) {
        state.notes.unshift(note)
      } else {
        state.notes = [note]
      }
    },
    UPDATE_NOTE(state, updatedNote) {
      if (Array.isArray(state.notes)) {
        const index = state.notes.findIndex(note => note.id === updatedNote.id)
        if (index !== -1) {
          state.notes.splice(index, 1, updatedNote)
        }
      }
    },
    DELETE_NOTE(state, noteId) {
      if (Array.isArray(state.notes)) {
        state.notes = state.notes.filter(note => note.id !== noteId)
      }
    },
    SET_REMINDERS(state, reminders) {
      state.reminders = Array.isArray(reminders) ? reminders : []
    },
    SET_UPCOMING_REMINDERS(state, reminders) {
      state.upcomingReminders = Array.isArray(reminders) ? reminders : []
    },
    SET_TASK_STATS(state, stats) {
      state.taskStats = stats
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
        commit('SET_TASKS', response.data)
        // localStorage'a kaydet
        localStorage.setItem('tasks', JSON.stringify(response.data))
        console.log('Veriler localStorage\'a kaydedildi')
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
          commit('SET_TASKS', JSON.parse(savedTasks))
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
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async deleteTask({ commit }, taskId) {
      commit('SET_LOADING', true)
      try {
        await deleteTask(taskId)
        commit('DELETE_TASK', taskId)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetchNotes({ commit }) {
      commit('SET_LOADING', true)
      try {
        const response = await getNotes()
        commit('SET_NOTES', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async createNote({ commit }, noteData) {
      commit('SET_LOADING', true)
      try {
        const response = await createNote(noteData)
        commit('ADD_NOTE', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async updateNote({ commit }, { id, noteData }) {
      commit('SET_LOADING', true)
      try {
        const response = await updateNote(id, noteData)
        commit('UPDATE_NOTE', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async deleteNote({ commit }, noteId) {
      commit('SET_LOADING', true)
      try {
        await deleteNote(noteId)
        commit('DELETE_NOTE', noteId)
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
