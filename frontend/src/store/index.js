import { createStore } from 'vuex'
import api from '../services/api'

export default createStore({
  state: {
    tasks: [],
    notes: [],
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
      state.tasks = tasks
    },
    ADD_TASK(state, task) {
      state.tasks.unshift(task)
    },
    UPDATE_TASK(state, updatedTask) {
      const index = state.tasks.findIndex(task => task.id === updatedTask.id)
      if (index !== -1) {
        state.tasks.splice(index, 1, updatedTask)
      }
    },
    DELETE_TASK(state, taskId) {
      state.tasks = state.tasks.filter(task => task.id !== taskId)
    },
    SET_NOTES(state, notes) {
      state.notes = notes
    },
    ADD_NOTE(state, note) {
      state.notes.unshift(note)
    },
    UPDATE_NOTE(state, updatedNote) {
      const index = state.notes.findIndex(note => note.id === updatedNote.id)
      if (index !== -1) {
        state.notes.splice(index, 1, updatedNote)
      }
    },
    DELETE_NOTE(state, noteId) {
      state.notes = state.notes.filter(note => note.id !== noteId)
    }
  },
  actions: {
    async fetchTasks({ commit }) {
      commit('SET_LOADING', true)
      try {
        const response = await api.getTasks()
        commit('SET_TASKS', response.data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async createTask({ commit }, taskData) {
      commit('SET_LOADING', true)
      try {
        const response = await api.createTask(taskData)
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
        const response = await api.updateTask(id, taskData)
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
        await api.deleteTask(taskId)
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
        const response = await api.getNotes()
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
        const response = await api.createNote(noteData)
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
        const response = await api.updateNote(id, noteData)
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
        await api.deleteNote(noteId)
        commit('DELETE_NOTE', noteId)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },
  getters: {
    completedTasks: state => state.tasks.filter(task => task.completed),
    pendingTasks: state => state.tasks.filter(task => !task.completed)
  }
})
