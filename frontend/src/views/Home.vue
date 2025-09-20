<template>
  <div class="home">
    <div class="hero">
      <h1>PWA Uygulamasına Hoş Geldiniz</h1>
      <p>Bu uygulama Vue.js ve Django ile geliştirilmiş bir Progressive Web App'tir.</p>
    </div>
    
    <div class="features">
      <div class="feature-card">
        <h3>📱 PWA Özellikleri</h3>
        <ul>
          <li>Offline çalışma</li>
          <li>Mobil cihaza yüklenebilir</li>
          <li>Push bildirimleri</li>
          <li>Hızlı yükleme</li>
        </ul>
      </div>
      
      <div class="feature-card">
        <h3>⚡ Modern Teknolojiler</h3>
        <ul>
          <li>Vue.js 3</li>
          <li>Django REST Framework</li>
          <li>Vuex State Management</li>
          <li>Responsive Design</li>
        </ul>
      </div>
      
      <div class="feature-card">
        <h3>🎯 Özellikler</h3>
        <ul>
          <li>Görev yönetimi</li>
          <li>Not tutma</li>
          <li>Real-time güncellemeler</li>
          <li>Kullanıcı dostu arayüz</li>
        </ul>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <h4>{{ completedTasksCount }}</h4>
        <p>Tamamlanan Görevler</p>
      </div>
      <div class="stat-card">
        <h4>{{ pendingTasksCount }}</h4>
        <p>Bekleyen Görevler</p>
      </div>
      <div class="stat-card">
        <h4>{{ notesCount }}</h4>
        <p>Toplam Not</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Home',
  computed: {
    ...mapGetters(['completedTasks', 'pendingTasks']),
    completedTasksCount() {
      return this.completedTasks.length
    },
    pendingTasksCount() {
      return this.pendingTasks.length
    },
    notesCount() {
      return this.$store.state.notes.length
    }
  },
  created() {
    this.$store.dispatch('fetchTasks')
    this.$store.dispatch('fetchNotes')
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 15px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #333;
}

.feature-card ul {
  list-style: none;
}

.feature-card li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.feature-card li:last-child {
  border-bottom: none;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h4 {
  font-size: 2.5rem;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-card p {
  color: #666;
  font-weight: 500;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .hero p {
    font-size: 1rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}
</style>
