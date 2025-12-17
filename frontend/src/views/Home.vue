<template>
  <div class="home">
    <div class="hero">
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.subtitle') }}</p>
    </div>
    
    <div class="quick-stats">
      <div class="stat-card">
        <h4>{{ completedTasksCount }}</h4>
        <p>{{ $t('home.completed') }}</p>
      </div>
      <div class="stat-card">
        <h4>{{ pendingTasksCount }}</h4>
        <p>{{ $t('home.pending') }}</p>
      </div>
      <div class="stat-card">
        <h4>{{ totalTasksCount }}</h4>
        <p>{{ $t('home.totalTasks') }}</p>
      </div>
    </div>

    <!-- Yeni görev ekleme formu -->
    <div class="add-task-section">
      <h3>{{ $t('home.quickAdd') }}</h3>
      <form @submit.prevent="addQuickTask" class="quick-form">
        <div class="form-row">
          <input 
            v-model="quickTask.title" 
            type="text" 
            :placeholder="$t('home.taskTitle')" 
            required
            class="form-input"
          >
          <button type="submit" class="add-btn" :disabled="loading">
            {{ loading ? $t('home.adding') : $t('home.add') }}
          </button>
        </div>
        <div class="form-row">
          <input 
            v-model="quickTask.reminderTime" 
            type="datetime-local"
            :placeholder="$t('tasks.reminderTimePlaceholder')"
            class="form-input"
          >
          <small class="form-help">{{ $t('tasks.noReminder') }}</small>
        </div>
      </form>
    </div>

    <!-- Todo Listesi -->
    <div class="todos-section">
      <div class="section-header">
        <h3>{{ $t('home.currentTasks') }}</h3>
        <router-link to="/tasks" class="view-all-btn">{{ $t('home.viewAll') }}</router-link>
      </div>
      
      <div v-if="loading" class="loading">
        <p>{{ $t('home.loading') }}</p>
      </div>
      
      <div v-if="error" class="error">
        <p>{{ error }}</p>
      </div>
      
      <div v-if="recentTasks.length > 0" class="todos-grid">
        <!-- Debug: {{ recentTasks.length }} görev bulundu -->
        <div 
          v-for="task in recentTasks" 
          :key="task.id" 
          class="todo-card"
          :class="{ completed: task.completed }"
        >
          <div class="todo-content">
            <button 
              @click="toggleTask(task)" 
              class="toggle-btn"
              :class="{ completed: task.completed }"
            >
              {{ task.completed ? '✓' : '○' }}
            </button>
            <div class="todo-text">
              <h4>{{ task.title }}</h4>
              <p v-if="task.description" class="todo-description">{{ task.description }}</p>
              <small class="todo-date">{{ formatDate(task.created_at) }}</small>
            </div>
          </div>
          <button @click="deleteTask(task.id)" class="delete-btn">🗑️</button>
        </div>
      </div>
      
      <div v-if="recentTasks.length === 0 && !loading" class="empty-state">
        <p>{{ $t('home.emptyState') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import notificationService from '../services/notificationService'

export default {
  name: 'Home',
  data() {
    return {
      quickTask: {
        title: '',
        reminderTime: ''
      }
    }
  },
  computed: {
    ...mapState(['tasks', 'loading', 'error']),
    ...mapGetters(['completedTasks', 'pendingTasks']),
    completedTasksCount() {
      return this.completedTasks.length
    },
    pendingTasksCount() {
      return this.pendingTasks.length
    },
    totalTasksCount() {
      if (!Array.isArray(this.tasks)) {
        return 0
      }
      return this.tasks.length
    },
    recentTasks() {
      // Son 5 görevi göster
      console.log('Home recentTasks computed - tasks:', this.tasks)
      if (!Array.isArray(this.tasks)) {
        console.log('Home recentTasks - tasks array değil, boş döndürülüyor')
        return []
      }
      const recent = this.tasks.slice(0, 5)
      console.log('Home recentTasks - recent tasks:', recent)
      return recent
    }
  },
  async created() {
    console.log('Home created - başlangıç tasks:', this.tasks)
    console.log('Home created - store state:', this.$store.state)
    
    // Sayfa yüklendiğinde verileri yükle
    console.log('Home sayfasında veriler yükleniyor...')
    await this.$store.dispatch('fetchTasks')
    
    console.log('Home created - yükleme sonrası tasks:', this.tasks)
    console.log('Home created - yükleme sonrası store state:', this.$store.state)
  },
  methods: {
    ...mapActions(['fetchTasks', 'createTask', 'updateTask', 'deleteTask']),
    
    async addQuickTask() {
      if (!this.quickTask.title.trim()) return
      
      const taskData = {
        title: this.quickTask.title,
        description: '',
        priority: 'medium', // Default priority
        category: 'other' // Default category
      }
      
      // Handle reminder_time with proper timezone conversion
      if (this.quickTask.reminderTime) {
        // datetime-local input gives us a string like "2024-01-15T14:30" (local time, no timezone)
        const localDate = new Date(this.quickTask.reminderTime)
        
        // Check if the date is valid
        if (isNaN(localDate.getTime())) {
          console.error('Geçersiz tarih formatı:', this.quickTask.reminderTime)
          alert('Geçersiz tarih formatı. Lütfen tekrar deneyin.')
          return
        }
        
        // Convert to ISO string which includes timezone offset
        // Django will handle timezone conversion on the backend
        taskData.reminder_time = localDate.toISOString()
        
        console.log('Hatırlatma zamanı ayarlanıyor:', {
          kullanıcıGirdiği: this.quickTask.reminderTime,
          backendGönderilecek: taskData.reminder_time,
          yerelSaat: localDate.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
        })
      }
      
      await this.$store.dispatch('createTask', taskData)
      
      // Store'da createTask zaten bildirimi zamanlıyor, burada ekstra bir şey yapmaya gerek yok
      // Ama reminder_time yoksa anında bildirim gönderebiliriz
      if (!taskData.reminder_time) {
        const settings = notificationService.getNotificationSettings()
        if (settings.enabled && settings.taskReminders) {
          // Yeni oluşturulan görev için anında bildirim gönder
          const createdTask = this.tasks.find(t => t.title === taskData.title && !t.description)
          if (createdTask) {
            await notificationService.showTaskNotification(createdTask)
          }
        }
      }
      
      this.quickTask = { title: '', reminderTime: '' }
    },
    
    async toggleTask(task) {
      await this.$store.dispatch('updateTask', {
        id: task.id,
        taskData: { ...task, completed: !task.completed }
      })
      
      // Görev tamamlandığında bildirim gönder
      if (!task.completed) {
        const settings = notificationService.getNotificationSettings()
        if (settings.enabled && settings.taskReminders) {
          await notificationService.showReminderNotification(
            `"${task.title}" görevi tamamlandı! 🎉`
          )
        }
      }
    },
    
    async deleteTask(taskId) {
      if (confirm(this.$t('home.deleteConfirm'))) {
        await this.$store.dispatch('deleteTask', taskId)
      }
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.hero {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  margin-bottom: 2rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h4 {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-card p {
  color: #666;
  font-weight: 500;
  margin: 0;
}

.add-task-section {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.add-task-section h3 {
  margin-bottom: 1rem;
  color: #333;
}

.quick-form {
  margin-top: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

.form-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.todos-section {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  color: #333;
  margin: 0;
}

.view-all-btn {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.view-all-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #dc3545;
}

.todos-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.todo-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.todo-card:hover {
  border-color: #667eea;
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2);
}

.todo-card.completed {
  opacity: 0.7;
  border-color: #28a745;
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.toggle-btn {
  background: none;
  border: 2px solid #e1e5e9;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 1rem;
}

.toggle-btn:hover {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.toggle-btn.completed {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.todo-text {
  flex: 1;
}

.todo-text h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.todo-card.completed .todo-text h4 {
  text-decoration: line-through;
  color: #6c757d;
}

.todo-description {
  margin: 0 0 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
}

.todo-date {
  color: #999;
  font-size: 0.8rem;
}

.delete-btn {
  background: none;
  border: 2px solid #e1e5e9;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.delete-btn:hover {
  border-color: #dc3545;
  background: #dc3545;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .hero p {
    font-size: 1rem;
  }
  
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .todo-card {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .todo-content {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
}
</style>
