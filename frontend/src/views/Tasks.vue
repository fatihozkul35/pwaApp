<template>
  <div class="tasks">
    <div class="header">
      <h1>{{ $t('tasks.title') }}</h1>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? $t('tasks.cancel') : $t('tasks.newTask') }}
      </button>
    </div>
    
    <div v-if="showAddForm" class="add-form">
      <h3>{{ $t('tasks.addTask') }}</h3>
      <form @submit.prevent="addTask">
        <div class="form-group">
          <input 
            v-model="newTask.title" 
            type="text" 
            :placeholder="$t('tasks.taskTitle')" 
            required
            class="form-input"
          >
        </div>
        <div class="form-group">
          <textarea 
            v-model="newTask.description" 
            :placeholder="$t('tasks.taskDescription')"
            class="form-textarea"
          ></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ $t('tasks.priority') || 'Öncelik' }}</label>
            <select v-model="newTask.priority" class="form-input">
              <option value="low">{{ $t('tasks.priorityLow') || 'Düşük' }}</option>
              <option value="medium">{{ $t('tasks.priorityMedium') || 'Orta' }}</option>
              <option value="high">{{ $t('tasks.priorityHigh') || 'Yüksek' }}</option>
              <option value="urgent">{{ $t('tasks.priorityUrgent') || 'Acil' }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('tasks.category') || 'Kategori' }}</label>
            <select v-model="newTask.category" class="form-input">
              <option value="work">{{ $t('tasks.categoryWork') || 'İş' }}</option>
              <option value="personal">{{ $t('tasks.categoryPersonal') || 'Kişisel' }}</option>
              <option value="shopping">{{ $t('tasks.categoryShopping') || 'Alışveriş' }}</option>
              <option value="health">{{ $t('tasks.categoryHealth') || 'Sağlık' }}</option>
              <option value="finance">{{ $t('tasks.categoryFinance') || 'Finans' }}</option>
              <option value="other">{{ $t('tasks.categoryOther') || 'Diğer' }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('tasks.dueDate') || 'Bitiş Tarihi' }}</label>
          <input 
            v-model="newTask.dueDate" 
            type="datetime-local"
            class="form-input"
          >
          <small class="form-help">{{ $t('tasks.dueDateHelp') || 'Opsiyonel' }}</small>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('tasks.reminderTime') }}</label>
          <input 
            v-model="newTask.reminderTime" 
            type="datetime-local"
            :placeholder="$t('tasks.reminderTimePlaceholder')"
            class="form-input"
          >
          <small class="form-help">{{ $t('tasks.noReminder') }}</small>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? $t('tasks.adding') : $t('tasks.addTaskBtn') }}
        </button>
      </form>
    </div>
    
    <div v-if="loading" class="loading">
      <p>{{ $t('tasks.loading') }}</p>
    </div>
    
    <div v-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div class="tasks-grid">
      <!-- Debug: {{ tasks.length }} görev bulundu -->
      <div 
        v-for="task in tasks" 
        :key="task.id" 
        class="task-card"
        :class="{ completed: task.completed }"
      >
        <div class="task-header">
          <h3>{{ task.title }}</h3>
          <div class="task-actions">
            <button 
              @click="toggleTask(task)" 
              class="toggle-btn"
              :class="{ completed: task.completed }"
            >
              {{ task.completed ? '✓' : '○' }}
            </button>
            <button @click="deleteTask(task.id)" class="delete-btn">🗑️</button>
          </div>
        </div>
        
        <p v-if="task.description" class="task-description">
          {{ task.description }}
        </p>
        
        <div class="task-meta">
          <small>{{ formatDate(task.created_at) }}</small>
          <small v-if="task.reminder_time" class="reminder-time">
            ⏰ {{ formatReminderTime(task.reminder_time) }}
          </small>
        </div>
      </div>
    </div>
    
    <div v-if="tasks.length === 0 && !loading" class="empty-state">
      <p>{{ $t('tasks.emptyState') }}</p>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import notificationService from '../services/notificationService'

