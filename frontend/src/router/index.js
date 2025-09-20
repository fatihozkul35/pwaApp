import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import Home from '../views/Home.vue'
import Tasks from '../views/Tasks.vue'
import Notes from '../views/Notes.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: Tasks
  },
  {
    path: '/notes',
    name: 'Notes',
    component: Notes
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Her route değişikliğinde verileri yenile
router.beforeEach(async (to, from, next) => {
  // Eğer store'da veri yoksa yeniden yükle
  if (store.state.tasks.length === 0) {
    console.log('Router: Tasks yükleniyor...')
    await store.dispatch('fetchTasks')
  }
  if (store.state.notes.length === 0) {
    console.log('Router: Notes yükleniyor...')
    await store.dispatch('fetchNotes')
  }
  next()
})

export default router
