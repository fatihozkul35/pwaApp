<template>
  <div class="tasks">
    <div class="header">
      <h1>Görevlerim</h1>
      <button @click="showAddForm = !showAddForm" class="add-btn">
        {{ showAddForm ? 'İptal' : 'Yeni Görev' }}
      </button>
    </div>
    
    <div v-if="showAddForm" class="add-form">
      <h3>Yeni Görev Ekle</h3>
      <form @submit.prevent="addTask">
        <div class="form-group">
          <input 
            v-model="newTask.title" 
            type="text" 
            placeholder="Görev başlığı" 
            required
            class="form-input"
          >
        </div>
        <div class="form-group">
          <textarea 
            v-model="newTask.description" 
            placeholder="Görev açıklaması"
            class="form-textarea"
          ></textarea>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Ekleniyor...' : 'Görev Ekle' }}
        </button>
      </form>
    </div>
    
    <div v-if="loading" class="loading">
      <p>Yükleniyor...</p>
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
        </div>
      </div>
    </div>
    
    <div v-if="tasks.length === 0 && !loading" class="empty-state">
      <p>Henüz görev eklenmemiş. İlk görevinizi ekleyin!</p>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'Tasks',
  data() {
    return {
      showAddForm: false,
      newTask: {
        title: '',
        description: ''
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
      await this.createTask(this.newTask)
      this.newTask = { title: '', description: '' }
      this.showAddForm = false
    },
    
    async toggleTask(task) {
      await this.updateTask({
        id: task.id,
        taskData: { ...task, completed: !task.completed }
      })
    },
    
    async deleteTask(taskId) {
      if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
        await this.deleteTask(taskId)
      }
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('tr-TR')
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