export default {
  name: 'Tasks',
  data() {
    return {
      showAddForm: false,
      newTask: {
        title: '',
        description: '',
        priority: 'medium',
        category: 'other',
        dueDate: '',
        reminderTime: ''
      }
    }
  },
  computed: {
    ...mapState(['tasks', 'loading', 'error'])
  },
  async created() {
    console.log('Tasks.vue created - mevcut tasks:', this.tasks)
    if (this.tasks.length === 0) {
      console.log('Tasks.vue - veriler yükleniyor...')
      await this.fetchTasks()
    }
    console.log('Tasks.vue created - yükleme sonrası tasks:', this.tasks)
  },
  methods: {
    ...mapActions(['fetchTasks', 'createTask', 'updateTask', 'deleteTask']),
    
    async addTask() {
      const taskData = { ...this.newTask }
      
      // Convert camelCase to snake_case for backend
      if (taskData.dueDate) {
        const dueDate = new Date(taskData.dueDate)
        if (!isNaN(dueDate.getTime())) {
          taskData.due_date = dueDate.toISOString()
        }
        delete taskData.dueDate
      }
      
      // Handle reminder_time with proper timezone conversion
      if (taskData.reminderTime) {
        // datetime-local input gives us a string like "2024-01-15T14:30" (local time, no timezone)
        // We need to convert it to ISO format with timezone info for backend
        const localDate = new Date(taskData.reminderTime)
        
        // Check if the date is valid
        if (isNaN(localDate.getTime())) {
          console.error('Geçersiz tarih formatı:', taskData.reminderTime)
          alert('Geçersiz tarih formatı. Lütfen tekrar deneyin.')
          return
        }
        
        // Convert to ISO string which includes timezone offset
        // Django will handle timezone conversion on the backend
        taskData.reminder_time = localDate.toISOString()
        
        console.log('Hatırlatma zamanı ayarlanıyor:', {
          kullanıcıGirdiği: taskData.reminderTime,
          backendGönderilecek: taskData.reminder_time,
          yerelSaat: localDate.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
        })
        
        delete taskData.reminderTime
      }
      
      await this.createTask(taskData)
      
      // Store'da createTask zaten bildirimi zamanlıyor, burada ekstra bir şey yapmaya gerek yok
      // Ama reminder_time yoksa anında bildirim gönderebiliriz
      if (!taskData.reminder_time) {
        const settings = notificationService.getNotificationSettings()
        if (settings.enabled && settings.taskReminders) {
          // Yeni oluşturulan görev için anında bildirim gönder
          const createdTask = this.tasks.find(t => t.title === taskData.title && t.description === taskData.description)
          if (createdTask) {
            await notificationService.showTaskNotification(createdTask)
          }
        }
      }
      
      this.newTask = { 
        title: '', 
        description: '', 
        priority: 'medium',
        category: 'other',
        dueDate: '',
        reminderTime: '' 
      }
      this.showAddForm = false
    },
    
    async toggleTask(task) {
      await this.updateTask({
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
      if (confirm(this.$t('tasks.deleteConfirm'))) {
        await this.$store.dispatch('deleteTask', taskId)
      }
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('tr-TR')
    },
    
    formatReminderTime(reminderTime) {
      if (!reminderTime) return ''
      
      // Backend'den gelen değer UTC formatında olabilir, doğru parse et
      const date = new Date(reminderTime)
      const now = new Date()
      
      // Invalid date kontrolü
      if (isNaN(date.getTime())) {
        console.error('Geçersiz tarih:', reminderTime)
        return 'Geçersiz tarih'
      }
      
      const diff = date.getTime() - now.getTime()
      
      if (diff < 0) {
        return 'Geçmiş'
      } else if (diff < 60000) { // 1 dakikadan az
        return 'Şimdi'
      } else if (diff < 3600000) { // 1 saatten az
        const minutes = Math.floor(diff / 60000)
        return `${minutes} dakika sonra`
      } else if (diff < 86400000) { // 1 günden az
        const hours = Math.floor(diff / 3600000)
        return `${hours} saat sonra`
      } else {
        return date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
  }
}
</script>

<style scoped>
.tasks {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #333;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;
}

.add-btn:hover {
  transform: translateY(-2px);
}

.add-form {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.add-form h3 {
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

.submit-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #218838;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.error {
  background: #f8d7da;
  color: #721c24;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.task-card {
  background: white;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
  border-left: 4px solid #667eea;
}

.task-card:hover {
  transform: translateY(-3px);
}

.task-card.completed {
  opacity: 0.7;
  border-left-color: #28a745;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
  margin-right: 1rem;
}

.task-card.completed .task-header h3 {
  text-decoration: line-through;
  color: #6c757d;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn,
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

.delete-btn:hover {
  border-color: #dc3545;
  background: #dc3545;
  color: white;
}

.task-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.task-meta {
  color: #999;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reminder-time {
  color: #667eea;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  color: #666;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .tasks-grid {
    grid-template-columns: 1fr;
  }
}
</style>
