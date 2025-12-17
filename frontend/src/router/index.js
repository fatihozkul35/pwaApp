import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import Home from '../views/Home.vue'
import Tasks from '../views/Tasks.vue'

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
  next()
})

export default router
